import React from "react";

interface Props {
  vacantTasks: number;
  onShowVacant: () => void;
}

/** Whether any task in the group's activities needs follow-up, with a shortcut to filter for them. */
export const ActivitiesStatusBanner: React.FC<Props> = ({ vacantTasks, onShowVacant }) =>
  vacantTasks > 0 ? (
    <div className="px-3.5 py-2.5 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between gap-2 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-xs font-bold text-red-900">
          {vacantTasks} {vacantTasks === 1 ? "oppgave trenger oppfølging / vikar" : "oppgaver trenger oppfølging / vikar"}
        </span>
      </div>
      <button
        type="button"
        id="btn-group-filter-urgent-shortcut"
        onClick={onShowVacant}
        className="text-[11px] font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        Filtrer forfall →
      </button>
    </div>
  ) : (
    <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-xs font-semibold text-emerald-900">Alle oppgaver er dekket for planlagte aktiviteter</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
        🟢 I rute
      </span>
    </div>
  );
