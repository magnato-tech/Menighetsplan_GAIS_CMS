import React, { useState } from "react";
import { Loader2, Radio, RefreshCw } from "lucide-react";
import type { ShowFeedback } from "../../studio";

interface Props {
  showFeedback: ShowFeedback;
}

/** Checks that external websites can fetch the public gatherings, and shows what they would get. */
export const ExternalSiteExchange: React.FC<Props> = ({ showFeedback }) => {
  const [response, setResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const test = async () => {
    setIsTesting(true);
    setResponse(null);
    try {
      const res = await fetch("/api/public/gatherings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(`Suksess: Mottok ${data.gatherings?.length ?? 0} offentlige samlinger.`);
      showFeedback("Utvekslingen med eksterne nettsider svarer som forventet.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ukjent feil";
      setResponse(`Feil: ${msg}`);
      showFeedback(`Kunne ikke nå utvekslingen med eksterne nettsider: ${msg}`, "error");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <span>Utveksling med eksterne nettsider</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Nettside-CMS-et henter offentlige samlinger og gudstjenester direkte fra Menighetsplan.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-400">
            Gir eksterne nettsider de offentlige samlingene i et fast format. Bare samlinger merket som offentlige deles.
          </p>
          {response && (
            <p className={`text-xs font-mono pt-1 ${response.startsWith("Suksess") ? "text-emerald-400" : "text-red-400"}`}>
              {response}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={test}
          disabled={isTesting}
          className="px-4 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Test utvekslingen nå</span>
        </button>
      </div>
    </section>
  );
};
