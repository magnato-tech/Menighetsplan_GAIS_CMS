import { describe, expect, test } from "vitest";
import type { CmsNewsArticle, CmsPage } from "../src/data/cmsData";
import {
  TRAFFIC_RECORD,
  addDays,
  describeDecimalChange,
  describeSecondsChange,
  emptyTrafficDay,
  formatHourSpan,
  formatPerVisit,
  formatSeconds,
  formatTrafficDate,
  osloDayAndHour,
  parseTrafficDay,
  summarizeTraffic,
  trafficActionForLink,
  trafficAddress,
  trafficDocId,
  trafficPeriod,
  trafficTarget,
  weekdayOf,
  type TrafficDay,
  type TrafficSite,
} from "../src/utils/siteTraffic";

const page = (id: string, slug: string, title: string, extra: Partial<CmsPage> = {}): CmsPage =>
  ({ id, slug, title, summary: "", content: "", isPublished: true, ...extra }) as CmsPage;
const article = (id: string, title: string): CmsNewsArticle =>
  ({ id, title, slug: "hostfest", summary: "", content: "", category: "aktuelt", author: "", publishedAt: "2026-09-01T10:00:00.000Z", isPublished: true }) as CmsNewsArticle;

const site: TrafficSite = {
  pages: [
    page("p-forside", "", "Velkommen"),
    page("p-om", "om-oss", "Om oss"),
    page("p-kontakt", "kontakt", "Kontakt"),
    page("p-gi", "gi", "Gi en gave"),
    page("p-utkast", "utkast", "Ikke ferdig", { isPublished: false }),
    // A menu entry that sends the visitor on to the built-in sermon page
    page("p-taler", "taler-lenke", "Taler", { linkUrl: "/taler" }),
  ],
  news: [article("nyhet-1", "Høstfest i kirken")],
  media: [],
  settings: { churchName: "Lillesand Misjonskirke", appName: "Menighetsplan", tagline: "", welcomeSubtext: "" },
  sermons: [{ id: "tale-1", title: "Håp i hverdagen" }],
};

// Wednesday 7 October 2026, 12:00 in Norway
const now = new Date("2026-10-07T10:00:00.000Z");
const day = (date: string, fill: Partial<TrafficDay>): TrafficDay => ({ ...emptyTrafficDay(date), ...fill });

describe("Adressen et besøk telles på", () => {
  test("én side har én adresse, uansett hvordan den ble skrevet", () => {
    expect(trafficAddress("/")).toBe("/");
    expect(trafficAddress("")).toBe("/");
    expect(trafficAddress("/Om-oss/")).toBe("/om-oss");
    expect(trafficAddress("/side/om-oss")).toBe("/om-oss");
    expect(trafficAddress("/nettside/Om-Oss")).toBe("/om-oss");
    expect(trafficAddress("/nettside")).toBe("/");
    expect(trafficAddress("//om-oss//")).toBe("/om-oss");
    expect(trafficAddress("/om-oss?fra=facebook#topp")).toBe("/om-oss");
    expect(trafficAddress("/barn%20og%20unge")).toBe("/barn og unge");
  });

  test("artikkelens id står som den er skrevet, og en dyp adresse holdes samlet", () => {
    expect(trafficAddress("/artikkel/Nyhet-ABC")).toBe("/artikkel/Nyhet-ABC");
    expect(trafficAddress("/Artikkel/x1")).toBe("/artikkel/x1");
    expect(trafficAddress("/Om-oss/Staben")).toBe("/om-oss/staben");
    expect(trafficAddress(`/${"a".repeat(300)}`)).toHaveLength(120);
  });

  test("en side telles som side, en adresse uten side som det, og Min side og admin ikke i det hele tatt", () => {
    expect(trafficTarget("/", site, now)).toEqual({ kind: "page", address: "/" });
    expect(trafficTarget("/side/om-oss", site, now)).toEqual({ kind: "page", address: "/om-oss" });
    expect(trafficTarget("/taler", site, now)).toEqual({ kind: "page", address: "/taler" });
    expect(trafficTarget("/artikkel/nyhet-1", site, now)).toEqual({ kind: "page", address: "/artikkel/nyhet-1" });
    // An article opened by the name in its address is the same article
    expect(trafficTarget("/artikkel/Hostfest", site, now)).toEqual({ kind: "page", address: "/artikkel/nyhet-1" });
    // A draft is not there for a visitor, and neither is an address nobody made a page for
    expect(trafficTarget("/utkast", site, now)).toEqual({ kind: "missing", address: "/utkast" });
    expect(trafficTarget("/om-oss/staben-og-styret", site, now)).toEqual({ kind: "missing", address: "/om-oss/staben-og-styret" });
    expect(trafficTarget("/artikkel/finnes-ikke", site, now)).toEqual({ kind: "missing", address: "/artikkel/finnes-ikke" });
    for (const internal of ["/admin", "/admin/person/p1", "/minside", "/leder/gruppe/g1", "/api/offentlig/kalender.ics"]) {
      expect(trafficTarget(internal, site, now)).toBeNull();
    }
  });

  test("en lenke som er en handling, kjennes igjen på hvor den fører", () => {
    expect(trafficActionForLink("tel:+4737270000")).toBe("kontakt-telefon");
    expect(trafficActionForLink("MAILTO:post@eksempel.no")).toBe("kontakt-epost");
    expect(trafficActionForLink("https://eksempel.no/api/offentlig/kalender.ics")).toBe("kalender-abonner");
    expect(trafficActionForLink("webcal://eksempel.no/kalender")).toBe("kalender-abonner");
    expect(trafficActionForLink("/om-oss")).toBeNull();
    expect(trafficActionForLink("https://eksempel.no/musics")).toBeNull();
    expect(trafficActionForLink(null)).toBeNull();
  });
});

describe("Dager og timer, norsk tid", () => {
  test("et øyeblikk hører til dagen og timen det er i Norge, sommer som vinter", () => {
    expect(osloDayAndHour(new Date("2026-10-07T10:00:00.000Z"))).toEqual({ date: "2026-10-07", hour: 12 });
    // Half past midnight in Norway is still the evening before in London
    expect(osloDayAndHour(new Date("2026-10-07T22:30:00.000Z"))).toEqual({ date: "2026-10-08", hour: 0 });
    expect(osloDayAndHour(new Date("2026-12-24T23:30:00.000Z"))).toEqual({ date: "2026-12-25", hour: 0 });
    expect(osloDayAndHour(new Date("2026-12-24T22:59:00.000Z"))).toEqual({ date: "2026-12-24", hour: 23 });
  });

  test("dager legges til og trekkes fra over måneds- og årsskifter, og uka starter mandag", () => {
    expect(addDays("2026-10-07", 1)).toBe("2026-10-08");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(weekdayOf("2026-10-05")).toBe(0);
    expect(weekdayOf("2026-10-07")).toBe(2);
    expect(weekdayOf("2026-10-11")).toBe(6);
    expect(formatTrafficDate("2026-10-07")).toBe("7.10.");
    expect(trafficDocId("2026-10-07")).toBe("traffic-2026-10-07");
  });

  test("perioden slutter i dag og er like lang som den før", () => {
    expect(trafficPeriod("7d", now)).toMatchObject({ from: "2026-10-01", to: "2026-10-07", previousFrom: "2026-09-24", previousTo: "2026-09-30", days: 7 });
    expect(trafficPeriod("4w", now)).toMatchObject({ from: "2026-09-10", to: "2026-10-07", previousFrom: "2026-08-13", previousTo: "2026-09-09" });
    expect(trafficPeriod("12m", now)).toMatchObject({ from: "2025-10-09", to: "2026-10-07", days: 364 });
  });
});

describe("En dag slik den er lagret", () => {
  test("bare dokumenter som er en dag, leses, og bare det som er et tall, tas med", () => {
    expect(parseTrafficDay(undefined)).toBeNull();
    expect(parseTrafficDay({ recordType: "volunteerRole", date: "2026-10-07" })).toBeNull();
    expect(parseTrafficDay({ recordType: TRAFFIC_RECORD, date: "i går" })).toBeNull();

    const parsed = parseTrafficDay({
      recordType: TRAFFIC_RECORD,
      date: "2026-10-07",
      visits: 12,
      deepVisits: "mange",
      views: { "/": 20, "/om-oss": -3, "/kontakt": "fem", "/gi": 4 },
      hours: { 10: 7 },
      simulated: true,
    });
    expect(parsed).toEqual({ ...emptyTrafficDay("2026-10-07"), visits: 12, views: { "/": 20, "/gi": 4 }, hours: { 10: 7 }, simulated: true });
  });
});

describe("Det bordet viser", () => {
  const days: TrafficDay[] = [
    // A Sunday and a Wednesday in the period
    day("2026-10-04", {
      visits: 10,
      deepVisits: 6,
      views: { "/": 12, "/om-oss": 6, "/gammel-side": 2 },
      entries: { "/": 8, "/om-oss": 2 },
      seconds: { "/": 300, "/om-oss": 450 },
      timed: { "/": 10, "/om-oss": 5 },
      hours: { 9: 15, 20: 5 },
      actions: { "kontakt-telefon": 2, "tale-avspilt": 3 },
      sermons: { "tale-1": 2, "tale-slettet": 1 },
      missing: { "/index.php": 3, "/wp-login.php": 1 },
    }),
    day("2026-10-07", {
      visits: 6,
      deepVisits: 2,
      views: { "/": 6, "/artikkel/nyhet-1": 4 },
      entries: { "/": 4, "/artikkel/nyhet-1": 2 },
      seconds: { "/": 150 },
      timed: { "/": 5 },
      hours: { 12: 10 },
      actions: { "kontakt-epost": 1 },
      missing: { "/index.php": 1 },
    }),
    // The period before
    day("2026-09-06", { visits: 8, deepVisits: 4, views: { "/": 10, "/kontakt": 2 }, seconds: { "/": 240 }, timed: { "/": 8 }, actions: { "kontakt-telefon": 5 } }),
    // Far too old to be part of anything
    day("2025-01-01", { visits: 500, views: { "/": 900 } }),
  ];
  const summary = summarizeTraffic(days, site, "4w", now);

  test("nøkkeltallene er summene av dagene i perioden", () => {
    expect(summary.hasCounts).toBe(true);
    expect(summary.totals.visits).toBe(16);
    expect(summary.totals.views).toBe(30);
    expect(summary.totals.pagesPerVisit).toBeCloseTo(30 / 16);
    expect(summary.totals.secondsPerVisit).toBeCloseTo(900 / 16);
    // 8 of the 16 visits went on to a second page
    expect(summary.totals.singlePageShare).toBeCloseTo(0.5);
    expect(summary.daysWithCounts).toBe(2);
    expect(summary.countingSince).toBe("2026-09-06");
    expect(summary.hasExamples).toBe(false);
  });

  test("perioden før er med for sammenligning, og er tom når ingenting ble telt da", () => {
    expect(summary.previous).toMatchObject({ visits: 8, views: 12 });
    expect(summary.previous?.singlePageShare).toBeCloseTo(0.5);

    const first = summarizeTraffic(days.slice(0, 2), site, "4w", now);
    expect(first.previous).toBeNull();
    expect(first.actions.every((action) => action.previous === null)).toBe(true);
    expect(first.countingSince).toBe("2026-10-04");
  });

  test("uten noe telt i perioden er det ingenting å dele på", () => {
    const empty = summarizeTraffic([], site, "4w", now);
    expect(empty.hasCounts).toBe(false);
    expect(empty.totals).toEqual({ visits: 0, views: 0, pagesPerVisit: null, secondsPerVisit: null, singlePageShare: null });
    expect(empty.pages).toEqual([]);
    expect(empty.busiest).toBeNull();
    expect(empty.countingSince).toBeNull();
  });

  test("søylene er en dag hver i fire uker, så en uke hver, så fire uker hver", () => {
    expect(summary.columnUnit).toBe("dag");
    expect(summary.columns).toHaveLength(28);
    expect(summary.columns[27]).toEqual({ from: "2026-10-07", to: "2026-10-07", label: "7.10.", visits: 6, views: 10 });
    expect(summary.columns[24]).toMatchObject({ from: "2026-10-04", visits: 10, views: 20 });
    expect(summary.columns[0]).toMatchObject({ from: "2026-09-10", visits: 0, views: 0 });

    const week = summarizeTraffic(days, site, "7d", now);
    expect(week.columns).toHaveLength(7);

    const quarter = summarizeTraffic(days, site, "3m", now);
    expect(quarter.columnUnit).toBe("uke");
    expect(quarter.columns).toHaveLength(13);
    // The last week is 1 to 7 October and holds both counted days of it
    expect(quarter.columns[12]).toEqual({ from: "2026-10-01", to: "2026-10-07", label: "1.10.", visits: 16, views: 30 });

    const year = summarizeTraffic(days, site, "12m", now);
    expect(year.columnUnit).toBe("fire uker");
    expect(year.columns).toHaveLength(13);
    expect(year.columns.reduce((sum, column) => sum + column.visits, 0)).toBe(24);
  });

  test("sidene står med tittel, visninger, andel, tid og hvor mange besøk som startet der", () => {
    expect(summary.pages.map((row) => row.address)).toEqual(["/", "/om-oss", "/artikkel/nyhet-1", "/gammel-side"]);
    expect(summary.pages[0]).toEqual({ address: "/", title: "Forsiden", exists: true, views: 18, share: 18 / 30, entries: 12, secondsPerView: 30 });
    expect(summary.pages[1]).toMatchObject({ title: "Om oss", views: 6, secondsPerView: 90 });
    // Opened, but never long enough in view for a time to be measured
    expect(summary.pages[2]).toMatchObject({ title: "Høstfest i kirken", exists: true, secondsPerView: null });
    // A page that was opened and has since been taken away is listed under its address
    expect(summary.pages[3]).toMatchObject({ title: "/gammel-side", exists: false, views: 2 });
  });

  test("sider som aldri åpnes, er de publiserte sidene uten visninger", () => {
    // Not the draft, not the menu entry that only leads on, and not the pages that were opened
    expect(summary.neverOpened).toEqual([
      { address: "/gi", title: "Gi en gave" },
      { address: "/kontakt", title: "Kontakt" },
    ]);
  });

  test("inngangssidene og adressene uten side står med de mest brukte først", () => {
    expect(summary.entryPages).toEqual([
      { address: "/", title: "Forsiden", entries: 12, share: 0.75 },
      { address: "/artikkel/nyhet-1", title: "Høstfest i kirken", entries: 2, share: 0.125 },
      { address: "/om-oss", title: "Om oss", entries: 2, share: 0.125 },
    ]);
    expect(summary.missing).toEqual([
      { address: "/index.php", hits: 4 },
      { address: "/wp-login.php", hits: 1 },
    ]);
  });

  test("rytmen viser ukedag og time, og den travleste timen", () => {
    // 4 October is a Sunday, 7 October a Wednesday
    expect(summary.rhythm[6][9]).toBe(15);
    expect(summary.rhythm[6][20]).toBe(5);
    expect(summary.rhythm[2][12]).toBe(10);
    expect(summary.weekdays.map((weekday) => weekday.views)).toEqual([0, 0, 10, 0, 0, 0, 20]);
    expect(summary.busiest).toEqual({ weekday: "Søndag", hour: 9, views: 15 });
  });

  test("handlingene, nyhetene og talene står med tall, og en tale som er slettet, sies å være det", () => {
    expect(summary.actions).toEqual([
      { id: "kontakt-telefon", label: "Trykk på telefonnummer", count: 2, previous: 5 },
      { id: "kontakt-epost", label: "Trykk på e-postadresse", count: 1, previous: 0 },
      { id: "kalender-abonner", label: "Abonner på kalenderen", count: 0, previous: 0 },
      { id: "tale-avspilt", label: "Avspilte taler", count: 3, previous: 0 },
    ]);
    expect(summary.news).toEqual([{ address: "/artikkel/nyhet-1", title: "Høstfest i kirken", views: 4 }]);
    expect(summary.sermons).toEqual([
      { id: "tale-1", title: "Håp i hverdagen", plays: 2 },
      { id: "tale-slettet", title: "En tale som ikke finnes lenger", plays: 1 },
    ]);
  });

  test("eksempeltall i perioden eller den før sies fra om", () => {
    expect(summarizeTraffic([...days, day("2026-09-01", { visits: 3, simulated: true })], site, "4w", now).hasExamples).toBe(true);
    expect(summarizeTraffic([...days, day("2025-01-02", { visits: 3, simulated: true })], site, "4w", now).hasExamples).toBe(false);
  });

  test("flere andre sider enn besøk gir aldri en negativ andel", () => {
    const odd = summarizeTraffic([day("2026-10-07", { visits: 2, deepVisits: 5, views: { "/": 9 } })], site, "4w", now);
    expect(odd.totals.singlePageShare).toBe(0);
  });
});

describe("Slik bordet skriver tallene", () => {
  test("tid skrives i sekunder under ett minutt og i minutter over", () => {
    expect(formatSeconds(null)).toBe("–");
    expect(formatSeconds(0.4)).toBe("0 sek");
    expect(formatSeconds(45.4)).toBe("45 sek");
    expect(formatSeconds(60)).toBe("1 min");
    expect(formatSeconds(125)).toBe("2 min 5 sek");
  });

  test("sider per besøk har én desimal, og en time skrives som et spenn", () => {
    expect(formatPerVisit(null)).toBe("–");
    expect(formatPerVisit(2)).toBe("2,0");
    expect(formatPerVisit(2.44)).toBe("2,4");
    expect(formatHourSpan(9)).toBe("kl. 9–10");
    expect(formatHourSpan(23)).toBe("kl. 23–24");
  });

  test("endring fra perioden før sies bare når begge finnes", () => {
    expect(describeDecimalChange(2.4, null)).toBeNull();
    expect(describeDecimalChange(2.44, 2.41)).toEqual({ direction: "flat", text: "Uendret" });
    expect(describeDecimalChange(2.4, 2.1)).toEqual({ direction: "up", text: "+0,3" });
    expect(describeDecimalChange(1.5, 2)).toEqual({ direction: "down", text: "−0,5" });
    expect(describeSecondsChange(null, 30)).toBeNull();
    expect(describeSecondsChange(72, 60)).toEqual({ direction: "up", text: "+12 sek" });
    expect(describeSecondsChange(30, 120)).toEqual({ direction: "down", text: "−1 min 30 sek" });
    expect(describeSecondsChange(60.2, 60)).toEqual({ direction: "flat", text: "Uendret" });
  });
});
