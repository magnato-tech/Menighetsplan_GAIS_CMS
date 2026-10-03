import React from "react";
import { Calendar, FileText, FolderKanban, ListTodo, Radio, Users, type LucideIcon } from "lucide-react";

export interface DatabaseCountTotals {
  persons: number;
  groups: number;
  gatherings: number;
  tasks: number;
  assignments: number;
  content: number;
}

interface Props {
  totals: DatabaseCountTotals;
  /** All documents, including those not shown in a tile */
  totalDocuments: number;
}

const TILES: { key: keyof DatabaseCountTotals; label: string; Icon: LucideIcon; iconClass: string }[] = [
  { key: "persons", label: "Personer", Icon: Users, iconClass: "bg-indigo-950/80 text-indigo-400" },
  { key: "groups", label: "Grupper", Icon: FolderKanban, iconClass: "bg-emerald-950/80 text-emerald-400" },
  { key: "gatherings", label: "Samlinger", Icon: Calendar, iconClass: "bg-amber-950/80 text-amber-400" },
  { key: "tasks", label: "Oppgaver", Icon: ListTodo, iconClass: "bg-sky-950/80 text-sky-400" },
  { key: "assignments", label: "Tildelinger", Icon: Radio, iconClass: "bg-purple-950/80 text-purple-400" },
  { key: "content", label: "CMS & Innhold", Icon: FileText, iconClass: "bg-rose-950/80 text-rose-400" },
];

/** How many documents the database holds, in total and per kind. */
export const DatabaseCounts: React.FC<Props> = ({ totals, totalDocuments }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Gjeldende innhold i databasen ({totalDocuments} dokumenter)
      </h3>
      <span className="text-[11px] text-slate-400">Oppdateres fortløpende</span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {TILES.map(({ key, label, Icon, iconClass }) => (
        <div key={key} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">{totals[key]}</div>
            <div className="text-[11px] text-slate-400">{label}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);
