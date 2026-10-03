import { monthKeyOf, monthOptionsOf } from "./dates";

/** The parts of a group's activity (a gathering with its tasks) that the overview reads. */
export interface ActivityItem {
  gathering: { id: string; title: string; startsAt: string; location?: string; type?: string };
  tasks: { status: string }[];
  taskItems: {
    task: { id: string; title: string };
    assignedPersons: {
      assignment: { id: string };
      person?: { id: string; name: string };
      statusLabel: string;
      response: "pending" | "confirmed" | "declined" | "withdrawn";
    }[];
    confirmedCount: number;
    neededCount: number;
  }[];
  staffing: { color: string };
}

/** An activity as the card shows it: with the totals, how each task is covered, and the staffing label. */
export interface ActivityCardItem extends ActivityItem {
  totalNeeded: number;
  totalConfirmed: number;
  staffing: ActivityItem["staffing"] & { badgeText: string };
  taskItems: (ActivityItem["taskItems"][number] & { isFullyCovered: boolean; hasForfall: boolean })[];
}

export type StatusFilter = "all" | "red" | "yellow" | "green";

/** One line in the table: a person on a task, or a task nobody stands on. */
export interface ActivityTableRow {
  rowId: string;
  gatheringId: string;
  gatheringTitle: string;
  gatheringType: "arrangement" | "gruppesamling";
  startsAt: string;
  location?: string;
  taskId: string;
  taskTitle: string;
  neededCount: number;
  confirmedCount: number;
  assignedPersonName?: string;
  assignedPersonId?: string;
  statusLabel: string;
  statusType: "confirmed" | "pending" | "withdrawn" | "declined" | "vacant";
}

/** An activity with no type counts as an event (arrangement). */
export function activityKind(gathering: { type?: string }): "arrangement" | "gruppesamling" {
  return gathering.type === "arrangement" || !gathering.type ? "arrangement" : "gruppesamling";
}

/** The choices in the month filter: all, then each month that has an activity. */
export function monthFilterOptions(items: ActivityItem[]): { id: string; label: string }[] {
  return [{ id: "all", label: "Alle måneder" }, ...monthOptionsOf(items.map((item) => item.gathering.startsAt))];
}

/** The activities in the chosen month with the chosen staffing colour. «all» lets everything through. */
export function filterActivities<T extends ActivityItem>(items: T[], month: string, status: StatusFilter): T[] {
  return items.filter((item) => {
    if (month !== "all" && monthKeyOf(item.gathering.startsAt) !== month) return false;
    if (status !== "all" && item.staffing.color !== status) return false;
    return true;
  });
}

/** Every task of every activity as table lines. A task with nobody on it gets one line marked vacant. */
export function activityTableRows(items: ActivityItem[]): ActivityTableRow[] {
  const rows: ActivityTableRow[] = [];
  for (const { gathering, taskItems } of items) {
    const gatheringType = activityKind(gathering);
    for (const { task, assignedPersons, confirmedCount, neededCount } of taskItems) {
      const common = {
        gatheringId: gathering.id,
        gatheringTitle: gathering.title,
        gatheringType,
        startsAt: gathering.startsAt,
        location: gathering.location,
        taskId: task.id,
        taskTitle: task.title,
        neededCount,
      };
      if (assignedPersons.length > 0) {
        for (const { assignment, person, statusLabel, response } of assignedPersons) {
          rows.push({
            ...common,
            rowId: `${gathering.id}-${task.id}-${assignment.id}`,
            confirmedCount,
            assignedPersonName: person?.name,
            assignedPersonId: person?.id,
            statusLabel,
            statusType: response,
          });
        }
      } else {
        rows.push({
          ...common,
          rowId: `${gathering.id}-${task.id}-vacant`,
          confirmedCount: 0,
          assignedPersonName: undefined,
          assignedPersonId: undefined,
          statusLabel: "Ubesatt",
          statusType: "vacant",
        });
      }
    }
  }
  return rows;
}

/** How many tasks across the activities are vacant and need follow-up. */
export function countVacantTasks(items: ActivityItem[]): number {
  return items.reduce((sum, item) => sum + item.tasks.filter((t) => t.status === "vacant").length, 0);
}
