// An in-memory stand-in for Firestore: enough of the API for reading a collection, asking for
// part of it, writing in batches, and adding to sums, so a test sees exactly what a service
// reads and stores. Used like this:
//
//   vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);
//   import { store, failing } from "./helpers/memoryFirestore";

type Row = Record<string, unknown>;

export const store = new Map<string, Map<string, Row>>();
/** Collections that cannot be read, with the error code Firestore gives. */
export const failing = new Map<string, string>();

const table = (name: string) => {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name)!;
};

// ---------- Adding to a sum, and writing into what is there ----------

const INCREMENT = "__increment";
const isIncrement = (value: unknown): value is { [INCREMENT]: number } =>
  !!value && typeof value === "object" && INCREMENT in (value as object);
const isMap = (value: unknown): value is Row => !!value && typeof value === "object" && !Array.isArray(value) && !isIncrement(value);

/** What is stored when `incoming` is written. With `existing`, as Firestore merges: maps field by field, sums added to. */
function written(incoming: Row, existing?: Row): Row {
  const result: Row = existing ? { ...existing } : {};
  for (const [key, value] of Object.entries(incoming)) {
    const before = existing?.[key];
    if (isIncrement(value)) result[key] = (typeof before === "number" ? before : 0) + value[INCREMENT];
    else if (isMap(value)) result[key] = written(value, existing && isMap(before) ? before : undefined);
    else result[key] = value;
  }
  return result;
}

// Whoever follows a single document is told each time it is written or deleted
const followers = new Set<{ name: string; id: string; tell: () => void }>();
const tellFollowers = (ref: { name: string; id: string }) =>
  followers.forEach((follower) => follower.name === ref.name && follower.id === ref.id && follower.tell());

const write = (ref: { name: string; id: string }, data: Row, options?: { merge?: boolean }) => {
  table(ref.name).set(ref.id, written(data, options?.merge ? table(ref.name).get(ref.id) : undefined));
  tellFollowers(ref);
};
const remove = (ref: { name: string; id: string }) => {
  table(ref.name).delete(ref.id);
  tellFollowers(ref);
};

function readOne(name: string, id: string) {
  if (failing.has(name)) throw Object.assign(new Error(`Lesing feilet: ${failing.get(name)}`), { code: failing.get(name) });
  const data = table(name).get(id);
  return { id, exists: () => data !== undefined, data: () => data, metadata: { fromCache: false } };
}

// ---------- Asking for part of a collection ----------

interface Condition {
  field: string | { documentId: true };
  op: "==" | ">=" | "<=" | ">" | "<";
  value: unknown;
}
interface Source {
  name: string;
  id?: string;
  conditions?: Condition[];
}

function matches(id: string, data: Row, conditions: Condition[] = []): boolean {
  return conditions.every(({ field, op, value }) => {
    const actual = typeof field === "string" ? data[field] : id;
    if (op === "==") return actual === value;
    if (actual === undefined || actual === null) return false;
    const [a, b] = [actual as string | number, value as string | number];
    return op === ">=" ? a >= b : op === "<=" ? a <= b : op === ">" ? a > b : a < b;
  });
}

function read({ name, conditions }: Source) {
  if (failing.has(name)) throw Object.assign(new Error(`Lesing feilet: ${failing.get(name)}`), { code: failing.get(name) });
  const docs = [...table(name).entries()]
    .filter(([id, data]) => matches(id, data, conditions))
    .map(([id, data]) => ({ id, ref: { name, id }, data: () => data }));
  return { docs, size: docs.length, empty: docs.length === 0, metadata: { fromCache: false } };
}

export const firestoreMock = {
  collection: (_db: unknown, name: string): Source => ({ name }),
  doc: (_db: unknown, name: string, id: string) => ({ name, id }),
  documentId: () => ({ documentId: true as const }),
  where: (field: Condition["field"], op: Condition["op"], value: unknown): Condition => ({ field, op, value }),
  query: (source: Source, ...conditions: Condition[]): Source => ({ ...source, conditions: [...(source.conditions ?? []), ...conditions] }),
  increment: (amount: number) => ({ [INCREMENT]: amount }),
  getDocs: async (source: Source) => read(source),
  setDoc: async (ref: { name: string; id: string }, data: Row, options?: { merge?: boolean }) => {
    write(ref, data, options);
  },
  writeBatch: () => {
    const operations: (() => void)[] = [];
    return {
      set: (ref: { name: string; id: string }, data: Row, options?: { merge?: boolean }) => operations.push(() => write(ref, data, options)),
      delete: (ref: { name: string; id: string }) => operations.push(() => remove(ref)),
      commit: async () => operations.forEach((operation) => operation()),
    };
  },
  /**
   * Tells what is there now, and what goes wrong instead when the collection cannot be read.
   * A collection is told once. A single document is followed: each write to it is told too.
   */
  onSnapshot: (source: Source, onNext: (snapshot: never) => void, onError?: (error: Error) => void) => {
    let following = true;
    const tell = () =>
      queueMicrotask(() => {
        if (!following) return;
        try {
          onNext((source.id === undefined ? read(source) : readOne(source.name, source.id)) as never);
        } catch (error) {
          onError?.(error as Error);
        }
      });
    const follower = source.id === undefined ? null : { name: source.name, id: source.id, tell };
    if (follower) followers.add(follower);
    tell();
    return () => {
      following = false;
      if (follower) followers.delete(follower);
    };
  },
};

export const ids = (name: string) => [...(store.get(name)?.keys() ?? [])].sort();
export const count = (name: string) => store.get(name)?.size ?? 0;
/** The named collections as stored, for comparing before and after. */
export const snapshotOf = (names: string[]) =>
  JSON.stringify(names.map((name) => [name, [...(store.get(name)?.entries() ?? [])].sort(([a], [b]) => a.localeCompare(b))]));
/** Everything stored, for showing that nothing at all was touched. */
export const snapshotOfAll = () => snapshotOf([...store.keys()].filter((name) => count(name) > 0).sort());
