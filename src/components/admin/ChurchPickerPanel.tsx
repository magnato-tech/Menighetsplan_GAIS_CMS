import React, { useEffect, useState } from "react";
import { AlertCircle, Church, Loader2, RefreshCw } from "lucide-react";
import { switchWebsite, type WebsiteSource } from "../../services/churchSwitch";
import { listDemoSets, loadDemoSet, type DemoSetInfo } from "../../services/demoSets";
import type { OperatingMode } from "../../services/operatingMode";
import { loadPreviousSetup, readPreviousSetupInfo, type PreviousSetupInfo } from "../../services/previousSetup";
import { DATA_PART_CONTENTS } from "../../utils/dataParts";
import type { ShowFeedback } from "../../pages/admin/studio";
import { studioInputFull, studioPrimaryButton } from "../../pages/admin/studioTheme";

interface ChurchPickerPanelProps {
  /** The mode the app is in. The website can only be swapped in demo. */
  mode: OperatingMode | null;
  showFeedback: ShowFeedback;
}

const BUILT_IN_DEMO = "demo";
const PREVIOUS = "previous";

const day = (isoString: string): string =>
  new Date(isoString).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
const dayAndTime = (isoString: string): string =>
  new Date(isoString).toLocaleString("nb-NO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/**
 * «Velg menighet»: swaps the website for another congregation's, for a demonstration. The
 * choices are the demo sets that come with the app, the made-up demo congregation, and the
 * website as it was before the last swap. The planner is never touched.
 */
export const ChurchPickerPanel: React.FC<ChurchPickerPanelProps> = ({ mode, showFeedback }) => {
  const [sets, setSets] = useState<DemoSetInfo[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<PreviousSetupInfo | null>(() => readPreviousSetupInfo());
  const [choice, setChoice] = useState("");
  const [asking, setAsking] = useState(false);
  // What the swap is doing right now, shown in the dialog while it runs
  const [step, setStep] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    listDemoSets()
      .then((list) => current && setSets(list))
      .catch((error) => current && setListError(error instanceof Error ? error.message : "ukjent feil"));
    return () => {
      current = false;
    };
  }, []);

  const chosenSet = sets.find((set) => `set:${set.id}` === choice);
  const chosenName = chosenSet?.name ?? (choice === BUILT_IN_DEMO ? "Demo-menigheten" : choice === PREVIOUS ? previous?.churchName : undefined);
  const chosenDocuments = chosenSet?.documents ?? (choice === PREVIOUS ? previous?.documents : undefined);
  const working = step !== null;
  const locked = mode !== "demo";

  const sourceOf = async (): Promise<WebsiteSource> => {
    if (chosenSet) return { kind: "dataset", dataset: await loadDemoSet(chosenSet) };
    if (choice === PREVIOUS) {
      const setup = loadPreviousSetup();
      if (!setup) throw new Error("Forrige oppsett finnes ikke lenger i denne nettleseren.");
      return { kind: "dataset", dataset: setup.dataset };
    }
    return { kind: "builtInDemo" };
  };

  const handleConfirmed = async () => {
    if (!chosenName) return;
    setStep("Henter innholdet …");
    try {
      // The new content is fetched before anything is kept or deleted
      const source = await sourceOf();
      const result = await switchWebsite(source, setStep);
      showFeedback(
        `Nettsiden er byttet til «${chosenName}» (${result.imported} dokumenter).${
          result.keptPrevious ? " Den som var, ligger som «Forrige oppsett» i listen." : ""
        } Planleggeren er ikke rørt.`
      );
      setChoice("");
    } catch (error) {
      showFeedback(`Nettsiden ble ikke byttet: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setPrevious(readPreviousSetupInfo());
      setStep(null);
      setAsking(false);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] space-y-4">
      <div>
        <h3 className="text-base font-bold text-[var(--studio-text)] flex items-center gap-2">
          <Church className="w-4 h-4 text-[var(--studio-icon)]" />
          <span>Velg menighet</span>
        </h3>
        <p className="text-xs text-[var(--studio-muted)] mt-0.5 max-w-3xl leading-relaxed">
          Bytter nettsiden til en annen menighets, for demonstrasjon. Nettsiden som ligger inne, slettes og erstattes, og
          lagres først som «Forrige oppsett» så byttet kan gjøres om. Personer, grupper og roller i planleggeren røres ikke.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label htmlFor="church-picker" className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
            Menighet
          </label>
          <select
            id="church-picker"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            disabled={locked || working}
            className={`${studioInputFull} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">Velg menighet …</option>
            {sets.map((set) => (
              <option key={set.id} value={`set:${set.id}`}>
                {set.name}
              </option>
            ))}
            <option value={BUILT_IN_DEMO}>Demo-menigheten</option>
            {previous && (
              <option value={PREVIOUS}>
                Forrige oppsett: {previous.churchName} (lagret {dayAndTime(previous.savedAt)})
              </option>
            )}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setAsking(true)}
          disabled={locked || working || !chosenName}
          className={`${studioPrimaryButton} px-4 py-2 text-xs flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <RefreshCw className="w-4 h-4" />
          Bytt nettside
        </button>
      </div>

      {mode === "production" && (
        <p className="text-[11px] font-bold text-[var(--studio-warn)]">
          Appen står i produksjon. Nettsiden kan ikke byttes før appen er satt i demo under «Driftsmodus».
        </p>
      )}
      {listError && (
        <p role="alert" className="text-[11px] font-bold text-[var(--studio-warn)]">
          {listError} Demo-menigheten og forrige oppsett kan fortsatt velges.
        </p>
      )}
      {chosenSet && (
        <p className="text-[11px] text-[var(--studio-muted)] leading-relaxed">
          Hentet fra {chosenSet.source} {day(chosenSet.fetchedAt)}: {chosenSet.documents} dokumenter. E-postadresser og
          telefonnumre er tatt ut. Bildene vises fra menighetens eget nettsted.
        </p>
      )}
      {choice === BUILT_IN_DEMO && (
        <p className="text-[11px] text-[var(--studio-muted)] leading-relaxed">
          Den oppdiktede menigheten som følger med appen: sider, nyheter, taler, stab og innstillinger.
        </p>
      )}
      {choice === PREVIOUS && previous && (
        <p className="text-[11px] text-[var(--studio-muted)] leading-relaxed">
          Nettsiden slik den var før forrige bytte: {previous.documents} dokumenter. Den ligger bare i denne nettleseren.
        </p>
      )}

      {asking && chosenName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--studio-overlay)] backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="church-picker-title"
        >
          <div className="bg-[var(--studio-bg)] border border-red-800/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <h4 id="church-picker-title" className="text-base font-bold text-[var(--studio-text)]">
                Bytte nettsiden til «{chosenName}»?
              </h4>
            </div>

            <div className="text-xs text-[var(--studio-muted)] leading-relaxed space-y-1.5">
              <p className="font-bold text-[var(--studio-text)]">Dette skjer i én operasjon:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Nettsiden slik den er nå, lagres som «Forrige oppsett» i denne nettleseren.</li>
                <li>Alt i nettsiden slettes: {DATA_PART_CONTENTS.website}.</li>
                <li>
                  «{chosenName}» hentes inn{chosenDocuments ? ` (${chosenDocuments} dokumenter)` : ""}.
                </li>
              </ol>
              <p>
                Planleggeren røres ikke, men oppgaver og oppmøte som hang på arrangementene som slettes, går med og
                kommer ikke tilbake med «Forrige oppsett».
              </p>
            </div>

            {working && (
              <p role="status" className="text-xs font-bold text-[var(--studio-text)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{step}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAsking(false)}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-muted)] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleConfirmed}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ja, bytt nettside
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
