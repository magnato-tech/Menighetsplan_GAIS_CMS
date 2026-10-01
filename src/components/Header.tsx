import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UserSwitcher } from "./UserSwitcher";
import { useLeaderDashboard, useModuleConfig } from "../hooks/useAppHooks";
import { Globe } from "lucide-react";

export const Header: React.FC = () => {
  const location = useLocation();
  const { isLeader, urgentGatherings, currentUser } = useLeaderDashboard();
  const { isKalenderOn, isMeldingerOn } = useModuleConfig();

  const isAdmin = currentUser.globalRole === "admin";

  const isLeaderPath = location.pathname.startsWith("/leder");
  const isCmsPath = location.pathname.startsWith("/admin/cms");
  const isAdminPath = location.pathname.startsWith("/admin") && !isCmsPath;
  const isKalenderPath = location.pathname.startsWith("/kalender");
  const isMeldingerPath = location.pathname.startsWith("/meldinger");
  const isMyPagePath =
    !isLeaderPath && !isAdminPath && !isCmsPath && !isKalenderPath && !isMeldingerPath;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-md mx-auto px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            id="app-logo-link"
            className="flex flex-col group transition-opacity hover:opacity-90"
          >
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Menighetsplan
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Varmt fellesskap. Enkel tjeneste.
            </p>
          </Link>

          {/* User Switcher Dropdown */}
          <UserSwitcher />
        </div>

        {/* Navigation Tabs (Min side / Gruppeleder / Admin / Valgfrie moduler) */}
        <nav className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100/80 overflow-x-auto pb-0.5 scrollbar-none">
          <Link
            to="/"
            id="nav-tab-min-side"
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              isMyPagePath
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Min side
          </Link>

          {isLeader && (
            <Link
              to="/leder"
              id="nav-tab-leder"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isLeaderPath
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              <span>Gruppeleder</span>
              {urgentGatherings.length > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLeaderPath ? "bg-amber-300" : "bg-red-500"
                  } animate-pulse`}
                  title="Trenger vikar"
                />
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              id="nav-tab-admin"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isAdminPath
                  ? "bg-indigo-700 text-white shadow-xs"
                  : "text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60"
              }`}
            >
              Admin
            </Link>
          )}

          {/* Valgfri modul: Kalender */}
          {isKalenderOn && (
            <Link
              to="/kalender"
              id="nav-tab-kalender"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isKalenderPath
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              Kalender
            </Link>
          )}

          {/* Valgfri modul: Meldinger */}
          {isMeldingerOn && (
            <Link
              to="/meldinger"
              id="nav-tab-meldinger"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isMeldingerPath
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60"
              }`}
            >
              Meldinger
            </Link>
          )}

          {/* CMS Admin tab for admins */}
          {isAdmin && (
            <Link
              to="/admin/cms"
              id="nav-tab-admin-cms"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isCmsPath
                  ? "bg-indigo-900 text-white shadow-xs"
                  : "text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60"
              }`}
            >
              CMS
            </Link>
          )}

          {/* Public Website button */}
          <Link
            to="/nettside"
            id="nav-tab-public-nettside"
            target="_blank"
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 ml-auto"
            title="Åpne menighetens offentlige nettside i ny fane"
          >
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span>Nettside</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};


