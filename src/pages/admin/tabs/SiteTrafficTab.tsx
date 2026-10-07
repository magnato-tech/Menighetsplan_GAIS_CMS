import React, { useState } from "react";
import { BarChart3, FlaskConical, Hourglass, Info } from "lucide-react";
import { useSiteTrafficBoard, type SiteTrafficBoard } from "../../../hooks/useSiteTrafficBoard";
import { DEFAULT_TRAFFIC_PERIOD, TRAFFIC_PERIODS, countOf, type TrafficPeriodId, type TrafficSummary } from "../../../utils/siteTraffic";
import type { ShowFeedback } from "../studio";
import { studioPrimaryButton, studioSecondaryButton } from "../studioTheme";
import { AnalyticsSection } from "./analytics/AnalyticsSection";
import { TrafficActionsSection } from "./traffic/TrafficActionsSection";
import { TrafficBasisSection, useAddExamples } from "./traffic/TrafficBasisSection";
import { TrafficChart } from "./traffic/TrafficChart";
import { TrafficKeyFigures } from "./traffic/TrafficKeyFigures";
import { TrafficPagesSection } from "./traffic/TrafficPagesSection";
import { TrafficRhythmSection } from "./traffic/TrafficRhythmSection";

interface SiteTrafficTabProps {
  showFeedback: ShowFeedback;
}

const COLUMN_DESCRIPTIONS: Record<TrafficSummary["columnUnit"], string> = {
  dag: "Én søyle per dag.",
  uke: "Én søyle per uke.",
  "fire uker": "Én søyle per fire uker.",
};

const noticeBox = "p-4 rounded-xl bg-[var(--studio-accent-bg)] border border-[var(--studio-accent-border)]";

interface BoardProps {
  board: SiteTrafficBoard;
  showFeedback: ShowFeedback;
}

/** The period holds example numbers. They are not visits, so the board says so and offers to take them away. */
const ExamplesNotice: React.FC<BoardProps> = ({ board, showFeedback }) => {
  const [working, setWorking] = useState(false);

  const remove = async () => {
    setWorking(true);
    try {
      const days = await board.removeExamples();
      showFeedback(`Eksempeltallene er fjernet (${countOf(days, "dag", "dager")}).`);
    } catch (error) {
      showFeedback(`Eksempeltallene ble ikke fjernet: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={`${noticeBox} flex flex-wrap items-center justify-between gap-3`}>
      <p className="flex items-start gap-2 text-xs text-[var(--studio-text)]">
        <FlaskConical className="w-4 h-4 shrink-0 mt-px text-[var(--studio-icon)]" aria-hidden="true" />
        <span>Perioden inneholder eksempeltall laget for demonstrasjon. De er ikke ekte besøk.</span>
      </p>
      <button type="button" onClick={remove} disabled={working} className={`${studioSecondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}>
        Fjern eksempeltallene
      </button>
    </div>
  );
};

/** What the board shows while nothing is counted, and in a demonstration the way to fill it with examples. */
const EmptyBoard: React.FC<BoardProps> = ({ board, showFeedback }) => {
  const examples = useAddExamples(board, showFeedback);

  return (
    <AnalyticsSection
      id="traffic-empty"
      title="Ingen besøk er telt i perioden"
      description={
        board.counting
          ? "Tellingen går av seg selv fra nettsiden åpnes første gang. Kom tilbake når noen har vært innom, eller velg en lengre periode."
          : "Tellingen er slått av. Slå den på under «Slik telles besøkene» for å telle besøk."
      }
      icon={<Hourglass className="w-5 h-5" />}
    >
      {board.demo && (
        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-3">
          <p className="text-xs font-bold text-[var(--studio-text)]">Vil du se hvordan bordet ser ut med tall?</p>
          <button
            type="button"
            onClick={examples.add}
            disabled={examples.working}
            className={`${studioPrimaryButton} px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Legg inn eksempeltall
          </button>
        </div>
      )}
    </AnalyticsSection>
  );
};

/** Besøk på nettsiden: how much the website is used, what is read and when, over a chosen period. */
export const SiteTrafficTab: React.FC<SiteTrafficTabProps> = ({ showFeedback }) => {
  const [periodId, setPeriodId] = useState<TrafficPeriodId>(DEFAULT_TRAFFIC_PERIOD);
  const board = useSiteTrafficBoard(periodId);
  const { summary, error } = board;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--studio-border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--studio-text)] tracking-tight">Besøk på nettsiden</h1>
          <p className="text-xs sm:text-sm text-[var(--studio-muted)] mt-1 max-w-2xl">
            Hvor mye nettsiden brukes, hva som leses og når, sammenlignet med perioden før. Besøkene telles anonymt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div
            role="group"
            aria-label="Periode"
            className="flex items-center gap-1 p-1 rounded-xl bg-[var(--studio-surface)] border border-[var(--studio-border)]"
          >
            {TRAFFIC_PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={periodId === option.id}
                onClick={() => setPeriodId(option.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  periodId === option.id ? "bg-indigo-600 text-white shadow-sm" : "text-[var(--studio-muted)] hover:text-[var(--studio-text)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error !== null && (
        <p role="alert" className="text-xs font-bold text-[var(--studio-bad)]">
          {`Besøkstallene kunne ikke hentes: ${error}`}
        </p>
      )}

      {error === null && summary === null && (
        <p role="status" className="text-xs text-[var(--studio-muted)]">
          Henter besøkstallene …
        </p>
      )}

      {error === null && summary !== null && (
        <>
          {(summary.hasExamples || board.ownVisitsExcluded || !board.counting) && (
            <div className="space-y-3">
              {!board.counting && (
                <p className={`${noticeBox} flex items-start gap-2 text-xs text-[var(--studio-text)]`}>
                  <Info className="w-4 h-4 shrink-0 mt-px text-[var(--studio-icon)]" aria-hidden="true" />
                  <span>Tellingen er slått av. Besøk på nettsiden telles ikke.</span>
                </p>
              )}
              {summary.hasExamples && <ExamplesNotice board={board} showFeedback={showFeedback} />}
              {board.ownVisitsExcluded && (
                <p className={`${noticeBox} flex items-start gap-2 text-xs text-[var(--studio-text)]`}>
                  <Info className="w-4 h-4 shrink-0 mt-px text-[var(--studio-icon)]" aria-hidden="true" />
                  <span>Besøk fra denne nettleseren telles ikke.</span>
                </p>
              )}
            </div>
          )}

          {summary.hasCounts ? (
            <>
              <TrafficKeyFigures summary={summary} />
              <AnalyticsSection
                id="traffic-chart"
                title="Besøk over tid"
                description={COLUMN_DESCRIPTIONS[summary.columnUnit]}
                icon={<BarChart3 className="w-5 h-5" />}
              >
                <TrafficChart columns={summary.columns} unit={summary.columnUnit} />
              </AnalyticsSection>
              <TrafficPagesSection summary={summary} />
              <TrafficRhythmSection summary={summary} />
              <TrafficActionsSection summary={summary} />
            </>
          ) : (
            <EmptyBoard board={board} showFeedback={showFeedback} />
          )}

          <TrafficBasisSection board={board} showFeedback={showFeedback} />
        </>
      )}
    </div>
  );
};
