import React from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import {
  Globe,
  Settings,
  Calendar,
  FileText,
  ExternalLink,
  Star,
  Shield,
  Users,
  FolderKanban,
  ListTodo,
  Menu,
  X,
  LayoutDashboard,
  Newspaper,
  Sliders,
  ChevronRight,
  Headphones,
  User,
  Palette,
} from "lucide-react";
import { StudioData, StudioTab, countUrgentTasks } from "./studio";

interface StudioSidebarProps {
  studio: StudioData;
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({ studio, activeTab, onTabChange, sidebarOpen, onToggleSidebar }) => {
  const { currentUser, adminPersons, adminGroups, adminGatherings, adminTasks } = studio;
  const { pages, news, sermons, staff, settings } = useCms();
  const urgentTasksCount = countUrgentTasks(adminTasks);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="font-black text-sm text-white">Menighetsplan Admin Studio</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleSidebar()}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION (FULLSKJERMS ARBEIDSFLATE)            */}
      {/* ========================================================= */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Header Brand */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">Admin & CMS Studio</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Oppdateres i sanntid</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Fullskjerms administrasjon for {settings.churchName}
            </p>
          </div>

          {/* Nav Section: Dashboard */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onTabChange("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Oversikt & Dashboard</span>
            </button>

            {/* Quick Context Navigation */}
            <div className="pt-2 pb-1 space-y-1.5 border-t border-slate-800/80">
              <Link
                to="/minside"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gå til Min Side</span>
                </div>
                <span className="text-[10px] text-slate-400">Min profil</span>
              </Link>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Åpne offentlig nettside</span>
                </div>
                <span className="text-[10px] text-slate-400">Forside ↗</span>
              </Link>
            </div>
          </div>

          {/* Nav Section: Nettside & CMS */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
              Nettside & CMS
            </div>

            <button
              type="button"
              onClick={() => onTabChange("cms-sider")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-sider"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Sider & Innhold</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {pages.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-nyheter")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-nyheter"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4" />
                <span>Aktuelt & Nyheter</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {news.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-taler")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-taler"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-amber-300" />
                <span>Taler & Prekener</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {sermons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-stab")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-stab"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Lederskap & Stab</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {staff.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-design")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-design"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>Tema & Designsystem</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-innstillinger")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-innstillinger"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Nettside-innstillinger</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("cms-overstyringer")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-overstyringer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Forside-overstyring</span>
            </button>
          </div>

          {/* Nav Section: Menighetsplanlegger */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
              Arrangementer & Bemanning
            </div>

            <button
              type="button"
              onClick={() => onTabChange("planlegger-samlinger")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-samlinger"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Arrangementer</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminGatherings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("planlegger-oppgaver")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-oppgaver"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 text-amber-400" />
                <span>Trenger oppfølging</span>
              </div>
              {urgentTasksCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 border border-red-700 text-red-300 font-bold">
                  {urgentTasksCount} ubesatt
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {adminTasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange("planlegger-grupper")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-grupper"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4" />
                <span>Grupper & Husfellesskap</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminGroups.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("planlegger-personer")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-personer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Personer & Roller</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminPersons.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer / Quick Switchers */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2 text-xs">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Åpne offentlig nettside</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/minside"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Gå til Min Side</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Database & innstillinger</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Innlogget som:</span>
            <strong className="text-white truncate max-w-[120px]">{currentUser.name}</strong>
          </div>
        </div>
      </aside>
    </>
  );
};
