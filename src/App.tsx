import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FirebaseDataProvider } from "./context/FirebaseDataContext";
import { CmsProvider } from "./context/CmsContext";
import { Header } from "./components/Header";
import { WriteErrorBanner } from "./components/WriteErrorBanner";
import { PublicNavbar } from "./components/public/PublicNavbar";
import { PublicFooter } from "./components/public/PublicFooter";

// Public Pages
import { PublicHomePage } from "./pages/public/PublicHomePage";
import { PublicCalendarPage } from "./pages/public/PublicCalendarPage";
import { PublicGroupsPage } from "./pages/public/PublicGroupsPage";
import { PublicStaticPage } from "./pages/public/PublicStaticPage";
import { PublicArticlePage } from "./pages/public/PublicArticlePage";
import { PublicSermonsPage } from "./pages/public/PublicSermonsPage";
import { PublicLeadershipPage } from "./pages/public/PublicLeadershipPage";

// Internal App / Min Side Pages
import { MyPage } from "./pages/MyPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { LeaderPage } from "./pages/LeaderPage";
import { LeaderGroupDetailPage } from "./pages/LeaderGroupDetailPage";
import { LeaderGatheringDetailPage } from "./pages/LeaderGatheringDetailPage";
import { HusfellesskapPage } from "./pages/HusfellesskapPage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";

// Fullscreen Admin & CMS Studio
import { AdminStudio } from "./pages/admin/AdminStudio";
import { AdminGroupDetailPage } from "./pages/AdminGroupDetailPage";
import { AdminPersonDetailPage } from "./pages/AdminPersonDetailPage";
import { AdminGatheringDetailPage } from "./pages/AdminGatheringDetailPage";
import { AdminTaskDetailPage } from "./pages/AdminTaskDetailPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";

const MIN_SIDE_SECTIONS = ["/minside", "/leder", "/oppgave", "/gruppe", "/samling", "/husfellesskap", "/meldinger"];

// Whole path segments only: "/leder" must not claim the public page "/lederskap"
const isUnder = (pathname: string, section: string) => pathname === section || pathname.startsWith(`${section}/`);

const isAdminStudioPath = (pathname: string) => pathname === "/admin";

function isMinSidePath(pathname: string): boolean {
  const isAdminSubpage = pathname.startsWith("/admin/") && !pathname.startsWith("/admin/cms");
  return isAdminSubpage || MIN_SIDE_SECTIONS.some((section) => isUnder(pathname, section));
}

function AppContent() {
  const location = useLocation();

  // Route type checks
  const isAdminStudio = isAdminStudioPath(location.pathname);
  const isMinSideRoute = isMinSidePath(location.pathname);

  // 1. Fullscreen Admin Studio
  if (isAdminStudio) {
    return <AdminStudio />;
  }

  // 2. Min Side / Internal Planlegger Layout
  if (isMinSideRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
        <Header />
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/minside" element={<MyPage />} />
            <Route path="/leder" element={<LeaderPage />} />
            <Route path="/leder/gruppe/:groupId" element={<LeaderGroupDetailPage />} />
            <Route path="/leder/samling/:gatheringId" element={<LeaderGatheringDetailPage />} />
            <Route path="/admin/gruppe/:groupId" element={<AdminGroupDetailPage />} />
            <Route path="/admin/person/:personId" element={<AdminPersonDetailPage />} />
            <Route path="/admin/samling/:gatheringId" element={<AdminGatheringDetailPage />} />
            <Route path="/admin/oppgave/:taskId" element={<AdminTaskDetailPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/oppgave/:taskId" element={<TaskDetailPage />} />
            <Route path="/gruppe/:groupId" element={<LeaderGroupDetailPage />} />
            <Route path="/samling/:gatheringId" element={<LeaderGatheringDetailPage />} />
            <Route path="/husfellesskap" element={<HusfellesskapPage />} />
            <Route path="/husfellesskap/:groupId" element={<HusfellesskapPage />} />
            <Route path="/meldinger" element={<ModulePlaceholderPage module="meldinger" />} />
            {/* An internal address that leads nowhere, such as /gruppe without an id */}
            <Route path="*" element={<Navigate to="/minside" replace />} />
          </Routes>
        </main>
        <footer className="py-6 border-t border-slate-200/60 bg-white/70 text-center text-xs text-slate-500">
          <div className="max-w-md mx-auto px-4 space-y-1">
            <p className="font-semibold text-slate-700">Menighetsplan Min Side</p>
            <p className="text-[11px] text-slate-400">
              Planlegging, gudstjenestelister og frivilligtjeneste
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // 3. Public Website Layout (Menighetsplan - Offentlig nettside for Lillesand Misjonskirke)
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      <PublicNavbar />
      <main className="flex-1">
        <Routes>
          {/* Public Home */}
          <Route path="/" element={<PublicHomePage />} />

          {/* Public Calendar & Events */}
          <Route path="/hva-skjer" element={<PublicCalendarPage />} />
          <Route path="/kalender" element={<PublicCalendarPage />} />

          {/* Public Sermons */}
          <Route path="/taler" element={<PublicSermonsPage />} />

          {/* Public Groups & Fellowship */}
          <Route path="/fellesskap" element={<PublicGroupsPage />} />
          <Route path="/grupper" element={<PublicGroupsPage />} />

          {/* Public Static CMS Pages */}
          <Route path="/om-oss" element={<PublicStaticPage forcedSlug="om-oss" />} />
          <Route path="/lederskap" element={<PublicLeadershipPage />} />
          <Route path="/stab" element={<PublicLeadershipPage />} />
          <Route path="/kontakt" element={<PublicStaticPage forcedSlug="kontakt" />} />
          <Route path="/side/:slug" element={<PublicStaticPage />} />
          <Route path="/:slug" element={<PublicStaticPage />} />

          {/* Public News & Articles */}
          <Route path="/artikkel/:id" element={<PublicArticlePage />} />

          {/* Aliases for old /nettside routes */}
          <Route path="/nettside" element={<Navigate to="/" replace />} />
          <Route path="/nettside/:slug" element={<PublicStaticPage />} />

          {/* Catch-all to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PublicFooter />
    </div>
  );
}

function DataProviders({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const internal = isAdminStudioPath(pathname) || isMinSidePath(pathname);

  return (
    <FirebaseDataProvider internal={internal}>
      <CmsProvider>{children}</CmsProvider>
    </FirebaseDataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProviders>
        <AppContent />
        <WriteErrorBanner />
      </DataProviders>
    </BrowserRouter>
  );
}
