import React, { useId, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { SiteTrafficBoard } from "../../../../hooks/useSiteTrafficBoard";
import type { ShowFeedback } from "../../studio";
import { countOf } from "../../../../utils/siteTraffic";
import { studioSecondaryButton } from "../../studioTheme";
import { AnalyticsSection } from "../analytics/AnalyticsSection";
import { ResetTrafficDialog } from "./ResetTrafficDialog";

/** What the numbers rest on and what is not measured, in plain words, so the editor can tell a visitor how the counting works. */
const BASIS = [
  "Nettsiden teller selv hvilken side som vises, når, hvor lenge, og hvilke knapper som trykkes. Bare summer per dag lagres.",
  "Tellingen lagrer ingenting i den besøkendes nettleser og bruker ikke informasjonskapsler. Ingen opplysninger om den besøkende eller utstyret lagres.",
  "Et besøk er én åpning av nettsiden. Kommer samme person tilbake senere, er det et nytt besøk. Nye og faste besøkende kan derfor ikke skilles; det ville krevd samtykke fra hver besøkende.",
  "Tid telles bare mens siden er synlig på skjermen, og høyst 30 minutter per side. Tallene er anslag.",
  "Forhåndsvisninger i admin og søkeroboter telles ikke. Det måles ikke hvor de besøkende kommer fra eller hva slags utstyr de bruker.",
];

const describeFailure = (error: unknown): string => (error instanceof Error ? error.message : "ukjent feil");

/**
 * Fills in example numbers and says for how many days it did. The empty board and the controls
 * below the numbers both offer this, so the behaviour lives in one place.
 */
export function useAddExamples(board: SiteTrafficBoard, showFeedback: ShowFeedback): { working: boolean; add: () => Promise<void> } {
  const [working, setWorking] = useState(false);

  const add = async () => {
    setWorking(true);
    try {
      const days = await board.addExamples();
      showFeedback(
        days > 0 ? `Eksempeltall er lagt inn for ${countOf(days, "dag", "dager")}.` : "Alle dagene har tall fra før, så ingen eksempeltall ble lagt inn."
      );
    } catch (error) {
      showFeedback(`Eksempeltallene ble ikke lagt inn: ${describeFailure(error)}`, "error");
    } finally {
      setWorking(false);
    }
  };

  return { working, add };
}

interface TrafficBasisSectionProps {
  board: SiteTrafficBoard;
  showFeedback: ShowFeedback;
}

/** How the visits are counted, the choice to leave one's own browser out, and, in a demonstration, the example numbers and the reset. */
export const TrafficBasisSection: React.FC<TrafficBasisSectionProps> = ({ board, showFeedback }) => {
  const checkboxId = useId();
  const helpId = useId();
  const countingId = useId();
  const countingHelpId = useId();
  const [savingChoice, setSavingChoice] = useState(false);
  const examples = useAddExamples(board, showFeedback);
  const [asking, setAsking] = useState(false);
  const [resetting, setResetting] = useState(false);
  // Example numbers are being made, or the counts are being deleted; the other must wait
  const busy = examples.working || resetting;

  const changeCounting = async (on: boolean) => {
    setSavingChoice(true);
    try {
      // A choice that could not be saved is already reported where the settings are written
      if (await board.setCounting(on)) {
        showFeedback(on ? "Tellingen er slått på. Besøk telles fra nå." : "Tellingen er slått av. Besøk telles ikke før den slås på igjen.");
      }
    } finally {
      setSavingChoice(false);
    }
  };

  const changeOwnVisits = (excluded: boolean) => {
    if (!board.excludeOwnVisits(excluded)) {
      showFeedback("Nettleseren ville ikke huske valget, så besøkene herfra telles fortsatt.", "error");
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      const days = await board.reset();
      showFeedback(`Besøkstallene er nullstilt (${countOf(days, "dag", "dager")} slettet).`);
    } catch (error) {
      showFeedback(`Besøkstallene ble ikke nullstilt: ${describeFailure(error)}`, "error");
    } finally {
      setResetting(false);
      setAsking(false);
    }
  };

  return (
    <AnalyticsSection
      id="traffic-basis"
      title="Slik telles besøkene"
      description="Hva tallene bygger på, og hva som ikke måles."
      icon={<ShieldCheck className="w-5 h-5" />}
    >
      <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed text-[var(--studio-text)]">
        {BASIS.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>

      <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-4">
        {/* The congregation decides whether its visitors are counted at all */}
        <div className="flex items-start gap-3">
          <input
            id={countingId}
            type="checkbox"
            checked={board.counting}
            disabled={savingChoice}
            onChange={(event) => void changeCounting(event.target.checked)}
            aria-describedby={countingHelpId}
            className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
          />
          <div>
            <label htmlFor={countingId} className="block text-xs font-bold text-[var(--studio-text)] cursor-pointer">
              Tell besøk på nettsiden
            </label>
            <p id={countingHelpId} className="text-[11px] text-[var(--studio-muted)] mt-0.5">
              Gjelder alle besøkende. Slås tellingen av, telles ingenting før den slås på igjen. Tallene som er telt, blir stående.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id={checkboxId}
            type="checkbox"
            checked={board.ownVisitsExcluded}
            onChange={(event) => changeOwnVisits(event.target.checked)}
            aria-describedby={helpId}
            className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
          />
          <div>
            <label htmlFor={checkboxId} className="block text-xs font-bold text-[var(--studio-text)] cursor-pointer">
              Ikke tell besøk fra denne nettleseren
            </label>
            <p id={helpId} className="text-[11px] text-[var(--studio-muted)] mt-0.5">
              For deg som redigerer nettsiden. Valget huskes i denne nettleseren.
            </p>
          </div>
        </div>

        {board.demo ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={examples.add}
              disabled={busy}
              className={`${studioSecondaryButton} py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Legg inn eksempeltall
            </button>
            <button
              type="button"
              onClick={() => setAsking(true)}
              disabled={busy}
              className="px-3 py-2 rounded-lg border border-[var(--studio-bad)] text-[var(--studio-bad)] hover:bg-[var(--studio-hover)] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nullstill besøkstallene
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--studio-muted)]">Appen står i produksjon. Da kan besøkstallene ikke nullstilles.</p>
        )}
      </div>

      {asking && <ResetTrafficDialog working={resetting} onConfirm={reset} onCancel={() => setAsking(false)} />}
    </AnalyticsSection>
  );
};
