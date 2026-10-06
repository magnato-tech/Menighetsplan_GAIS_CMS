import React, { useState } from "react";
import { AlertCircle, Loader2, Lock, LockOpen } from "lucide-react";
import { OPERATING_MODE_LABELS, setOperatingMode, type OperatingMode } from "../../services/operatingMode";
import type { ShowFeedback } from "../../pages/admin/studio";
import { studioSecondaryButton } from "../../pages/admin/studioTheme";

interface OperatingModePanelProps {
  /** The mode the app is in. Null until the database has answered. */
  mode: OperatingMode | null;
  showFeedback: ShowFeedback;
}

/**
 * The switch between demo and production. In production nothing can be emptied or swapped from
 * the Database tab. Locking is done at once; unlocking asks first, because it is the step that
 * makes deleting possible again.
 */
export const OperatingModePanel: React.FC<OperatingModePanelProps> = ({ mode, showFeedback }) => {
  const [working, setWorking] = useState(false);
  const [asking, setAsking] = useState(false);

  const change = async (next: OperatingMode) => {
    setWorking(true);
    try {
      await setOperatingMode(next);
      showFeedback(
        next === "production"
          ? "Appen står nå i produksjon. Data kan ikke slettes eller byttes fra denne fanen."
          : "Appen står nå i demo. Innholdet kan tømmes og byttes fra denne fanen."
      );
    } catch (error) {
      showFeedback(`Driftsmodus ble ikke endret: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setWorking(false);
      setAsking(false);
    }
  };

  const production = mode === "production";
  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-base font-bold text-[var(--studio-text)] flex items-center gap-2">
          {production ? <Lock className="w-4 h-4 text-emerald-400" /> : <LockOpen className="w-4 h-4 text-amber-400" />}
          <span>Driftsmodus</span>
          {mode && (
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                production
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/80"
                  : "bg-amber-950/80 text-amber-300 border-amber-800/80"
              }`}
            >
              {OPERATING_MODE_LABELS[mode]}
            </span>
          )}
        </h3>
        <p className="text-xs text-[var(--studio-muted)] mt-0.5 max-w-2xl leading-relaxed">
          {mode === null
            ? "Leser driftsmodus fra databasen …"
            : production
            ? "Appen står i produksjon. Ingenting kan tømmes eller byttes fra denne fanen. Sider, personer og arrangementer redigeres som vanlig."
            : "Appen står i demo. Innholdet kan tømmes og byttes fra denne fanen: testdata, datasett og en annen menighets nettside. Sett appen i produksjon når innholdet er menighetens ekte."}
        </p>
      </div>

      {mode !== null && (
        <button
          type="button"
          onClick={() => (production ? setAsking(true) : change("production"))}
          disabled={working}
          className={`${studioSecondaryButton} py-2 flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : production ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {production ? "Sett i demo" : "Sett i produksjon"}
        </button>
      )}

      {asking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--studio-overlay)] backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="operating-mode-title"
        >
          <div className="bg-[var(--studio-bg)] border border-amber-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 id="operating-mode-title" className="text-base font-bold text-[var(--studio-text)]">
                Sette appen i demo?
              </h4>
            </div>
            <p className="text-xs text-[var(--studio-muted)] leading-relaxed">
              Da kan nettsiden og planleggeren tømmes og byttes fra denne fanen igjen. Gjør det bare når innholdet som
              ligger inne, ikke er menighetens ekte, eller når du har lastet det ned som et datasett.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAsking(false)}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-muted)] text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => change("demo")}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {working && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ja, sett i demo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
