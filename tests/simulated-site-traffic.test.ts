import { describe, expect, test } from "vitest";
import type { CmsNewsArticle, CmsPage } from "../src/data/cmsData";
import { exampleAddresses, simulateSiteTraffic } from "../src/data/simulatedSiteTraffic";
import { summarizeTraffic, weekdayOf, type TrafficSite } from "../src/utils/siteTraffic";

const addresses = ["/", "/om-oss", "/hva-skjer", "/taler", "/kontakt", "/gi", "/barn-og-unge", "/smagrupper", "/historie", "/utleie", "/personvern", "/arkiv"];
const input = { from: "2026-07-13", to: "2026-10-04", addresses, sermonIds: ["tale-1", "tale-2", "tale-3"] };
const days = simulateSiteTraffic(input);
const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);

describe("Eksempeltall for besøk på nettsiden", () => {
  test("hver dag i perioden får tall, og hver dag er merket som eksempel", () => {
    // Twelve whole weeks, Monday to Sunday
    expect(days).toHaveLength(84);
    expect(days[0].date).toBe("2026-07-13");
    expect(days[83].date).toBe("2026-10-04");
    expect(days.every((day) => day.simulated === true && day.visits >= 3)).toBe(true);
  });

  test("de samme forutsetningene gir de samme tallene, og et annet frø gir andre", () => {
    expect(simulateSiteTraffic(input)).toEqual(days);
    expect(simulateSiteTraffic({ ...input, seed: 7 })).not.toEqual(days);
  });

  test("tallene henger sammen på hver dag", () => {
    for (const day of days) {
      // Every page view falls in an hour, and a visit starts on a page that was opened
      expect(sum(day.hours)).toBe(sum(day.views));
      expect(sum(day.entries)).toBeLessThanOrEqual(day.visits);
      expect(day.deepVisits).toBeLessThanOrEqual(day.visits);
      expect(sum(day.views)).toBeGreaterThanOrEqual(day.visits);
      for (const [address, entries] of Object.entries(day.entries)) expect(entries).toBeLessThanOrEqual(day.views[address]);
      // A page that was opened was in view for a while, and no page was in view without being opened
      expect(Object.keys(day.seconds).sort()).toEqual(Object.keys(day.views).sort());
      for (const seconds of Object.values(day.seconds)) expect(seconds).toBeGreaterThan(0);
      expect(sum(day.sermons)).toBe(day.actions["tale-avspilt"] ?? 0);
    }
  });

  test("uka har menighetens rytme: flest besøk på søndag", () => {
    const averageOn = (weekday: number) => {
      const matching = days.filter((day) => weekdayOf(day.date) === weekday);
      return matching.reduce((total, day) => total + day.visits, 0) / matching.length;
    };
    const sunday = averageOn(6);
    for (let weekday = 0; weekday < 6; weekday++) expect(sunday).toBeGreaterThan(averageOn(weekday));
  });

  test("forsiden er mest besøkt, og den siste fjerdedelen av sidene åpnes aldri", () => {
    const views: Record<string, number> = {};
    for (const day of days) for (const [address, value] of Object.entries(day.views)) views[address] = (views[address] ?? 0) + value;

    const mostOpened = Object.entries(views).sort(([, a], [, b]) => b - a)[0][0];
    expect(mostOpened).toBe("/");
    expect(views["/"] / sum(views)).toBeGreaterThan(0.25);
    expect(views["/"] / sum(views)).toBeLessThan(0.45);
    for (const never of ["/utleie", "/personvern", "/arkiv"]) expect(views[never]).toBeUndefined();
    expect(views["/historie"]).toBeGreaterThan(0);
  });

  test("uten sider og taler gis det likevel tall for forsiden, og ingen avspillinger", () => {
    const bare = simulateSiteTraffic({ from: "2026-10-01", to: "2026-10-03", addresses: [], sermonIds: [] });
    expect(bare).toHaveLength(3);
    expect(bare.every((day) => Object.keys(day.views).join() === "/" && !day.actions["tale-avspilt"] && sum(day.sermons) === 0)).toBe(true);
  });

  test("bordet får noe å vise av tallene: alle delene har innhold", () => {
    const site: TrafficSite = {
      pages: addresses.slice(1).map((address) => ({ id: address, slug: address.slice(1), title: address.slice(1), isPublished: true }) as CmsPage),
      news: [],
      media: [],
      settings: { churchName: "Lillesand Misjonskirke", appName: "Menighetsplan", tagline: "", welcomeSubtext: "" },
      sermons: [{ id: "tale-1", title: "Håp i hverdagen" }],
    };
    const summary = summarizeTraffic(days, site, "4w", new Date("2026-10-04T10:00:00.000Z"));

    expect(summary.hasCounts && summary.hasExamples).toBe(true);
    expect(summary.previous).not.toBeNull();
    expect(summary.totals.pagesPerVisit).toBeGreaterThan(1.8);
    expect(summary.totals.secondsPerVisit).toBeGreaterThan(30);
    expect(summary.neverOpened.map((page) => page.address)).toEqual(["/arkiv", "/personvern", "/utleie"]);
    expect(summary.busiest?.weekday).toBe("Søndag");
    expect(summary.sermons[0]).toMatchObject({ id: "tale-1", title: "Håp i hverdagen" });
    expect(summary.missing.length).toBeGreaterThan(0);
  });
});

describe("Sidene eksempeltallene lages for", () => {
  const page = (id: string, slug: string, extra: Partial<CmsPage> = {}): CmsPage =>
    ({ id, slug, title: id, isPublished: true, ...extra }) as CmsPage;
  const article = (id: string, isPublished = true): CmsNewsArticle => ({ id, title: id, slug: id, isPublished }) as CmsNewsArticle;

  test("forsiden først, så menyen i rekkefølge, de nyeste nyhetene, og så resten", () => {
    const site = {
      pages: [
        page("skjult", "skjult", { inNavMenu: false }),
        page("under", "om-oss/historie", { parentPageId: "om", menuOrder: 0 }),
        page("kontakt", "kontakt", { menuOrder: 2 }),
        page("om", "om-oss", { menuOrder: 1 }),
        page("forside", "", { menuOrder: 0 }),
        page("taler", "taler-lenke", { menuOrder: 3, linkUrl: "/taler" }),
        page("facebook", "facebook", { menuOrder: 4, linkUrl: "https://facebook.com/menigheten" }),
        page("utkast", "utkast", { isPublished: false }),
      ],
      news: [article("n1"), article("n2", false), article("n3"), article("n4"), article("n5")],
    };

    expect(exampleAddresses(site, new Date("2026-10-07T10:00:00.000Z"))).toEqual([
      "/",
      "/om-oss",
      "/kontakt",
      "/taler",
      "/om-oss/historie",
      "/skjult",
      "/artikkel/n1",
      "/artikkel/n3",
      "/artikkel/n4",
    ]);
  });

  test("en tom nettside har bare forsiden", () => {
    expect(exampleAddresses({ pages: [], news: [] })).toEqual(["/"]);
  });
});
