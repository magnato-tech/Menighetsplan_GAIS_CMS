import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", async () => (await import("./helpers/memoryFirestore")).firestoreMock);

import { failing, ids, store } from "./helpers/memoryFirestore";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "../src/data/collections";
import { saveAddonChoice, subscribeAddons } from "../src/services/addons";
import { clearDatabase, databaseHasContent, exportDataset } from "../src/services/datasetService";
import type { AddonChoices } from "../src/utils/addons";

const settings = () => store.get(CMS_COLLECTIONS.SETTINGS)!;
// The answers are told a moment after they are asked for, as from a database
const landed = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  store.clear();
  failing.clear();
  // What else lies in the same collection: the settings of the website and a volunteer role
  store.set(CMS_COLLECTIONS.SETTINGS, new Map<string, Record<string, unknown>>([
    [CMS_SETTINGS_DOC_ID, { churchName: "Lillesand Misjonskirke" }],
    ["role-lyd", { id: "role-lyd", recordType: "volunteerRole", name: "Lyd" }],
  ]));
  store.set(CMS_COLLECTIONS.PAGES, new Map([["page-om-oss", { id: "page-om-oss", title: "Om oss" }]]));
});

describe("Hvilke moduler som er på, lagres for hele menigheten", () => {
  test("en database der ingen har valgt, har alle modulene av", async () => {
    const heard: AddonChoices[] = [];
    const stop = subscribeAddons((choices) => heard.push(choices), vi.fn());
    await landed();
    stop();

    expect(heard).toEqual([{}]);
  });

  test("en modul slås av og på uten at den andre røres, og den som følger med, får vite det", async () => {
    const heard: AddonChoices[] = [];
    const stop = subscribeAddons((choices) => heard.push(choices), vi.fn());

    await saveAddonChoice("analysebord", true);
    await saveAddonChoice("nettsidebesok", true);
    await saveAddonChoice("analysebord", false);
    await landed();

    expect(settings().get("addons")).toEqual({ recordType: "addons", on: { analysebord: false, nettsidebesok: true } });
    expect(heard[heard.length - 1]).toEqual({ nettsidebesok: true });

    // Whoever has stopped following is not told anything more
    stop();
    const told = heard.length;
    await saveAddonChoice("analysebord", true);
    await landed();
    expect(heard).toHaveLength(told);
  });

  test("valget skriver bare sitt eget dokument", async () => {
    await saveAddonChoice("analysebord", true);

    expect(ids(CMS_COLLECTIONS.SETTINGS)).toEqual(["addons", CMS_SETTINGS_DOC_ID, "role-lyd"].sort());
    expect(settings().get(CMS_SETTINGS_DOC_ID)).toEqual({ churchName: "Lillesand Misjonskirke" });
  });

  test("kan ikke valgene leses, får den som spør, vite hvorfor", async () => {
    failing.set(CMS_COLLECTIONS.SETTINGS, "permission-denied");
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeAddons(onChange, onError);
    await landed();

    expect(onChange).not.toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("permission-denied");
  });
});

describe("Valget av moduler er ikke innhold", () => {
  test("et datasett har det ikke med, og tømming av databasen lar det stå", async () => {
    await saveAddonChoice("nettsidebesok", true);

    const { dataset } = await exportDataset("Alt");
    expect(dataset.collections[CMS_COLLECTIONS.SETTINGS].map((d) => d.id)).toEqual([CMS_SETTINGS_DOC_ID]);
    expect(JSON.stringify(dataset)).not.toContain("nettsidebesok");

    await clearDatabase();
    // The website's content is gone; what the congregation has turned on is as it was
    expect(ids(CMS_COLLECTIONS.PAGES)).toEqual([]);
    expect(settings().get("addons")).toEqual({ recordType: "addons", on: { nettsidebesok: true } });
    expect(await databaseHasContent()).toBe(false);
  });
});
