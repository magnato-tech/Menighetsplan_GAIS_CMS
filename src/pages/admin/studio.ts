import type { useAdminDashboard } from "../../hooks/useAppHooks";
import { isPubliclyVisible } from "../../utils/visibility";

export const STUDIO_TABS = [
  "dashboard",
  "cms-sider",
  "cms-nyheter",
  "cms-taler",
  "cms-stab",
  "cms-design",
  "cms-innstillinger",
  "cms-overstyringer",
  "planlegger-samlinger",
  "planlegger-oppgaver",
  "planlegger-grupper",
  "planlegger-personer",
] as const;

export type StudioTab = (typeof STUDIO_TABS)[number];

/** The tab named in the address. Anything unknown opens the dashboard rather than an empty page. */
export function toStudioTab(value: string | null): StudioTab {
  return STUDIO_TABS.find((tab) => tab === value) ?? "dashboard";
}

/** The address of a tab. Links built with this cannot point at a tab that does not exist. */
export function studioTabUrl(tab: StudioTab): string {
  return `/admin?tab=${tab}`;
}

/**
 * Everything useAdminDashboard returns. AdminStudio calls the hook once and hands
 * the result to the tabs, so its derived lists are not recomputed per tab.
 */
export type StudioData = ReturnType<typeof useAdminDashboard>;

export type ShowFeedback = (text: string, type?: "success" | "error") => void;

export function countPublicGatherings(items: StudioData["adminGatherings"]): number {
  return items.filter((item) => isPubliclyVisible(item.gathering)).length;
}

export function countUrgentTasks(items: StudioData["adminTasks"]): number {
  return items.filter(
    (item) => item.taskStaffing.hasForfall || item.taskStaffing.color === "red" || item.task.status === "vacant"
  ).length;
}
