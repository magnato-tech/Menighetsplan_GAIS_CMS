import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../../../../components/ConfirmDialog";

interface Props {
  isWorking: boolean;
  totalDocuments: number;
  /** What a planner clear would remove, for the confirmation text */
  plannerCounts: { persons: number; groups: number; gatherings: number; tasks: number };
  onClearPlanner: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

type Dialog = "planner" | "all" | null;

/** The two ways to empty the database, each behind a confirmation. */
export const ResetSection: React.FC<Props> = ({ isWorking, totalDocuments, plannerCounts, onClearPlanner, onDeleteAll }) => {
  const [dialog, setDialog] = useState<Dialog>(null);

  const confirm = async (action: () => Promise<void>) => {
    await action();
    setDialog(null);
  };

  return (
    <>
      <section className="p-5 sm:p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-900/30 pb-3">
          <div>
            <h3 className="text-base font-bold text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Tilbakestilling & Sletting</span>
            </h3>
            <p className="text-xs text-red-300/80 mt-0.5">
              Tøm kun testpersoner og planlegger-data, eller foreta en fullstendig tilbakestilling av databasen.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-red-300 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded self-start sm:self-auto">
            {totalDocuments} dokumenter i databasen
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tøm kun testdata (Personer & Planlegger)</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fjerner alle testpersoner, grupper, samlinger og oppgaver.{" "}
                <strong className="text-emerald-400 font-semibold">CMS-sider og nyheter forblir uberørt.</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialog("planner")}
              disabled={isWorking}
              className="px-3.5 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Tøm planlegger-testdata</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-red-200 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Total tilbakestilling av alle samlinger</span>
              </span>
              <p className="text-[11px] text-red-300/80 leading-relaxed">
                Permanent sletting av samtlige dokumenter (også CMS-sider og artikler). Krever ekstra bekreftelse.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialog("all")}
              disabled={isWorking}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Slett alt i databasen</span>
            </button>
          </div>
        </div>
      </section>

      {dialog === "planner" && (
        <ConfirmDialog
          title="Tømme testpersoner og planleggerdata?"
          confirmLabel={isWorking ? "Tømmer …" : "Ja, tøm testdata"}
          busy={isWorking}
          onConfirm={() => confirm(onClearPlanner)}
          onCancel={() => setDialog(null)}
        >
          <p>
            Dette sletter alle dokumenter for personer ({plannerCounts.persons}), grupper ({plannerCounts.groups}),
            samlinger ({plannerCounts.gatherings}) og oppgaver ({plannerCounts.tasks}). CMS-sider og nyhetsartikler
            bevares.
          </p>
        </ConfirmDialog>
      )}

      {dialog === "all" && (
        <ConfirmDialog
          title="Slette absolutt alle data i databasen?"
          tone="danger"
          confirmLabel={isWorking ? "Sletter alt …" : "Ja, slett alt permanent"}
          busy={isWorking}
          onConfirm={() => confirm(onDeleteAll)}
          onCancel={() => setDialog(null)}
        >
          <p>
            Dette vil permanent slette <strong>{totalDocuments} dokumenter</strong> fra databasen for alle brukere
            (personer, grupper, samlinger, oppgaver, meldinger og CMS-innhold som sider og nyheter). Dette kan ikke
            angres.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
};
