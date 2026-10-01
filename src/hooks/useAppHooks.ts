import { useMemo, useState, useEffect, useCallback } from "react";
import { useMockData } from "../context/MockDataContext";
import { Task, Person, Group, Gathering, Assignment, ActionCardModel, QueryResult, BadgeVariant } from "../types";

// Helper function to format Norwegian dates nicely
export function formatNorwegianDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
    const months = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayName} ${dayNum}. ${monthName} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

// Helper to format chat message timestamps in Norwegian
export function formatChatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (isToday) {
      return `I dag kl. ${hours}:${minutes}`;
    }
    if (isYesterday) {
      return `I går kl. ${hours}:${minutes}`;
    }

    const months = [
      "jan.", "feb.", "mars", "apr.", "mai", "juni",
      "juli", "aug.", "sep.", "okt.", "nov.", "des."
    ];
    return `${date.getDate()}. ${months[date.getMonth()]} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

// Compact line format as requested (e.g., "søndag 16. august 2026 · 11:00 · Gitmark · Gudstjeneste")
export function formatCompactGatheringSubtitle(
  isoString: string,
  location?: string,
  typeOrGroup?: string
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const days = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
    const months = [
      "januar",
      "februar",
      "mars",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "desember",
    ];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const parts: string[] = [
      `${dayName} ${dayNum}. ${monthName} ${year}`,
      `${hours}:${minutes}`,
    ];

    if (location) {
      parts.push(location);
    }

    if (typeOrGroup) {
      parts.push(typeOrGroup);
    }

    return parts.join(" · ");
  } catch {
    return isoString;
  }
}

// Helpers for input date/time editing
export function parseIsoToDateAndTime(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "11:00" };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
  } catch {
    return { date: "", time: "11:00" };
  }
}

export function combineDateAndTimeToIso(dateStr: string, timeStr: string): string {
  try {
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const [hh, min] = (timeStr || "11:00").split(":").map(Number);
    const d = new Date(yyyy, mm - 1, dd, hh || 0, min || 0, 0);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// 1. Hook: useCurrentUser
export function useCurrentUser() {
  const { currentUser, allPersons, currentUserId, setCurrentUserId, getUserGroups } = useMockData();
  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);

  return {
    currentUser,
    allPersons,
    currentUserId,
    setCurrentUserId,
    userGroups,
  };
}

// 2. Hook: useMyTasks
export function useMyTasks(): QueryResult<Task[]> {
  const { currentUser, getTasksForPerson, tasks, assignments } = useMockData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myTasks = useMemo(() => {
    return getTasksForPerson(currentUser.id);
  }, [getTasksForPerson, currentUser.id, tasks, assignments]);

  return {
    data: myTasks,
    loading,
    error,
  };
}

// 3. Hook: useOpenTasks
export function useOpenTasks(): QueryResult<Task[]> {
  const { currentUser, getUserGroups, getOpenTasksForGroups, tasks } = useMockData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);
  const groupIds = useMemo(() => userGroups.map((g) => g.id), [userGroups]);

  const openTasks = useMemo(() => {
    return getOpenTasksForGroups(groupIds);
  }, [getOpenTasksForGroups, groupIds, tasks]);

  return {
    data: openTasks,
    loading,
    error,
    permissionDenied: false,
  };
}

// 4. Hook: useTaskDetail
export interface TaskDetailResult {
  task: Task | null;
  gathering: Gathering | null;
  group: Group | null;
  assignment: Assignment | null;
  assignedPerson: Person | null;
  isAssignedToMe: boolean;
  canClaim: boolean;
  canReportAbsence: boolean;
  permissionDenied: boolean;
  loading: boolean;
  error: string | null;
  claimTask: () => Promise<{ success: boolean; error?: string }>;
  reportAbsence: () => Promise<{ success: boolean; error?: string }>;
}

export function useTaskDetail(taskId: string | undefined): TaskDetailResult {
  const {
    currentUser,
    getTaskById,
    getGatheringById,
    getGroupById,
    getPersonById,
    getAssignmentForTask,
    isPersonInGroup,
    assignTaskToPerson,
    reportAbsence: performReportAbsence,
    tasks,
    assignments,
  } = useMockData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById]);

  // Check group membership permission
  const hasGroupAccess = useMemo(() => {
    if (!task) return true;
    return isPersonInGroup(currentUser.id, task.groupId);
  }, [task, currentUser.id, isPersonInGroup]);

  const isAssignedToMe = useMemo(() => {
    return assignment?.personId === currentUser.id && assignment?.response === "confirmed";
  }, [assignment, currentUser.id]);

  const canClaim = useMemo(() => {
    return (
      hasGroupAccess &&
      (task?.status === "open" || task?.status === "vacant") &&
      !isAssignedToMe
    );
  }, [hasGroupAccess, task?.status, isAssignedToMe]);

  const canReportAbsence = useMemo(() => {
    return isAssignedToMe && (task?.status === "confirmed" || task?.status === "assigned");
  }, [isAssignedToMe, task?.status]);

  const claimTask = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return await assignTaskToPerson(task.id, currentUser.id);
  }, [task, currentUser.id, assignTaskToPerson]);

  const reportAbsenceAction = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return await performReportAbsence(task.id, currentUser.id);
  }, [task, currentUser.id, performReportAbsence]);

  const permissionDenied = Boolean(task && !hasGroupAccess);

  return {
    task: permissionDenied ? null : task,
    gathering,
    group,
    assignment,
    assignedPerson,
    isAssignedToMe,
    canClaim,
    canReportAbsence,
    permissionDenied,
    loading,
    error,
    claimTask,
    reportAbsence: reportAbsenceAction,
  };
}

// 5. Hook / Function: useActionCardModel
export function useActionCardModel(task: Task, currentUser: Person): ActionCardModel {
  const { getGatheringById, getGroupById, getAssignmentForTask, getPersonById } = useMockData();

  const gathering = getGatheringById(task.gatheringId);
  const group = getGroupById(task.groupId);
  const assignment = getAssignmentForTask(task.id);
  const assignedPerson = assignment ? getPersonById(assignment.personId) : null;

  const isAssignedToMe = assignment?.personId === currentUser.id && assignment?.response === "confirmed";

  let statusLabel = "Ledig";
  let badgeVariant: BadgeVariant = "neutral";
  let primaryActionLabel: string | undefined = "Ta oppgave";
  let primaryActionType: "claim" | "absence" | "view" | undefined = "claim";

  if (isAssignedToMe) {
    statusLabel = "Din oppgave";
    badgeVariant = "success";
    primaryActionLabel = "Meld forfall";
    primaryActionType = "absence";
  } else if (task.status === "vacant") {
    statusLabel = "Trenger vikar";
    badgeVariant = "urgent";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "open") {
    statusLabel = "Ledig oppgave";
    badgeVariant = "info";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "confirmed" || task.status === "assigned") {
    statusLabel = assignedPerson ? `Tildelt ${assignedPerson.name.split(" ")[0]}` : "Tildelt";
    badgeVariant = "neutral";
    primaryActionLabel = undefined;
    primaryActionType = "view";
  }

  const dateTimeFormatted = gathering
    ? formatNorwegianDateTime(gathering.startsAt)
    : "Tidspunkt ikke satt";

  return {
    id: task.id,
    taskId: task.id,
    title: task.title,
    gatheringTitle: gathering?.title || "Samling",
    dateTimeFormatted,
    groupName: group?.name || "Gruppe",
    location: gathering?.location,
    status: task.status,
    statusLabel,
    badgeVariant,
    primaryActionLabel,
    primaryActionType,
    detailUrl: `/oppgave/${task.id}`,
    isAssignedToMe,
    assignedPersonName: assignedPerson?.name,
  };
}

// 6. Bemanningsbarometer & Staffing Status helpers
export type StaffingColor = "green" | "yellow" | "red";

export interface TaskStaffingStatus {
  color: StaffingColor;
  statusText: string; // "Dekket" | "Mangler X" | "Venter på svar"
  confirmedCount: number;
  neededCount: number;
  missingCount: number;
  pendingCount: number;
  hasForfall: boolean;
  isFullyCovered: boolean;
}

/**
 * Standardized 3-color staffing status for a single task:
 * 🟢 Grønn = behovet er fullt dekket ("Dekket")
 * 🔴 Rød = det mangler folk ("Mangler X")
 * 🟡 Gul = forespurt, men ikke svart ("Venter på svar")
 *
 * Regler:
 * 2/2 bekreftet → 🟢
 * 1/2 bekreftet → 🔴
 * 0/2 bekreftet + forespørsler som venter på svar → 🟡
 * 1/2 bekreftet + 1 ubesvart forespørsel → 🔴
 * Forfall som åpner en plass → 🔴
 * Forfall + ny forespørsel → fortsatt 🔴 inntil plassen faktisk er dekket
 * Først når hele behovet er dekket med bekreftede personer → 🟢
 */
export function calculateTaskStaffingStatus(
  task: Task,
  taskAssignments: Assignment[] = []
): TaskStaffingStatus {
  const needed = task.neededCount !== undefined ? task.neededCount : 1;

  // If no assignments provided, synthesize from task.status fallback
  if (taskAssignments.length === 0) {
    if (task.status === "confirmed") {
      return {
        color: "green",
        statusText: "Dekket",
        confirmedCount: needed,
        neededCount: needed,
        missingCount: 0,
        pendingCount: 0,
        hasForfall: false,
        isFullyCovered: true,
      };
    }
    if (task.status === "vacant") {
      return {
        color: "red",
        statusText: `Mangler ${needed}`,
        confirmedCount: 0,
        neededCount: needed,
        missingCount: needed,
        pendingCount: 0,
        hasForfall: true,
        isFullyCovered: false,
      };
    }
    if (task.status === "assigned") {
      return {
        color: "yellow",
        statusText: "Venter på svar",
        confirmedCount: 0,
        neededCount: needed,
        missingCount: needed,
        pendingCount: 1,
        hasForfall: false,
        isFullyCovered: false,
      };
    }
    // "open"
    return {
      color: "red",
      statusText: `Mangler ${needed}`,
      confirmedCount: 0,
      neededCount: needed,
      missingCount: needed,
      pendingCount: 0,
      hasForfall: false,
      isFullyCovered: false,
    };
  }

  const confirmedCount = taskAssignments.filter((a) => a.response === "confirmed").length;
  const pendingCount = taskAssignments.filter((a) => a.response === "pending").length;
  const withdrawnCount = taskAssignments.filter((a) => a.response === "withdrawn").length;
  const hasForfall = withdrawnCount > 0 || task.status === "vacant";

  const missingCount = Math.max(0, needed - confirmedCount);
  const isFullyCovered = confirmedCount >= needed;

  if (isFullyCovered) {
    return {
      color: "green",
      statusText: "Dekket",
      confirmedCount,
      neededCount: needed,
      missingCount: 0,
      pendingCount,
      hasForfall: false,
      isFullyCovered: true,
    };
  }

  // Not fully covered:
  // - Forfall som åpner en plass -> 🔴
  // - Forfall + ny forespørsel -> fortsatt 🔴 inntil plassen faktisk er dekket
  // - 1/2 bekreftet -> 🔴
  // - 1/2 bekreftet + 1 ubesvart forespørsel -> 🔴
  if (hasForfall || confirmedCount > 0) {
    return {
      color: "red",
      statusText: `Mangler ${missingCount}`,
      confirmedCount,
      neededCount: needed,
      missingCount,
      pendingCount,
      hasForfall: true,
      isFullyCovered: false,
    };
  }

  // confirmedCount === 0:
  // 0/2 bekreftet + forespørsler som venter på svar -> 🟡
  if (pendingCount > 0) {
    return {
      color: "yellow",
      statusText: "Venter på svar",
      confirmedCount: 0,
      neededCount: needed,
      missingCount,
      pendingCount,
      hasForfall: false,
      isFullyCovered: false,
    };
  }

  // 0 bekreftet, 0 venter -> 🔴 Mangler X
  return {
    color: "red",
    statusText: `Mangler ${missingCount}`,
    confirmedCount: 0,
    neededCount: needed,
    missingCount,
    pendingCount: 0,
    hasForfall: false,
    isFullyCovered: false,
  };
}

export interface StaffingStatusResult {
  color: StaffingColor;
  label: string;
  badgeText: string;
  totalTasks: number;
  coveredCount: number;
  vacantCount: number;
  openCount: number;
  missingPeopleCount: number;
  pendingCount: number;
  needsAttention: boolean;
}

/**
 * Standardized 3-color staffing status for a gathering (collection of tasks):
 * 🟢 Grønn = behovet er fullt dekket ("Dekket")
 * 🔴 Rød = det mangler folk ("Mangler X")
 * 🟡 Gul = forespurt, men ikke svart ("Venter på svar")
 */
export function getStaffingStatus(
  tasksForGathering: Task[],
  assignments: Assignment[] = []
): StaffingStatusResult {
  const totalTasks = tasksForGathering.length;
  if (totalTasks === 0) {
    return {
      color: "green",
      label: "Ingen oppgaver",
      badgeText: "Dekket",
      totalTasks: 0,
      coveredCount: 0,
      vacantCount: 0,
      openCount: 0,
      missingPeopleCount: 0,
      pendingCount: 0,
      needsAttention: false,
    };
  }

  const taskStatuses = tasksForGathering.map((task) => {
    const taskAssigns = assignments.length > 0
      ? assignments.filter((a) => a.taskId === task.id)
      : [];
    return calculateTaskStaffingStatus(task, taskAssigns);
  });

  const totalMissing = taskStatuses.reduce((sum, s) => sum + s.missingCount, 0);
  const totalPending = taskStatuses.reduce((sum, s) => sum + s.pendingCount, 0);
  const coveredCount = taskStatuses.filter((s) => s.isFullyCovered).length;
  const vacantCount = taskStatuses.filter((s) => s.hasForfall).length;
  const openCount = taskStatuses.filter((s) => !s.isFullyCovered && !s.hasForfall).length;

  const hasRed = taskStatuses.some((s) => s.color === "red");
  const hasYellow = taskStatuses.some((s) => s.color === "yellow");

  if (hasRed) {
    return {
      color: "red",
      label: `Mangler ${totalMissing}`,
      badgeText: `Mangler ${totalMissing}`,
      totalTasks,
      coveredCount,
      vacantCount,
      openCount,
      missingPeopleCount: totalMissing,
      pendingCount: totalPending,
      needsAttention: true,
    };
  }

  if (hasYellow) {
    return {
      color: "yellow",
      label: "Venter på svar",
      badgeText: "Venter på svar",
      totalTasks,
      coveredCount,
      vacantCount,
      openCount,
      missingPeopleCount: totalMissing,
      pendingCount: totalPending,
      needsAttention: false,
    };
  }

  return {
    color: "green",
    label: "Dekket",
    badgeText: "Dekket",
    totalTasks,
    coveredCount,
    vacantCount,
    openCount,
    missingPeopleCount: 0,
    pendingCount: 0,
    needsAttention: false,
  };
}

export interface LeaderGatheringItem {
  gathering: Gathering;
  group: Group;
  tasks: Task[];
  staffing: StaffingStatusResult;
}

export interface LeaderGroupData {
  group: Group;
  members: Person[];
  gatherings: LeaderGatheringItem[];
  totalVacantTasks: number;
  totalOpenTasks: number;
  needsAttention: boolean;
}

// 7. Hook: useLeaderDashboard
export function useLeaderDashboard() {
  const { currentUser, groups, gatherings, tasks, assignments, allPersons, assignTaskToPerson } = useMockData();

  // Find groups where current user's ID exists in group.leaderIds OR group.deputyLeaderIds
  const leaderGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        g.leaderIds.includes(currentUser.id) ||
        (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id)) ||
        currentUser.globalRole === "admin"
    );
  }, [groups, currentUser.id, currentUser.globalRole]);

  const isLeader = leaderGroups.length > 0;

  const leaderData: LeaderGroupData[] = useMemo(() => {
    return leaderGroups.map((group) => {
      // Find members belonging to this group
      const groupMembers = allPersons.filter((p) => group.memberIds.includes(p.id));

      // Find all tasks for this group
      const groupTasks = tasks.filter((t) => t.groupId === group.id);

      // Find gatherings relevant to this group
      const relevantGatheringIds = new Set([
        ...gatherings.filter((g) => g.groupId === group.id).map((g) => g.id),
        ...groupTasks.map((t) => t.gatheringId),
      ]);

      const groupGatherings = gatherings
        .filter((g) => relevantGatheringIds.has(g.id))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

      const gatheringItems: LeaderGatheringItem[] = groupGatherings.map((gathering) => {
        const tasksForGathering = groupTasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(tasksForGathering, assignments);
        return {
          gathering,
          group,
          tasks: tasksForGathering,
          staffing,
        };
      });

      const totalVacantTasks = groupTasks.filter((t) => t.status === "vacant").length;
      const totalOpenTasks = groupTasks.filter((t) => t.status === "open").length;

      return {
        group,
        members: groupMembers,
        gatherings: gatheringItems,
        totalVacantTasks,
        totalOpenTasks,
        needsAttention: totalVacantTasks > 0,
      };
    });
  }, [leaderGroups, gatherings, tasks, assignments, allPersons]);

  // All semester gatherings across leader's groups (consolidated)
  const allSemesterGatherings = useMemo(() => {
    const leaderGroupIds = new Set(leaderGroups.map((g) => g.id));
    const leaderTasks = tasks.filter((t) => leaderGroupIds.has(t.groupId));

    const relevantGatheringIds = new Set([
      ...gatherings.filter((g) => leaderGroupIds.has(g.groupId)).map((g) => g.id),
      ...leaderTasks.map((t) => t.gatheringId),
    ]);

    const relevantGatherings = gatherings
      .filter((g) => relevantGatheringIds.has(g.id))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return relevantGatherings.map((gathering) => {
      const tasksForGathering = leaderTasks.filter((t) => t.gatheringId === gathering.id);
      const group = groups.find((g) => g.id === gathering.groupId) || leaderGroups[0];
      const staffing = getStaffingStatus(tasksForGathering, assignments);
      return {
        gathering,
        group,
        tasks: tasksForGathering,
        staffing,
      };
    });
  }, [leaderGroups, gatherings, tasks, assignments, groups]);

  // Urgent tasks across leader's groups
  const urgentTasks = useMemo(() => {
    const leaderGroupIds = new Set(leaderGroups.map((g) => g.id));
    return tasks.filter((t) => leaderGroupIds.has(t.groupId) && t.status === "vacant");
  }, [leaderGroups, tasks]);

  // Urgent gatherings across leader's groups (all semester gatherings where staffing is red)
  const urgentGatherings = useMemo(() => {
    return allSemesterGatherings.filter((item) => item.staffing.color === "red");
  }, [allSemesterGatherings]);

  return {
    isLeader,
    leaderGroups,
    leaderData,
    allSemesterGatherings,
    urgentGatherings,
    urgentTasks,
    urgentTasksCount: urgentTasks.length,
    urgentGatheringsCount: urgentGatherings.length,
    currentUser,
    assignTaskToPerson,
  };
}

// 8. Hook: useModuleConfig
export function useModuleConfig() {
  const { moduleConfig, setModuleStatus, toggleKalender, toggleMeldinger } = useMockData();

  return {
    moduleConfig,
    kalender: moduleConfig.kalender,
    meldinger: moduleConfig.meldinger,
    isKalenderOn: moduleConfig.kalender === "on",
    isMeldingerOn: moduleConfig.meldinger === "on",
    setModuleStatus,
    toggleKalender,
    toggleMeldinger,
  };
}

// Constants for Group Category and Meeting Schedule
export const GROUP_CATEGORIES: { id: "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe"; label: string }[] = [
  { id: "tjenestegruppe", label: "Tjenestegruppe" },
  { id: "husgruppe", label: "Husgruppe" },
  { id: "strategigruppe", label: "Strategigruppe" },
  { id: "ledergruppe", label: "Ledergruppe" },
];

export const MEETING_FREQUENCIES: { id: "hver uke" | "annenhver uke" | "hver måned"; label: string }[] = [
  { id: "hver uke", label: "Hver uke" },
  { id: "annenhver uke", label: "Annenhver uke" },
  { id: "hver måned", label: "Hver måned" },
];

export const WEEKDAYS = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
];

// 9. Hook: useAdminDashboard
export function useAdminDashboard() {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    updateGroupName,
    updateGroup,
    createGroup,
    addPerson,
    updatePerson,
    getGroupById,
    getGatheringById,
    getPersonById,
    getAssignmentForTask,
    getAllAssignmentsForTask,
    createGathering,
    updateGathering,
    deleteGathering,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";

  const adminPersons = useMemo(() => {
    return allPersons.map((person) => {
      const personGroups = groups.filter((g) => g.memberIds.includes(person.id));
      const leaderInGroups = groups.filter((g) => g.leaderIds.includes(person.id));
      const deputyInGroups = groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
      return {
        person,
        groups: personGroups,
        leaderInGroups,
        deputyInGroups,
      };
    });
  }, [allPersons, groups]);

  const adminGroups = useMemo(() => {
    return groups.map((group) => {
      const leaders = allPersons.filter((p) => group.leaderIds.includes(p.id));
      const deputyLeaders = allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
      const members = allPersons.filter((p) => group.memberIds.includes(p.id));
      const groupTasks = tasks.filter((t) => t.groupId === group.id);
      return {
        group,
        leaders,
        deputyLeaders,
        members,
        tasksCount: groupTasks.length,
      };
    });
  }, [groups, allPersons, tasks]);

  const adminGatherings = useMemo(() => {
    return gatherings
      .filter((gathering) => {
        const group = getGroupById(gathering.groupId);
        // Exclude Husfellesskap from Admin -> Arrangementer list
        return group?.category !== "husgruppe";
      })
      .map((gathering) => {
        const group = getGroupById(gathering.groupId);
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks, assignments);

        // Detailed counts for admin gathering overview
        const totalTasks = gatheringTasks.length;
        let coveredTasksCount = 0;
        let missingStaffingCount = 0;

        const tasksWithStaffing = gatheringTasks.map((task) => {
          const taskAssignments = assignments.filter((a) => a.taskId === task.id);
          const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);
          if (taskStaffing.isFullyCovered) {
            coveredTasksCount++;
          } else {
            missingStaffingCount += taskStaffing.missingCount;
          }
          return {
            task,
            taskStaffing,
          };
        });

        return {
          gathering,
          group,
          tasks: gatheringTasks,
          tasksWithStaffing,
          totalTasks,
          coveredTasksCount,
          missingStaffingCount,
          staffing,
        };
      });
  }, [gatherings, tasks, assignments, getGroupById]);

  const adminTasks = useMemo(() => {
    return tasks.map((task) => {
      const gathering = getGatheringById(task.gatheringId);
      const group = getGroupById(task.groupId);
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const primaryAssignment = getAssignmentForTask(task.id);
      const assignedPerson = primaryAssignment ? getPersonById(primaryAssignment.personId) : null;
      
      const assignedPersonsList = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);

      return {
        task,
        gathering,
        group,
        assignment: primaryAssignment,
        assignedPerson,
        assignedPersonsList,
        confirmedCount: taskStaffing.confirmedCount,
        isFullyCovered: taskStaffing.isFullyCovered,
        missingCount: taskStaffing.missingCount,
        taskStaffing,
      };
    });
  }, [tasks, assignments, getGatheringById, getGroupById, getAssignmentForTask, getPersonById]);

  return {
    isAdmin,
    currentUser,
    allPersons,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    updateGroup,
    createGroup,
    addPerson,
    updatePerson,
    createGathering,
    updateGathering,
    deleteGathering,
  };
}

// 10. Hook: useAdminGatheringDetail
export function useAdminGatheringDetail(gatheringId: string) {
  const {
    currentUser,
    gatherings,
    groups,
    tasks,
    assignments,
    allPersons,
    getGatheringById,
    getGroupById,
    getPersonById,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    updateGathering,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const gathering = useMemo(() => {
    if (!gatheringId) return null;
    return getGatheringById(gatheringId) || null;
  }, [gatheringId, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!gathering) return null;
    return getGroupById(gathering.groupId) || null;
  }, [gathering, getGroupById, groups]);

  const tasksWithDetails = useMemo(() => {
    if (!gathering) return [];
    const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);

    return gatheringTasks.map((task) => {
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const assignedPersons = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const confirmedPersonsCount = taskAssignments.filter((a) => a.response === "confirmed").length;
      const neededCount = task.neededCount;
      const isFullyCovered =
        neededCount !== undefined ? confirmedPersonsCount >= neededCount : task.status === "confirmed";
      const missingCount =
        neededCount !== undefined
          ? Math.max(0, neededCount - confirmedPersonsCount)
          : task.status === "confirmed"
          ? 0
          : 1;

      let staffingStatusLabel = "Behov ikke satt";
      if (neededCount !== undefined) {
        if (isFullyCovered) {
          staffingStatusLabel = "Fullt dekket";
        } else {
          staffingStatusLabel = `Mangler: ${missingCount}`;
        }
      } else {
        staffingStatusLabel = task.status === "confirmed" ? "Fullt dekket" : "Mangler bemanning";
      }

      return {
        task,
        neededCount,
        assignedPersons,
        confirmedPersonsCount,
        isFullyCovered,
        missingCount,
        staffingStatusLabel,
      };
    });
  }, [gathering, tasks, assignments, getPersonById]);

  return {
    isAdmin,
    currentUser,
    gathering,
    group,
    allGroups: groups,
    allPersons,
    tasksWithDetails,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    updateGathering,
  };
}

// 11. Hook: useAdminGroupDetail
export function useAdminGroupDetail(groupId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    getGroupById,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const group = getGroupById(groupId);

  const leaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.leaderIds.includes(p.id));
  }, [group, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
  }, [group, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const availablePersonsToAdd = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => !group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const groupGatherings = useMemo(() => {
    if (!group) return [];
    return gatherings
      .filter((g) => g.groupId === group.id)
      .map((gathering) => {
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks, assignments);
        return {
          gathering,
          tasks: gatheringTasks,
          staffing,
        };
      });
  }, [group, gatherings, tasks, assignments]);

  return {
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    allPersons,
    groupGatherings,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  };
}

// 12. Hook: useAdminPersonDetail
export function useAdminPersonDetail(personId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    tasks,
    assignments,
    getPersonById,
    updatePerson,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const person = getPersonById(personId);

  const personGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.memberIds.includes(person.id));
  }, [person, groups]);

  const leaderInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.leaderIds.includes(person.id));
  }, [person, groups]);

  const deputyInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
  }, [person, groups]);

  const personAssignments = useMemo(() => {
    if (!person) return [];
    return assignments.filter((a) => a.personId === person.id && a.response !== "withdrawn");
  }, [person, assignments]);

  const personTasks = useMemo(() => {
    if (!person) return [];
    const taskIds = personAssignments.map((a) => a.taskId);
    return tasks.filter((t) => taskIds.includes(t.id));
  }, [person, personAssignments, tasks]);

  return {
    isAdmin,
    currentUser,
    person,
    personGroups,
    leaderInGroups,
    deputyInGroups,
    personTasks,
    allPersons,
    updatePerson,
  };
}

// 13. Hook: useAdminTaskDetail
export function useAdminTaskDetail(taskId: string) {
  const {
    currentUser,
    tasks,
    gatherings,
    groups,
    assignments,
    allPersons,
    getTaskById,
    getGatheringById,
    getGroupById,
    getAssignmentForTask,
    getAllAssignmentsForTask,
    getPersonById,
    updateTask,
    updateTaskInstruction,
    updateTaskNeededCount,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById, groups]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById, allPersons]);

  const allAssignedPersonsWithStatus = useMemo(() => {
    if (!task) return [];
    const taskAssignments = getAllAssignmentsForTask(task.id);
    return taskAssignments.map((a) => {
      const person = getPersonById(a.personId);
      let statusLabel = "Forespurt";
      if (a.response === "confirmed") statusLabel = "Akseptert";
      if (a.response === "withdrawn") statusLabel = "Forfall";
      if (a.response === "declined") statusLabel = "Avslått";

      return {
        assignment: a,
        person,
        statusLabel,
        response: a.response,
      };
    });
  }, [task, getAllAssignmentsForTask, getPersonById]);

  const confirmedCount = useMemo(() => {
    return allAssignedPersonsWithStatus.filter((p) => p.response === "confirmed").length;
  }, [allAssignedPersonsWithStatus]);

  const isFullyCovered = useMemo(() => {
    if (!task) return false;
    if (task.neededCount !== undefined) {
      return confirmedCount >= task.neededCount;
    }
    return task.status === "confirmed";
  }, [task, confirmedCount]);

  const missingCount = useMemo(() => {
    if (!task) return 0;
    if (task.neededCount !== undefined) {
      return Math.max(0, task.neededCount - confirmedCount);
    }
    return task.status === "confirmed" ? 0 : 1;
  }, [task, confirmedCount]);

  const taskStaffing = useMemo(() => {
    if (!task) {
      return {
        color: "green" as StaffingColor,
        statusText: "Dekket",
        confirmedCount: 0,
        neededCount: 0,
        missingCount: 0,
        pendingCount: 0,
        hasForfall: false,
        isFullyCovered: true,
      };
    }
    const taskAssigns = getAllAssignmentsForTask(task.id);
    return calculateTaskStaffingStatus(task, taskAssigns);
  }, [task, getAllAssignmentsForTask, assignments]);

  const handleUpdateInstruction = useCallback(
    (instruction: string) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskInstruction(task.id, instruction);
    },
    [task, updateTaskInstruction]
  );

  const handleUpdateNeededCount = useCallback(
    (neededCount: number | undefined) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskNeededCount(task.id, neededCount);
    },
    [task, updateTaskNeededCount]
  );

  return {
    isAdmin,
    currentUser,
    task,
    gathering,
    group,
    assignment,
    assignedPerson,
    allAssignedPersonsWithStatus,
    confirmedCount,
    isFullyCovered,
    missingCount,
    taskStaffing,
    updateTask,
    updateTaskInstruction: handleUpdateInstruction,
    updateTaskNeededCount: handleUpdateNeededCount,
  };
}

// 14. Hook: useLeaderGroupDetail
export function useLeaderGroupDetail(groupId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    getGroupById,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    getGroupMessages,
    sendGroupMessage,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    getPersonById,
  } = useMockData();

  const group = getGroupById(groupId);

  // Access checks:
  const isLeader = Boolean(group && group.leaderIds.includes(currentUser.id));
  const isDeputy = Boolean(group && group.deputyLeaderIds?.includes(currentUser.id));
  const isAdmin = currentUser.globalRole === "admin";
  const hasLeaderAccess = Boolean(group && (isLeader || isDeputy || isAdmin));
  const isMember = Boolean(
    group &&
      (group.memberIds.includes(currentUser.id) ||
        group.leaderIds.includes(currentUser.id) ||
        (group.deputyLeaderIds && group.deputyLeaderIds.includes(currentUser.id)) ||
        isAdmin)
  );
  const hasAccess = Boolean(group && (isMember || hasLeaderAccess));

  const leaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.leaderIds.includes(p.id));
  }, [group, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
  }, [group, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const availablePersonsToAdd = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => !group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const groupGatherings = useMemo(() => {
    if (!group) return [];
    
    // Find all gatherings assigned to this group or where this group has tasks
    const groupTasks = tasks.filter((t) => t.groupId === group.id);
    const relevantGatheringIds = new Set([
      ...gatherings.filter((g) => g.groupId === group.id).map((g) => g.id),
      ...groupTasks.map((t) => t.gatheringId),
    ]);

    return gatherings
      .filter((g) => relevantGatheringIds.has(g.id))
      .map((gathering) => {
        const gatheringTasks = groupTasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks, assignments);

        // Detailed task items with assignments
        const taskItems = gatheringTasks.map((task) => {
          const taskAssignments = assignments.filter((a) => a.taskId === task.id);
          const assignedPersons = taskAssignments.map((a) => {
            const person = getPersonById(a.personId);
            let statusLabel = "Forespurt";
            if (a.response === "confirmed") statusLabel = "Akseptert";
            if (a.response === "withdrawn") statusLabel = "Forfall";
            if (a.response === "declined") statusLabel = "Avslått";

            return {
              assignment: a,
              person,
              statusLabel,
              response: a.response,
            };
          });

          const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);
          const confirmedCount = taskStaffing.confirmedCount;
          const neededCount = taskStaffing.neededCount;
          const isFullyCovered = taskStaffing.isFullyCovered;
          const hasForfall = taskStaffing.hasForfall;

          return {
            task,
            assignedPersons,
            confirmedCount,
            neededCount,
            isFullyCovered,
            hasForfall,
            taskStaffing,
          };
        });

        // Compute total needed and confirmed count for gathering
        const totalNeeded = taskItems.reduce((acc, t) => acc + (t.neededCount || 1), 0);
        const totalConfirmed = taskItems.reduce((acc, t) => acc + t.confirmedCount, 0);
        const hasForfall = taskItems.some((t) => t.hasForfall);
        const isFullyCovered = totalNeeded > 0 && totalConfirmed >= totalNeeded && !hasForfall;

        return {
          gathering,
          tasks: gatheringTasks,
          taskItems,
          totalNeeded,
          totalConfirmed,
          hasForfall,
          isFullyCovered,
          staffing,
        };
      })
      .sort((a, b) => new Date(a.gathering.startsAt).getTime() - new Date(b.gathering.startsAt).getTime());
  }, [group, gatherings, tasks, assignments, getPersonById]);

  const messages = useMemo(() => {
    if (!group) return [];
    return getGroupMessages(group.id);
  }, [group, getGroupMessages]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!group) return { success: false, error: "Ingen gruppe valgt." };
      return sendGroupMessage(group.id, content);
    },
    [group, sendGroupMessage]
  );

  return {
    hasAccess,
    isMember,
    hasLeaderAccess,
    isLeader,
    isDeputy,
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    allPersons,
    groupGatherings,
    messages,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    sendMessage: handleSendMessage,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
  };
}

// 15. Hook: useLeaderGatheringDetail
export function useLeaderGatheringDetail(gatheringId: string) {
  const {
    currentUser,
    gatherings,
    groups,
    tasks,
    assignments,
    allPersons,
    getGatheringById,
    getGroupById,
    getPersonById,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence: performReportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    updateGathering,
  } = useMockData();

  const gathering = useMemo(() => {
    if (!gatheringId) return null;
    return getGatheringById(gatheringId) || null;
  }, [gatheringId, getGatheringById, gatherings]);

  // All tasks for this gathering
  const gatheringTasks = useMemo(() => {
    if (!gathering) return [];
    return tasks.filter((t) => t.gatheringId === gathering.id);
  }, [gathering, tasks]);

  // Find all groups involved in this gathering
  const involvedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    if (gathering) {
      ids.add(gathering.groupId);
    }
    gatheringTasks.forEach((t) => ids.add(t.groupId));
    return Array.from(ids);
  }, [gathering, gatheringTasks]);

  const involvedGroups = useMemo(() => {
    return involvedGroupIds.map((id) => getGroupById(id)).filter(Boolean) as Group[];
  }, [involvedGroupIds, getGroupById]);

  // Determine user's active group for this gathering:
  // If user is leader/deputy in one of the involved groups, pick that group
  const userLedGroup = useMemo(() => {
    return involvedGroups.find(
      (g) => g.leaderIds.includes(currentUser.id) || g.deputyLeaderIds?.includes(currentUser.id)
    ) || null;
  }, [involvedGroups, currentUser]);

  const group = useMemo(() => {
    if (userLedGroup) return userLedGroup;
    if (gathering) return getGroupById(gathering.groupId) || null;
    return null;
  }, [userLedGroup, gathering, getGroupById]);

  const isLeader = Boolean(
    (group && group.leaderIds.includes(currentUser.id)) ||
    involvedGroups.some((g) => g.leaderIds.includes(currentUser.id))
  );
  const isDeputy = Boolean(
    (group && group.deputyLeaderIds?.includes(currentUser.id)) ||
    involvedGroups.some((g) => g.deputyLeaderIds?.includes(currentUser.id))
  );
  const isAdmin = currentUser.globalRole === "admin";
  const hasAccess = Boolean(isAdmin || isLeader || isDeputy);

  // Group members available for leader to assign
  const groupMembers = useMemo(() => {
    if (!group) return allPersons;
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const tasksWithDetails = useMemo(() => {
    if (!gathering) return [];

    return gatheringTasks.map((task) => {
      const taskGroup = getGroupById(task.groupId);
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const assignedPersons = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);
      const confirmedPersonsCount = taskStaffing.confirmedCount;
      const neededCount = taskStaffing.neededCount;
      const isFullyCovered = taskStaffing.isFullyCovered;
      const hasWithdrawn = taskStaffing.hasForfall;
      const missingCount = taskStaffing.missingCount;
      const isMyGroup = Boolean(group && task.groupId === group.id);
      const staffingStatusLabel = taskStaffing.statusText;

      return {
        task,
        taskGroup,
        isMyGroup,
        neededCount,
        assignedPersons,
        confirmedPersonsCount,
        isFullyCovered,
        missingCount,
        hasWithdrawn,
        staffingStatusLabel,
        taskStaffing,
      };
    });
  }, [gathering, gatheringTasks, assignments, getPersonById, getGroupById, group]);

  // Combined program schedule including items with or without task links
  const programSchedule = useMemo(() => {
    if (!gathering) return [];
    if (gathering.programSchedule && gathering.programSchedule.length > 0) {
      return gathering.programSchedule;
    }
    // Fallback: build default program schedule from gathering tasks
    return [
      { time: "11:00", title: "Velkommen & åpningsbønn" },
      { time: "11:05", title: "Fellessang & lovsang" },
      { time: "11:50", title: "Preken / Dagens tale" },
      { time: "12:15", title: "Nattverd & forbønn" },
      { time: "12:35", title: "Kirkekaffe & fellesskap" },
    ];
  }, [gathering]);

  return {
    hasAccess,
    isLeader,
    isDeputy,
    isAdmin,
    currentUser,
    gathering,
    group,
    involvedGroups,
    groupMembers,
    allPersons,
    tasksWithDetails,
    programSchedule,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence: performReportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    allGroups: groups,
    updateGathering,
  };
}

export function useHusfellesskap(explicitGroupId?: string, explicitGatheringId?: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    attendances,
    groupMessages,
    getPersonById,
    getGatheringAttendances,
    getPersonAttendance,
    getUpcomingGatheringForGroup,
    getGatheringsForGroup,
    createGathering,
    updateGathering,
    deleteGathering,
    sendGatheringInvitation,
    respondToGathering,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    toggleGroupNotifications,
    getGroupNotificationsEnabled,
  } = useMockData();

  // Selected meeting ID override state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(explicitGatheringId || null);

  // Find the target group (either by ID or find the first group current user is member/leader in)
  const group = useMemo(() => {
    if (explicitGroupId) {
      return groups.find((g) => g.id === explicitGroupId) || null;
    }
    // Find user's husfellesskap first
    const userHus = groups.find(
      (g) =>
        g.category === "husgruppe" &&
        (g.memberIds.includes(currentUser.id) ||
          g.leaderIds.includes(currentUser.id) ||
          (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id)))
    );
    if (userHus) return userHus;
    // Or any group user is member/leader in
    const anyUserGroup = groups.find(
      (g) =>
        g.memberIds.includes(currentUser.id) ||
        g.leaderIds.includes(currentUser.id) ||
        (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id))
    );
    if (anyUserGroup) return anyUserGroup;
    // Fallback: any husgruppe or first group
    return groups.find((g) => g.category === "husgruppe") || groups[0] || null;
  }, [groups, explicitGroupId, currentUser.id]);

  const isMember = useMemo(() => {
    if (!group) return false;
    return (
      group.memberIds.includes(currentUser.id) ||
      group.leaderIds.includes(currentUser.id) ||
      (group.deputyLeaderIds ? group.deputyLeaderIds.includes(currentUser.id) : false)
    );
  }, [group, currentUser.id]);

  const isLeader = useMemo(() => {
    if (!group) return false;
    return group.leaderIds.includes(currentUser.id);
  }, [group, currentUser.id]);

  const isDeputyLeader = useMemo(() => {
    if (!group || !group.deputyLeaderIds) return false;
    return group.deputyLeaderIds.includes(currentUser.id);
  }, [group, currentUser.id]);

  const leaders = useMemo(() => {
    if (!group) return [];
    return group.leaderIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group || !group.deputyLeaderIds) return [];
    return group.deputyLeaderIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    // Distinct members including leaders and deputy leaders or pure members
    const allMemberIds = Array.from(
      new Set([...group.memberIds, ...group.leaderIds, ...(group.deputyLeaderIds || [])])
    );
    return allMemberIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  // All planned meetings for this husfellesskap
  const allGroupMeetings = useMemo(() => {
    if (!group) return [];
    return getGatheringsForGroup(group.id);
  }, [group, getGatheringsForGroup, gatherings]);

  // Active meeting: explicitly selected, or the next upcoming meeting, or the first meeting
  const activeMeeting = useMemo(() => {
    if (!group) return null;
    if (selectedMeetingId) {
      const match = allGroupMeetings.find((g) => g.id === selectedMeetingId);
      if (match) return match;
    }
    const upcoming = getUpcomingGatheringForGroup(group.id);
    if (upcoming) return upcoming;
    return allGroupMeetings[0] || null;
  }, [group, selectedMeetingId, allGroupMeetings, getUpcomingGatheringForGroup]);

  // Host person for active meeting
  const hostPerson = useMemo(() => {
    if (!activeMeeting?.hostPersonId) return null;
    return getPersonById(activeMeeting.hostPersonId) || null;
  }, [activeMeeting, getPersonById, allPersons]);

  // Attendances for active meeting
  const activeMeetingAttendances = useMemo(() => {
    if (!activeMeeting) return [];
    return getGatheringAttendances(activeMeeting.id);
  }, [activeMeeting, getGatheringAttendances, attendances]);

  // Hvem kommer (members who answered "attending")
  const attendingMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return att?.status === "attending";
    });
  }, [members, activeMeetingAttendances]);

  // Hvem kommer ikke (members who answered "declined")
  const declinedMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return att?.status === "declined";
    });
  }, [members, activeMeetingAttendances]);

  // Hvem har ikke svart (members with no response recorded)
  const unrespondedMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return !att;
    });
  }, [members, activeMeetingAttendances]);

  // Current user's attendance status
  const currentUserAttendance = useMemo(() => {
    if (!activeMeeting) return undefined;
    return getPersonAttendance(activeMeeting.id, currentUser.id);
  }, [activeMeeting, getPersonAttendance, currentUser.id, attendances]);

  const respond = useCallback(
    async (status: "attending" | "declined", gatheringId?: string) => {
      const targetId = gatheringId || activeMeeting?.id;
      if (!targetId) return { success: false, error: "Ingen møte funnet" };
      return respondToGathering(targetId, currentUser.id, status);
    },
    [activeMeeting, respondToGathering, currentUser.id]
  );

  // Leader Actions
  const createMeeting = useCallback(
    async (data: {
      title: string;
      startsAt: string;
      location?: string;
      theme?: string;
      bibleText?: string;
      hostPersonId?: string;
      sendInvitationImmediately?: boolean;
    }) => {
      if (!group) return { success: false, error: "Ingen husfellesskap valgt" };
      const res = createGathering({
        groupId: group.id,
        type: "gruppesamling",
        ...data,
      });
      if (res.success && res.gathering) {
        setSelectedMeetingId(res.gathering.id);
      }
      return res;
    },
    [group, createGathering]
  );

  const updateMeeting = useCallback(
    async (gatheringId: string, updates: Partial<Gathering>) => {
      return updateGathering(gatheringId, updates);
    },
    [updateGathering]
  );

  const deleteMeeting = useCallback(
    async (gatheringId: string) => {
      const res = deleteGathering(gatheringId);
      if (res.success && selectedMeetingId === gatheringId) {
        setSelectedMeetingId(null);
      }
      return res;
    },
    [deleteGathering, selectedMeetingId]
  );

  const sendInvitation = useCallback(
    async (gatheringId?: string) => {
      const targetId = gatheringId || activeMeeting?.id;
      if (!targetId) return { success: false, error: "Ingen samling valgt" };
      return sendGatheringInvitation(targetId);
    },
    [activeMeeting, sendGatheringInvitation]
  );

  // Group messages filtered by membership and join date
  const messages = useMemo(() => {
    if (!group || !isMember) return [];
    return getGroupMessages(group.id, currentUser.id);
  }, [group, isMember, getGroupMessages, currentUser.id, groupMessages]);

  const sendMessage = useCallback(
    (content: string, imageUrl?: string) => {
      if (!group) return { success: false, error: "Ingen gruppe valgt" };
      if (!isMember) return { success: false, error: "Du er ikke medlem av denne gruppen." };
      return sendGroupMessage(group.id, content, imageUrl);
    },
    [group, isMember, sendGroupMessage]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      return deleteGroupMessage(messageId, currentUser.id);
    },
    [deleteGroupMessage, currentUser.id]
  );

  const notificationsEnabled = useMemo(() => {
    if (!group) return true;
    return getGroupNotificationsEnabled(group.id, currentUser.id);
  }, [group, getGroupNotificationsEnabled, currentUser.id, groups]);

  const toggleNotifications = useCallback(
    (forced?: boolean) => {
      if (!group) return { success: false, enabled: true };
      return toggleGroupNotifications(group.id, currentUser.id, forced);
    },
    [group, toggleGroupNotifications, currentUser.id]
  );

  return {
    group,
    isMember,
    isLeader,
    isDeputyLeader,
    leaders,
    deputyLeaders,
    members,
    allGroupMeetings,
    nextMeeting: activeMeeting,
    activeMeeting,
    selectedMeetingId,
    setSelectedMeetingId,
    hostPerson,
    attendingMembers,
    declinedMembers,
    unrespondedMembers,
    currentUserAttendance,
    respond,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    sendInvitation,
    messages,
    sendMessage,
    deleteMessage,
    notificationsEnabled,
    toggleNotifications,
    currentUser,
    allPersons,
  };
}

// Universal Group Room hook alias
export const useGroupRoom = useHusfellesskap;


