import { parseDataset, serializeDataset, totalDocuments, type Dataset } from "../utils/dataset";

// «Forrige oppsett»: the website as it was just before it was last swapped for another
// congregation's, so the swap can be undone. One setup is kept, in this browser only. It is a
// convenience for demonstrations, not a backup: a dataset downloaded to a file is the backup.

const KEY = "menighetsplan_forrige_nettside";

export interface PreviousSetupInfo {
  /** The congregation whose website it is. */
  churchName: string;
  savedAt: string;
  documents: number;
}

export interface PreviousSetup extends PreviousSetupInfo {
  dataset: Dataset;
}

/** The setup kept in this browser, or null when there is none or it cannot be read. */
export function loadPreviousSetup(): PreviousSetup | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null") as { churchName?: unknown; savedAt?: unknown; dataset?: unknown } | null;
    if (!stored || typeof stored.churchName !== "string" || typeof stored.savedAt !== "string") return null;
    const parsed = parseDataset(JSON.stringify(stored.dataset));
    if (!parsed.ok) return null;
    return { churchName: stored.churchName, savedAt: stored.savedAt, documents: parsed.total, dataset: parsed.dataset };
  } catch (error) {
    console.error("Forrige oppsett kunne ikke leses:", error);
    return null;
  }
}

export function readPreviousSetupInfo(): PreviousSetupInfo | null {
  const setup = loadPreviousSetup();
  return setup && { churchName: setup.churchName, savedAt: setup.savedAt, documents: setup.documents };
}

/**
 * Keeps the dataset as the previous setup, in place of the one kept before. Throws when the
 * browser will not store it (no room, or storage turned off): the caller must not go on to
 * delete what it could not keep.
 */
export function savePreviousSetup(dataset: Dataset, churchName: string, now: Date = new Date()): PreviousSetupInfo {
  const info = { churchName, savedAt: now.toISOString(), documents: totalDocuments(dataset) };
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...info, dataset: JSON.parse(serializeDataset(dataset)) }));
  } catch (error) {
    console.error("Forrige oppsett kunne ikke lagres:", error);
    throw new Error("Nettsiden slik den er nå, kunne ikke lagres i nettleseren. Last den ned som et datasett først.");
  }
  return info;
}
