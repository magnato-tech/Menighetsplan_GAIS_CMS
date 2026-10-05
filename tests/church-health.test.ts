import { describe } from "vitest";
import { assert } from "./assert";
import {
  MONTH_BANDS,
  analyticsPeriod,
  atLeastPerMonth,
  buildChurchAnalytics,
  summarizeEngagement,
  type ChurchData,
} from "../src/utils/churchAnalytics";
import type { Assignment, Gathering, GatheringAttendance, Group, Person, Task } from "../src/types";

describe("Menighetens helse på analysebordet", () => {
  const now = new Date("2026-10-05T12:00:00.000Z").getTime();

  const persons: Person[] = [
    { id: "a", name: "Anne Leder", globalRole: "admin" },
    { id: "b", name: "Bjørn Bilde", globalRole: "member" },
    { id: "c", name: "Cecilie Forbønn", globalRole: "member" },
    { id: "d", name: "Dag Hus", globalRole: "member" },
    { id: "e", name: "Eva Ny", globalRole: "member" },
  ];
  const groups: Group[] = [
    { id: "team", name: "Søndagsteam", category: "tjenestegruppe", memberIds: ["b", "c"], leaderIds: ["a"] },
    { id: "hus", name: "Husfellesskap", category: "husgruppe", memberIds: ["c", "d"], leaderIds: ["a"] },
  ];
  const service = (id: string, startsAt: string, extra: Partial<Gathering> = {}): Gathering => ({
    id,
    groupId: "team",
    title: "Gudstjeneste",
    startsAt,
    type: "arrangement",
    visibility: "offentlig",
    isGudstjeneste: true,
    ...extra,
  });
  const meeting = (id: string, startsAt: string): Gathering =>
    service(id, startsAt, { groupId: "hus", title: "Husfellesskap", type: "gruppesamling", visibility: "intern", isGudstjeneste: false });

  const gatherings: Gathering[] = [
    service("p1", "2026-06-14T09:00:00.000Z"),
    service("s4", "2026-07-19T09:00:00.000Z"),
    service("s3", "2026-08-16T09:00:00.000Z"),
    service("s1", "2026-09-13T09:00:00.000Z", {
      programSchedule: [
        { time: "11:00", title: "Velkommen", taskId: "s1-moteleder" },
        { time: "11:00", title: "Bilder på skjermen", taskId: "s1-bilde" },
        { time: "11:30", title: "Lyd under talen", taskId: "s1-lyd" },
      ],
    }),
    service("s2", "2026-09-20T09:00:00.000Z"),
    meeting("h2", "2026-08-19T17:30:00.000Z"),
    meeting("h1", "2026-09-16T17:30:00.000Z"),
  ];
  const task = (id: string, gatheringId: string, title: string, neededCount = 1, volunteerRoleId?: string): Task => ({
    id,
    gatheringId,
    title,
    status: "open",
    neededCount,
    volunteerRoleId,
  });
  const tasks: Task[] = [
    task("p1-lyd", "p1", "Lyd"),
    task("s4-lyd", "s4", "Lyd", 2),
    task("s3-bilde", "s3", "Bilde", 1, "role-bilde"),
    task("s3-moteleder", "s3", "Møteleder"),
    task("s1-bilde", "s1", "Bildeteknikk", 1, "role-bilde"),
    task("s1-moteleder", "s1", "Møteleder"),
    task("s1-lyd", "s1", "Lyd"),
    task("s2-forbonn", "s2", "Forbønn"),
    task("s2-nattverd", "s2", "Nattverd"),
    task("s2-bilde", "s2", "Bilde", 1, "role-bilde"),
  ];
  const yes = (taskId: string, personId: string): Assignment => ({ id: `${taskId}-${personId}`, taskId, personId, response: "confirmed" });
  const assignments: Assignment[] = [
    yes("s4-lyd", "a"),
    yes("s3-bilde", "b"),
    yes("s3-moteleder", "b"),
    yes("s1-bilde", "b"),
    yes("s1-moteleder", "b"),
    yes("s1-lyd", "c"),
    yes("s2-forbonn", "c"),
    yes("s2-nattverd", "c"),
    { id: "s2-bilde-d", taskId: "s2-bilde", personId: "d", response: "declined" },
  ];
  const attendances: GatheringAttendance[] = [
    { id: "att-h1-c", gatheringId: "h1", personId: "c", status: "attending" },
    { id: "att-h1-d", gatheringId: "h1", personId: "d", status: "declined" },
    { id: "att-h2-d", gatheringId: "h2", personId: "d", status: "attending" },
  ];
  const data: ChurchData = {
    persons,
    groups,
    gatherings,
    tasks,
    assignments,
    attendances,
    headcounts: [],
    messages: [],
    volunteerRoles: [{ id: "role-bilde", name: "Bilde", sortOrder: 0 }],
    pages: [],
    news: [],
    sermons: [],
  };
  const { fullStaffing, multiTasks, engagement, coverage } = buildChurchAnalytics(data, "3m", now);
  const ids = (list: { gathering: Gathering }[]) => list.map((row) => row.gathering.id).join(",");

  // 1. Full staffing per gathering
  assert(ids(fullStaffing.gatherings) === "s4,s3,s1,s2", "Bare holdte samlinger med oppgaver telles, eldste først; gruppesamlinger uten oppgaver er ikke med");
  assert(fullStaffing.full === 2 && fullStaffing.rate === 0.5, "To av fire samlinger hadde alle plasser bekreftet");
  assert(
    fullStaffing.worship.withTasks === 4 && fullStaffing.worship.full === 2 && fullStaffing.worship.rate === 0.5,
    "Gudstjenestene telles for seg"
  );
  assert(fullStaffing.previousRate === 0, "Forrige periode: én samling, ikke fullt bemannet");
  assert(
    ids(fullStaffing.notFull) === "s2,s4" && fullStaffing.notFull[1].missing === 1 && fullStaffing.notFull[1].needed === 2,
    "Samlingene som ikke var fullt bemannet, nyeste først, med hvor mange som manglet"
  );

  // 2. Several tasks on the same gathering
  assert(multiTasks.occurrences.length === 3, "Tre ganger hadde noen to oppgaver på samme samling");
  assert(
    multiTasks.occurrences.map((o) => `${o.person.id}@${o.gathering.id}`).join(",") === "c@s2,b@s1,b@s3",
    "Nyeste først"
  );
  assert(
    multiTasks.occurrences.find((o) => o.gathering.id === "s1")?.roles.join(" + ") === "Bilde + Møteleder",
    "Rollenavnet hentes fra rollebiblioteket, og rollene står alfabetisk"
  );
  assert(multiTasks.people === 2 && multiTasks.gatherings === 3, "To personer, på tre samlinger");
  assert(multiTasks.shareOfServings === 3 / 5, "Tre av fem ganger noen tjenestegjorde, hadde de flere oppgaver");
  assert(
    multiTasks.combinations.map((c) => `${c.roles}:${c.count}`).join(",") === "Bilde + Møteleder:2,Forbønn + Nattverd:1",
    "De vanligste kombinasjonene først"
  );
  assert(
    multiTasks.byPerson.map((p) => `${p.person.id}:${p.times}`).join(",") === "b:2,c:1",
    "Den som oftest har flere oppgaver, står først"
  );
  assert(
    multiTasks.occurrences.find((o) => o.gathering.id === "s1")?.sameTime === true &&
      multiTasks.occurrences.find((o) => o.gathering.id === "s2")?.sameTime === false &&
      multiTasks.sameTimeCount === 1,
    "Samme klokkeslett i kjøreplanen merkes; uten kjøreplan kan det ikke sies"
  );

  // 3. Each person
  const row = (id: string) => engagement.people.find((p) => p.person.id === id)!;
  assert(engagement.months === 3 && engagement.worshipHeld === 4, "Tre måneder med fire gudstjenester");
  assert(engagement.people.map((p) => p.person.id).join(",") === "b,c,a,d,e", "Flest oppgaver først");
  assert(
    row("b").tasks === 4 && row("b").gatheringsServed === 2 && row("b").worshipServed === 2 && row("b").worshipShare === 0.5,
    "Fire oppgaver på to gudstjenester, altså halvparten av gudstjenestene"
  );
  assert(row("b").multiTaskTimes === 2 && row("c").multiTaskTimes === 1, "Ganger med flere oppgaver per person");
  assert(
    row("c").serviceGroups === 1 && row("c").otherGroups === 1 && row("a").serviceGroups === 1 && row("a").otherGroups === 1,
    "Tjenestegrupper og andre grupper telles hver for seg; en leder er med i gruppen"
  );
  assert(row("c").meetingsAttending === 1 && row("c").activitiesPerMonth === 1.3, "Aktiviteter er oppgaver og gruppesamlinger med «Kommer»");
  assert(row("d").tasks === 0 && row("d").meetingsAttending === 1 && row("d").activitiesPerMonth === 0.3, "«Kommer ikke» telles ikke");

  // 4. A typical month
  const band = (label: string) => engagement.tasksPerMonth!.find((b) => b.label === label)!;
  assert(engagement.tasksPerMonth!.length === MONTH_BANDS.length, "Båndene går fra 0 til 8 eller flere");
  assert(
    band("0").share === 11 / 15 && band("1").share === 1 / 15 && band("2").share === 2 / 15 && band("3").share === 1 / 15,
    "Andelen av menigheten med 0, 1, 2 og 3 oppgaver i en måned"
  );
  assert(band("0").people === 3.7 && band("2").people === 0.7, "Omtrent hvor mange personer det er i en vanlig måned");
  assert(
    Math.abs(engagement.tasksPerMonth!.reduce((sum, b) => sum + b.share, 0) - 1) < 1e-9,
    "Andelene blir til sammen hele menigheten"
  );
  const activityBand = (label: string) => engagement.activitiesPerMonth!.find((b) => b.label === label)!;
  assert(activityBand("1").share === 2 / 15 && activityBand("4").share === 1 / 15, "Aktiviteter tar med gruppesamlingene");
  const twoOrMore = atLeastPerMonth(engagement.tasksPerMonth!, 2);
  assert(twoOrMore.share === 3 / 15 && twoOrMore.people === 1, "Andelen med to eller flere oppgaver i en måned");
  assert(engagement.withoutTasks === 2 && engagement.withoutTasksShare === 0.4, "To av fem hadde ingen oppgave");
  assert(engagement.withoutTasksOrGroups.map((p) => p.id).join(",") === "e", "Én er verken med i en gruppe eller har hatt en oppgave");

  // 5. What the numbers rest on
  const runSheet = coverage.find((c) => c.id === "kjoreplan")!;
  assert(runSheet.status === "partial" && runSheet.text.includes("1 av 4"), "Datagrunnlaget sier hvor mange kjøreplaner som har klokkeslett");

  // 6. Eight or more, and nothing made up
  const busy = summarizeEngagement(
    {
      persons: [persons[0]],
      groups: [],
      gatherings: [service("x", "2026-09-27T09:00:00.000Z")],
      tasks: Array.from({ length: 9 }, (_, i) => task(`x-${i}`, "x", `Oppgave ${i}`)),
      assignments: Array.from({ length: 9 }, (_, i) => yes(`x-${i}`, "a")),
      attendances: [],
    },
    analyticsPeriod("4w", now)
  );
  assert(busy.tasksPerMonth!.find((b) => b.label === "8 eller flere")?.share === 1, "Ni oppgaver i en måned havner i «8 eller flere»");
  const empty = buildChurchAnalytics(
    { ...data, gatherings: [], tasks: [], assignments: [], attendances: [] },
    "3m",
    now
  );
  assert(
    empty.fullStaffing.rate === null &&
      empty.multiTasks.shareOfServings === null &&
      empty.engagement.tasksPerMonth === null &&
      empty.engagement.activitiesPerMonth === null &&
      empty.engagement.withoutTasks === null,
    "Uten samlinger er tallene tomme, ikke null"
  );
});
