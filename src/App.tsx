import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FirebaseDataProvider } from "./firebase-service";
import { CmsProvider } from "./context/CmsContext";
import { Header } from "./components/Header";
import { MyPage } from "./pages/MyPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { LeaderPage } from "./pages/LeaderPage";
import { LeaderGroupDetailPage } from "./pages/LeaderGroupDetailPage";
import { LeaderGatheringDetailPage } from "./pages/LeaderGatheringDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminGroupDetailPage } from "./pages/AdminGroupDetailPage";
import { AdminPersonDetailPage } from "./pages/AdminPersonDetailPage";
import { AdminGatheringDetailPage } from "./pages/AdminGatheringDetailPage";
import { AdminTaskDetailPage } from "./pages/AdminTaskDetailPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminCmsPage } from "./pages/AdminCmsPage";
import { PublicWebsitePage } from "./pages/PublicWebsitePage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";
import { HusfellesskapPage } from "./pages/HusfellesskapPage";

function AppContent() {
  const location = useLocation();
  const isPublicWebsite = location.pathname.startsWith("/nettside");

  return (
    <div className={`min-h-screen flex flex-col ${isPublicWebsite ? "bg-stone-50" : "bg-slate-100 text-slate-800"}`}>
      {!isPublicWebsite && <Header />}

      <main className={`flex-1 ${!isPublicWebsite ? "pb-12" : ""}`}>
        <Routes>
          <Route path="/" element={<MyPage />} />
          <Route path="/leder" element={<LeaderPage />} />
          <Route path="/leder/gruppe/:groupId" element={<LeaderGroupDetailPage />} />
          <Route path="/leder/samling/:gatheringId" element={<LeaderGatheringDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/gruppe/:groupId" element={<AdminGroupDetailPage />} />
          <Route path="/admin/person/:personId" element={<AdminPersonDetailPage />} />
          <Route path="/admin/samling/:gatheringId" element={<AdminGatheringDetailPage />} />
          <Route path="/admin/oppgave/:taskId" element={<AdminTaskDetailPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/cms" element={<AdminCmsPage />} />
          <Route path="/nettside" element={<PublicWebsitePage />} />
          <Route path="/nettside/:slug" element={<PublicWebsitePage />} />
          <Route
            path="/kalender"
            element={<ModulePlaceholderPage module="kalender" />}
          />
          <Route
            path="/meldinger"
            element={<ModulePlaceholderPage module="meldinger" />}
          />
          <Route path="/oppgave/:taskId" element={<TaskDetailPage />} />
          <Route path="/gruppe/:groupId" element={<LeaderGroupDetailPage />} />
          <Route path="/samling/:gatheringId" element={<LeaderGatheringDetailPage />} />
          <Route path="/husfellesskap" element={<HusfellesskapPage />} />
          <Route path="/husfellesskap/:groupId" element={<HusfellesskapPage />} />
          <Route path="/grupper" element={<HusfellesskapPage />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isPublicWebsite && (
        <footer className="py-6 border-t border-slate-200/60 bg-white/70 text-center text-xs text-slate-500">
          <div className="max-w-md mx-auto px-4 space-y-1">
            <p className="font-semibold text-slate-700">Menighetsplan 2.0 & ClaudeCMS</p>
            <p className="text-[11px] text-slate-400">
              Integrert løsning for planlegging, samlinger og offentlig nettside
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseDataProvider>
      <CmsProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CmsProvider>
    </FirebaseDataProvider>
  );
}

