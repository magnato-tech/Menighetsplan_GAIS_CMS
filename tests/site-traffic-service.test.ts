import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);

import { failing, ids, snapshotOfAll, store } from "./helpers/memoryFirestore";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "../src/data/collections";
import { clearDatabase, databaseHasContent, exportDataset } from "../src/services/datasetService";
import { PRODUCTION_LOCK_MESSAGE, setOperatingMode } from "../src/services/operatingMode";
import {
  addExampleTraffic,
  clearSiteTraffic,
  recordTrafficAction,
  removeExampleTraffic,
  siteTrafficRecorder,
  subscribeSiteTraffic,
} from "../src/services/siteTraffic";
import { emptyTrafficDay, type TrafficDay } from "../src/utils/siteTraffic";

const settings = () => store.get(CMS_COLLECTIONS.SETTINGS)!;
const stored = (date: string) => settings().get(`traffic-${date}`);
// Wednesday 7 October 2026 at 12:00 and at 12:05 in Norway
const noon = new Date("2026-10-07T10:00:00.000Z");
const fivePast = new Date("2026-10-07T10:05:00.000Z");
// The writes are sent without being waited for, as on the website. This lets them land.
const landed = () => new Promise((resolve) => setTimeout(resolve, 0));
const day = (date: string, fill: Partial<TrafficDay> = {}): TrafficDay => ({ ...emptyTrafficDay(date), visits: 1, views: { "/": 1 }, ...fill });

beforeEach(() => {
  store.clear();
  failing.clear();
  // What else lies in the same collection: the settings, a volunteer role and a page of the website
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    [CMS_SETTINGS_DOC_ID, { churchName: "Lillesand Misjonskirke" }],
    ["role-lyd", { id: "role-lyd", recordType: "volunteerRole", name: "Lyd" }],
  ]));
  store.set(CMS_COLLECTIONS.PAGES, new Map([["page-om-oss", { id: "page-om-oss", title: "Om oss" }]]));
});

describe("Besøk telles som summer per dag", () => {
  test("en sidevisning legges til dagens summer: visningen, timen, og besøket når det starter her", async () => {
    siteTrafficRecorder.view("/", noon, { entry: true, second: false });
    siteTrafficRecorder.view("/om-oss", fivePast, { entry: false, second: true });
    siteTrafficRecorder.view("/kontakt", fivePast, { entry: false, second: false });
    await landed();

    expect(stored("2026-10-07")).toEqual({
      recordType: "siteTraffic",
      date: "2026-10-07",
      visits: 1,
      deepVisits: 1,
      views: { "/": 1, "/om-oss": 1, "/kontakt": 1 },
      entries: { "/": 1 },
      hours: { "12": 3 },
    });
  });

  test("to besøkende legger til hver sin del, og ingen skriver over den andre", async () => {
    for (let visitor = 0; visitor < 2; visitor++) {
      siteTrafficRecorder.view("/", noon, { entry: true, second: false });
      siteTrafficRecorder.seconds("/", noon, 12.4, true);
      siteTrafficRecorder.seconds("/", noon, 20, false);
    }
    await landed();

    expect(stored("2026-10-07")).toMatchObject({ visits: 2, views: { "/": 2 }, entries: { "/": 2 }, seconds: { "/": 64 }, timed: { "/": 2 } });
  });

  test("dagen er den norske, også når klokka har passert midnatt bare i Norge", async () => {
    siteTrafficRecorder.view("/", new Date("2026-10-07T22:30:00.000Z"), { entry: true, second: false });
    await landed();

    expect(stored("2026-10-07")).toBeUndefined();
    expect(stored("2026-10-08")).toMatchObject({ date: "2026-10-08", hours: { "0": 1 } });
  });

  test("adresser uten side, handlinger og avspilte taler telles hver for seg", async () => {
    siteTrafficRecorder.missing("/index.php", noon);
    siteTrafficRecorder.missing("/index.php", noon);
    recordTrafficAction("kontakt-telefon", noon);
    recordTrafficAction("tale-avspilt", noon, "tale-1");
    recordTrafficAction("tale-avspilt", noon);
    await landed();

    expect(stored("2026-10-07")).toEqual({
      recordType: "siteTraffic",
      date: "2026-10-07",
      missing: { "/index.php": 2 },
      actions: { "kontakt-telefon": 1, "tale-avspilt": 2 },
      sermons: { "tale-1": 1 },
    });
  });

  test("et navn databasen ikke tar imot, og en tid som ikke er en tid, telles ikke", async () => {
    siteTrafficRecorder.view("", noon, { entry: true, second: false });
    siteTrafficRecorder.view("__name__", noon, { entry: true, second: false });
    siteTrafficRecorder.seconds("/", noon, 0, true);
    siteTrafficRecorder.seconds("/", noon, Number.NaN, true);
    recordTrafficAction("tale-avspilt", noon, "__id__");
    await landed();

    // Only the play itself is counted; nothing was written under the names that cannot be used
    expect(stored("2026-10-07")).toEqual({ recordType: "siteTraffic", date: "2026-10-07", actions: { "tale-avspilt": 1 } });
  });

  test("bordet får dagene i perioden, og ikke noe annet som ligger i samme samling", async () => {
    siteTrafficRecorder.view("/", new Date("2026-09-30T10:00:00.000Z"), { entry: true, second: false });
    siteTrafficRecorder.view("/", noon, { entry: true, second: false });
    siteTrafficRecorder.view("/", new Date("2026-10-09T10:00:00.000Z"), { entry: true, second: false });
    await landed();

    const onChange = vi.fn();
    const stop = subscribeSiteTraffic("2026-10-01", "2026-10-07", onChange, vi.fn());
    await landed();
    stop();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([{ ...emptyTrafficDay("2026-10-07"), visits: 1, views: { "/": 1 }, entries: { "/": 1 }, hours: { "12": 1 } }]);
  });

  test("kan ikke tallene hentes, får bordet vite hvorfor", async () => {
    failing.set(CMS_COLLECTIONS.SETTINGS, "unavailable");
    const onError = vi.fn();
    subscribeSiteTraffic("2026-10-01", "2026-10-07", vi.fn(), onError);
    await landed();

    expect(onError.mock.calls[0][0].message).toContain("unavailable");
  });
});

describe("Besøkstallene nullstilles for seg", () => {
  beforeEach(async () => {
    siteTrafficRecorder.view("/", new Date("2026-10-06T10:00:00.000Z"), { entry: true, second: false });
    siteTrafficRecorder.view("/", noon, { entry: true, second: false });
    await landed();
  });

  test("nullstilling sletter alle dagene, og ingenting annet", async () => {
    expect(await clearSiteTraffic()).toBe(2);

    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual([CMS_SETTINGS_DOC_ID, "role-lyd"]);
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual(["page-om-oss"]);
  });

  test("i produksjon nullstilles ingenting", async () => {
    await setOperatingMode("production");
    const before = snapshotOfAll();

    await expect(clearSiteTraffic()).rejects.toThrow(PRODUCTION_LOCK_MESSAGE);
    expect(snapshotOfAll()).toBe(before);
  });

  test("besøkstallene er ikke innhold: et datasett har dem ikke med, og tømming av databasen lar dem stå", async () => {
    const { dataset } = await exportDataset("Alt");
    expect(JSON.stringify(dataset)).not.toContain("siteTraffic");
    expect(dataset.collections[CMS_COLLECTIONS.SETTINGS].map((d) => d.id)).toEqual([CMS_SETTINGS_DOC_ID]);

    await clearDatabase();
    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual(["traffic-2026-10-06", "traffic-2026-10-07"]);
    expect(await databaseHasContent()).toBe(false);
  });
});

describe("Eksempeltall for demonstrasjon", () => {
  test("eksempeltall legges bare der ingenting er telt, og merkes", async () => {
    siteTrafficRecorder.view("/", new Date("2026-10-05T10:00:00.000Z"), { entry: true, second: false });
    await landed();
    const counted = { ...stored("2026-10-05") };

    expect(await addExampleTraffic([day("2026-10-04"), day("2026-10-05", { visits: 99 }), day("2026-10-06")])).toBe(2);

    expect(stored("2026-10-04")).toMatchObject({ recordType: "siteTraffic", date: "2026-10-04", simulated: true, visits: 1 });
    expect(stored("2026-10-06")).toMatchObject({ simulated: true });
    // The day that was counted is as it was
    expect(stored("2026-10-05")).toEqual(counted);
  });

  test("eksempeltall kan bare legges inn i demo", async () => {
    await setOperatingMode("production");
    await expect(addExampleTraffic([day("2026-10-04")])).rejects.toThrow("Eksempeltall kan bare legges inn mens appen står i demo.");
    expect(stored("2026-10-04")).toBeUndefined();
  });

  test("eksempeltallene fjernes uten at en telt dag røres, også i produksjon", async () => {
    siteTrafficRecorder.view("/", new Date("2026-10-05T10:00:00.000Z"), { entry: true, second: false });
    await landed();
    await addExampleTraffic([day("2026-10-03"), day("2026-10-04")]);
    await setOperatingMode("production");

    expect(await removeExampleTraffic()).toBe(2);
    expect(ids(CMS_COLLECTIONS.SETTINGS).filter((id) => id.startsWith("traffic-"))).toEqual(["traffic-2026-10-05"]);
  });
});
