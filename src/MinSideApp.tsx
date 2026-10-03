import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { MyPage } from "./pages/MyPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { LeaderPage } from "./pages/LeaderPage";
import { LeaderGroupDetailPage } from "./pages/LeaderGroupDetailPage";
import { LeaderGatheringDetailPage } from "./pages/LeaderGatheringDetailPage";
import { HusfellesskapPage } from "./pages/HusfellesskapPage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";
import { AdminGroupDetailPage } from "./pages/AdminGroupDetailPage";
import { AdminPersonDetailPage } from "./pages/AdminPersonDetailPage";
import { AdminGatheringDetailPage } from "./pages/AdminGatheringDetailPage";
import { AdminTaskDetailPage } from "./pages/AdminTaskDetailPage";

/** Layout and routes for Min side and the internal pages. Loaded only when one of them is opened. */
export default function MinSideApp() {
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
        <Route path="/admin/settings" element={<Navigate to="/admin?tab=database-admin" replace />} />
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
