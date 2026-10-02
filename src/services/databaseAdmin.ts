import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreData";
import { ALL_COLLECTIONS } from "../data/collections";
import { getMockDocuments, type MockDocument } from "../data/mockDocuments";
import { chunk } from "../utils/chunk";

// Firestore accepts at most 500 writes per batch
const BATCH_SIZE = 400;

export interface DatabaseAdminResult {
  /** Documents written or deleted, per collection. */
  counts: Record<string, number>;
  total: number;
  /** Collections that could not be processed. The others are still completed. */
  failures: { collection: string; message: string }[];
}

function emptyResult(): DatabaseAdminResult {
  return { counts: {}, total: 0, failures: [] };
}

function recordFailure(result: DatabaseAdminResult, collectionName: string, error: unknown) {
  console.error(`Database admin: ${collectionName} failed:`, error);
  result.failures.push({
    collection: collectionName,
    message: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Writes the mock data set to Firestore. Documents with the same id are overwritten;
 * other documents are left as they are.
 */
export async function populateWithMockData(): Promise<DatabaseAdminResult> {
  const result = emptyResult();
  const byCollection = new Map<string, MockDocument[]>();
  for (const document of getMockDocuments()) {
    byCollection.set(document.collection, [...(byCollection.get(document.collection) || []), document]);
  }

  for (const [collectionName, documents] of byCollection) {
    try {
      for (const piece of chunk(documents, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const document of piece) {
          batch.set(doc(db, collectionName, document.id), sanitizeForFirestore(document.data));
        }
        await batch.commit();
      }
      result.counts[collectionName] = documents.length;
      result.total += documents.length;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }
  return result;
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
  return result;
}
