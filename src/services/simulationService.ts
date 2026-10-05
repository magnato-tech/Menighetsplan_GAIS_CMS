import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreData";
import { chunk } from "../utils/chunk";
import {
  SIMULATED_COLLECTIONS,
  buildSimulatedChurchLife,
  isSimulatedDocument,
  type SimulationInput,
} from "../data/simulatedChurchLife";
import type { TestdataServiceResult } from "./testdataService";
import { COLLECTIONS, CMS_COLLECTIONS } from "../data/collections";
import { headcountFields, isHeadcountRecord } from "./headcounts";
import type { GatheringHeadcount } from "../types";

/** Headcounts are kept in cms_settings for now (see headcounts.ts); everything else in its own collection. */
const storedIn = (collectionName: string) =>
  collectionName === COLLECTIONS.GATHERING_HEADCOUNTS ? CMS_COLLECTIONS.SETTINGS : collectionName;

// Firestore accepts at most 500 writes per batch
const BATCH_SIZE = 400;

function emptyResult(): TestdataServiceResult {
  return { success: true, counts: {}, total: 0, failures: [] };
}

function recordFailure(result: TestdataServiceResult, collectionName: string, error: unknown) {
  console.error(`Simulering: ${collectionName} feilet:`, error);
  result.success = false;
  result.failures.push({
    collection: collectionName,
    message: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Removes everything an earlier simulation wrote, and nothing else: persons, groups,
 * roles, CMS content and gatherings made by hand stay as they are.
 */
export async function clearSimulatedChurchLife(): Promise<TestdataServiceResult> {
  const startTime = Date.now();
  const result = emptyResult();
  for (const collectionName of SIMULATED_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, storedIn(collectionName)));
      const simulated = snap.docs.filter(
        (d) =>
          isSimulatedDocument(d.id, d.data()) &&
          (collectionName !== COLLECTIONS.GATHERING_HEADCOUNTS || isHeadcountRecord(d.data()))
      );
      for (const piece of chunk(simulated, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const docSnap of piece) batch.delete(docSnap.ref);
        await batch.commit();
      }
      result.counts[collectionName] = simulated.length;
      result.total += simulated.length;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }
  result.durationMs = Date.now() - startTime;
  return result;
}

/**
 * Writes a simulated history built from the persons, groups and roles in the database.
 * An earlier simulation is removed first, so running it again never doubles anything.
 */
export async function simulateChurchLife(input: SimulationInput): Promise<TestdataServiceResult> {
  const startTime = Date.now();
  const cleared = await clearSimulatedChurchLife();
  const result = emptyResult();
  result.failures.push(...cleared.failures);

  const byCollection = new Map<string, { id: string; data: object }[]>();
  for (const item of buildSimulatedChurchLife(input)) {
    const list = byCollection.get(item.collection) ?? [];
    list.push(item);
    byCollection.set(item.collection, list);
  }

  for (const [collectionName, documents] of byCollection) {
    try {
      for (const piece of chunk(documents, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const item of piece) {
          const data =
            collectionName === COLLECTIONS.GATHERING_HEADCOUNTS ? headcountFields(item.data as GatheringHeadcount) : item.data;
          batch.set(doc(db, storedIn(collectionName), item.id), sanitizeForFirestore(data));
        }
        await batch.commit();
      }
      result.counts[collectionName] = documents.length;
      result.total += documents.length;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }
  result.success = result.failures.length === 0;
  result.durationMs = Date.now() - startTime;
  return result;
}
