import { lazy, type ComponentType } from "react";
import type { StudioTab } from "./studio";
import { prefetchModule } from "../../utils/lazyImport";

type TabLoader = () => Promise<{ default: ComponentType<any> }>;

function namedTab<T extends ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string
): TabLoader {
  return () => loader().then((mod) => ({ default: mod[exportName] }));
}

const TAB_LOADERS: Record<StudioTab, TabLoader> = {
  dashboard: namedTab(() => import("./tabs/DashboardTab"), "DashboardTab"),
  "cms-sider": namedTab(() => import("../../components/admin/AdminCmsPanel"), "AdminCmsPanel"),
  "cms-medier": namedTab(() => import("./tabs/MediaTab"), "MediaTab"),
  "cms-nyheter": namedTab(() => import("./tabs/NewsTab"), "NewsTab"),
  "cms-taler": namedTab(() => import("./tabs/SermonsTab"), "SermonsTab"),
  "cms-stab": namedTab(() => import("./tabs/StaffTab"), "StaffTab"),
  "cms-design": namedTab(() => import("./tabs/ThemeTab"), "ThemeTab"),
  "cms-innstillinger": namedTab(() => import("./tabs/SiteSettingsTab"), "SiteSettingsTab"),
  "cms-overstyringer": namedTab(() => import("./tabs/VisibilityTab"), "VisibilityTab"),
  "planlegger-samlinger": namedTab(() => import("./tabs/GatheringsTab"), "GatheringsTab"),
  "planlegger-oppgaver": namedTab(() => import("./tabs/TasksTab"), "TasksTab"),
  "planlegger-grupper": namedTab(() => import("./tabs/GroupsTab"), "GroupsTab"),
  "planlegger-personer": namedTab(() => import("./tabs/PersonsTab"), "PersonsTab"),
  "planlegger-roller": namedTab(() => import("./tabs/RolesTab"), "RolesTab"),
  "database-admin": namedTab(() => import("./tabs/DatabaseTab"), "DatabaseTab"),
};

export function prefetchStudioTab(tab: StudioTab): void {
  prefetchModule(TAB_LOADERS[tab]);
}

export const LazyDashboardTab = lazy(TAB_LOADERS.dashboard);
export const LazyAdminCmsPanel = lazy(TAB_LOADERS["cms-sider"]);
export const LazyMediaTab = lazy(TAB_LOADERS["cms-medier"]);
export const LazyNewsTab = lazy(TAB_LOADERS["cms-nyheter"]);
export const LazySermonsTab = lazy(TAB_LOADERS["cms-taler"]);
export const LazyStaffTab = lazy(TAB_LOADERS["cms-stab"]);
export const LazyThemeTab = lazy(TAB_LOADERS["cms-design"]);
export const LazySiteSettingsTab = lazy(TAB_LOADERS["cms-innstillinger"]);
export const LazyVisibilityTab = lazy(TAB_LOADERS["cms-overstyringer"]);
export const LazyGatheringsTab = lazy(TAB_LOADERS["planlegger-samlinger"]);
export const LazyTasksTab = lazy(TAB_LOADERS["planlegger-oppgaver"]);
export const LazyGroupsTab = lazy(TAB_LOADERS["planlegger-grupper"]);
export const LazyPersonsTab = lazy(TAB_LOADERS["planlegger-personer"]);
export const LazyRolesTab = lazy(TAB_LOADERS["planlegger-roller"]);
export const LazyDatabaseTab = lazy(TAB_LOADERS["database-admin"]);
