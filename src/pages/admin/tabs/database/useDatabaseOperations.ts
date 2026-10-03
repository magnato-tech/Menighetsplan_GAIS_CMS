import { useState } from "react";
import {
  clearPlannerTestData,
  deleteAllData,
  populateCustomMockData,
} from "../../../../services/databaseAdmin";
import type { TestdataSize } from "../../../../utils/testdataPresets";
import type { ShowFeedback } from "../../studio";

/**
 * What the database tab does to the database: fill it with test data, empty the planner data, or
 * delete everything. Only one runs at a time, and each ends with a message to the person who started it.
 */
export function useDatabaseOperations(showFeedback: ShowFeedback) {
  const [isWorking, setIsWorking] = useState(false);

  const run = async (work: () => Promise<void>, fallbackMessage: string) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await work();
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : fallbackMessage, "error");
    } finally {
      setIsWorking(false);
    }
  };

  const populate = (size: TestdataSize, clearPlannerFirst: boolean) =>
    run(async () => {
      const result = await populateCustomMockData(size, { clearPlannerFirst });
      if (result.failures.length > 0) {
        showFeedback(`Fylling fullført med noen feil: ${result.failures[0].message}`, "error");
      } else {
        const clearedNote = clearPlannerFirst ? "Tidligere testdata ble ryddet. " : "";
        showFeedback(
          `${clearedNote}Databasen er nå fylt med ${size.personCount} personer, ${size.groupCount} grupper, ${size.gatheringCount} samlinger og ${size.taskCount} oppgaver!`
        );
      }
    }, "En feil oppstod under fylling av databasen.");

  const clearPlanner = () =>
    run(async () => {
      const result = await clearPlannerTestData();
      if (result.failures.length > 0) {
        showFeedback(`Kunne ikke tømme alle samlinger: ${result.failures[0].message}`, "error");
      } else {
        showFeedback("Testpersoner, grupper og planlegger-data er nå tømt. CMS-sider og nyheter ble bevart.");
      }
    }, "Kunne ikke tømme testdata.");

  const deleteAll = () =>
    run(async () => {
      const result = await deleteAllData();
      if (result.failures.length > 0) {
        showFeedback(`Sletting fullført med noen feil: ${result.failures[0].message}`, "error");
      } else {
        showFeedback("Alle data i databasen er nå slettet.");
      }
    }, "Kunne ikke slette database.");

  return { isWorking, populate, clearPlanner, deleteAll };
}
