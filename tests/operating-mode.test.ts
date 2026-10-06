import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);

import { failing, ids, snapshotOfAll, store } from "./helpers/memoryFirestore";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID, COLLECTIONS } from "../src/data/collections";
import { deleteAllData } from "../src/services/databaseAdmin";
import { clearDatabase, databaseHasContent, exportDataset } from "../src/services/datasetService";
import {
  OPERATING_MODE_DOC_ID,
  PRODUCTION_LOCK_MESSAGE,
  ensureDeletionAllowed,
  readOperatingMode,
  setOperatingMode,
} from "../src/services/operatingMode";
import { clearTestdata, deletePersonsTestdata } from "../src/services/testdataService";

beforeEach(() => {
  store.clear();
  failing.clear();
  store.set(CMS_COLLECTIONS.PAGES, new Map([["page-om-oss", { id: "page-om-oss", title: "Om oss" }]]));
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    [CMS_SETTINGS_DOC_ID, { churchName: "Lillesand Misjonskirke" }],
    ["role-lyd", { id: "role-lyd", recordType: "volunteerRole", name: "Lyd" }],
  ]));
  store.set(COLLECTIONS.PERSONS, new Map([["p1", { id: "p1", name: "Kari" }]]));
});

describe("Driftsmodus: demo eller produksjon", () => {
  test("en database uten merket står i demo, og en ukjent verdi er også demo", async () => {
    expect(await readOperatingMode()).toBe("demo");
    store.get(CMS_COLLECTIONS.SETTINGS)!.set(OPERATING_MODE_DOC_ID, { recordType: "operatingMode", mode: "noe annet" });
    expect(await readOperatingMode()).toBe("demo");
    await expect(ensureDeletionAllowed()).resolves.toBeUndefined();
  });

  test("modusen lagres i databasen og leses derfra", async () => {
    await setOperatingMode("production");
    expect(store.get(CMS_COLLECTIONS.SETTINGS)!.get(OPERATING_MODE_DOC_ID)).toEqual({ recordType: "operatingMode", mode: "production" });
    expect(await readOperatingMode()).toBe("production");

    await setOperatingMode("demo");
    expect(await readOperatingMode()).toBe("demo");
  });

  test("i produksjon nekter alt som tømmer databasen, og ingenting slettes", async () => {
    await setOperatingMode("production");
    const before = snapshotOfAll();

    await expect(clearDatabase()).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    await expect(clearDatabase(["website"])).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    await expect(clearTestdata()).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    await expect(deletePersonsTestdata()).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    await expect(deleteAllData()).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    expect(snapshotOfAll()).toBe(before);
  });

  test("satt tilbake i demo kan databasen tømmes igjen", async () => {
    await setOperatingMode("production");
    await setOperatingMode("demo");
    const cleared = await clearDatabase();

    expect(cleared.failures).toEqual([]);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual([]);
    expect(ids(COLLECTIONS.PERSONS)).toEqual([]);
  });

  test("modusen er ikke innhold: den lastes ikke ned, telles ikke og tømmes ikke", async () => {
    await setOperatingMode("demo");
    const { dataset } = await exportDataset("Alt");
    expect(JSON.stringify(dataset)).not.toContain("operatingMode");
    expect(dataset.collections[CMS_COLLECTIONS.SETTINGS].map((d) => d.id)).toEqual([CMS_SETTINGS_DOC_ID]);

    await clearDatabase();
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual([OPERATING_MODE_DOC_ID]);
    expect(await databaseHasContent()).toBe(false);
  });

  test("kan ikke modusen leses, slettes ingenting", async () => {
    failing.set(CMS_COLLECTIONS.SETTINGS, "unavailable");
    await expect(clearTestdata()).rejects.toThrow("unavailable");
    await expect(deleteAllData()).rejects.toThrow("unavailable");
    failing.clear();

    expect(ids(COLLECTIONS.PERSONS)).toEqual(["p1"]);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["page-om-oss"]);
  });
});
