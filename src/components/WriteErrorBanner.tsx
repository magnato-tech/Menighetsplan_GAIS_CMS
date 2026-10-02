import React, { useSyncExternalStore } from "react";
import { AlertTriangle, X } from "lucide-react";
import { clearWriteError, getWriteError, subscribeToWriteError } from "../services/writeErrors";

/** Stays on screen until dismissed: a change the user believes is saved was not. */
export const WriteErrorBanner: React.FC = () => {
  const error = useSyncExternalStore(subscribeToWriteError, getWriteError);
  if (!error) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
      <div
        role="alert"
        className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-xl border border-red-200 p-4 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-100 text-red-700">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-bold text-slate-900">Kunne ikke {error.action}</p>
          <p className="text-xs text-slate-600 leading-relaxed">Endringen er ikke lagret. Prøv igjen.</p>
          <p className="text-[11px] text-slate-400 font-mono break-words">{error.detail}</p>
        </div>
        <button
          type="button"
          onClick={clearWriteError}
          aria-label="Lukk feilmelding"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
