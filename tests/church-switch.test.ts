// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);

import { count, failing, ids, snapshotOf, snapshotOfAll, store } from "./helpers/memoryFirestore";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID, COLLECTIONS } from "../src/data/collections";
import { initialCmsPages } from "../src/data/cmsData";
import { switchWebsite } from "../src/services/churchSwitch";
import { PRODUCTION_LOCK_MESSAGE, setOperatingMode } from "../src/services/operatingMode";
import { loadPreviousSetup, readPreviousSetupInfo } from "../src/services/previousSetup";
import { buildDataset } from "../src/utils/dataset";

const open = { type: "arrangement", visibility: "offentlig", isPublic: true };
const now = new Date("2026-10-06T18:40:00.000Z");
const WEBSITE = [CMS_COLLECTIONS.PAGES, CMS_COLLECTIONS.SETTINGS, COLLECTIONS.GATHERINGS, COLLECTIONS.GROUPS];
const PLANNER = [COLLECTIONS.PERSONS];

// Another congregation's website, as a demo set holds it. The person in it is not the website's.
const sogne = buildDataset(
  "Sogne_sett",
  "",
  {
    [CMS_COLLECTIONS.SETTINGS]: [{ id: CMS_SETTINGS_DOC_ID, churchName: "Søgne Misjonskirke" }],
    [CMS_COLLECTIONS.PAGES]: [{ id: "sogne-forside", slug: "", title: "Søgne Misjonskirke" }, { id: "sogne-om", slug: "om-oss", title: "Om oss" }],
    [COLLECTIONS.GROUPS]: [{ id: "sogne-kalender", name: "Felleskalender", memberIds: [], leaderIds: [] }],
    [COLLECTIONS.GATHERINGS]: [{ id: "sogne-arr-1", title: "Gudstjeneste", groupId: "sogne-kalender", ...open }],
    [COLLECTIONS.PERSONS]: [{ id: "sogne-person", name: "Skal ikke inn" }],
  },
  now
);

beforeEach(() => {
  store.clear();
  failing.clear();
  localStorage.clear();
  // Lillesand's website, with test persons in the planner
  store.set(CMS_COLLECTIONS.PAGES, new Map([["lmk-forside", { id: "lmk-forside", slug: "", title: "Lillesand Misjonskirke" }]]));
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    [CMS_SETTINGS_DOC_ID, { churchName: "Lillesand Misjonskirke" }],
    ["role-lyd", { id: "role-lyd", recordType: "volunteerRole", name: "Lyd" }],
  ]));
  store.set(COLLECTIONS.GROUPS, new Map<string, Record<string, unknown>>([
    ["lmk-kalender", { id: "lmk-kalender", name: "Felleskalender", memberIds: [], leaderIds: [] }],
    ["group-lyd", { id: "group-lyd", name: "Lyd", memberIds: ["p1"], leaderIds: ["p1"] }],
  ]));
  store.set(COLLECTIONS.GATHERINGS, new Map([["lmk-arr-1", { id: "lmk-arr-1", title: "Høstfest", groupId: "lmk-kalender", ...open }]]));
  store.set(COLLECTIONS.PERSONS, new Map([["p1", { id: "p1", name: "Kari" }]]));
});

afterEach(() => vi.restoreAllMocks());

describe("Velg menighet: nettsiden byttes, planleggeren står", () => {
  test("nettsiden som var, lagres først, slettes, og den nye hentes inn", async () => {
    const planner = snapshotOf(PLANNER);
    const steps: string[] = [];
    const result = await switchWebsite({ kind: "dataset", dataset: sogne }, (step) => steps.push(step), now);

    expect(result).toEqual({ keptPrevious: true, deleted: 4, imported: 5 });
    expect(steps).toEqual(["Lagrer nettsiden slik den er nå …", "Sletter nettsiden …", "Henter inn den nye nettsiden …"]);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["sogne-forside", "sogne-om"]);
    expect(store.get(CMS_COLLECTIONS.SETTINGS)!.get(CMS_SETTINGS_DOC_ID)).toEqual({ churchName: "Søgne Misjonskirke" });
    expect(ids(COLLECTIONS.GATHERINGS)).toEqual(["sogne-arr-1"]);
    // The planner is as it was: its person, its group and its role, and nobody from the set
    expect(snapshotOf(PLANNER)).toBe(planner);
    expect(ids(COLLECTIONS.GROUPS)).toEqual(["group-lyd", "sogne-kalender"]);
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual([CMS_SETTINGS_DOC_ID, "role-lyd"].sort());

    expect(readPreviousSetupInfo()).toEqual({ churchName: "Lillesand Misjonskirke", savedAt: now.toISOString(), documents: 4 });
  });

  test("«Forrige oppsett» gir nettsiden tilbake slik den var, og den som lå der, blir forrige", async () => {
    const before = snapshotOf(WEBSITE);
    await switchWebsite({ kind: "dataset", dataset: sogne }, undefined, now);
    const previous = loadPreviousSetup();
    expect(previous).not.toBeNull();

    await switchWebsite({ kind: "dataset", dataset: previous!.dataset }, undefined, now);

    // Besides the website, the settings collection and the groups hold the planner's role and group
    expect(snapshotOf(WEBSITE)).toBe(before);
    expect(readPreviousSetupInfo()?.churchName).toBe("Søgne Misjonskirke");
  });

  test("demo-menigheten som følger med appen, kan velges på samme måte", async () => {
    const result = await switchWebsite({ kind: "builtInDemo" }, undefined, now);

    expect(result.keptPrevious).toBe(true);
    expect(count(CMS_COLLECTIONS.PAGES)).toBe(initialCmsPages.length);
    expect(ids(CMS_COLLECTIONS.PAGES)).not.toContain("lmk-forside");
    expect(ids(COLLECTIONS.PERSONS)).toEqual(["p1"]);
    expect(readPreviousSetupInfo()?.churchName).toBe("Lillesand Misjonskirke");
  });

  test("en tom nettside har ikke noe å lagre, og den nye hentes inn", async () => {
    for (const name of [CMS_COLLECTIONS.PAGES, COLLECTIONS.GATHERINGS]) store.get(name)!.clear();
    store.get(CMS_COLLECTIONS.SETTINGS)!.delete(CMS_SETTINGS_DOC_ID);
    store.get(COLLECTIONS.GROUPS)!.delete("lmk-kalender");
    const result = await switchWebsite({ kind: "dataset", dataset: sogne }, undefined, now);

    expect(result).toEqual({ keptPrevious: false, deleted: 0, imported: 5 });
    expect(readPreviousSetupInfo()).toBeNull();
  });

  test("i produksjon byttes ingenting: ikke lagret, ikke slettet, ikke hentet inn", async () => {
    await setOperatingMode("production");
    const before = snapshotOfAll();

    await expect(switchWebsite({ kind: "dataset", dataset: sogne }, undefined, now)).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    expect(snapshotOfAll()).toBe(before);
    expect(readPreviousSetupInfo()).toBeNull();
  });

  test("kan ikke nettsiden som er, lagres i nettleseren, slettes den ikke", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Fullt", "QuotaExceededError");
    });
    const before = snapshotOfAll();

    await expect(switchWebsite({ kind: "dataset", dataset: sogne }, undefined, now)).rejects.toThrow(
      "kunne ikke lagres i nettleseren"
    );
    expect(snapshotOfAll()).toBe(before);
  });

  test("kan ikke databasen leses, lagres og slettes ingenting", async () => {
    failing.set(COLLECTIONS.PERSONS, "unavailable");
    await expect(switchWebsite({ kind: "dataset", dataset: sogne }, undefined, now)).rejects.toThrow("unavailable");
    failing.clear();

    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["lmk-forside"]);
    expect(readPreviousSetupInfo()).toBeNull();
  });
});

describe("Forrige oppsett i nettleseren", () => {
  test("det som ligger der og ikke er et oppsett, leses som ingenting", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadPreviousSetup()).toBeNull();
    localStorage.setItem("menighetsplan_forrige_nettside", "{ikke json");
    expect(loadPreviousSetup()).toBeNull();
    localStorage.setItem("menighetsplan_forrige_nettside", JSON.stringify({ churchName: "X", savedAt: "2026-10-06", dataset: { format: "noe annet" } }));
    expect(loadPreviousSetup()).toBeNull();
  });
});
