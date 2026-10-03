import React from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import {
  Globe,
  Calendar,
  FileText,
  Plus,
  Users,
  ListTodo,
  LayoutDashboard,
  Newspaper,
  Sliders,
  Headphones,
} from "lucide-react";
import { StudioData, StudioTab, countPublicGatherings, countUrgentTasks } from "../studio";

interface DashboardTabProps {
  studio: StudioData;
  onTabChange: (tab: StudioTab) => void;
  /** Opens the tab with its editor for a new item already showing. */
  onCreateIn: (tab: StudioTab) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ studio, onTabChange, onCreateIn }) => {
  const { adminGatherings, adminTasks } = studio;
  const { pages, news, sermons, staff, settings } = useCms();
  const publicGatheringsCount = countPublicGatherings(adminGatherings);
  const urgentTasksCount = countUrgentTasks(adminTasks);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Velkommen til Admin Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Komplett administrasjon av {settings.churchName}: nettsiden, samlingene og de frivillige på ett sted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Se nettsiden live</span>
          </Link>
          <Link
            to="/minside"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
            <span>Min Side</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          onClick={() => onTabChange("planlegger-samlinger")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gudstjenester</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{adminGatherings.length}</div>
          <p className="text-[11px] text-slate-400">{publicGatheringsCount} offentlig i kalenderen</p>
        </div>

        <div
          onClick={() => onTabChange("planlegger-oppgaver")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oppgaver</span>
            <ListTodo className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{adminTasks.length}</div>
          <p className="text-[11px] text-slate-400">
            {urgentTasksCount > 0 ? (
              <span className="text-red-400 font-bold">{urgentTasksCount} trenger vikar!</span>
            ) : (
              "Alle vakter besatt"
            )}
          </p>
        </div>

        <div
          onClick={() => onTabChange("cms-taler")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taler & Prekener</span>
            <Headphones className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-3xl font-black text-white">{sermons.length}</div>
          <p className="text-[11px] text-slate-400">Opptak tilgjengelig for menigheten</p>
        </div>

        <div
          onClick={() => onTabChange("cms-sider")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CMS Sider</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{pages.length}</div>
          <p className="text-[11px] text-slate-400">Publiserte sider på nettsiden</p>
        </div>

        <div
          onClick={() => onTabChange("cms-nyheter")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nyheter & Aktuelt</span>
            <Newspaper className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">{news.length}</div>
          <p className="text-[11px] text-slate-400">Artikler for medlemmer & offentlighet</p>
        </div>

        <div
          onClick={() => onTabChange("cms-stab")}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lederskap & Stab</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{staff.length}</div>
          <p className="text-[11px] text-slate-400">Registrerte ledere og ansatte</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hurtighandlinger Nettside CMS */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>Hurtighandlinger: Nettside & CMS</span>
          </div>
          <div className="space-y-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onCreateIn("cms-nyheter");
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Skriv en ny aktuelt-sak eller nyhet</span>
              <Plus className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateIn("cms-sider");
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Opprett en ny underside på nettsiden</span>
              <Plus className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => onTabChange("cms-innstillinger")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Oppdater Vipps, kontonummer eller kontaktinfo</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Hurtighandlinger Menighetsplanlegger */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Hurtighandlinger: Planlegger</span>
          </div>
          <div className="space-y-2 text-xs">
            <button
              type="button"
              onClick={() => onTabChange("planlegger-samlinger")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Opprett ny gudstjeneste eller samling</span>
              <Plus className="w-4 h-4 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={() => onTabChange("planlegger-oppgaver")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Sjekk vikarstatus og ubesatte oppgaver</span>
              <ListTodo className="w-4 h-4 text-rose-400" />
            </button>
            <button
              type="button"
              onClick={() => onTabChange("planlegger-personer")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
            >
              <span>Administrer medlemmer, ledere og frivillige</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
