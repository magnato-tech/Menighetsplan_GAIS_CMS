import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAppHooks";
import { StudioTab, ShowFeedback, toStudioTab } from "./studio";
import { StudioSidebar } from "./StudioSidebar";
import { DashboardTab } from "./tabs/DashboardTab";
import { PagesTab } from "./tabs/PagesTab";
import { NewsTab } from "./tabs/NewsTab";
import { SermonsTab } from "./tabs/SermonsTab";
import { StaffTab } from "./tabs/StaffTab";
import { SiteSettingsTab } from "./tabs/SiteSettingsTab";
import { VisibilityTab } from "./tabs/VisibilityTab";
import { GatheringsTab } from "./tabs/GatheringsTab";
import { TasksTab } from "./tabs/TasksTab";
import { GroupsTab } from "./tabs/GroupsTab";
import { PersonsTab } from "./tabs/PersonsTab";

export const AdminStudio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Admin Dashboard Hooks (Menighetsplan data)
  const studio = useAdminDashboard();

  // Tab State
  const tabParam = toStudioTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<StudioTab>(tabParam);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // A tab is mounted on its first visit and then only hidden, so a half-written
  // draft is still there after a look at another tab.
  const [visitedTabs, setVisitedTabs] = useState<StudioTab[]>([tabParam]);
  // The tab that was asked to open with its editor for a new item showing
  const [createRequest, setCreateRequest] = useState<StudioTab | null>(null);

  const openTab = (tab: StudioTab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  useEffect(() => {
    if (searchParams.has("tab")) openTab(tabParam);
  }, [searchParams]);

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

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showFeedback: ShowFeedback = (text, type = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const panel = (tab: StudioTab, content: React.ReactNode) =>
    visitedTabs.includes(tab) ? <div hidden={activeTab !== tab}>{content}</div> : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Feedback Toast */}
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
        {panel("dashboard", <DashboardTab studio={studio} onTabChange={handleTabChange} onCreateIn={handleCreateIn} />)}
        {panel(
          "cms-sider",
          <PagesTab
            showFeedback={showFeedback}
            createRequested={createRequest === "cms-sider"}
            onCreateHandled={clearCreateRequest}
          />
        )}
        {panel(
          "cms-nyheter",
          <NewsTab
            studio={studio}
            showFeedback={showFeedback}
            createRequested={createRequest === "cms-nyheter"}
            onCreateHandled={clearCreateRequest}
          />
        )}
        {panel("cms-taler", <SermonsTab studio={studio} showFeedback={showFeedback} />)}
        {panel("cms-stab", <StaffTab showFeedback={showFeedback} />)}
        {panel("cms-innstillinger", <SiteSettingsTab />)}
        {panel("cms-overstyringer", <VisibilityTab studio={studio} showFeedback={showFeedback} />)}
        {panel("planlegger-samlinger", <GatheringsTab studio={studio} showFeedback={showFeedback} />)}
        {panel("planlegger-oppgaver", <TasksTab studio={studio} showFeedback={showFeedback} />)}
        {panel("planlegger-grupper", <GroupsTab studio={studio} showFeedback={showFeedback} />)}
        {panel("planlegger-personer", <PersonsTab studio={studio} />)}
      </main>
    </div>
  );
};
