import type { useAdminDashboard } from "../../hooks/useAppHooks";

export type StudioTab =
  | "dashboard"
  | "cms-sider"
  | "cms-nyheter"
  | "cms-taler"
  | "cms-stab"
  | "cms-innstillinger"
  | "cms-overstyringer"
  | "planlegger-samlinger"
  | "planlegger-oppgaver"
  | "planlegger-grupper"
  | "planlegger-personer";

/**
 * Everything useAdminDashboard returns. AdminStudio calls the hook once and hands
 * the result to the tabs, so its derived lists are not recomputed per tab.
 */
export type StudioData = ReturnType<typeof useAdminDashboard>;

export type ShowFeedback = (text: string, type?: "success" | "error") => void;

export function countPublicGatherings(items: StudioData["adminGatherings"]): number {
  return items.filter((item) => item.gathering.visibility !== "intern").length;
}

export function countUrgentTasks(items: StudioData["adminTasks"]): number {
  return items.filter(
    (item) => item.taskStaffing.hasForfall || item.taskStaffing.color === "red" || item.task.status === "vacant"
  ).length;
}
