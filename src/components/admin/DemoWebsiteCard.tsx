import React, { useState } from "react";
import { AlertCircle, Globe, Loader2 } from "lucide-react";
import { useCms } from "../../context/CmsContext";
import { populateDemoWebsite } from "../../services/databaseAdmin";
import type { ShowFeedback } from "../../pages/admin/studio";

interface DemoWebsiteCardProps {
  showFeedback: ShowFeedback;
  disabled?: boolean;
}

/**
 * Puts the demo website in: the pages, news, sermons, staff and settings that come with the app.
 * It is kept apart from the test persons, so a congregation's own website is never overwritten
 * by filling the planner. It asks first, because it changes the name and settings of the site.
 */
export const DemoWebsiteCard: React.FC<DemoWebsiteCardProps> = ({ showFeedback, disabled = false }) => {
  const { pages } = useCms();
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);

  const handleConfirmed = async () => {
    setWorking(true);
    try {
      const result = await populateDemoWebsite();
      if (result.failures.length > 0) {
        showFeedback(`Demo-nettsiden ble ikke lagt inn i sin helhet: ${result.failures[0].message}`, "error");
      } else {
        showFeedback(`Demo-nettsiden er lagt inn (${result.total} dokumenter). Planleggeren er ikke rørt.`);
      }
    } catch (error) {
      showFeedback(`Demo-nettsiden ble ikke lagt inn: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setWorking(false);
      setAsking(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[var(--studio-accent-bg)] border border-[var(--studio-accent-border)] flex flex-col justify-between space-y-3">
      <div className="space-y-1">
        <span className="font-bold text-indigo-100 text-xs flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[var(--studio-accent-text)]" />
          <span>Legg inn demo-nettsiden</span>
        </span>
        <p className="text-[11px] text-[var(--studio-accent-text)]/80 leading-relaxed">
          Legger inn demosidene, nyhetene, talene, staben og innstillingene som følger med. Personer, grupper og
          samlinger røres ikke.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={disabled || working}
        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>Legg inn demo-nettsiden</span>
      </button>

      {asking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--studio-overlay)] backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-website-title"
        >
          <div className="bg-[var(--studio-bg)] border border-amber-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 id="demo-website-title" className="text-base font-bold text-[var(--studio-text)]">
                Legge inn demo-nettsiden?
              </h4>
            </div>

            <div className="text-xs text-[var(--studio-muted)] leading-relaxed space-y-1.5">
              <p>
                Menighetens navn og de andre innstillingene for nettsiden byttes til demo-menighetens. Demosidene,
                nyhetene, talene og staben legges inn.
              </p>
              {pages.length > 0 ? (
                <p>
                  Nettsiden har {pages.length} sider fra før. Ingenting slettes, så de blir stående sammen med demosidene,
                  og menyen får faner fra begge. Vil du bytte innhold i stedet, henter du inn et datasett under «Datasett»
                  og svarer ja til å slette først.
                </p>
              ) : (
                <p>Nettsiden har ingen sider fra før.</p>
              )}
              <p>Planleggeren røres ikke.</p>
            </div>

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
                onClick={handleConfirmed}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {working && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{working ? "Legger inn…" : "Ja, legg inn"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
