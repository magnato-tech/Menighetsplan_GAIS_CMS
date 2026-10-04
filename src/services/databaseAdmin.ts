import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { ALL_COLLECTIONS } from "../data/collections";
import { chunk } from "../utils/chunk";
import {
  clearTestdata,
  clearPlannerTestData,
  generateTestdata,
  generate32TestPersons,
  deletePersonsTestdata,
  deleteGroupsTestdata,
  deleteRolesTestdata,
  populateCustomMockData,
  type TestdataServiceResult,
  type TestdataCounts,
  type GenerateTestdataOptions,
  type ClearTestdataOptions,
} from "./testdataService";

// Firestore accepts at most 500 writes per batch
const BATCH_SIZE = 400;

export type DatabaseAdminResult = TestdataServiceResult;

export {
  clearTestdata,
  clearPlannerTestData,
  generateTestdata,
  generate32TestPersons,
  deletePersonsTestdata,
  deleteGroupsTestdata,
  deleteRolesTestdata,
  populateCustomMockData,
  type TestdataServiceResult,
  type TestdataCounts,
  type GenerateTestdataOptions,
  type ClearTestdataOptions,
};

function emptyResult(): DatabaseAdminResult {
  return { success: true, counts: {}, total: 0, failures: [] };
}

function recordFailure(result: DatabaseAdminResult, collectionName: string, error: unknown) {
  console.error(`Database admin: ${collectionName} failed:`, error);
  result.success = false;
  result.failures.push({
    collection: collectionName,
    message: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Writes the full mock data set to Firestore. Documents with the same id are overwritten;
 * other documents are left as they are. If clearPlannerFirst is set to true, planner test data is cleared first.
 */
export async function populateWithMockData(options?: { clearPlannerFirst?: boolean }): Promise<DatabaseAdminResult> {
  return populateCustomMockData(undefined, options);
}

/** Fills the database with the full demo set: persons, groups, gatherings, tasks and tjenesteroller. */
export async function restoreFullMockDatabase(): Promise<DatabaseAdminResult> {
  return populateCustomMockData(
    {
      personCount: 32,
      groupCount: 14,
      gatheringCount: 19,
      taskCount: 24,
      roleCount: 14,
    },
    { clearPlannerFirst: false }
  );
}

/**
 * Permanently deletes every document in every collection the app uses.
 * There is no undo.
 */
export async function deleteAllData(): Promise<DatabaseAdminResult> {
  const result = emptyResult();

  for (const collectionName of ALL_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      for (const piece of chunk(snap.docs, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const docSnap of piece) {
          batch.delete(docSnap.ref);
        }
        await batch.commit();
      }
      result.counts[collectionName] = snap.size;
      result.total += snap.size;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }
  result.success = result.failures.length === 0;
  return result;
}
