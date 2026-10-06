import { beforeEach, describe, expect, test, vi } from "vitest";

// An in-memory stand-in for Firestore: enough of the API for reading a collection and
// writing in batches, so the test sees exactly what the service reads and stores.
const { store, failing } = vi.hoisted(() => ({
  store: new Map<string, Map<string, Record<string, unknown>>>(),
  /** Collections that cannot be read, with the error code Firestore gives. */
  failing: new Map<string, string>(),
}));

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
    // Only reached through modules this service imports for their constants
    onSnapshot: () => () => {},
  };
});

import { clearDatabase, databaseHasContent, exportDataset, importDataset } from "../src/services/datasetService";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID, COLLECTIONS } from "../src/data/collections";
import { getMockDocuments } from "../src/data/mockDocuments";
import { parseDataset, serializeDataset, type Dataset } from "../src/utils/dataset";

const ids = (name: string) => [...(store.get(name)?.keys() ?? [])].sort();
// Everything stored, in a fixed order: the order of the fields in a document carries no meaning
const snapshot = () =>
  JSON.stringify(
    [...store.entries()]
      .filter(([, table]) => table.size > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, table]) => [
        name,
        [...table.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([id, data]) => [id, Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)))]),
      ])
  );
const now = new Date("2026-10-06T12:00:00.000Z");

beforeEach(() => {
  store.clear();
  failing.clear();
  store.set(CMS_COLLECTIONS.PAGES, new Map([["page-om-oss", { id: "page-om-oss", slug: "om-oss", title: "Om oss" }]]));
  store.set(COLLECTIONS.GROUPS, new Map([["group-lyd", { id: "group-lyd", name: "Lyd", memberIds: [], leaderIds: [] }]]));
  // Volunteer roles and headcounts are kept in cms_settings, marked, next to the settings document
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    [CMS_SETTINGS_DOC_ID, { churchName: "Lillesand Misjonskirke", tagline: "Rotfestet, raus og relevant" }],
    ["role-lyd", { id: "role-lyd", recordType: "volunteerRole", name: "Lyd", sortOrder: 0 }],
    ["headcount-g1", { id: "headcount-g1", recordType: "gatheringHeadcount", gatheringId: "g1", adults: 80, children: 20 }],
  ]));
});

describe("Datasett: last ned og hent inn", () => {
  test("nedlastingen tar med alt, og kaller tjenesteroller og oppmøtetall det de er", async () => {
    const { dataset, unreadable } = await exportDataset("Lillesand Misjonskirke", "Prøve", now);

    expect(unreadable).toEqual([]);
    expect(dataset.name).toBe("Lillesand Misjonskirke");
    expect(dataset.createdAt).toBe("2026-10-06T12:00:00.000Z");
    expect(Object.keys(dataset.collections).sort()).toEqual(
      [CMS_COLLECTIONS.PAGES, CMS_COLLECTIONS.SETTINGS, COLLECTIONS.GATHERING_HEADCOUNTS, COLLECTIONS.GROUPS, COLLECTIONS.VOLUNTEER_ROLES].sort()
    );
    // The settings document carries its key, and nothing else is filed under settings
    expect(dataset.collections[CMS_COLLECTIONS.SETTINGS]).toEqual([
      { id: CMS_SETTINGS_DOC_ID, churchName: "Lillesand Misjonskirke", tagline: "Rotfestet, raus og relevant" },
    ]);
    // The mark that says where they are stored today is not part of the file
    expect(dataset.collections[COLLECTIONS.VOLUNTEER_ROLES]).toEqual([{ id: "role-lyd", name: "Lyd", sortOrder: 0 }]);
    expect(dataset.collections[COLLECTIONS.GATHERING_HEADCOUNTS]).toEqual([
      { id: "headcount-g1", gatheringId: "g1", adults: 80, children: 20 },
    ]);
  });

  test("en samling reglene i databasen avviser, utelates og nevnes ved navn", async () => {
    // The rules in force on the live project are older than the app and turn away the image library
    failing.set(CMS_COLLECTIONS.MEDIA, "permission-denied");
    const { dataset, unreadable } = await exportDataset("Uten bilder", "", now);

    expect(unreadable).toEqual([CMS_COLLECTIONS.MEDIA]);
    expect(Object.keys(dataset.collections)).not.toContain(CMS_COLLECTIONS.MEDIA);
    expect(dataset.collections[COLLECTIONS.GROUPS]).toHaveLength(1);
  });

  test("tjenesteroller og oppmøtetall leses der de ligger, ikke fra samlingene reglene avviser", async () => {
    failing.set(COLLECTIONS.VOLUNTEER_ROLES, "permission-denied");
    failing.set(COLLECTIONS.GATHERING_HEADCOUNTS, "permission-denied");
    const { dataset, unreadable } = await exportDataset("Som i drift", "", now);

    expect(unreadable).toEqual([]);
    expect(dataset.collections[COLLECTIONS.VOLUNTEER_ROLES]).toHaveLength(1);
    expect(dataset.collections[COLLECTIONS.GATHERING_HEADCOUNTS]).toHaveLength(1);
  });

  test("en annen lesefeil stopper nedlastingen i stedet for å gi en halv fil", async () => {
    failing.set(COLLECTIONS.PERSONS, "unavailable");
    await expect(exportDataset("Halv", "", now)).rejects.toThrow("unavailable");
  });

  test("det som lastes ned, gir samme database når det hentes inn i en tom", async () => {
    const before = snapshot();
    const text = serializeDataset((await exportDataset("Kopi", "", now)).dataset);

    store.clear();
    const parsed = parseDataset(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await importDataset(parsed.dataset);

    expect(result.success).toBe(true);
    expect(result.total).toBe(5);
    expect(snapshot()).toBe(before);
    // Back where the app reads them, with the mark, and without a collection of their own
    expect(store.get(CMS_COLLECTIONS.SETTINGS)?.get("role-lyd")).toMatchObject({ recordType: "volunteerRole", name: "Lyd" });
    expect(store.get(CMS_COLLECTIONS.SETTINGS)?.get("headcount-g1")).toMatchObject({ recordType: "gatheringHeadcount", adults: 80 });
    expect(ids(COLLECTIONS.VOLUNTEER_ROLES)).toEqual([]);
    expect(ids(COLLECTIONS.GATHERING_HEADCOUNTS)).toEqual([]);
    expect(store.get(CMS_COLLECTIONS.SETTINGS)?.get(CMS_SETTINGS_DOC_ID)).toEqual({
      churchName: "Lillesand Misjonskirke",
      tagline: "Rotfestet, raus og relevant",
    });
  });

  test("innhenting erstatter det som finnes fra før, og lar resten stå", async () => {
    const dataset: Dataset = {
      format: "menighetsplan-datasett",
      version: 1,
      name: "Eget innhold",
      createdAt: now.toISOString(),
      collections: {
        [CMS_COLLECTIONS.PAGES]: [
          { id: "page-om-oss", slug: "om-oss", title: "Hvem er vi?" },
          { id: "page-visjon", slug: "visjon", title: "Visjon", heroImage: undefined },
        ],
        [CMS_COLLECTIONS.SETTINGS]: [{ id: CMS_SETTINGS_DOC_ID, churchName: "Eget navn" }],
      },
    };
    const result = await importDataset(dataset);

    expect(result.failures).toEqual([]);
    expect(result.counts).toEqual({ [CMS_COLLECTIONS.PAGES]: 2, [CMS_COLLECTIONS.SETTINGS]: 1 });
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["page-om-oss", "page-visjon"]);
    expect(store.get(CMS_COLLECTIONS.PAGES)?.get("page-om-oss")).toEqual({ id: "page-om-oss", slug: "om-oss", title: "Hvem er vi?" });
    // A page keeps its id as a field, which is how the website reads it; an undefined field is never sent
    expect(store.get(CMS_COLLECTIONS.PAGES)?.get("page-visjon")).toEqual({ id: "page-visjon", slug: "visjon", title: "Visjon" });
    expect(store.get(CMS_COLLECTIONS.SETTINGS)?.get(CMS_SETTINGS_DOC_ID)).toEqual({ churchName: "Eget navn" });
    // Untouched: the group, the volunteer role and the headcount that were there
    expect(ids(COLLECTIONS.GROUPS)).toEqual(["group-lyd"]);
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual([CMS_SETTINGS_DOC_ID, "headcount-g1", "role-lyd"].sort());
  });

  test("databasen sier selv om den har innhold", async () => {
    expect(await databaseHasContent()).toBe(true);
    await clearDatabase();
    expect(await databaseHasContent()).toBe(false);

    // One document anywhere is content
    store.set(COLLECTIONS.GROUP_MESSAGES, new Map([["m1", { id: "m1" }]]));
    expect(await databaseHasContent()).toBe(true);
  });

  test("samlingene reglene avviser, teller ikke som innhold, og en annen lesefeil gis videre", async () => {
    await clearDatabase();
    failing.set(CMS_COLLECTIONS.MEDIA, "permission-denied");
    expect(await databaseHasContent()).toBe(false);

    failing.set(COLLECTIONS.PERSONS, "unavailable");
    await expect(databaseHasContent()).rejects.toThrow("unavailable");
  });

  test("tømming sletter alt appen når, også tjenesteroller og oppmøtetall", async () => {
    const cleared = await clearDatabase();

    expect(cleared).toEqual({ deleted: 5, failures: [] });
    expect([...store.values()].every((table) => table.size === 0)).toBe(true);
  });

  test("tømming går forbi samlingene reglene avviser, som i drift", async () => {
    for (const name of [CMS_COLLECTIONS.MEDIA, COLLECTIONS.VOLUNTEER_ROLES, COLLECTIONS.GATHERING_HEADCOUNTS]) {
      failing.set(name, "permission-denied");
    }
    const cleared = await clearDatabase();

    expect(cleared).toEqual({ deleted: 5, failures: [] });
  });

  test("en annen feil under tømming meldes, og resten slettes likevel", async () => {
    failing.set(COLLECTIONS.GROUPS, "unavailable");
    const cleared = await clearDatabase();

    expect(cleared.failures).toEqual([{ collection: COLLECTIONS.GROUPS, message: "Lesing feilet: unavailable" }]);
    expect(cleared.deleted).toBe(4);
    expect(ids(COLLECTIONS.GROUPS)).toEqual(["group-lyd"]);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual([]);
  });

  test("kopi, tømming og innhenting etter hverandre gir nøyaktig datasettets innhold", async () => {
    const backup = (await exportDataset("Sikkerhetskopi", "", now)).dataset;
    const before = snapshot();
    await clearDatabase();
    const result = await importDataset({
      format: "menighetsplan-datasett",
      version: 1,
      name: "Eget innhold",
      createdAt: now.toISOString(),
      collections: { [CMS_COLLECTIONS.PAGES]: [{ id: "page-visjon", slug: "visjon", title: "Visjon" }] },
    });

    expect(result.total).toBe(1);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["page-visjon"]);
    expect(ids(COLLECTIONS.GROUPS)).toEqual([]);
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual([]);

    // The copy taken first brings back what was there
    await clearDatabase();
    await importDataset(backup);
    expect(snapshot()).toBe(before);
  });

  test("hele demoinnholdet kan lastes ned og hentes inn igjen uten tap", async () => {
    store.clear();
    for (const document of getMockDocuments()) {
      const data = { ...(document.data as Record<string, unknown>) };
      // Stored the way the app stores them (see testdataService.ts)
      if (document.collection === COLLECTIONS.VOLUNTEER_ROLES) {
        if (!store.has(CMS_COLLECTIONS.SETTINGS)) store.set(CMS_COLLECTIONS.SETTINGS, new Map());
        store.get(CMS_COLLECTIONS.SETTINGS)!.set(document.id, { ...data, recordType: "volunteerRole" });
      } else if (document.collection === COLLECTIONS.GATHERING_HEADCOUNTS) {
        if (!store.has(CMS_COLLECTIONS.SETTINGS)) store.set(CMS_COLLECTIONS.SETTINGS, new Map());
        store.get(CMS_COLLECTIONS.SETTINGS)!.set(document.id, { ...data, recordType: "gatheringHeadcount" });
      } else {
        if (!store.has(document.collection)) store.set(document.collection, new Map());
        store.get(document.collection)!.set(document.id, data);
      }
    }
    const before = snapshot();
    const total = getMockDocuments().length;

    const parsed = parseDataset(serializeDataset((await exportDataset("Demo", "", now)).dataset));
    expect(parsed.ok && parsed.total).toBe(total);
    store.clear();
    if (!parsed.ok) return;
    const result = await importDataset(parsed.dataset);

    expect(result.total).toBe(total);
    expect(snapshot()).toBe(before);
  });
});
