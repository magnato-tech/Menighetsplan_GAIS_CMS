import React from "react";
import { Clock, Info } from "lucide-react";
import { formatNorwegianDateTime } from "../../utils/dates";
import { locationOf } from "../../utils/gatherings";
import type { RunSheetRow } from "../../utils/runSheet";
import { RunSheetRowCard } from "./RunSheetRowCard";

type CardProps = React.ComponentProps<typeof RunSheetRowCard>;

interface Props {
  gathering: { title: string; startsAt: string; location?: string };
  rows: RunSheetRow[];
  totalRows: number;
  /** Whether the person may change who is on a row */
  canInterveneOn: (row: RunSheetRow) => boolean;
  canAdminister: boolean;
  openMenuAssignmentId: string | null;
  onToggleMenu: CardProps["onToggleMenu"];
  onStatusChange: CardProps["onStatusChange"];
  onRemovePerson: CardProps["onRemovePerson"];
  onShowInstruction: CardProps["onShowInstruction"];
  onAssign: CardProps["onAssign"];
  onEditTask: CardProps["onEditTask"];
  onResetFilters: () => void;
}

/** The run sheet: a heading, a print header, and a card for each row, or a note when the filter leaves none. */
export const RunSheetSection: React.FC<Props> = ({
  gathering,
  rows,
  totalRows,
  canInterveneOn,
  canAdminister,
  openMenuAssignmentId,
  onToggleMenu,
  onStatusChange,
  onRemovePerson,
  onShowInstruction,
  onAssign,
  onEditTask,
  onResetFilters,
}) => (
  <div className="p-3 sm:p-4 space-y-2 flex-1 print:p-0 print:space-y-1">
    <div className="flex items-center justify-between px-1 print:hidden">
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Kjøreplan & «Hvem gjør hva»</span>
      </h2>
      <span className="text-[11px] text-slate-400">
        Viser {rows.length} av {totalRows} punkter
      </span>
    </div>

    <div className="hidden print:block mb-4 border-b border-slate-300 pb-2">
      <h1 className="text-xl font-bold text-black">{gathering.title}</h1>
      <p className="text-xs text-slate-600">
        {formatNorwegianDateTime(gathering.startsAt)} • {locationOf(gathering)}
      </p>
      <p className="text-[10px] text-slate-500 mt-1">Offisiell kjøreplan og bemanningsliste – Menighetsplan</p>
    </div>

    {rows.length === 0 ? (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
        <Info className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-700">Ingen programpunkter matcher filteret</p>
        <p className="text-[11px] text-slate-400">Prøv å endre filteret til «Hele programmet» eller velg en annen gruppe.</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer mt-1"
        >
          Nullstill alle filtre
        </button>
      </div>
    ) : (
      <div className="space-y-2 print:space-y-1">
        {rows.map((row) => (
          <RunSheetRowCard
            key={row.id}
            row={row}
            canIntervene={canInterveneOn(row)}
            canAdminister={canAdminister}
            openMenuAssignmentId={openMenuAssignmentId}
            onToggleMenu={onToggleMenu}
            onStatusChange={onStatusChange}
            onRemovePerson={onRemovePerson}
            onShowInstruction={onShowInstruction}
            onAssign={onAssign}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    )}
  </div>
);
