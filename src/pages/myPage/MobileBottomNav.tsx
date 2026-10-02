import React from "react";
import { Link } from "react-router-dom";
import {
  Home,
  MessageSquare,
  Users,
  ListTodo,
} from "lucide-react";

interface MobileBottomNavProps {
  onShowTasks: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onShowTasks }) => {
  return (
    <nav
      id="mobile-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 py-1.5 px-3 shadow-lg flex items-center justify-around sm:hidden"
    >
      {/* 1. Min side */}
      <Link
        to="/"
        id="mobile-nav-min-side"
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-emerald-800 font-bold transition-colors cursor-pointer"
      >
        <Home className="w-5 h-5 text-emerald-700 stroke-[2.2]" />
        <span className="text-[10px] tracking-tight">Min side</span>
      </Link>

      {/* 2. Grupper */}
      <Link
        to="/husfellesskap"
        id="mobile-nav-grupper"
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
      >
        <Users className="w-5 h-5 text-slate-500" />
        <span className="text-[10px] tracking-tight">Grupper</span>
      </Link>

      {/* 3. Oppgaver */}
      <button
        type="button"
        id="mobile-nav-oppgaver"
        onClick={() => onShowTasks()}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
      >
        <ListTodo className="w-5 h-5 text-slate-500" />
        <span className="text-[10px] tracking-tight">Oppgaver</span>
      </button>

      {/* 4. Meldinger */}
      <Link
        to="/meldinger"
        id="mobile-nav-meldinger"
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
      >
        <MessageSquare className="w-5 h-5 text-slate-500" />
        <span className="text-[10px] tracking-tight">Meldinger</span>
      </Link>
    </nav>
  );
};
