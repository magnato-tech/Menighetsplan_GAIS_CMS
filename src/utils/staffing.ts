import { Task, Assignment } from "../types";

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
      // Red either way, but only a withdrawal or a vacant task counts as forfall:
      // 1 of 2 confirmed is short of people without anyone having dropped out.
      hasForfall,
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
