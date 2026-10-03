// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "../src/data/collections";
import { initialCmsSettings, type CmsNewsArticle, type CmsPage, type CmsSermon } from "../src/data/cmsData";
import { clearWriteError, getWriteError } from "../src/services/writeErrors";
import { clearCollections, offline, seed, stored, storedIds } from "./support/offlineFirestore";

// Same setup as data-provider.test.tsx: the real Firestore client, kept offline
vi.mock("../src/firebase", async () => (await import("./support/offlineFirestore")).firebaseModuleMock);

import { CmsProvider, useCms } from "../src/context/CmsContext";

const PAGES_CACHE = "menighetsplan_cms_pages_v3";

const page = (id: string, extra: Partial<CmsPage> = {}): CmsPage => ({
  id,
  slug: id,
  title: id,
  summary: "",
  content: "",
  isPublished: true,
  inNavMenu: true,
  parentId: null,
  navOrder: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...extra,
});

const article = (id: string, publishedAt: string): CmsNewsArticle => ({
  id,
  title: id,
  slug: id,
  summary: "",
  content: "",
  category: "aktuelt",
  author: "Menigheten",
  publishedAt,
  isPublished: true,
});

const sermon = (id: string, date: string): CmsSermon => ({ id, title: id, speaker: "Pastor", date });

beforeEach(async () => {
  await offline;
  await clearCollections(Object.values(CMS_COLLECTIONS));
  localStorage.clear();
  clearWriteError();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mountProvider() {
  const { result } = renderHook(() => useCms(), {
    wrapper: ({ children }: { children: React.ReactNode }) => <CmsProvider>{children}</CmsProvider>,
  });
  return result;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe("Lesing", () => {
  test("Innholdet i databasen vises, nyheter og taler med de nyeste først", async () => {
    seed(CMS_COLLECTIONS.PAGES, [page("om-oss"), page("kontakt")]);
    seed(CMS_COLLECTIONS.NEWS, [article("gammel", "2026-01-01T10:00:00.000Z"), article("ny", "2026-09-01T10:00:00.000Z")]);
    seed(CMS_COLLECTIONS.SERMONS, [sermon("tale-januar", "2026-01-04"), sermon("tale-august", "2026-08-30")]);
    const cms = mountProvider();

    await waitFor(() => {
      expect(ids(cms.current.pages).sort()).toEqual(["kontakt", "om-oss"]);
      expect(ids(cms.current.news)).toEqual(["ny", "gammel"]);
      expect(ids(cms.current.sermons)).toEqual(["tale-august", "tale-januar"]);
    });
    expect(cms.current.getPageBySlug("/Om-Oss")?.id).toBe("om-oss");
    expect(cms.current.getNewsById("ny")?.title).toBe("ny");
    expect(cms.current.getNewsBySlug("GAMMEL")?.id).toBe("gammel");
  });

  test("Standardinnstillingene gjelder til noen er lagret", async () => {
    const cms = mountProvider();
    expect(cms.current.settings).toEqual(initialCmsSettings);

    seed(CMS_COLLECTIONS.SETTINGS, [{ id: CMS_SETTINGS_DOC_ID, ...initialCmsSettings, churchName: "Testkirken" }]);
    await waitFor(() => expect(cms.current.settings.churchName).toBe("Testkirken"));
  });

  test("Uten nett beholdes kopien i nettleseren i stedet for en tom side", async () => {
    localStorage.setItem(PAGES_CACHE, JSON.stringify([page("lagret-fra-sist")]));
    const cms = mountProvider();

    expect(ids(cms.current.pages)).toEqual(["lagret-fra-sist"]);
    // The offline client now reports an empty collection, which must not wipe the copy
    await pause(80);
    expect(ids(cms.current.pages)).toEqual(["lagret-fra-sist"]);
    expect(JSON.parse(localStorage.getItem(PAGES_CACHE)!)).toHaveLength(1);

    // What the database holds takes over as soon as there is something to show
    seed(CMS_COLLECTIONS.PAGES, [page("fra-databasen")]);
    await waitFor(() => expect(ids(cms.current.pages)).toEqual(["fra-databasen"]));
    expect(ids(JSON.parse(localStorage.getItem(PAGES_CACHE)!))).toEqual(["fra-databasen"]);
  });
});

describe("Sider", () => {
  test("En ny side får ID, ryddet adresse og lagres uten tomme felt", async () => {
    const cms = mountProvider();
    void cms.current.savePage({ title: "Om oss", slug: "/Om-Oss", parentId: "" });

    await waitFor(() => expect(cms.current.pages).toHaveLength(1));
    const [saved] = cms.current.pages;
    expect(saved).toMatchObject({ title: "Om oss", slug: "om-oss", parentId: null, status: "published", navOrder: 99 });
    expect(saved.id).toMatch(/^page-/);
    expect(await stored(CMS_COLLECTIONS.PAGES, saved.id)).not.toHaveProperty("linkUrl");
  });

  test("To sider lagret i samme øyeblikk får hver sin ID", async () => {
    const cms = mountProvider();
    void cms.current.savePage({ title: "Første" });
    void cms.current.savePage({ title: "Andre" });

    await waitFor(() => expect(cms.current.pages.map((p) => p.title).sort()).toEqual(["Andre", "Første"]));
  });

  test("En redigert side erstatter den gamle", async () => {
    seed(CMS_COLLECTIONS.PAGES, [page("om-oss", { title: "Om oss", linkUrl: "/lederskap" })]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.pages).toHaveLength(1));

    void cms.current.savePage({ ...cms.current.pages[0], title: "Om menigheten", linkUrl: undefined });
    await waitFor(() => expect(cms.current.pages[0].title).toBe("Om menigheten"));
    expect(cms.current.pages).toHaveLength(1);
    expect(await stored(CMS_COLLECTIONS.PAGES, "om-oss")).not.toHaveProperty("linkUrl");
  });

  test("Når en hovedfane slettes, flyttes underfanene opp i samme skriving", async () => {
    seed(CMS_COLLECTIONS.PAGES, [
      page("utleie"),
      page("kurs", { parentId: "utleie" }),
      page("selskap", { parentId: "utleie" }),
      page("kontakt"),
    ]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.pages).toHaveLength(4));

    void cms.current.deletePage("utleie");
    await waitFor(() => expect(ids(cms.current.pages).sort()).toEqual(["kontakt", "kurs", "selskap"]));
    expect(cms.current.pages.every((p) => p.parentId === null)).toBe(true);
    expect((await stored(CMS_COLLECTIONS.PAGES, "kurs"))?.parentId).toBeNull();
    expect((await stored(CMS_COLLECTIONS.PAGES, "selskap"))?.parentId).toBeNull();
    expect(await storedIds(CMS_COLLECTIONS.PAGES)).toEqual(["kontakt", "kurs", "selskap"]);
  });
});

describe("Nyheter, taler og stab", () => {
  test("Nytt innhold får standardverdier og havner riktig i rekkefølgen", async () => {
    seed(CMS_COLLECTIONS.NEWS, [article("fra-i-fjor", "2025-06-01T10:00:00.000Z")]);
    const cms = mountProvider();
    void cms.current.saveNews({ title: "Høstfest" });
    void cms.current.saveSermon({ title: "Nåde", date: "2026-09-27" });

    await waitFor(() => {
      expect(cms.current.news.map((n) => n.title)).toEqual(["Høstfest", "fra-i-fjor"]);
      expect(cms.current.sermons[0]).toMatchObject({ title: "Nåde", speaker: "Pastor" });
    });
    expect(cms.current.news[0]).toMatchObject({ category: "aktuelt", author: "Menigheten", isPublished: true });
  });

  test("Slettet innhold forsvinner", async () => {
    seed(CMS_COLLECTIONS.NEWS, [article("nyhet", "2026-09-01T10:00:00.000Z")]);
    seed(CMS_COLLECTIONS.SERMONS, [sermon("tale", "2026-08-30")]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.sermons).toHaveLength(1));

    void cms.current.deleteNews("nyhet");
    void cms.current.deleteSermon("tale");
    await waitFor(() => {
      expect(cms.current.news).toEqual([]);
      expect(cms.current.sermons).toEqual([]);
    });
  });
});

describe("Innstillinger", () => {
  test("Lagring endrer bare feltene som er oppgitt", async () => {
    seed(CMS_COLLECTIONS.SETTINGS, [{ id: CMS_SETTINGS_DOC_ID, ...initialCmsSettings, churchName: "Testkirken" }]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.settings.churchName).toBe("Testkirken"));

    void cms.current.saveSettings({ tagline: "Ny undertittel" });
    await waitFor(() => expect(cms.current.settings.tagline).toBe("Ny undertittel"));
    expect(cms.current.settings.churchName).toBe("Testkirken");
    expect(await stored(CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID)).toMatchObject({
      churchName: "Testkirken",
      tagline: "Ny undertittel",
    });
  });

  test("En lagring skriver bare det som ble endret, så en annens endring ikke overskrives", async () => {
    seed(CMS_COLLECTIONS.SETTINGS, [{ id: CMS_SETTINGS_DOC_ID, ...initialCmsSettings, churchName: "Testkirken" }]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.settings.churchName).toBe("Testkirken"));

    // Another editor changes the phone number after this one has loaded the settings
    seed(CMS_COLLECTIONS.SETTINGS, [{ id: CMS_SETTINGS_DOC_ID, ...initialCmsSettings, churchName: "Testkirken", phone: "999 99 999" }]);
    await waitFor(() => expect(cms.current.settings.phone).toBe("999 99 999"));
    void cms.current.saveSettings({ tagline: "Ny undertittel" });

    await waitFor(() => expect(cms.current.settings.tagline).toBe("Ny undertittel"));
    expect(await stored(CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID)).toMatchObject({ phone: "999 99 999" });
  });

  test("Innstillinger som mangler felt får standardverdi i visningen", async () => {
    seed(CMS_COLLECTIONS.SETTINGS, [{ id: CMS_SETTINGS_DOC_ID, churchName: "Testkirken" }]);
    const cms = mountProvider();
    await waitFor(() => expect(cms.current.settings.churchName).toBe("Testkirken"));
    expect(cms.current.settings.appName).toBe(initialCmsSettings.appName);
  });
});

describe("Feil", () => {
  test("En lagring databasen avviser svarer nei og meldes til brukeren", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cms = mountProvider();
    // Firestore cannot store a function
    const saved = await cms.current.savePage({ title: "Ødelagt", content: (() => "x") as unknown as string });

    expect(saved).toBe(false);
    expect(getWriteError()?.action).toBe("lagre siden");
    await pause(50);
    expect(cms.current.pages).toEqual([]);
  });
});
