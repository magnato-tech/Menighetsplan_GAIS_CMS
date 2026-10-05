import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAppHooks";
import { StudioTab, ShowFeedback, toStudioTab } from "./studio";
import { useTimedMessage } from "../../hooks/useTimedMessage";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTabErrorBoundary } from "../../components/StudioTabErrorBoundary";
import {
  LazyAdminCmsPanel,
  LazyDashboardTab,
  LazyDatabaseTab,
  LazyGatheringsTab,
  LazyGroupsTab,
  LazyMediaTab,
  LazyNewsTab,
  LazyPersonsTab,
  LazyRolesTab,
  LazySermonsTab,
  LazySiteSettingsTab,
  LazyStaffTab,
  LazyTasksTab,
  LazyThemeTab,
  LazyVisibilityTab,
  prefetchStudioTab,
} from "./studioTabLoaders";

function TabLoadingPlaceholder() {
  return <p className="text-sm text-slate-400 p-2">Laster fane…</p>;
}

interface StudioTabPanelProps {
  tab: StudioTab;
  activeTab: StudioTab;
  visited: boolean;
  children: React.ReactNode;
}

function StudioTabPanel({ tab, activeTab, visited, children }: StudioTabPanelProps) {
  if (!visited) return null;
  return (
    <div hidden={activeTab !== tab}>
      <StudioTabErrorBoundary>
        <Suspense fallback={<TabLoadingPlaceholder />}>{children}</Suspense>
      </StudioTabErrorBoundary>
    </div>
  );
}

export const AdminStudio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const studio = useAdminDashboard();

  const tabParam = toStudioTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<StudioTab>(tabParam);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<StudioTab[]>([tabParam]);
  const [createRequest, setCreateRequest] = useState<StudioTab | null>(null);

  useEffect(() => {
    prefetchStudioTab("dashboard");
    prefetchStudioTab(tabParam);
  }, [tabParam]);

  const openTab = (tab: StudioTab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  useEffect(() => {
    if (searchParams.has("tab")) openTab(tabParam);
  }, [searchParams, tabParam]);

  const handleTabChange = (tab: StudioTab) => {
    openTab(tab);
    setSearchParams({ tab });
    setSidebarOpen(false);
  };

  const handleCreateIn = (tab: StudioTab) => {
    setCreateRequest(tab);
    handleTabChange(tab);
  };
  const clearCreateRequest = () => setCreateRequest(null);

  const [feedback, setFeedback] = useTimedMessage<{ text: string; type: "success" | "error" }>();
  const showFeedback: ShowFeedback = (text, type = "success") => setFeedback({ text, type });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      <StudioSidebar
        studio={studio}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:p-8">
        <StudioTabPanel tab="dashboard" activeTab={activeTab} visited={visitedTabs.includes("dashboard")}>
          <LazyDashboardTab studio={studio} onTabChange={handleTabChange} onCreateIn={handleCreateIn} />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-sider" activeTab={activeTab} visited={visitedTabs.includes("cms-sider")}>
          <LazyAdminCmsPanel
            showFeedback={showFeedback}
            createRequested={createRequest === "cms-sider"}
            onCreateHandled={clearCreateRequest}
          />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-medier" activeTab={activeTab} visited={visitedTabs.includes("cms-medier")}>
          <LazyMediaTab showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-nyheter" activeTab={activeTab} visited={visitedTabs.includes("cms-nyheter")}>
          <LazyNewsTab
            studio={studio}
            showFeedback={showFeedback}
            createRequested={createRequest === "cms-nyheter"}
            onCreateHandled={clearCreateRequest}
          />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-taler" activeTab={activeTab} visited={visitedTabs.includes("cms-taler")}>
          <LazySermonsTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-stab" activeTab={activeTab} visited={visitedTabs.includes("cms-stab")}>
          <LazyStaffTab showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-design" activeTab={activeTab} visited={visitedTabs.includes("cms-design")}>
          <LazyThemeTab showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-innstillinger" activeTab={activeTab} visited={visitedTabs.includes("cms-innstillinger")}>
          <LazySiteSettingsTab />
        </StudioTabPanel>

        <StudioTabPanel tab="cms-overstyringer" activeTab={activeTab} visited={visitedTabs.includes("cms-overstyringer")}>
          <LazyVisibilityTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="planlegger-samlinger" activeTab={activeTab} visited={visitedTabs.includes("planlegger-samlinger")}>
          <LazyGatheringsTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="planlegger-oppgaver" activeTab={activeTab} visited={visitedTabs.includes("planlegger-oppgaver")}>
          <LazyTasksTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="planlegger-grupper" activeTab={activeTab} visited={visitedTabs.includes("planlegger-grupper")}>
          <LazyGroupsTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="planlegger-personer" activeTab={activeTab} visited={visitedTabs.includes("planlegger-personer")}>
          <LazyPersonsTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="planlegger-roller" activeTab={activeTab} visited={visitedTabs.includes("planlegger-roller")}>
          <LazyRolesTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>

        <StudioTabPanel tab="database-admin" activeTab={activeTab} visited={visitedTabs.includes("database-admin")}>
          <LazyDatabaseTab studio={studio} showFeedback={showFeedback} />
        </StudioTabPanel>
      </main>
    </div>
  );
};
