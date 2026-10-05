import type {
  Assignment,
  Gathering,
  GatheringAttendance,
  GatheringHeadcount,
  Group,
  GroupCategory,
  GroupMessage,
  Person,
  Task,
  VolunteerRole,
} from "../types";
import type { CmsNewsArticle, CmsPage, CmsSermon } from "../data/cmsData";
import { isGroupGathering, isWorshipService } from "./gatherings";
import { allGroupPersonIds } from "./groups";
import { canRegisterHeadcount, headcountTotal } from "./headcount";
import { isPagePublished } from "./menu";
import { countSlots, isAcuteForfall } from "./staffing";
import { parseIsoToDateAndTime } from "./dates";

// The analysis board (Analysebord): what the stored data says about the life of the
// congregation over a period, compared with the period before. Every number is counted
// from what is in the database. Where something is not registered, it is reported as
// missing, never estimated.

const DAY_MS = 24 * 60 * 60 * 1000;

export type AnalyticsPeriodId = "4w" | "3m" | "12m";

export const ANALYTICS_PERIODS: { id: AnalyticsPeriodId; label: string; previousLabel: string; days: number }[] = [
  { id: "4w", label: "Siste 4 uker", previousLabel: "forrige 4 uker", days: 28 },
  { id: "3m", label: "Siste 3 måneder", previousLabel: "forrige 3 måneder", days: 91 },
  // 52 whole weeks, so both periods hold the same number of Sundays
  { id: "12m", label: "Siste 12 måneder", previousLabel: "forrige 12 måneder", days: 364 },
];

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriodId = "3m";

export interface AnalyticsPeriod {
  id: AnalyticsPeriodId;
  label: string;
  previousLabel: string;
  /** The period is [from, to]; `to` is now. */
  from: number;
  to: number;
  /** The period before, of the same length: [previousFrom, from). */
  previousFrom: number;
  weeks: number;
}

export function analyticsPeriod(id: AnalyticsPeriodId, now: number): AnalyticsPeriod {
  const spec = ANALYTICS_PERIODS.find((p) => p.id === id) ?? ANALYTICS_PERIODS[1];
  const length = spec.days * DAY_MS;
  return {
    id: spec.id,
    label: spec.label,
    previousLabel: spec.previousLabel,
    from: now - length,
    to: now,
    previousFrom: now - 2 * length,
    weeks: Math.round(spec.days / 7),
  };
}

/** Days ahead the board looks when it says how the coming staffing stands. */
export const UPCOMING_DAYS = 28;
/** A group with neither a meeting nor a message in this many days is shown as quiet. */
export const QUIET_GROUP_DAYS = 30;
/** A police certificate that runs out within this many days needs renewing now. */
export const POLICE_CERTIFICATE_WARNING_DAYS = 60;

/** Serving more often than every other week in the period. Never fewer than three times. */
export function highLoadThreshold(period: Pick<AnalyticsPeriod, "weeks">): number {
  return Math.max(3, Math.ceil(period.weeks / 2));
}

export interface ChurchData {
  persons: Person[];
  groups: Group[];
  gatherings: Gathering[];
  tasks: Task[];
  assignments: Assignment[];
  attendances: GatheringAttendance[];
  headcounts: GatheringHeadcount[];
  messages: GroupMessage[];
  volunteerRoles: VolunteerRole[];
  pages: CmsPage[];
  news: CmsNewsArticle[];
  sermons: CmsSermon[];
}

const timeOf = (iso: string | undefined): number => (iso ? new Date(iso).getTime() : NaN);
const within = (ms: number, from: number, to: number) => !Number.isNaN(ms) && ms >= from && ms <= to;
const before = (ms: number, from: number, to: number) => !Number.isNaN(ms) && ms >= from && ms < to;
const share = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);
const average = (values: number[]): number | null =>
  values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;

/** Gatherings that took place: started in the window and not cancelled. */
function heldIn(gatherings: Gathering[], from: number, to: number, inclusiveEnd = true): Gathering[] {
  return gatherings
    .filter((g) => !g.cancelled && (inclusiveEnd ? within : before)(timeOf(g.startsAt), from, to))
    .sort((a, b) => timeOf(a.startsAt) - timeOf(b.startsAt));
}

// ============================================================================
// Attendance: how many came
// ============================================================================

export interface CountedGathering {
  gathering: Gathering;
  isWorship: boolean;
  headcount?: GatheringHeadcount;
  /** Adults and children together. Absent when nobody has registered a count. */
  total?: number;
}

export interface AttendanceSummary {
  /** Church-wide gatherings held in the period, oldest first. Group meetings are not counted here. */
  gatherings: CountedGathering[];
  worship: CountedGathering[];
  worshipCounted: number;
  /** Average of the worship services that have a count. Null when none has. */
  averageWorship: number | null;
  /** Average of every church-wide gathering that has a count, worship or not. */
  averageAll: number | null;
  averageWorshipChildren: number | null;
  previousAverageWorship: number | null;
  previousWorshipCounted: number;
  highestWorship: CountedGathering | null;
  /** Everyone counted at any church-wide gathering in the period. */
  totalCounted: number;
  /** Held gatherings without a count, newest first: the list to register. */
  missing: CountedGathering[];
}

/** The held gatherings that can have a count (see canRegisterHeadcount), each with its count if registered. */
function countedGatherings(
  held: Gathering[],
  headcountByGathering: Map<string, GatheringHeadcount>,
  now: number
): CountedGathering[] {
  return held
    .filter((g) => canRegisterHeadcount(g, now))
    .map((gathering) => {
      const headcount = headcountByGathering.get(gathering.id);
      return {
        gathering,
        isWorship: isWorshipService(gathering),
        headcount,
        total: headcount ? headcountTotal(headcount) : undefined,
      };
    });
}

export function summarizeAttendance(data: Pick<ChurchData, "gatherings" | "headcounts">, period: AnalyticsPeriod): AttendanceSummary {
  const headcountByGathering = new Map(data.headcounts.map((h) => [h.gatheringId, h]));
  const gatherings = countedGatherings(heldIn(data.gatherings, period.from, period.to), headcountByGathering, period.to);
  const previous = countedGatherings(
    heldIn(data.gatherings, period.previousFrom, period.from, false),
    headcountByGathering,
    period.to
  );

  const worship = gatherings.filter((g) => g.isWorship);
  const countedWorship = worship.filter((g) => g.total !== undefined);
  const previousCountedWorship = previous.filter((g) => g.isWorship && g.total !== undefined);

  const highestWorship = countedWorship.reduce<CountedGathering | null>(
    (best, g) => (best === null || (g.total ?? 0) > (best.total ?? 0) ? g : best),
    null
  );

  return {
    gatherings,
    worship,
    worshipCounted: countedWorship.length,
    averageWorship: average(countedWorship.map((g) => g.total ?? 0)),
    averageAll: average(gatherings.filter((g) => g.total !== undefined).map((g) => g.total ?? 0)),
    averageWorshipChildren: average(countedWorship.map((g) => g.headcount?.children ?? 0)),
    previousAverageWorship: average(previousCountedWorship.map((g) => g.total ?? 0)),
    previousWorshipCounted: previousCountedWorship.length,
    highestWorship,
    totalCounted: gatherings.reduce((sum, g) => sum + (g.total ?? 0), 0),
    missing: gatherings.filter((g) => g.total === undefined).reverse(),
  };
}

// ============================================================================
// Gatherings: what took place
// ============================================================================

export interface GatheringSummary {
  held: number;
  previousHeld: number;
  worship: number;
  otherEvents: number;
  groupMeetings: number;
  cancelled: number;
  /** Planned in the coming four weeks, not cancelled. */
  upcoming: number;
}

export function summarizeGatherings(data: Pick<ChurchData, "gatherings">, period: AnalyticsPeriod): GatheringSummary {
  const held = heldIn(data.gatherings, period.from, period.to);
  const groupMeetings = held.filter(isGroupGathering).length;
  const worship = held.filter((g) => !isGroupGathering(g) && isWorshipService(g)).length;
  return {
    held: held.length,
    previousHeld: heldIn(data.gatherings, period.previousFrom, period.from, false).length,
    worship,
    otherEvents: held.length - groupMeetings - worship,
    groupMeetings,
    cancelled: data.gatherings.filter((g) => g.cancelled && within(timeOf(g.startsAt), period.from, period.to)).length,
    upcoming: data.gatherings.filter(
      (g) => !g.cancelled && timeOf(g.startsAt) > period.to && timeOf(g.startsAt) <= period.to + UPCOMING_DAYS * DAY_MS
    ).length,
  };
}

// ============================================================================
// Volunteers: who serves, and how the staffing went
// ============================================================================

export interface RoleFill {
  name: string;
  needed: number;
  filled: number;
  rate: number | null;
}

export interface LoadBucket {
  label: string;
  people: number;
}

export interface StaffingWindow {
  slotsNeeded: number;
  slotsFilled: number;
  fillRate: number | null;
  /** People who served (said yes) on at least one of the gatherings. */
  volunteers: Set<string>;
}

export interface VolunteerSummary {
  slotsNeeded: number;
  slotsFilled: number;
  fillRate: number | null;
  previousFillRate: number | null;
  /**
   * The counts below are null when no gathering in the period had tasks to staff:
   * then nobody could have served, and a zero would say something the data does not.
   */
  activeVolunteers: number | null;
  previousActiveVolunteers: number | null;
  /** Active volunteers as a share of everyone in the person register. */
  shareOfRegister: number | null;
  withdrawals: number | null;
  acuteWithdrawals: number | null;
  declines: number | null;
  /** Median time from being asked to answering, in hours. Null without answered requests. */
  medianResponseHours: number | null;
  load: LoadBucket[];
  highLoadThreshold: number;
  /** People who served on more gatherings than the threshold, most first. */
  highLoad: { person: Person; gatherings: number }[];
  /** Roles with the lowest share of filled slots first. */
  roles: RoleFill[];
  /** Members of a service team (tjenestegruppe) who did not serve in the period. */
  unused: Person[];
  upcoming: { slotsNeeded: number; slotsFilled: number; fillRate: number | null; openSlots: number };
}

function staffingOf(gatherings: Gathering[], tasks: Task[], assignmentsByTask: Map<string, Assignment[]>): StaffingWindow {
  const ids = new Set(gatherings.map((g) => g.id));
  let slotsNeeded = 0;
  let slotsFilled = 0;
  const volunteers = new Set<string>();
  for (const task of tasks) {
    if (!ids.has(task.gatheringId) || task.status === "cancelled") continue;
    const taskAssignments = assignmentsByTask.get(task.id) ?? [];
    const slots = countSlots(task, taskAssignments);
    slotsNeeded += slots.needed;
    slotsFilled += Math.min(slots.confirmed, slots.needed);
    for (const a of taskAssignments) if (a.response === "confirmed") volunteers.add(a.personId);
  }
  return { slotsNeeded, slotsFilled, fillRate: share(slotsFilled, slotsNeeded), volunteers };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeVolunteers(
  data: Pick<ChurchData, "persons" | "groups" | "gatherings" | "tasks" | "assignments" | "volunteerRoles">,
  period: AnalyticsPeriod
): VolunteerSummary {
  const assignmentsByTask = new Map<string, Assignment[]>();
  for (const a of data.assignments) {
    const list = assignmentsByTask.get(a.taskId) ?? [];
    list.push(a);
    assignmentsByTask.set(a.taskId, list);
  }

  const held = heldIn(data.gatherings, period.from, period.to);
  const current = staffingOf(held, data.tasks, assignmentsByTask);
  const previous = staffingOf(heldIn(data.gatherings, period.previousFrom, period.from, false), data.tasks, assignmentsByTask);
  const upcomingGatherings = data.gatherings.filter(
    (g) => !g.cancelled && timeOf(g.startsAt) > period.to && timeOf(g.startsAt) <= period.to + UPCOMING_DAYS * DAY_MS
  );
  const upcoming = staffingOf(upcomingGatherings, data.tasks, assignmentsByTask);

  const gatheringById = new Map(held.map((g) => [g.id, g]));
  const periodTasks = data.tasks.filter((t) => gatheringById.has(t.gatheringId) && t.status !== "cancelled");
  const periodAssignments = periodTasks.flatMap((t) => assignmentsByTask.get(t.id) ?? []);
  const taskById = new Map(periodTasks.map((t) => [t.id, t]));

  let withdrawals = 0;
  let acuteWithdrawals = 0;
  let declines = 0;
  const responseHours: number[] = [];
  const servedGatherings = new Map<string, Set<string>>();
  for (const a of periodAssignments) {
    const gathering = gatheringById.get(taskById.get(a.taskId)?.gatheringId ?? "");
    if (a.response === "withdrawn") {
      withdrawals++;
      const at = timeOf(a.respondedAt);
      if (!Number.isNaN(at) && isAcuteForfall(gathering?.startsAt, new Date(at))) acuteWithdrawals++;
    }
    if (a.response === "declined") declines++;
    if ((a.response === "confirmed" || a.response === "declined") && a.assignedAt && a.respondedAt) {
      const hours = (timeOf(a.respondedAt) - timeOf(a.assignedAt)) / (60 * 60 * 1000);
      if (Number.isFinite(hours) && hours >= 0) responseHours.push(hours);
    }
    if (a.response === "confirmed" && gathering) {
      const set = servedGatherings.get(a.personId) ?? new Set<string>();
      set.add(gathering.id);
      servedGatherings.set(a.personId, set);
    }
  }

  const timesServed = [...servedGatherings.values()].map((s) => s.size);
  const load: LoadBucket[] = [
    { label: "1 gang", people: timesServed.filter((n) => n === 1).length },
    { label: "2–3 ganger", people: timesServed.filter((n) => n >= 2 && n <= 3).length },
    { label: "4–6 ganger", people: timesServed.filter((n) => n >= 4 && n <= 6).length },
    { label: "7 ganger eller mer", people: timesServed.filter((n) => n >= 7).length },
  ];

  const personById = new Map(data.persons.map((p) => [p.id, p]));
  const threshold = highLoadThreshold(period);
  const highLoad = [...servedGatherings.entries()]
    .filter(([, set]) => set.size >= threshold)
    .map(([personId, set]) => ({ person: personById.get(personId), gatherings: set.size }))
    .filter((row): row is { person: Person; gatherings: number } => row.person !== undefined)
    .sort((a, b) => b.gatherings - a.gatherings || a.person.name.localeCompare(b.person.name, "nb"));

  const roleNameById = new Map(data.volunteerRoles.map((r) => [r.id, r.name]));
  const roles = new Map<string, RoleFill>();
  for (const task of periodTasks) {
    const name = (task.volunteerRoleId && roleNameById.get(task.volunteerRoleId)) || task.title;
    const slots = countSlots(task, assignmentsByTask.get(task.id) ?? []);
    const row = roles.get(name) ?? { name, needed: 0, filled: 0, rate: null };
    row.needed += slots.needed;
    row.filled += Math.min(slots.confirmed, slots.needed);
    roles.set(name, row);
  }
  const roleRows = [...roles.values()]
    .map((row) => ({ ...row, rate: share(row.filled, row.needed) }))
    .sort((a, b) => (a.rate ?? 1) - (b.rate ?? 1) || b.needed - a.needed || a.name.localeCompare(b.name, "nb"));

  const teamMembers = new Set(
    data.groups.filter((g) => g.category === "tjenestegruppe").flatMap((g) => allGroupPersonIds(g))
  );
  const unused = [...teamMembers]
    .filter((id) => !current.volunteers.has(id))
    .map((id) => personById.get(id))
    .filter((p): p is Person => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  const staffed = current.slotsNeeded > 0;
  const whenStaffed = (value: number) => (staffed ? value : null);
  return {
    slotsNeeded: current.slotsNeeded,
    slotsFilled: current.slotsFilled,
    fillRate: current.fillRate,
    previousFillRate: previous.fillRate,
    activeVolunteers: whenStaffed(current.volunteers.size),
    previousActiveVolunteers: previous.slotsNeeded > 0 ? previous.volunteers.size : null,
    shareOfRegister: staffed ? share(current.volunteers.size, data.persons.length) : null,
    withdrawals: whenStaffed(withdrawals),
    acuteWithdrawals: whenStaffed(acuteWithdrawals),
    declines: whenStaffed(declines),
    medianResponseHours: median(responseHours),
    load,
    highLoadThreshold: threshold,
    highLoad,
    roles: roleRows,
    unused,
    upcoming: {
      slotsNeeded: upcoming.slotsNeeded,
      slotsFilled: upcoming.slotsFilled,
      fillRate: upcoming.fillRate,
      openSlots: upcoming.slotsNeeded - upcoming.slotsFilled,
    },
  };
}

// ============================================================================
// Groups: belonging and activity
// ============================================================================

export const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  ledergruppe: "Ledergrupper",
  strategigruppe: "Strategigrupper",
  tjenestegruppe: "Tjenestegrupper",
  husgruppe: "Husfellesskap",
  interessegruppe: "Interessegrupper",
};

export interface GroupActivity {
  group: Group;
  members: number;
  newMembers: number;
  meetings: number;
  /** Answers to the group's meetings in the period. `possible` is members × meetings. */
  responses: { attending: number; declined: number; possible: number };
  messages: number;
  lastActivityAt: string | null;
  quiet: boolean;
}

export interface GroupSummary {
  groups: GroupActivity[];
  personsInGroups: number;
  belongingRate: number | null;
  withoutGroup: Person[];
  newMembers: number;
  messages: number;
  previousMessages: number;
  quietGroups: number;
  byCategory: { category: GroupCategory | "uten"; label: string; groups: number; people: number }[];
}

export function summarizeGroups(
  data: Pick<ChurchData, "persons" | "groups" | "gatherings" | "attendances" | "messages">,
  period: AnalyticsPeriod
): GroupSummary {
  const held = heldIn(data.gatherings, period.from, period.to);
  const quietSince = period.to - QUIET_GROUP_DAYS * DAY_MS;
  const attendancesByGathering = new Map<string, GatheringAttendance[]>();
  for (const a of data.attendances) {
    const list = attendancesByGathering.get(a.gatheringId) ?? [];
    list.push(a);
    attendancesByGathering.set(a.gatheringId, list);
  }

  const groups: GroupActivity[] = data.groups.map((group) => {
    const memberIds = allGroupPersonIds(group);
    const current = new Set(memberIds);
    // Someone who has left keeps their join date in the document; they are not counted
    const newMembers = Object.entries(group.memberJoinedAt ?? {}).filter(
      ([personId, at]) => current.has(personId) && within(timeOf(at), period.from, period.to)
    ).length;
    const meetings = held.filter((g) => g.groupId === group.id && isGroupGathering(g));
    let attending = 0;
    let declined = 0;
    for (const meeting of meetings) {
      for (const a of attendancesByGathering.get(meeting.id) ?? []) {
        // Answers from people who have since left are not part of the group's share
        if (!current.has(a.personId)) continue;
        if (a.status === "attending") attending++;
        else declined++;
      }
    }
    const groupMessages = data.messages.filter((m) => m.groupId === group.id);
    const messages = groupMessages.filter((m) => within(timeOf(m.createdAt), period.from, period.to)).length;
    const pastActivity = [
      ...groupMessages.map((m) => m.createdAt),
      ...data.gatherings
        .filter((g) => g.groupId === group.id && !g.cancelled && timeOf(g.startsAt) <= period.to)
        .map((g) => g.startsAt),
    ].filter((at) => timeOf(at) <= period.to);
    const lastActivityAt = pastActivity.reduce<string | null>(
      (latest, at) => (latest === null || timeOf(at) > timeOf(latest) ? at : latest),
      null
    );
    return {
      group,
      members: memberIds.length,
      newMembers,
      meetings: meetings.length,
      responses: { attending, declined, possible: memberIds.length * meetings.length },
      messages,
      lastActivityAt,
      quiet: lastActivityAt === null || timeOf(lastActivityAt) < quietSince,
    };
  });

  const inGroups = new Set(data.groups.flatMap((g) => allGroupPersonIds(g)));
  const personsInGroups = data.persons.filter((p) => inGroups.has(p.id)).length;

  const categories = new Map<GroupCategory | "uten", { groups: number; people: Set<string> }>();
  for (const group of data.groups) {
    const key = group.category ?? "uten";
    const row = categories.get(key) ?? { groups: 0, people: new Set<string>() };
    row.groups++;
    for (const id of allGroupPersonIds(group)) row.people.add(id);
    categories.set(key, row);
  }
  const order: (GroupCategory | "uten")[] = ["ledergruppe", "strategigruppe", "tjenestegruppe", "husgruppe", "interessegruppe", "uten"];
  const byCategory = order
    .filter((key) => categories.has(key))
    .map((key) => ({
      category: key,
      label: key === "uten" ? "Uten kategori" : GROUP_CATEGORY_LABELS[key],
      groups: categories.get(key)!.groups,
      people: categories.get(key)!.people.size,
    }));

  return {
    groups,
    personsInGroups,
    belongingRate: share(personsInGroups, data.persons.length),
    withoutGroup: data.persons.filter((p) => !inGroups.has(p.id)).sort((a, b) => a.name.localeCompare(b.name, "nb")),
    newMembers: groups.reduce((sum, g) => sum + g.newMembers, 0),
    messages: data.messages.filter((m) => within(timeOf(m.createdAt), period.from, period.to)).length,
    previousMessages: data.messages.filter((m) => before(timeOf(m.createdAt), period.previousFrom, period.from)).length,
    quietGroups: groups.filter((g) => g.quiet).length,
    byCategory,
  };
}

// ============================================================================
// The person register
// ============================================================================

export interface PeopleSummary {
  total: number;
  admins: number;
  staff: number;
  /** Shown on the website with a registered consent. */
  publicProfiles: number;
  policeCertificates: { registered: number; valid: number; expiringSoon: Person[]; expired: Person[] };
  unavailableNow: number;
}

/** "YYYY-MM-DD" for the moment, in the time zone of the person looking. */
function dayOf(ms: number): string {
  return parseIsoToDateAndTime(new Date(ms).toISOString()).date;
}

export function summarizePeople(data: Pick<ChurchData, "persons">, now: number): PeopleSummary {
  const today = dayOf(now);
  const warnUntil = dayOf(now + POLICE_CERTIFICATE_WARNING_DAYS * DAY_MS);
  const withCertificate = data.persons.filter((p) => p.policeCertificateValidUntil);
  const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, "nb");
  const expired = withCertificate.filter((p) => p.policeCertificateValidUntil! < today).sort(byName);
  const expiringSoon = withCertificate
    .filter((p) => p.policeCertificateValidUntil! >= today && p.policeCertificateValidUntil! <= warnUntil)
    .sort(byName);
  return {
    total: data.persons.length,
    admins: data.persons.filter((p) => p.globalRole === "admin").length,
    staff: data.persons.filter((p) => p.isStaff).length,
    publicProfiles: data.persons.filter((p) => p.isPublicProfile && p.consentToPublishGivenAt).length,
    policeCertificates: {
      registered: withCertificate.length,
      valid: withCertificate.length - expired.length - expiringSoon.length,
      expiringSoon,
      expired,
    },
    unavailableNow: data.persons.filter((p) => (p.unavailablePeriods ?? []).some((u) => u.from <= today && today <= u.to)).length,
  };
}

// ============================================================================
// The website
// ============================================================================

export interface ContentSummary {
  newsPublished: number;
  previousNewsPublished: number;
  sermons: number;
  previousSermons: number;
  sermonsWithRecording: number;
  pages: { published: number; scheduled: number; drafts: number };
}

export function summarizeContent(data: Pick<ChurchData, "pages" | "news" | "sermons">, period: AnalyticsPeriod): ContentSummary {
  const published = data.news.filter((n) => n.isPublished);
  const sermonsIn = (from: number, to: number, inclusiveEnd: boolean) =>
    data.sermons.filter((s) => (inclusiveEnd ? within : before)(timeOf(s.date), from, to));
  const sermons = sermonsIn(period.from, period.to, true);
  const now = new Date(period.to);
  const live = data.pages.filter((p) => isPagePublished(p, now));
  const drafts = data.pages.filter((p) => p.isPublished === false || p.status === "draft");
  return {
    newsPublished: published.filter((n) => within(timeOf(n.publishedAt), period.from, period.to)).length,
    previousNewsPublished: published.filter((n) => before(timeOf(n.publishedAt), period.previousFrom, period.from)).length,
    sermons: sermons.length,
    previousSermons: sermonsIn(period.previousFrom, period.from, false).length,
    sermonsWithRecording: sermons.filter((s) => s.audioUrl || s.videoUrl || s.spotifyUrl).length,
    pages: { published: live.length, scheduled: data.pages.length - live.length - drafts.length, drafts: drafts.length },
  };
}

// ============================================================================
// What the numbers rest on
// ============================================================================

export interface CoverageNote {
  id: string;
  status: "ok" | "partial" | "missing";
  text: string;
}

export function describeCoverage(attendance: AttendanceSummary, groups: GroupSummary, volunteers: VolunteerSummary): CoverageNote[] {
  const worship = attendance.worship.length;
  const counted = attendance.worshipCounted;
  const meetings = groups.groups.reduce((sum, g) => sum + g.meetings, 0);
  const answers = groups.groups.reduce((sum, g) => sum + g.responses.attending + g.responses.declined, 0);
  return [
    {
      id: "oppmote",
      status: worship === 0 ? "missing" : counted === worship ? "ok" : counted === 0 ? "missing" : "partial",
      text:
        worship === 0
          ? "Ingen gudstjenester er holdt i perioden."
          : `Oppmøtetall er registrert for ${counted} av ${worship} gudstjenester.`,
    },
    {
      id: "bemanning",
      status: volunteers.slotsNeeded > 0 ? "ok" : "missing",
      text:
        volunteers.slotsNeeded > 0
          ? `Bemanningen bygger på ${volunteers.slotsNeeded} plasser i oppgavene på samlingene i perioden.`
          : "Ingen samlinger i perioden hadde oppgaver å bemanne.",
    },
    {
      id: "svar",
      status: meetings === 0 ? "missing" : answers > 0 ? "ok" : "missing",
      text:
        meetings === 0
          ? "Ingen gruppesamlinger er holdt i perioden."
          : `${answers} svar («Kommer» / «Kommer ikke») på ${meetings} gruppesamlinger. Et svar sier hvem som planla å komme, ikke hvem som kom.`,
    },
    {
      id: "nettside",
      status: "missing",
      text: "Besøk på nettsiden måles ikke. Løsningen har ingen sporing av besøkende.",
    },
  ];
}

// ============================================================================
// Everything together
// ============================================================================

export interface ChurchAnalytics {
  period: AnalyticsPeriod;
  attendance: AttendanceSummary;
  gatherings: GatheringSummary;
  volunteers: VolunteerSummary;
  groups: GroupSummary;
  people: PeopleSummary;
  content: ContentSummary;
  coverage: CoverageNote[];
}

export function buildChurchAnalytics(data: ChurchData, periodId: AnalyticsPeriodId, now: number): ChurchAnalytics {
  const period = analyticsPeriod(periodId, now);
  const attendance = summarizeAttendance(data, period);
  const volunteers = summarizeVolunteers(data, period);
  const groups = summarizeGroups(data, period);
  return {
    period,
    attendance,
    gatherings: summarizeGatherings(data, period),
    volunteers,
    groups,
    people: summarizePeople(data, now),
    content: summarizeContent(data, period),
    coverage: describeCoverage(attendance, groups, volunteers),
  };
}

// ============================================================================
// Export
// ============================================================================

function csvCell(value: string | number | undefined): string {
  let text = value === undefined ? "" : String(value);
  // A spreadsheet runs text that starts like a formula; an apostrophe keeps it text
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The counted gatherings as a semicolon-separated table, the way Norwegian spreadsheets
 * open it. A gathering without a count has empty number cells, never a zero.
 */
export function headcountCsv(rows: CountedGathering[]): string {
  const header = ["Dato", "Klokkeslett", "Samling", "Type", "Voksne", "Barn", "Totalt", "Merknad"];
  const lines = rows.map((row) => {
    const { date, time } = parseIsoToDateAndTime(row.gathering.startsAt);
    return [
      date,
      time,
      row.gathering.title,
      row.isWorship ? "Gudstjeneste" : "Arrangement",
      row.headcount?.adults,
      row.headcount?.children,
      row.total,
      row.headcount?.note,
    ]
      .map(csvCell)
      .join(";");
  });
  return [header.join(";"), ...lines].join("\r\n");
}
