import React from "react";
import { UserPlus } from "lucide-react";
import type { ActivityCardItem } from "../../../utils/groupActivities";

type TaskItem = ActivityCardItem["taskItems"][number];

interface Props {
  item: TaskItem;
  members: { id: string; name: string }[];
  hasLeaderAccess: boolean;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onAssign: (taskId: string, member: { id: string; name: string }) => void;
}

const RESPONSE_LABEL = { withdrawn: "Forfall", declined: "Avslått", pending: "Forespurt" } as const;

/** One task of an opened activity: who stands on it, and a drawer for assigning someone from the group. */
export const GatheringTaskItem: React.FC<Props> = ({ item, members, hasLeaderAccess, isDrawerOpen, onToggleDrawer, onAssign }) => {
  const { task, assignedPersons, confirmedCount, neededCount, isFullyCovered, hasForfall } = item;

  return (
    <div id={`group-gathering-task-${task.id}`} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
      <div className="flex items-center justify-between gap-1">
        <div>
          <span className="font-bold text-slate-800">{task.title}</span>
          <span className="text-[11px] text-slate-500 ml-2">
            ({confirmedCount}/{neededCount} dekket)
          </span>
        </div>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
            hasForfall
              ? "bg-red-100 text-red-700"
              : isFullyCovered
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {hasForfall ? "Forfall" : isFullyCovered ? "Dekket" : "Mangler"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {assignedPersons.length > 0 ? (
          assignedPersons.map(({ assignment, person, response }) => (
            <span
              key={assignment.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                response === "confirmed"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                  : response === "withdrawn"
                  ? "bg-red-50 text-red-800 border border-red-300"
                  : "bg-amber-50 text-amber-800 border border-amber-300"
              }`}
            >
              <span>{person?.name || "Ukjent"}</span>
              {response !== "confirmed" && (
                <span className="text-[9px] font-bold opacity-90">({RESPONSE_LABEL[response]})</span>
              )}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400 italic">Ingen tildelt</span>
        )}
      </div>

      {!isFullyCovered && hasLeaderAccess && (
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            id={`btn-quick-assign-${task.id}`}
            onClick={onToggleDrawer}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tildel fra gruppen</span>
          </button>
        </div>
      )}

      {isDrawerOpen && (
        <div className="p-2.5 bg-slate-900 text-white rounded-xl space-y-2 mt-1">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Velg medlem for direkte tildeling:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                id={`btn-do-quick-assign-${task.id}-${m.id}`}
                onClick={() => onAssign(task.id, m)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-left rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>{m.name}</span>
                <UserPlus className="w-3 h-3 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
