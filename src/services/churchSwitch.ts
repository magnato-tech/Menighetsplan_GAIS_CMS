import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "../data/collections";
import { keepParts } from "../utils/dataParts";
import { totalDocuments, type Dataset } from "../utils/dataset";
import { clearDatabase, exportDataset, importDataset } from "./datasetService";
import { ensureDeletionAllowed } from "./operatingMode";
import { savePreviousSetup } from "./previousSetup";
import { clearSiteTraffic } from "./siteTraffic";
import { generateDemoWebsite } from "./testdataService";

// «Velg menighet»: swaps the website for another congregation's, for a demonstration. The
// website as it was is kept as the previous setup first, so the swap can be undone. The planner
// (persons, groups, roles) is never touched. See utils/dataParts.ts for what the website is.

/** What to put in: a dataset, or the demo website that comes with the app. */
export type WebsiteSource = { kind: "dataset"; dataset: Dataset } | { kind: "builtInDemo" };

export interface WebsiteSwitchResult {
  /** Whether there was a website to keep as the previous setup. */
  keptPrevious: boolean;
  deleted: number;
  imported: number;
  /** Whether the visit counts were reset. They are about the website that was replaced. */
  countsReset: boolean;
}

const WEBSITE = ["website"] as const;

const churchNameOf = (dataset: Dataset): string => {
  const settings = dataset.collections[CMS_COLLECTIONS.SETTINGS]?.find((document) => document.id === CMS_SETTINGS_DOC_ID);
  return typeof settings?.churchName === "string" && settings.churchName.trim() ? settings.churchName : "Uten navn";
};

/**
  * Keeps the website as the previous setup, empties it, puts the new one in, and resets the
 * visit counts, in that order. A step that fails stops the rest: nothing is deleted before the
 * website is kept, and nothing is put in on top of a website that was not emptied. The counts
 * are the exception: the swap stands even if they could not be reset. `onStep` is told what
 * is being done.
 */
export async function switchWebsite(
  source: WebsiteSource,
  onStep: (step: string) => void = () => {},
  now: Date = new Date()
): Promise<WebsiteSwitchResult> {
  await ensureDeletionAllowed();

  onStep("Lagrer nettsiden slik den er nå …");
  const current = (await exportDataset("Forrige oppsett", "", now, WEBSITE)).dataset;
  const keptPrevious = totalDocuments(current) > 0;
  if (keptPrevious) savePreviousSetup(current, churchNameOf(current), now);

  onStep("Sletter nettsiden …");
  const cleared = await clearDatabase(WEBSITE);
  if (cleared.failures.length > 0) {
    throw new Error(`Nettsiden ble ikke tømt helt, og ingenting er hentet inn: ${cleared.failures[0].message}`);
  }

  onStep("Henter inn den nye nettsiden …");
  const written =
    source.kind === "builtInDemo"
      ? await generateDemoWebsite()
      : await importDataset({ ...source.dataset, collections: keepParts(source.dataset.collections, WEBSITE) });
  if (written.failures.length > 0) {
    throw new Error(
      `Nettsiden er tømt, men den nye ble ikke hentet inn i sin helhet: ${written.failures[0].message}.${
        keptPrevious ? " Velg «Forrige oppsett» for å få tilbake den som var." : ""
      }`
    );
  }
  // The visits counted so far were to the website that is gone. A new website starts from nothing.
  onStep("Nullstiller besøkstallene …");
  let countsReset = true;
  try {
    await clearSiteTraffic();
  } catch (error) {
    // The website is swapped all the same; the counts can be reset from the board
    console.error("Besøkstallene ble ikke nullstilt:", error);
    countsReset = false;
  }
  return { keptPrevious, deleted: cleared.deleted, imported: written.total, countsReset };
}
