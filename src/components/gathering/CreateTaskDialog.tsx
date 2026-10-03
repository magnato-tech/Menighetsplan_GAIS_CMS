import React, { useState } from "react";
import { Gathering } from "../../types";
import {
  X,
} from "lucide-react";
import { GatheringDetail } from "./gatheringDetail";

interface CreateTaskDialogProps {
  detail: GatheringDetail;
  gathering: Gathering;
  /** The dialog stays mounted while closed, so a half-filled form is still there when it reopens. */
  open: boolean;
  showToast: (text: string) => void;
  onClose: () => void;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ detail, gathering, open, showToast, onClose }) => {
  const { group, involvedGroups, allGroups, createTask } = detail;

  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  // Starts on the user's own group, then the gathering's, then the first group there is
  const [newTaskGroupId, setNewTaskGroupId] = useState<string>(
    group?.id || involvedGroups[0]?.id || allGroups[0]?.id || ""
  );
  const [newTaskNeededCount, setNewTaskNeededCount] = useState<number>(1);
  const [newTaskInstruction, setNewTaskInstruction] = useState<string>("");

  // Admin: Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      showToast("Vennligst oppgi en tittel på oppgaven.");
      return;
    }
    if (!newTaskGroupId) {
      showToast("Velg hvilken gruppe som har ansvaret for oppgaven.");
      return;
    }

    const res = createTask({
      gatheringId: gathering.id,
      groupId: newTaskGroupId,
      title: newTaskTitle.trim(),
      instruction: newTaskInstruction.trim() || undefined,
      neededCount: newTaskNeededCount || 1,
    });

    if (res.success) {
      showToast(`Oppgaven «${newTaskTitle.trim()}» ble lagt til i samlingen!`);
      onClose();
      setNewTaskTitle("");
      setNewTaskInstruction("");
      setNewTaskNeededCount(1);
    } else {
      showToast(res.error || "Kunne ikke opprette oppgave.");
    }
  };

  if (!open) return null;

  return (
    <div
      id="modal-admin-create-task"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              Legg til i samlingen
            </span>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Ny oppgave / programpunkt
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          {/* Task Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Oppgavetittel / Rolle *
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="f.eks. Dørvert / Velkomst"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              required
            />
          </div>

          {/* Responsible Group */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ansvarlig tjenestegruppe *
            </label>
            <select
              value={newTaskGroupId}
              onChange={(e) => setNewTaskGroupId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
            >
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category || "gruppe"})
                </option>
              ))}
            </select>
          </div>

          {/* Needed Count */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Bemanningsbehov (antall personer)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={newTaskNeededCount}
              onChange={(e) => setNewTaskNeededCount(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
            />
          </div>

          {/* Instruction */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Oppgaveinstruks (valgfritt)
            </label>
            <textarea
              rows={2}
              value={newTaskInstruction}
              onChange={(e) => setNewTaskInstruction(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              placeholder="Beskriv forberedelser og rutiner..."
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              Opprett oppgave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
