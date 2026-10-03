import React from "react";
import { CheckSquare } from "lucide-react";
import type { Task } from "../../types";

interface Props {
  tasks: Task[];
}

const STATUS_LABEL: Record<Task["status"], string> = {
  open: "Åpen",
  assigned: "Tildelt",
  confirmed: "Bekreftet",
  vacant: "Ledig",
  cancelled: "Avlyst",
};

/** The tasks the person stands on, with each task's status. */
export const PersonTasksCard: React.FC<Props> = ({ tasks }) => (
  <section
    id="person-tasks-section"
    className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs"
  >
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <CheckSquare className="w-4 h-4 text-emerald-600" />
        Tildelte oppgaver ({tasks.length})
      </span>
    </div>

    {tasks.length === 0 ? (
      <p className="text-xs text-slate-400 italic py-1">
        Ingen aktive oppgaver tildelt denne personen for øyeblikket.
      </p>
    ) : (
      <div className="space-y-1.5 pt-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-2 bg-slate-50/70 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
          >
            <span className="text-slate-700 font-medium">{task.title}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                task.status === "confirmed"
                  ? "bg-emerald-50 text-emerald-700"
                  : task.status === "vacant"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {STATUS_LABEL[task.status]}
            </span>
          </div>
        ))}
      </div>
    )}
  </section>
);
