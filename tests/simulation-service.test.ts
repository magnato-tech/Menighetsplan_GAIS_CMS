import { beforeEach, describe, expect, test, vi } from "vitest";

// An in-memory stand-in for Firestore: enough of the API for reading a collection and
// writing in batches, so the test sees exactly what the service stores and deletes.
const { store } = vi.hoisted(() => ({ store: new Map<string, Map<string, Record<string, unknown>>>() }));

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => {
  const table = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name)!;
  };
  return {
    collection: (_db: unknown, name: string) => ({ name }),
    doc: (_db: unknown, name: string, id: string) => ({ name, id }),
    getDocs: async ({ name }: { name: string }) => {
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
  };
});

import { clearSimulatedChurchLife, simulateChurchLife } from "../src/services/simulationService";
import { CMS_COLLECTIONS, COLLECTIONS } from "../src/data/collections";
import type { Gathering, Group, Person, VolunteerRole } from "../src/types";

const ids = (name: string) => [...(store.get(name)?.keys() ?? [])].sort();

const persons: Person[] = [
  { id: "p1", name: "Anne Admin", globalRole: "admin" },
  { id: "p2", name: "Bjørn Bærer", globalRole: "member" },
  { id: "p3", name: "Cecilie Kaffe", globalRole: "member" },
];
const groups: Group[] = [
  { id: "g-team", name: "Søndagsteam", category: "tjenestegruppe", memberIds: ["p2", "p3"], leaderIds: ["p1"] },
  { id: "g-hus", name: "Husfellesskap Vest", category: "husgruppe", memberIds: ["p2", "p3"], leaderIds: ["p1"] },
];
const volunteerRoles: VolunteerRole[] = [{ id: "role-kaffe", name: "Kirkekaffe", groupId: "g-team", sortOrder: 0 }];
const handMade: Gathering = {
  id: "gathering-1",
  groupId: "g-team",
  title: "Gudstjeneste",
  startsAt: "2026-09-27T09:00:00.000Z",
  visibility: "offentlig",
  isGudstjeneste: true,
};
const input = { now: new Date("2026-10-05T12:00:00.000Z").getTime(), weeks: 12, persons, groups, volunteerRoles, gatherings: [handMade] };

beforeEach(() => {
  store.clear();
  store.set(COLLECTIONS.GATHERINGS, new Map([
    ["gathering-1", { ...handMade }],
    ["sim-gathering-2026-01-04", { id: "sim-gathering-2026-01-04", title: "Gammel simulering" }],
  ]));
  // Headcounts live in cms_settings next to the settings and the volunteer roles (see services/headcounts.ts)
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    ["global", { churchName: "Lillesand Misjonskirke" }],
    ["role-sim-like", { recordType: "volunteerRole", name: "Lyd", gatheringId: "sim-ikke-en-telling" }],
    ["headcount-gathering-1", { recordType: "gatheringHeadcount", gatheringId: "gathering-1", adults: 80, children: 20 }],
    ["headcount-sim-gathering-2026-01-04", { recordType: "gatheringHeadcount", gatheringId: "sim-gathering-2026-01-04", adults: 1, children: 0 }],
  ]));
  store.set(COLLECTIONS.PERSONS, new Map(persons.map((p) => [p.id, { ...p }])));
});

describe("Simulering av menighetsliv i databasen", () => {
  test("en ny simulering erstatter den gamle og rører ikke det som er laget for hånd", async () => {
    const result = await simulateChurchLife(input);
    expect(result.success).toBe(true);
    expect(result.total).toBeGreaterThan(0);

    expect(ids(COLLECTIONS.GATHERINGS)).toContain("gathering-1");
    expect(ids(COLLECTIONS.GATHERINGS)).not.toContain("sim-gathering-2026-01-04");
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toContain("headcount-gathering-1");
    expect(ids(CMS_COLLECTIONS.SETTINGS)).not.toContain("headcount-sim-gathering-2026-01-04");
    expect(ids(CMS_COLLECTIONS.SETTINGS).some((id) => id.startsWith("headcount-sim-gathering-"))).toBe(true);
    expect(store.get(CMS_COLLECTIONS.SETTINGS)?.get(ids(CMS_COLLECTIONS.SETTINGS).find((id) => id.startsWith("headcount-sim-"))!))
      .toMatchObject({ recordType: "gatheringHeadcount" });
    expect(ids(COLLECTIONS.GATHERING_HEADCOUNTS)).toEqual([]);
    expect(ids(COLLECTIONS.PERSONS)).toEqual(["p1", "p2", "p3"]);
    // The hand-made service on 27 September is not doubled
    expect(ids(COLLECTIONS.GATHERINGS)).not.toContain("sim-gathering-2026-09-27");

    // Run again the way the panel does: with every stored gathering, the simulated ones included
    const sizes = () => [COLLECTIONS.GATHERINGS, COLLECTIONS.TASKS, COLLECTIONS.ASSIGNMENTS, CMS_COLLECTIONS.SETTINGS].map((name) => ids(name).length);
    const after = sizes();
    const stored = [...(store.get(COLLECTIONS.GATHERINGS)?.values() ?? [])] as unknown as Gathering[];
    await simulateChurchLife({ ...input, gatherings: stored });
    expect(sizes()).toEqual(after);
  });

  test("fjerning tar bare det simulerte", async () => {
    await simulateChurchLife(input);
    const result = await clearSimulatedChurchLife();
    expect(result.success).toBe(true);
    expect(ids(COLLECTIONS.GATHERINGS)).toEqual(["gathering-1"]);
    // Only simulated counts go; the settings, the roles and a count made by hand stay
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual(["global", "headcount-gathering-1", "role-sim-like"]);
    expect(ids(COLLECTIONS.TASKS)).toEqual([]);
    expect(ids(COLLECTIONS.ASSIGNMENTS)).toEqual([]);
    expect(ids(COLLECTIONS.GATHERING_ATTENDANCES)).toEqual([]);
    expect(ids(COLLECTIONS.GROUP_MESSAGES)).toEqual([]);
  });
});
