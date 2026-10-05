import React, { useState } from "react";
import { History, Loader2, Trash2 } from "lucide-react";
import { useFirebase } from "../../context/FirebaseDataContext";
import { SIMULATION_WEEK_OPTIONS } from "../../data/simulatedChurchLife";
import { clearSimulatedChurchLife, simulateChurchLife } from "../../services/simulationService";
import type { ShowFeedback } from "../../pages/admin/studio";
import { studioPrimaryButton, studioSecondaryButton } from "../../pages/admin/studioTheme";

interface SimulationPanelProps {
  showFeedback: ShowFeedback;
}

/**
 * Fills the database with a simulated history of congregation life, so the analysis board
 * has something to show before real data has been gathered. Built from the persons, groups
 * and roles already in the database.
 */
export const SimulationPanel: React.FC<SimulationPanelProps> = ({ showFeedback }) => {
  const { allPersons, groups, volunteerRoles, gatherings } = useFirebase();
  const [weeks, setWeeks] = useState<number>(26);
  const [working, setWorking] = useState<"simulate" | "clear" | null>(null);
  const canSimulate = allPersons.length > 0 && groups.length > 0;

  const handleSimulate = async () => {
    setWorking("simulate");
    try {
      const result = await simulateChurchLife({ now: Date.now(), weeks, persons: allPersons, groups, volunteerRoles, gatherings });
      if (result.failures.length > 0) {
        showFeedback(`Simuleringen ble ikke fullført: ${result.failures[0].message}`, "error");
      } else {
        showFeedback(`${weeks} uker med menighetsliv er simulert (${result.total} dokumenter). Se Analysebord.`);
      }
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Simuleringen feilet.", "error");
    } finally {
      setWorking(null);
    }
  };

  const handleClear = async () => {
    setWorking("clear");
    try {
      const result = await clearSimulatedChurchLife();
      if (result.failures.length > 0) {
        showFeedback(`Den simulerte historikken ble ikke fjernet helt: ${result.failures[0].message}`, "error");
      } else {
        showFeedback(`Den simulerte historikken er fjernet (${result.total} dokumenter).`);
      }
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Fjerningen feilet.", "error");
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] space-y-4">
      <div>
        <h3 className="text-base font-bold text-[var(--studio-text)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--studio-icon)]" />
          <span>Simuler menighetsliv</span>
        </h3>
        <p className="text-xs text-[var(--studio-muted)] mt-0.5 max-w-3xl">
          Lager en tenkt historikk bakover i tid for personene, gruppene og rollene som ligger i databasen: gudstjenester med
          oppmøtetall, oppgaver med ja, nei og forfall, husfellesskap med svar, og meldinger i gruppene. Nyttig for å prøve
          Analysebord før dere har samlet egne tall. Alt som simuleres er merket og kan fjernes igjen uten at noe annet
          berøres.
        </p>
      </div>

      {!canSimulate && (
        <p className="text-xs font-bold text-[var(--studio-warn)]">
          Databasen har ingen personer eller grupper å bygge historikken på. Fyll databasen med demodata først.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="simulation-weeks" className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
            Hvor langt tilbake
          </label>
          <select
            id="simulation-weeks"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[var(--studio-input)] border border-[var(--studio-border)] text-[var(--studio-input-text)] text-xs cursor-pointer"
          >
            {SIMULATION_WEEK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} uker
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSimulate}
          disabled={!canSimulate || working !== null}
          className={`${studioPrimaryButton} px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {working === "simulate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
          {working === "simulate" ? "Simulerer…" : "Simuler menighetsliv"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={working !== null}
          className={`${studioSecondaryButton} py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {working === "clear" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Fjern simulert historikk
        </button>
      </div>
    </section>
  );
};
