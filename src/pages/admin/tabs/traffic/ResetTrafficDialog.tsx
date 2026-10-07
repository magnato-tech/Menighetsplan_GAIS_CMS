import React, { useEffect, useId, useRef } from "react";
import { AlertCircle } from "lucide-react";

interface ResetTrafficDialogProps {
  /** The counts are being deleted right now. Both answers are locked until that is done. */
  working: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asked before every count of visits is deleted. A yes cannot be taken back, so the dialog says
 * plainly what goes, and the focus starts on the safe answer.
 */
export const ResetTrafficDialog: React.FC<ResetTrafficDialogProps> = ({ working, onConfirm, onCancel }) => {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus starts on «Avbryt», and goes back to the button that opened the dialog
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Halfway through the deleting there is nothing to cancel, so Escape waits until it is done
      if (event.key === "Escape" && !working) onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, working]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--studio-overlay)] backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bg-[var(--studio-bg)] border border-red-800/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <h3 id={titleId} className="text-base font-bold text-[var(--studio-text)]">
            Nullstille besøkstallene?
          </h3>
        </div>

        <p className="text-xs text-[var(--studio-muted)] leading-relaxed">
          Alle besøk som er telt til nå, slettes, og tellingen starter på nytt. Eksempeltall slettes også. Det kan ikke angres.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-muted)] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ja, nullstill
          </button>
        </div>
      </div>
    </div>
  );
};
