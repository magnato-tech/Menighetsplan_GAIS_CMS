import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface DatasetImportDialogProps {
  datasetName: string;
  datasetTotal: number;
  /** What is being done right now, shown while the work is under way. Null when nothing is. */
  step: string | null;
  onReplace: () => void;
  onAdd: () => void;
  onCancel: () => void;
}

/**
 * Asked before a dataset is brought into a database that already holds content.
 * Bringing it in on top mixes the old with the new, so emptying the database first is
 * the recommended answer. The dialog says exactly what each answer does.
 */
export const DatasetImportDialog: React.FC<DatasetImportDialogProps> = ({
  datasetName,
  datasetTotal,
  step,
  onReplace,
  onAdd,
  onCancel,
}) => {
  const working = step !== null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--studio-overlay)] backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dataset-import-title"
    >
      <div className="bg-[var(--studio-bg)] border border-red-800/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 id="dataset-import-title" className="text-base font-bold text-[var(--studio-text)]">
              Slette databasen først?
            </h4>
            <p className="text-xs text-[var(--studio-warn)]">Anbefalt når du bytter innhold.</p>
          </div>
        </div>

        <p className="text-xs text-[var(--studio-muted)] leading-relaxed">
          Databasen har innhold fra før. Hentes «{datasetName}» inn oppå det, blandes gammelt og nytt: menyen får faner fra
          begge, og to sider kan få samme adresse.
        </p>

        <div className="text-xs text-[var(--studio-muted)] leading-relaxed space-y-1.5">
          <p className="font-bold text-[var(--studio-text)]">Svarer du ja, skjer dette i én operasjon:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>En sikkerhetskopi av alt som ligger i databasen nå, lastes ned til maskinen din.</li>
            <li>
              Alt i databasen slettes: sider, nyheter, taler og innstillinger, og personer, grupper, samlinger og oppgaver.
            </li>
            <li>
              «{datasetName}» hentes inn ({datasetTotal} dokumenter).
            </li>
          </ol>
          <p>Slettingen kan bare gjøres om ved å hente inn sikkerhetskopien.</p>
          <p>Svarer du nei, slettes ingenting. Datasettet legges til det som ligger der.</p>
        </div>

        {working && (
          <p role="status" className="text-xs font-bold text-[var(--studio-text)] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{step}</span>
          </p>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-muted)] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-[var(--studio-row)] hover:bg-[var(--studio-hover)] border border-[var(--studio-border)] text-[var(--studio-text)] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nei, legg til uten å slette
          </button>
          <button
            type="button"
            onClick={onReplace}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ja, slett og hent inn
          </button>
        </div>
      </div>
    </div>
  );
};
