import type { Task } from "../types";
import type { RunSheetRow, RunSheetTask } from "./runSheet";

export type RunSheetFilter = "all" | "needs-action" | "my-group";
export type GatheringViewMode = "admin" | "leader";
export type AssignmentResponse = "confirmed" | "pending" | "withdrawn" | "declined";

/** What the page shows: the admin look when asked for, or when an admin opens it without saying leader. */
export function isAdminLook(mode: GatheringViewMode, isUserAdmin: boolean): boolean {
  return mode === "admin" || (isUserAdmin && mode !== "leader");
}

/** Admins can change tasks and the gathering, whichever look the page has. */
export function canAdminister(isUserAdmin: boolean, adminLook: boolean): boolean {
  return isUserAdmin || adminLook;
}

/** Whether the person may change who is on a row: an admin anywhere, a leader in the own group. */
export function canIntervene(row: Pick<RunSheetRow, "isMyGroup">, admin: boolean, isLeader: boolean): boolean {
  return admin || (row.isMyGroup && isLeader);
}

/** The label in the corner of the header. */
export function roleLabel(adminLook: boolean, isDeputy: boolean): string {
  return adminLook ? "Admin-visning" : isDeputy ? "Nestleder" : "Gruppeleder";
}

/** The word for an answer, as in «Status for Kari ble endret til Forfall». */
export function responseLabel(response: AssignmentResponse): string {
  return response === "confirmed" ? "Akseptert" : response === "pending" ? "Forespurt" : response === "withdrawn" ? "Forfall" : "Avslått";
}

/** The groups that have rows in the run sheet, with the number of rows each, in the order they first appear. */
export function groupsInRunSheet(rows: RunSheetRow[]): { id: string; name: string; count: number }[] {
  const groups = new Map<string, { id: string; name: string; count: number }>();
  for (const row of rows) {
    if (!row.groupId) continue;
    const group = groups.get(row.groupId) || { id: row.groupId, name: row.groupName || "Gruppe", count: 0 };
    group.count += 1;
    groups.set(row.groupId, group);
  }
  return Array.from(groups.values());
}

/** The rows of one group (or all), and then only those in the own group or only those that need action. */
export function filterRunSheet(rows: RunSheetRow[], view: RunSheetFilter, groupId: string): RunSheetRow[] {
  return rows.filter((row) => {
    if (groupId !== "all" && row.groupId !== groupId) return false;
    if (view === "my-group") return row.isMyGroup;
    if (view === "needs-action") return !row.isFullyCovered || row.hasForfall;
    return true;
  });
}

export interface StaffingSummary {
  total: number;
  /** Tasks marked vacant or where someone has withdrawn */
  vacant: number;
  covered: number;
  myGroupTotal: number;
  myGroupCovered: number;
  /** red when something needs follow-up, green when everything is covered, otherwise amber */
  tone: "red" | "green" | "amber";
  headline: string;
}

/** How well the gathering is staffed, with the words for it. */
export function staffingSummary(tasks: RunSheetTask[]): StaffingSummary {
  const total = tasks.length;
  const vacant = tasks.filter((t) => t.task.status === "vacant" || t.hasWithdrawn).length;
  const covered = tasks.filter((t) => t.isFullyCovered).length;
  const mine = tasks.filter((t) => t.isMyGroup);
  const myNeedingAction = mine.filter((t) => !t.isFullyCovered || t.hasWithdrawn).length;
  const allCovered = covered === total && total > 0;

  return {
    total,
    vacant,
    covered,
    myGroupTotal: mine.length,
    myGroupCovered: mine.length - myNeedingAction,
    tone: vacant > 0 ? "red" : allCovered ? "green" : "amber",
    headline:
      vacant > 0
        ? `${vacant} ${vacant === 1 ? "oppgave krever oppfølging (forfall/vikar)" : "oppgaver krever oppfølging"}`
        : allCovered
        ? "Fullt bemannet arrangement"
        : "Mangler bemanning på noen oppgaver",
  };
}

/** What the instruction dialog is opened with: the row's title (with the role after a dash), text, time and group. */
export function instructionTargetOf(row: Pick<RunSheetRow, "task" | "title" | "roleTitle" | "instruction" | "time" | "groupName">) {
  return {
    taskId: row.task?.id,
    title: row.roleTitle ? `${row.title} – ${row.roleTitle}` : row.title,
    instruction: row.instruction || "",
    time: row.time,
    groupName: row.groupName,
  };
}

/** The fields of a task the edit dialog works on, with a need of 1 and empty texts when nothing is set. */
export function editableTaskOf(task: Pick<Task, "id" | "title" | "groupId" | "neededCount" | "description" | "instruction">) {
  return {
    id: task.id,
    title: task.title,
    groupId: task.groupId,
    neededCount: task.neededCount || 1,
    description: task.description || "",
    instruction: task.instruction || "",
  };
}
