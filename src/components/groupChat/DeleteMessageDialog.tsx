import React from "react";
import { Trash2 } from "lucide-react";

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

/** Asks before a message is deleted. */
export const DeleteMessageDialog: React.FC<Props> = ({ onCancel, onConfirm }) => (
  <div
    id="modal-delete-chat-message"
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
  >
    <div className="bg-white rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-xl border border-slate-100">
      <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
        <Trash2 className="w-5 h-5" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-slate-900">Slette melding?</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Er du sikker på at du vil slette denne meldingen? Handlingen kan ikke angres.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          id="btn-cancel-delete-msg"
          onClick={onCancel}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Avbryt
        </button>
        <button
          type="button"
          id="btn-confirm-delete-msg"
          onClick={onConfirm}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          Slett
        </button>
      </div>
    </div>
  </div>
);
