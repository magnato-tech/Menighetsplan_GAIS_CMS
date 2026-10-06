// An in-memory stand-in for Firestore: enough of the API for reading a collection and writing
// in batches, so a test sees exactly what a service reads and stores. Used like this:
//
//   vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);
//   import { store, failing } from "./helpers/memoryFirestore";

export const store = new Map<string, Map<string, Record<string, unknown>>>();
/** Collections that cannot be read, with the error code Firestore gives. */
export const failing = new Map<string, string>();

const table = (name: string) => {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name)!;
};

export const firestoreMock = {
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, name: string, id: string) => ({ name, id }),
  getDocs: async ({ name }: { name: string }) => {
    if (failing.has(name)) throw Object.assign(new Error(`Lesing feilet: ${failing.get(name)}`), { code: failing.get(name) });
    const docs = [...table(name).entries()].map(([id, data]) => ({ id, ref: { name, id }, data: () => data }));
    return { docs, size: docs.length, empty: docs.length === 0 };
  },
  writeBatch: () => {
    const operations: (() => void)[] = [];
    return {
      set: (ref: { name: string; id: string }, data: Record<string, unknown>) => operations.push(() => table(ref.name).set(ref.id, data)),
      delete: (ref: { name: string; id: string }) => operations.push(() => table(ref.name).delete(ref.id)),
      commit: async () => operations.forEach((operation) => operation()),
    };
  },
  // Only reached through modules a service imports for their constants
  onSnapshot: () => () => {},
};

export const ids = (name: string) => [...(store.get(name)?.keys() ?? [])].sort();
export const count = (name: string) => store.get(name)?.size ?? 0;
/** The named collections as stored, for comparing before and after. */
export const snapshotOf = (names: string[]) =>
  JSON.stringify(names.map((name) => [name, [...(store.get(name)?.entries() ?? [])].sort(([a], [b]) => a.localeCompare(b))]));
/** Everything stored, for showing that nothing at all was touched. */
export const snapshotOfAll = () => snapshotOf([...store.keys()].filter((name) => count(name) > 0).sort());
