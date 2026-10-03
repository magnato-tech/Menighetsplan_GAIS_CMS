import React from "react";
import { SlidersHorizontal } from "lucide-react";
import type { RunSheetFilter } from "../../utils/gatheringView";

interface Props {
  view: RunSheetFilter;
  groupId: string;
  groups: { id: string; name: string; count: number }[];
  totalRows: number;
  vacantTasks: number;
  myGroupTasks: number;
  /** The own-group tab is only for a leader who is not looking at the admin view */
  showMyGroup: boolean;
  onViewChange: (view: RunSheetFilter) => void;
  onGroupChange: (groupId: string) => void;
}

/** The tabs (whole programme, needs action, my group) and the pills for one group. Not printed. */
export const RunSheetFilters: React.FC<Props> = ({
  view,
  groupId,
  groups,
  totalRows,
  vacantTasks,
  myGroupTasks,
  showMyGroup,
  onViewChange,
  onGroupChange,
}) => (
  <div className="space-y-2 pt-1 print:hidden">
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
      <button
        type="button"
        id="tab-filter-all"
        onClick={() => onViewChange("all")}
        className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
          view === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Hele programmet ({totalRows})
      </button>

      <button
        type="button"
        id="tab-filter-needs-action"
        onClick={() => onViewChange("needs-action")}
        className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
          view === "needs-action" ? "bg-white text-red-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <span>Forfall / Mangler</span>
        {vacantTasks > 0 && (
          <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
            {vacantTasks}
          </span>
        )}
      </button>

      {showMyGroup && (
        <button
          type="button"
          id="tab-filter-my-group"
          onClick={() => onViewChange("my-group")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
            view === "my-group" ? "bg-white text-emerald-800 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Min gruppe ({myGroupTasks})
        </button>
      )}
    </div>

    {groups.length > 1 && (
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
        <span className="text-slate-400 font-bold uppercase text-[10px] pr-1 flex items-center gap-0.5">
          <SlidersHorizontal className="w-3 h-3" />
          Gruppe:
        </span>
        <button
          type="button"
          onClick={() => onGroupChange("all")}
          className={`px-2 py-0.5 rounded-full border font-medium transition-colors shrink-0 cursor-pointer ${
            groupId === "all"
              ? "bg-slate-800 text-white border-slate-800 font-bold"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Alle ({totalRows})
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onGroupChange(g.id)}
            className={`px-2 py-0.5 rounded-full border font-medium transition-colors shrink-0 cursor-pointer ${
              groupId === g.id
                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {g.name} ({g.count})
          </button>
        ))}
      </div>
    )}
  </div>
);
