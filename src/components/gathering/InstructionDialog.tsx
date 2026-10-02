import React, { useState } from "react";
import {
  X,
  Edit3,
} from "lucide-react";
import { GatheringDetail, InstructionTarget } from "./gatheringDetail";

interface InstructionDialogProps {
  detail: GatheringDetail;
  /** What the dialog was opened for. */
  task: InstructionTarget;
  canAdminister: boolean;
  showToast: (text: string) => void;
  onClose: () => void;
}

export const InstructionDialog: React.FC<InstructionDialogProps> = ({ detail, task, canAdminister, showToast, onClose }) => {
  const { updateTaskInstruction } = detail;

  // A local copy, so the text on screen follows a save without a round trip through the parent
  const [viewInstructionTask, setViewInstructionTask] = useState<InstructionTarget | null>(task);
  const [isEditingInstructionInModal, setIsEditingInstructionInModal] = useState<boolean>(false);
  const [editedInstructionText, setEditedInstructionText] = useState<string>(task.instruction);

  // Save instruction from modal
  const handleSaveInstructionInModal = () => {
    if (!viewInstructionTask?.taskId) return;
    const res = updateTaskInstruction(viewInstructionTask.taskId, editedInstructionText);
    if (res.success) {
      showToast("Instruksen ble oppdatert!");
      setViewInstructionTask((prev) => prev ? { ...prev, instruction: editedInstructionText } : null);
      setIsEditingInstructionInModal(false);
    } else {
      showToast(res.error || "Kunne ikke lagre instruks.");
    }
  };

  if (!viewInstructionTask) return null;

  return (
    <div
      id="modal-view-instruction"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              {viewInstructionTask.groupName || "Instruks for oppgave"} • kl. {viewInstructionTask.time || "11:00"}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {viewInstructionTask.title}
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

        {/* Instruction body or inline editor */}
        {isEditingInstructionInModal ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Rediger instruksen:
            </label>
            <textarea
              value={editedInstructionText}
              onChange={(e) => setEditedInstructionText(e.target.value)}
              rows={6}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              placeholder="Skriv instruks for oppgaven her..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingInstructionInModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleSaveInstructionInModal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                Lagre instruks
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {viewInstructionTask.instruction || "Ingen instruks er registrert for denne oppgaven ennå."}
            </div>

            <div className="flex items-center justify-between pt-1">
              {canAdminister && viewInstructionTask.taskId ? (
                <button
                  type="button"
                  onClick={() => setIsEditingInstructionInModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Rediger instruks</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Lukk
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
