import React from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import type { StatusFilter } from "../../../utils/groupActivities";
import type { ActivitiesViewMode } from "./useGroupActivitiesView";

interface Props {
  monthOptions: { id: string; label: string }[];
  month: string;
  status: StatusFilter;
  viewMode: ActivitiesViewMode;
  onMonthChange: (month: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onViewModeChange: (mode: ActivitiesViewMode) => void;
}

const boxClass = "flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs";
const selectClass = "bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1";

const viewButtonClass = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
    active ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
  }`;

/** The month and status filters, and the choice between cards and table. */
export const ActivitiesFilters: React.FC<Props> = ({
  monthOptions,
  month,
  status,
  viewMode,
  onMonthChange,
  onStatusChange,
  onViewModeChange,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1.5 border-b border-slate-100">
    <div className="flex items-center gap-2 flex-wrap">
      <div className={boxClass}>
        <span className="text-slate-400 font-bold text-[10px] uppercase">Periode:</span>
        <select
          id="select-group-filter-month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className={selectClass}
        >
          {monthOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className={boxClass}>
        <span className="text-slate-400 font-bold text-[10px] uppercase">Status:</span>
        <select
          id="select-group-filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className={selectClass}
        >
          <option value="all">Alle statuser</option>
          <option value="red">🔴 Forfall / Trenger vikar</option>
          <option value="yellow">🟡 Mangler frivillig</option>
          <option value="green">🟢 Fullt dekket</option>
        </select>
      </div>
    </div>

    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto border border-slate-200/60">
      <button
        type="button"
        id="btn-switch-view-kort"
        onClick={() => onViewModeChange("kort")}
        className={viewButtonClass(viewMode === "kort")}
        title="Kortvisning"
      >
        <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
        <span>Kort</span>
      </button>
      <button
        type="button"
        id="btn-switch-view-tabell"
        onClick={() => onViewModeChange("tabell")}
        className={viewButtonClass(viewMode === "tabell")}
        title="Tabellvisning"
      >
        <Table2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Tabell</span>
      </button>
    </div>
  </div>
);
