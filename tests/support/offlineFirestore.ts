import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  disableNetwork,
  doc,
  getDocFromCache,
  getDocsFromCache,
  getFirestore,
  setDoc,
  type DocumentData,
} from "firebase/firestore";

// The real Firestore client, cut off from the network. A local write reaches the
// snapshot listeners exactly as it does in the app, and nothing ever leaves the machine.
const app = initializeApp({ projectId: "demo-menighetsplan" }, "offline-tests");
export const db = getFirestore(app);

/** Resolves once the client is offline. Await it before the first read or write. */
export const offline = disableNetwork(db);

/** What `src/firebase.ts` exports, backed by the offline client. Use as the factory result of `vi.mock`. */
export const firebaseModuleMock = {
  db,
  OperationType: { CREATE: "create", UPDATE: "update", DELETE: "delete", LIST: "list", GET: "get", WRITE: "write" },
  handleFirestoreError: (error: unknown): never => {
    throw error;
  },
  testConnection: async () => false,
};

/** Puts documents in the local database. Offline, a write is never acknowledged, so it is not awaited. */
export function seed(collectionName: string, documents: { id: string }[]): void {
  for (const document of documents) {
    void setDoc(doc(db, collectionName, document.id), document);
  }
}

/** The document as the local database holds it, or undefined when it is not there. */
export async function stored(collectionName: string, id: string): Promise<DocumentData | undefined> {
  try {
    const snapshot = await getDocFromCache(doc(db, collectionName, id));
    return snapshot.exists() ? snapshot.data() : undefined;
  } catch {
    // The client throws when it has never heard of the document
    return undefined;
  }
}

export async function storedIds(collectionName: string): Promise<string[]> {
  const snapshot = await getDocsFromCache(collection(db, collectionName));
  return snapshot.docs.map((d) => d.id).sort();
}

/** Empties the given collections, so one test does not see what another one wrote. */
export async function clearCollections(collectionNames: string[]): Promise<void> {
  for (const name of collectionNames) {
    const snapshot = await getDocsFromCache(collection(db, name));
    for (const document of snapshot.docs) void deleteDoc(document.ref);
  }
}
