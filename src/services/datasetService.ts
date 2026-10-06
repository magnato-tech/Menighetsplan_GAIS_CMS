import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { ALL_COLLECTIONS, CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID, COLLECTIONS } from "../data/collections";
import { chunk } from "../utils/chunk";
import { buildDataset, type Dataset, type DatasetDocument } from "../utils/dataset";
import { sanitizeForFirestore } from "../utils/firestoreData";
import { HEADCOUNT_RECORD } from "./headcounts";
import type { TestdataServiceResult } from "./testdataService";
import { VOLUNTEER_ROLE_RECORD } from "./volunteerRoles";

// Firestore accepts at most 500 writes per batch
const BATCH_SIZE = 400;

/**
 * Collections that are stored as marked documents in cms_settings for now (see volunteerRoles.ts
 * and headcounts.ts). A dataset names them as the collections they are, so a file made today
 * still fits the day they get collections of their own.
 */
const KEPT_IN_SETTINGS: Record<string, string> = {
  [COLLECTIONS.VOLUNTEER_ROLES]: VOLUNTEER_ROLE_RECORD,
  [COLLECTIONS.GATHERING_HEADCOUNTS]: HEADCOUNT_RECORD,
};

const collectionOfMark = (recordType: unknown): string | undefined =>
  Object.keys(KEPT_IN_SETTINGS).find((name) => KEPT_IN_SETTINGS[name] === recordType);

export interface ExportedDataset {
  dataset: Dataset;
  /** Collections the rules in force would not let us read. They are not in the dataset. */
  unreadable: string[];
}

const isPermissionDenied = (error: unknown): boolean => (error as { code?: unknown } | null)?.code === "permission-denied";

/**
 * Everything in the database as one dataset. Uploaded images stay in the image store;
 * the dataset holds the references to them.
 *
 * The rules deployed on a project can be older than the app and turn away a collection the
 * app has since been given (see CLAUDE.md). Such a collection is left out and named, so the
 * caller can say that the file is not everything. Any other failure stops the export:
 * a file that silently lacks a collection would pass for a complete copy.
 */
export async function exportDataset(name: string, description = "", now: Date = new Date()): Promise<ExportedDataset> {
  const collections: Record<string, DatasetDocument[]> = {};
  const unreadable: string[] = [];
  const add = (collectionName: string, document: DatasetDocument) => {
    (collections[collectionName] ??= []).push(document);
  };

  for (const collectionName of ALL_COLLECTIONS) {
    if (collectionName in KEPT_IN_SETTINGS) continue;
    let snapshot;
    try {
      snapshot = await getDocs(collection(db, collectionName));
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
      unreadable.push(collectionName);
      continue;
    }
    for (const docSnap of snapshot.docs) {
      const { recordType, ...fields } = docSnap.data();
      const kept = collectionName === CMS_COLLECTIONS.SETTINGS ? collectionOfMark(recordType) : undefined;
      if (kept) add(kept, { ...fields, id: docSnap.id });
      else add(collectionName, { ...docSnap.data(), id: docSnap.id });
    }
  }
  return { dataset: buildDataset(name, description, collections, now), unreadable };
}

/** Where a document from a dataset is stored, and in what form. */
function storedForm(collectionName: string, document: DatasetDocument): { collection: string; data: object } {
  const mark = KEPT_IN_SETTINGS[collectionName];
  if (mark) return { collection: CMS_COLLECTIONS.SETTINGS, data: { ...document, recordType: mark } };
  if (collectionName === CMS_COLLECTIONS.SETTINGS && document.id === CMS_SETTINGS_DOC_ID) {
    // The settings document is addressed by its place, not by a field in it
    const { id: _id, ...settings } = document;
    return { collection: collectionName, data: settings };
  }
  return { collection: collectionName, data: document };
}

/**
 * Writes every document in the dataset. A document already in the database under the same id
 * is replaced by the one in the file; everything else in the database is left as it is.
 * Nothing is deleted here: emptying the database first is a separate, deliberate step.
 */
export async function importDataset(dataset: Dataset): Promise<TestdataServiceResult> {
  const startTime = Date.now();
  const result: TestdataServiceResult = { success: true, counts: {}, total: 0, failures: [] };

  for (const [collectionName, documents] of Object.entries(dataset.collections)) {
    try {
      for (const piece of chunk(documents, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const document of piece) {
          const stored = storedForm(collectionName, document);
          batch.set(doc(db, stored.collection, document.id), sanitizeForFirestore(stored.data));
        }
        await batch.commit();
      }
      result.counts[collectionName] = documents.length;
      result.total += documents.length;
    } catch (error) {
      console.error(`Datasett: ${collectionName} feilet:`, error);
      result.failures.push({
        collection: collectionName,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  result.success = result.failures.length === 0;
  result.durationMs = Date.now() - startTime;
  return result;
}

/**
 * Whether the database holds anything the app can reach. Asked at the moment a dataset is
 * about to be brought in, so the answer does not depend on what a screen has loaded so far.
 */
export async function databaseHasContent(): Promise<boolean> {
  for (const collectionName of ALL_COLLECTIONS) {
    if (collectionName in KEPT_IN_SETTINGS) continue;
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      if (!snapshot.empty) return true;
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
    }
  }
  return false;
}

export interface ClearedDatabase {
  deleted: number;
  failures: { collection: string; message: string }[];
}

/**
 * Deletes every document the app can reach, so a dataset can take the place of what was there.
 * There is no undo: the caller takes a copy first (see exportDataset).
 *
 * A collection the rules in force turn away is passed over, as in exportDataset: the app cannot
 * have stored anything there. Volunteer roles and headcounts go with cms_settings, where they
 * are kept. Any other failure is reported, and the caller must not go on as if the database were empty.
 */
export async function clearDatabase(): Promise<ClearedDatabase> {
  const cleared: ClearedDatabase = { deleted: 0, failures: [] };
  for (const collectionName of ALL_COLLECTIONS) {
    if (collectionName in KEPT_IN_SETTINGS) continue;
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      for (const piece of chunk(snapshot.docs, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const docSnap of piece) batch.delete(docSnap.ref);
        await batch.commit();
      }
      cleared.deleted += snapshot.docs.length;
    } catch (error) {
      if (isPermissionDenied(error)) continue;
      console.error(`Datasett: sletting av ${collectionName} feilet:`, error);
      cleared.failures.push({
        collection: collectionName,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return cleared;
}
