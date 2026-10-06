import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { filterStockImages, listStockImages, stockImageUrl, stockThumbUrl, type StockImage } from "../src/services/stockImages";

// The images themselves, as they lie in public/bildebibliotek/. They are added by hand, a batch
// at a time, so what the app relies on is checked here: every listed image has its files, and
// every image says what it shows and where it comes from.

const folder = join(__dirname, "..", "public", "bildebibliotek");
const index = JSON.parse(readFileSync(join(folder, "index.json"), "utf8")) as StockImage[];
const files = readdirSync(folder).filter((name) => name.endsWith(".jpg"));

const stubList = (body: unknown, ok = true, status = 200) =>
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status, json: async () => body })));

afterEach(() => vi.unstubAllGlobals());

describe("Bildene som følger med appen", () => {
  test("hvert bilde i listen har en stor og en liten fil, og ingen fil ligger utenfor listen", () => {
    expect(index.length).toBeGreaterThan(0);
    expect(new Set(index.map((image) => image.id)).size).toBe(index.length);
    const listed = index.flatMap((image) => [image.file, image.thumb]).sort();
    expect([...files].sort()).toEqual(listed);
  });

  test.each(index)("$title: beskrevet, merket med emneord og med fotograf og kilde", (image) => {
    expect(image.title.trim().length).toBeGreaterThan(3);
    // The description is what a screen reader says, so it is a sentence about what is seen
    expect(image.altText.trim().length).toBeGreaterThan(20);
    expect(image.altText).not.toBe(image.title);
    expect(image.tags.length).toBeGreaterThan(1);
    // An archive image names its photographer and links to where it was found. One of the
    // congregation's own has no link, and names a photographer only when one is given.
    expect(["Pixabay", "Unsplash", "Egne bilder"]).toContain(image.source);
    if (image.source === "Egne bilder") {
      expect(image.sourceUrl).toBeUndefined();
    } else {
      expect(image.credit.trim()).not.toBe("");
      expect(image.sourceUrl).toMatch(/^https:\/\/(pixabay\.com|unsplash\.com)\//);
    }
    expect(image.width).toBeLessThanOrEqual(1600);
    expect(image.height).toBeGreaterThan(0);
  });

  test("ingen fil er tyngre enn en nettside tåler", () => {
    for (const image of index) {
      expect(readFileSync(join(folder, image.file)).length).toBeLessThan(500 * 1024);
      expect(readFileSync(join(folder, image.thumb)).length).toBeLessThan(80 * 1024);
    }
  });
});

describe("Listen over bildene", () => {
  test("leses fra mappen, og et bilde brukes med adressen sin", async () => {
    stubList(index);
    const list = await listStockImages();

    expect(list).toEqual(index);
    expect(fetch).toHaveBeenCalledWith("/bildebibliotek/index.json");
    expect(stockImageUrl(list[0])).toBe(`/bildebibliotek/${index[0].file}`);
    expect(stockThumbUrl(list[0])).toBe(`/bildebibliotek/${index[0].thumb}`);
  });

  test("en oppføring som ikke er et bilde i mappen, tas ikke med", async () => {
    const good = index[0];
    const own = { ...good, id: "eget", source: "Egne bilder", sourceUrl: undefined };
    stubList([good, own, { ...good, id: "x", file: "../hemmelig.jpg" }, { ...good, id: "y", sourceUrl: "javascript:alert(1)" }, { id: "z" }, null]);
    expect((await listStockImages()).map((image) => image.id)).toEqual([good.id, "eget"]);
  });

  test("finnes ikke listen, eller er den ikke en liste, sies det fra", async () => {
    stubList(null, false, 404);
    await expect(listStockImages()).rejects.toThrow("Bildene som følger med, kunne ikke hentes (404).");
    stubList({});
    await expect(listStockImages()).rejects.toThrow("ukjent format");
  });

  test("søket leter i tittel, beskrivelse og emneord, og alle ordene må finnes", () => {
    const images = [
      { ...index[0], id: "a", title: "Smågruppe rundt bordet", altText: "Fem personer rundt et lavt bord.", tags: ["smågruppe", "kaffe"] },
      { ...index[0], id: "b", title: "Familie med baby", altText: "En mor og en far med en baby.", tags: ["familie", "dåp"] },
    ];
    const found = (query: string) => filterStockImages(images, query).map((image) => image.id);

    expect(found("")).toEqual(["a", "b"]);
    expect(found("  ")).toEqual(["a", "b"]);
    expect(found("DÅP")).toEqual(["b"]);
    expect(found("bord")).toEqual(["a"]);
    expect(found("smågruppe kaffe")).toEqual(["a"]);
    expect(found("smågruppe dåp")).toEqual([]);
  });

  test("både arkivbilder og egne bilder ligger inne", () => {
    const sources = new Set(index.map((image) => image.source));
    expect([...sources].sort()).toEqual(["Egne bilder", "Pixabay", "Unsplash"]);
  });

  test("bildene som ligger inne nå, kan finnes på det en menighet leter etter", () => {
    for (const word of ["fellesskap", "familie", "ungdom", "samtale"]) {
      expect(filterStockImages(index, word).length).toBeGreaterThan(0);
    }
  });
});
