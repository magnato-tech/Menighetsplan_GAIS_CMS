import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Edit3, MapPin, Plus, Printer, Users } from "lucide-react";
import { formatNorwegianDateTime } from "../../utils/dates";

interface Props {
  title: string;
  startsAt: string;
  location?: string;
  /** An event (arrangement) or an ordinary meeting */
  isEvent: boolean;
  involvedGroupCount: number;
  backLink: string;
  backLabel: string;
  roleLabel: string;
  adminLook: boolean;
  canAdminister: boolean;
  onEdit: () => void;
  onAddTask: () => void;
  onPrint: () => void;
}

/** The top of the gathering page: back link, buttons, title, time and place. */
export const GatheringHeader: React.FC<Props> = ({
  title,
  startsAt,
  location,
  isEvent,
  involvedGroupCount,
  backLink,
  backLabel,
  roleLabel,
  adminLook,
  canAdminister,
  onEdit,
  onAddTask,
  onPrint,
}) => (
  <>
    <div className="flex items-center justify-between print:hidden">
      <Link
        to={backLink}
        id="btn-back-to-group-or-admin"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{backLabel}</span>
      </Link>

      <div className="flex items-center gap-2">
        {canAdminister && (
          <>
            <button
              type="button"
              id="btn-admin-edit-gathering"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Rediger tittel, dato, tid og sted"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Rediger</span>
            </button>
            <button
              type="button"
              id="btn-admin-add-task"
              onClick={onAddTask}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ny oppgave</span>
            </button>
          </>
        )}

        <button
          type="button"
          id="btn-print-schedule"
          onClick={onPrint}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title="Skriv ut eller lagre kjøreplan som PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Skriv ut</span>
        </button>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            adminLook ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"
          }`}
        >
          {roleLabel}
        </span>
      </div>
    </div>

    <div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          {isEvent ? "Gudstjeneste / Arrangement" : "Samling"}
        </span>
      </div>
      <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 leading-tight">{title}</h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1.5 font-medium">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatNorwegianDateTime(startsAt)}
        </span>
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {location}
          </span>
        )}
        <span className="flex items-center gap-1 text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {involvedGroupCount} {involvedGroupCount === 1 ? "tjenestegruppe" : "tjenestegrupper"} involvert
        </span>
      </div>
    </div>
  </>
);
