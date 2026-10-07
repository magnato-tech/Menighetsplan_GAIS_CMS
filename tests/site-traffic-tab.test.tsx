// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../src/hooks/useSiteTrafficBoard", () => ({ useSiteTrafficBoard: vi.fn() }));

import { SiteTrafficTab } from "../src/pages/admin/tabs/SiteTrafficTab";
import { useSiteTrafficBoard, type SiteTrafficBoard } from "../src/hooks/useSiteTrafficBoard";
import type { CmsNewsArticle, CmsPage } from "../src/data/cmsData";
import { emptyTrafficDay, summarizeTraffic, type TrafficDay, type TrafficSite } from "../src/utils/siteTraffic";

// Wednesday 7 October 2026. The default period, four weeks, is 10 September to 7 October,
// and the four weeks before it are 13 August to 9 September.
const NOW = new Date("2026-10-07T10:00:00Z");

const page = (fields: Partial<CmsPage> & { id: string; slug: string; title: string }): CmsPage => ({
  summary: "",
  content: "",
  isPublished: true,
  updatedAt: "2026-10-01T10:00:00Z",
  ...fields,
});

const article = (fields: Partial<CmsNewsArticle> & { id: string; title: string }): CmsNewsArticle => ({
  slug: fields.id,
  summary: "",
  content: "",
  category: "aktuelt",
  author: "Menigheten",
  publishedAt: "2026-10-01T10:00:00Z",
  isPublished: true,
  ...fields,
});

const day = (date: string, counts: Partial<Omit<TrafficDay, "date">>): TrafficDay => ({ ...emptyTrafficDay(date), ...counts });
const nums = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

const settings = { churchName: "Lillesand Misjonskirke", appName: "Menighetsplan", tagline: "", welcomeSubtext: "" };

const site: TrafficSite = {
  settings,
  pages: [
    page({ id: "forside", slug: "", title: "Forside", linkUrl: "/" }),
    page({ id: "om-oss", slug: "om-oss", title: "Om oss" }),
    page({ id: "barn", slug: "barn-og-unge", title: "Barn og unge" }),
    page({ id: "kontakt", slug: "kontakt", title: "Kontakt" }),
    page({ id: "utkast", slug: "utkast", title: "Utkast", isPublished: false }),
  ],
  news: [article({ id: "hostfest", title: "Høstfest i kirken" })],
  media: [],
  sermons: [
    { id: "s1", title: "Tro i hverdagen" },
    { id: "s2", title: "Nåde og tillit" },
  ],
};

// Three counted days in the period, two of them Sundays, and one in the period before so there is something to compare with.
// Together the period has 90 visits and 180 page views, which is 2,0 pages per visit, and 8280 seconds, which is 1 min 32 sek per visit.
const COUNTED_DAYS: TrafficDay[] = [
  day("2026-09-06", {
    visits: 50,
    deepVisits: 20,
    views: { "/": 45, "/om-oss": 30 },
    seconds: { "/": 1500, "/om-oss": 1000 },
    timed: { "/": 45, "/om-oss": 30 },
    hours: { "10": 75 },
    actions: { "kontakt-telefon": 1, "tale-avspilt": 2 },
  }),
  // A Sunday
  day("2026-09-27", {
    visits: 30,
    deepVisits: 15,
    views: { "/": 25, "/om-oss": 15, "/artikkel/hostfest": 10 },
    entries: { "/": 20, "/om-oss": 10 },
    seconds: { "/": 750, "/om-oss": 900, "/artikkel/hostfest": 900 },
    timed: { "/": 25, "/om-oss": 15, "/artikkel/hostfest": 10 },
    hours: { "10": 30, "9": 20 },
    actions: { "kontakt-epost": 2, "tale-avspilt": 1 },
    sermons: { s1: 1 },
    missing: { "/gammel-lenke": 2, "/index.php": 1 },
  }),
  // A Wednesday
  day("2026-09-30", {
    visits: 20,
    deepVisits: 3,
    views: { "/": 15, "/om-oss": 15 },
    entries: { "/": 20 },
    seconds: { "/": 450, "/om-oss": 900 },
    timed: { "/": 15, "/om-oss": 15 },
    hours: { "19": 30 },
  }),
  // A Sunday. The address that no page answers to any more is one that was opened before the page was removed.
  day("2026-10-04", {
    visits: 40,
    deepVisits: 24,
    views: { "/": 50, "/om-oss": 30, "/artikkel/hostfest": 10, "/slettet-side": 10 },
    entries: { "/": 30, "/om-oss": 10 },
    seconds: { "/": 1500, "/om-oss": 1800, "/artikkel/hostfest": 900, "/slettet-side": 180 },
    timed: { "/": 50, "/om-oss": 30, "/artikkel/hostfest": 10, "/slettet-side": 10 },
    hours: { "10": 60, "9": 30, "20": 10 },
    actions: { "kontakt-telefon": 4, "kalender-abonner": 2, "tale-avspilt": 5 },
    sermons: { s1: 3, s2: 2 },
    missing: { "/gammel-lenke": 3 },
  }),
];

const EXAMPLE_DAY: TrafficDay = { ...day("2026-10-06", { visits: 10, deepVisits: 4, views: { "/": 10 }, hours: { "9": 10 } }), simulated: true };

// One day of visits and nothing else: no earlier period, no starting pages beyond the front page, no actions, no hours.
const SPARSE_DAYS: TrafficDay[] = [day("2026-10-04", { visits: 5, views: { "/": 5 } })];
const FRONT_PAGE_ONLY: TrafficSite = { ...site, pages: [site.pages[0]], news: [] };

// More of everything than the board shows: 19 pages in all, 7 starting pages, 7 articles, 7 sermons and 12 addresses that lead nowhere.
const BUSY_SITE: TrafficSite = {
  settings,
  pages: nums(12).map((n) => page({ id: `side-${n}`, slug: `side-${n}`, title: `Side ${n}` })),
  news: nums(7).map((n) => article({ id: `nyhet-${n}`, title: `Nyhet ${n}` })),
  media: [],
  sermons: nums(7).map((n) => ({ id: `tale-${n}`, title: `Tale ${n}` })),
};
const BUSY_DAYS: TrafficDay[] = [
  day("2026-10-04", {
    visits: 100,
    deepVisits: 50,
    views: {
      ...Object.fromEntries(nums(12).map((n) => [`/side-${n}`, 100 - n])),
      ...Object.fromEntries(nums(7).map((n) => [`/artikkel/nyhet-${n}`, 40 - n])),
    },
    entries: Object.fromEntries(nums(7).map((n) => [`/side-${n}`, 20 - n])),
    sermons: Object.fromEntries(nums(7).map((n) => [`tale-${n}`, 8 - n])),
    missing: Object.fromEntries(nums(12).map((n) => [`/gammel-${n}`, 20 - n])),
  }),
];

/** A website with this many pages, each opened, so the table over pages is exactly that long. */
const withPagesOpened = (count: number): { days: TrafficDay[]; site: TrafficSite } => ({
  site: { ...site, pages: nums(count).map((n) => page({ id: `p${n}`, slug: `p-${n}`, title: `P ${n}` })) },
  days: [day("2026-10-04", { visits: count, views: Object.fromEntries(nums(count).map((n) => [`/p-${n}`, n])) })],
});

const showFeedback = vi.fn();

interface Setup extends Partial<Omit<SiteTrafficBoard, "summary">> {
  /** The days counted. Null is the board before the first fetch is done. */
  days?: TrafficDay[] | null;
  site?: TrafficSite;
}

/** The tab over a board made from the days counted. The board comes back, so a test can see what the tab asked of it. */
function renderTab({ days = COUNTED_DAYS, site: content = site, ...fields }: Setup = {}) {
  const board = {
    error: null,
    counting: true,
    setCounting: vi.fn(async () => true),
    ownVisitsExcluded: false,
    excludeOwnVisits: vi.fn(() => true),
    demo: false,
    reset: vi.fn(async () => 0),
    addExamples: vi.fn(async () => 0),
    removeExamples: vi.fn(async () => 0),
    ...fields,
  };
  // The real summary, made for whichever period the tab asks for
  vi.mocked(useSiteTrafficBoard).mockImplementation((periodId) => ({
    ...board,
    summary: days === null ? null : summarizeTraffic(days, content, periodId, NOW),
  }));
  render(<SiteTrafficTab showFeedback={showFeedback} />);
  return board;
}

const regionOf = (name: string) => screen.getByRole("region", { name });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Besøk på nettsiden: overskrift, perioder og tilstander", () => {
  test("overskriften, forklaringen og periodene står øverst, og det er ingen «Tilpass bordet»", () => {
    renderTab();
    expect(screen.getByRole("heading", { name: "Besøk på nettsiden", level: 1 })).toBeTruthy();
    expect(screen.getByText("Hvor mye nettsiden brukes, hva som leses og når, sammenlignet med perioden før. Besøkene telles anonymt.")).toBeTruthy();

    const periods = within(screen.getByRole("group", { name: "Periode" }));
    expect(periods.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Siste 7 dager",
      "Siste 4 uker",
      "Siste 3 måneder",
      "Siste 12 måneder",
    ]);
    expect(periods.getByRole("button", { name: "Siste 4 uker" }).getAttribute("aria-pressed")).toBe("true");
    expect(periods.getByRole("button", { name: "Siste 7 dager" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: "Tilpass bordet" })).toBeNull();
  });

  test("perioden kan byttes, og søylene følger med: en uke, og fire uker, om gangen", () => {
    renderTab();
    expect(screen.getByText("Én søyle per dag.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siste 3 måneder" }));
    expect(vi.mocked(useSiteTrafficBoard).mock.calls.at(-1)?.[0]).toBe("3m");
    expect(screen.getByRole("button", { name: "Siste 3 måneder" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Siste 4 uker" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Én søyle per uke.")).toBeTruthy();
    // A week is named by its first and last day, and holds the days it covers
    expect(screen.getByRole("button", { name: "9.7.–15.7.: 0 besøk, 0 sidevisninger" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "24.9.–30.9.: 50 besøk, 80 sidevisninger" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1.10.–7.10.: 40 besøk, 100 sidevisninger" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siste 12 måneder" }));
    expect(vi.mocked(useSiteTrafficBoard).mock.calls.at(-1)?.[0]).toBe("12m");
    expect(screen.getByText("Én søyle per fire uker.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "9.10.–5.11.: 0 besøk, 0 sidevisninger" })).toBeTruthy();
  });

  test("delene kommer i rekkefølge fra nøkkeltallene ned til redegjørelsen for tellingen", () => {
    renderTab();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Nøkkeltall",
      "Besøk over tid",
      "Mest besøkte sider",
      "Sider som aldri åpnes",
      "Hvor besøkene starter",
      "Adresser som ikke finnes",
      "Når kommer besøkene?",
      "Fører besøket til noe?",
      "Slik telles besøkene",
    ]);
  });

  test("hver del har sin forklaring under overskriften", () => {
    renderTab();
    const descriptions: [string, string][] = [
      ["Besøk over tid", "Én søyle per dag."],
      ["Mest besøkte sider", "Sidene som er åpnet i perioden, de mest åpnede først."],
      ["Sider som aldri åpnes", "Publiserte sider ingen har åpnet i perioden. Kanskje de er vanskelige å finne, eller ikke trengs."],
      ["Hvor besøkene starter", "Siden et besøk begynner på. Den bør si hvem dere er og vise veien videre."],
      ["Adresser som ikke finnes", "Adresser noen har prøvd å åpne, men som ikke har noen side. Ofte gamle lenker fra søk eller andre nettsteder."],
      ["Når kommer besøkene?", "Sidevisninger fordelt på ukedag og klokkeslett, norsk tid."],
      ["Fører besøket til noe?", "Det besøkende gjør på nettsiden utover å lese."],
      ["Slik telles besøkene", "Hva tallene bygger på, og hva som ikke måles."],
    ];
    for (const [name, text] of descriptions) expect(within(regionOf(name)).getByText(text), name).toBeTruthy();
  });

  test("mens tallene hentes, står det på skjermen, og bare overskriften og periodene vises", () => {
    renderTab({ days: null });
    expect(screen.getByRole("status").textContent).toBe("Henter besøkstallene …");
    expect(screen.getByRole("heading", { name: "Besøk på nettsiden", level: 1 })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Periode" })).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
  });

  test("kan tallene ikke hentes, står grunnen der, og ingenting annet vises, heller ikke tall som er hentet før", () => {
    renderTab({ error: "Ingen tilgang" });
    expect(screen.getByRole("alert").textContent).toBe("Besøkstallene kunne ikke hentes: Ingen tilgang");
    expect(screen.getByRole("heading", { name: "Besøk på nettsiden", level: 1 })).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  const boards: [string, TrafficDay[], TrafficSite][] = [
    ["med tall", COUNTED_DAYS, site],
    ["uten tall", [], site],
    ["med bare litt tall", SPARSE_DAYS, FRONT_PAGE_ONLY],
    ["med mer enn brettet viser", BUSY_DAYS, BUSY_SITE],
  ];
  for (const [label, days, content] of boards) {
    test(`${label}: ingen ugyldige tall og ingen utviklerord på skjermen`, () => {
      renderTab({ days, site: content, demo: true });
      // Something is on the screen, so a clean sweep below means something
      expect(document.body.textContent).toContain("Slik telles besøkene");
      expect(document.body.textContent).not.toMatch(/\bNaN\b|\bundefined\b|\bnull\b|\bInfinity\b|\[object|firestore|\bmock\b/i);
    });
  }
});

describe("Besøk på nettsiden: ingenting er telt ennå", () => {
  const EMPTY_PANEL = "Ingen besøk er telt i perioden";

  test("i produksjon sies det hva som skjer, uten tilbud om eksempeltall, og bare redegjørelsen for tellingen følger", () => {
    renderTab({ days: [] });
    const panel = within(regionOf(EMPTY_PANEL));
    expect(
      panel.getByText("Tellingen går av seg selv fra nettsiden åpnes første gang. Kom tilbake når noen har vært innom, eller velg en lengre periode.")
    ).toBeTruthy();
    expect(screen.queryByText("Vil du se hvordan bordet ser ut med tall?")).toBeNull();
    expect(screen.queryByRole("button", { name: "Legg inn eksempeltall" })).toBeNull();

    for (const name of ["Nøkkeltall", "Besøk over tid", "Mest besøkte sider", "Sider som aldri åpnes", "Når kommer besøkene?", "Fører besøket til noe?"]) {
      expect(screen.queryByRole("region", { name }), name).toBeNull();
    }
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([EMPTY_PANEL, "Slik telles besøkene"]);
  });

  test("i en demonstrasjon spørres det om eksempeltall, og trykket legger dem inn og sier for hvor mange dager", async () => {
    const board = renderTab({ days: [], demo: true, addExamples: vi.fn(async () => 182) });
    const panel = within(regionOf(EMPTY_PANEL));
    expect(panel.getByText("Vil du se hvordan bordet ser ut med tall?")).toBeTruthy();
    // The controls under the board offer the same, so there are two buttons with that name
    expect(screen.getAllByRole("button", { name: "Legg inn eksempeltall" })).toHaveLength(2);

    fireEvent.click(panel.getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltall er lagt inn for 182 dager."));
    expect(board.addExamples).toHaveBeenCalledTimes(1);
  });

  test("er alle dagene talt fra før, sies det at ingenting er lagt inn", async () => {
    renderTab({ days: [], demo: true, addExamples: vi.fn(async () => 0) });
    fireEvent.click(within(regionOf(EMPTY_PANEL)).getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith("Alle dagene har tall fra før, så ingen eksempeltall ble lagt inn.")
    );
  });

  test("feiler det, meldes grunnen som feil", async () => {
    renderTab({ days: [], demo: true, addExamples: vi.fn().mockRejectedValue(new Error("Ingen tilgang")) });
    fireEvent.click(within(regionOf(EMPTY_PANEL)).getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltallene ble ikke lagt inn: Ingen tilgang", "error"));
  });

  test("en feil som ikke har noen tekst, meldes som ukjent feil", async () => {
    renderTab({ days: [], demo: true, addExamples: vi.fn().mockRejectedValue("noe gikk galt") });
    fireEvent.click(within(regionOf(EMPTY_PANEL)).getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltallene ble ikke lagt inn: ukjent feil", "error"));
  });

  test("knappen er låst mens eksempeltallene legges inn", async () => {
    let finish: (days: number) => void = () => {};
    renderTab({ days: [], demo: true, addExamples: vi.fn(() => new Promise<number>((resolve) => (finish = resolve))) });
    const button = within(regionOf(EMPTY_PANEL)).getByRole("button", { name: "Legg inn eksempeltall" }) as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    finish(7);
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltall er lagt inn for 7 dager."));
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});

describe("Besøk på nettsiden: nøkkeltallene", () => {
  /** The tile that has this label: the label sits in a row at the top of its tile. */
  const tile = (label: string) => within(within(regionOf("Nøkkeltall")).getByText(label).parentElement!.parentElement!);

  test("fem tall, hvert med verdi og endring fra perioden før", () => {
    renderTab();
    expect(tile("Besøk").getByText("90")).toBeTruthy();
    expect(tile("Besøk").getByText("+40 fra forrige 4 uker")).toBeTruthy();
    expect(tile("Sidevisninger").getByText("180")).toBeTruthy();
    expect(tile("Sidevisninger").getByText("+105 fra forrige 4 uker")).toBeTruthy();
    expect(tile("Sider per besøk").getByText("2,0")).toBeTruthy();
    expect(tile("Sider per besøk").getByText("+0,5 fra forrige 4 uker")).toBeTruthy();
    expect(tile("Tid per besøk").getByText("1 min 32 sek")).toBeTruthy();
    expect(tile("Tid per besøk").getByText("+42 sek fra forrige 4 uker")).toBeTruthy();
    expect(tile("Besøk med bare én side").getByText("53 %")).toBeTruthy();
    expect(tile("Besøk med bare én side").getByText("−7 prosentpoeng fra forrige 4 uker")).toBeTruthy();
  });

  test("færre som går etter én side er gode nyheter, så den endringen står i fargen for det som er bra", () => {
    renderTab();
    const fall = tile("Besøk med bare én side").getByText("−7 prosentpoeng fra forrige 4 uker");
    expect(fall.closest("p")?.className).toContain("--studio-good");
  });

  test("linjen under tallene sier hvor mange av dagene som har tall, og når tellingen startet", () => {
    renderTab();
    expect(within(regionOf("Nøkkeltall")).getByText("Tall fra 3 av 28 dager. Tellingen startet 6.9.")).toBeTruthy();
  });

  test("uten tall fra perioden før sammenlignes ingenting, og et tall uten grunnlag er en strek", () => {
    renderTab({ days: SPARSE_DAYS, site: FRONT_PAGE_ONLY });
    const figures = within(regionOf("Nøkkeltall"));
    expect(figures.queryByText(/fra forrige 4 uker/)).toBeNull();
    expect(tile("Besøk").getByText("5")).toBeTruthy();
    expect(tile("Tid per besøk").getByText("–")).toBeTruthy();
    expect(figures.getByText("Tall fra 1 av 28 dager. Tellingen startet 4.10.")).toBeTruthy();
  });
});

describe("Besøk på nettsiden: besøk over tid", () => {
  const chart = () => within(within(regionOf("Besøk over tid")).getByRole("group", { name: "Besøk over tid" }));

  test("én søyle per dag, hver med navn, besøk og sidevisninger, også en dag uten besøk", () => {
    renderTab();
    expect(chart().getAllByRole("button")).toHaveLength(28);
    expect(chart().getByRole("button", { name: "4.10.: 40 besøk, 100 sidevisninger" })).toBeTruthy();
    expect(chart().getByRole("button", { name: "27.9.: 30 besøk, 50 sidevisninger" })).toBeTruthy();
    expect(chart().getByRole("button", { name: "10.9.: 0 besøk, 0 sidevisninger" })).toBeTruthy();
  });

  test("tallene vises når musen er over en søyle, eller den har fokus, og forsvinner igjen", () => {
    renderTab();
    const column = chart().getByRole("button", { name: "4.10.: 40 besøk, 100 sidevisninger" });
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.mouseEnter(column);
    const tooltip = within(screen.getByRole("status"));
    expect(tooltip.getByText("4.10.")).toBeTruthy();
    expect(tooltip.getByText("Besøk 40")).toBeTruthy();
    expect(tooltip.getByText("Sidevisninger 100")).toBeTruthy();

    fireEvent.mouseLeave(within(regionOf("Besøk over tid")).getByRole("group", { name: "Besøk over tid" }));
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.focus(column);
    expect(within(screen.getByRole("status")).getByText("Besøk 40")).toBeTruthy();
    fireEvent.blur(column);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Besøk på nettsiden: sidene", () => {
  const pagesTable = () => within(screen.getByRole("table", { name: "Mest besøkte sider" }));
  const rowOf = (title: string) => within(pagesTable().getByText(title).closest("tr")!);
  const bodyRows = (section: HTMLElement) => within(within(section).getByRole("table")).getAllByRole("row").length - 1;

  test("tabellen har sidene med visninger, andel, tid per visning og hvor mange besøk som startet der, de mest åpnede først", () => {
    renderTab();
    expect(pagesTable().getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Side",
      "Visninger",
      "Andel",
      "Tid per visning",
      "Startet her",
    ]);

    const rows = pagesTable().getAllByRole("row").slice(1);
    const order = ["Forsiden", "Om oss", "Høstfest i kirken", "/slettet-side"].map((title) => rows.indexOf(pagesTable().getByText(title).closest("tr")!));
    expect(order).toEqual([0, 1, 2, 3]);

    const front = rowOf("Forsiden");
    expect(front.getByText("/")).toBeTruthy();
    for (const text of ["90", "50 %", "30 sek", "70"]) expect(front.getByText(text), text).toBeTruthy();

    const about = rowOf("Om oss");
    expect(about.getByText("/om-oss")).toBeTruthy();
    for (const text of ["60", "33 %", "1 min", "20"]) expect(about.getByText(text), text).toBeTruthy();

    const news = rowOf("Høstfest i kirken");
    expect(news.getByText("/artikkel/hostfest")).toBeTruthy();
    for (const text of ["20", "11 %", "1 min 30 sek", "0"]) expect(news.getByText(text), text).toBeTruthy();
  });

  test("en adresse som ikke har noen side lenger, har en merkelapp og står med adressen som navn", () => {
    renderTab();
    expect(pagesTable().getAllByText("Finnes ikke lenger")).toHaveLength(1);
    const gone = rowOf("/slettet-side");
    expect(gone.getByText("Finnes ikke lenger")).toBeTruthy();
    for (const text of ["10", "6 %", "18 sek", "0"]) expect(gone.getByText(text), text).toBeTruthy();
    expect(rowOf("Forsiden").queryByText("Finnes ikke lenger")).toBeNull();
  });

  test("ti sider vises først, og de resterende vises og skjules igjen med knappen", () => {
    renderTab({ days: BUSY_DAYS, site: BUSY_SITE });
    const section = regionOf("Mest besøkte sider");
    expect(bodyRows(section)).toBe(10);
    expect(within(section).getByText("Side 10")).toBeTruthy();
    expect(within(section).queryByText("Side 11")).toBeNull();

    fireEvent.click(within(section).getByRole("button", { name: "Vis alle 19 sidene" }));
    expect(bodyRows(section)).toBe(19);
    expect(within(section).getByText("Nyhet 7")).toBeTruthy();

    fireEvent.click(within(section).getByRole("button", { name: "Vis bare de ti første" }));
    expect(bodyRows(section)).toBe(10);
    expect(within(section).getByRole("button", { name: "Vis alle 19 sidene" })).toBeTruthy();
  });

  test("med ti sider er det ingen knapp, og med elleve er det en", () => {
    const ten = withPagesOpened(10);
    renderTab(ten);
    expect(bodyRows(regionOf("Mest besøkte sider"))).toBe(10);
    expect(screen.queryByRole("button", { name: /^Vis alle/ })).toBeNull();
    cleanup();

    renderTab(withPagesOpened(11));
    expect(bodyRows(regionOf("Mest besøkte sider"))).toBe(10);
    expect(screen.getByRole("button", { name: "Vis alle 11 sidene" })).toBeTruthy();
  });

  test("sider som aldri åpnes: de publiserte sidene ingen har åpnet, men ikke en kladd", () => {
    renderTab();
    const items = within(regionOf("Sider som aldri åpnes")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [first, second] = items.map((item) => within(item));
    expect(first.getByText("Barn og unge")).toBeTruthy();
    expect(first.getByText("/barn-og-unge")).toBeTruthy();
    expect(second.getByText("Kontakt")).toBeTruthy();
    expect(second.getByText("/kontakt")).toBeTruthy();
    expect(within(regionOf("Sider som aldri åpnes")).queryByText("Utkast")).toBeNull();
  });

  test("er alle publiserte sider åpnet, står det der i stedet for en liste", () => {
    renderTab({ days: BUSY_DAYS, site: BUSY_SITE });
    const section = within(regionOf("Sider som aldri åpnes"));
    expect(section.getByText("Alle publiserte sider er åpnet i perioden.")).toBeTruthy();
    expect(section.queryByRole("listitem")).toBeNull();
  });

  test("hvor besøkene starter: sidene med antall og andel", () => {
    renderTab();
    const items = within(regionOf("Hvor besøkene starter")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Forsiden")).toBeTruthy();
    expect(items[0].textContent).toContain("70 · 78 %");
    expect(within(items[1]).getByText("Om oss")).toBeTruthy();
    expect(items[1].textContent).toContain("20 · 22 %");
  });

  test("adresser som ikke finnes: adressen og antall forsøk, de mest brukte først", () => {
    renderTab();
    const items = within(regionOf("Adresser som ikke finnes")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("/gammel-lenke")).toBeTruthy();
    expect(within(items[0]).getByText("5 forsøk")).toBeTruthy();
    expect(within(items[1]).getByText("/index.php")).toBeTruthy();
    expect(within(items[1]).getByText("1 forsøk")).toBeTruthy();
  });

  test("uten noe å vise sier hver liste det i stedet for å stå tom", () => {
    renderTab({ days: SPARSE_DAYS, site: FRONT_PAGE_ONLY });
    expect(within(regionOf("Sider som aldri åpnes")).getByText("Alle publiserte sider er åpnet i perioden.")).toBeTruthy();
    expect(within(regionOf("Hvor besøkene starter")).getByText("Ingen besøk er telt i perioden.")).toBeTruthy();
    expect(within(regionOf("Adresser som ikke finnes")).getByText("Ingen har havnet på en adresse som ikke finnes.")).toBeTruthy();
  });

  test("bare de fem første av hvor besøkene starter og de ti første av adressene som ikke finnes vises", () => {
    renderTab({ days: BUSY_DAYS, site: BUSY_SITE });
    const entries = within(regionOf("Hvor besøkene starter"));
    expect(entries.getAllByRole("listitem")).toHaveLength(5);
    expect(entries.getByText("Side 5")).toBeTruthy();
    expect(entries.queryByText("Side 6")).toBeNull();

    const missing = within(regionOf("Adresser som ikke finnes"));
    expect(missing.getAllByRole("listitem")).toHaveLength(10);
    expect(missing.getByText("/gammel-10")).toBeTruthy();
    expect(missing.queryByText("/gammel-11")).toBeNull();
  });
});

describe("Besøk på nettsiden: når kommer besøkene", () => {
  const section = () => within(regionOf("Når kommer besøkene?"));
  const grid = () => within(section().getByRole("table", { name: "Sidevisninger per ukedag og time" }));

  test("det travleste tidspunktet står i en setning", () => {
    renderTab();
    expect(section().getByText("Flest sidevisninger: søndag kl. 10–11 (90).")).toBeTruthy();
  });

  test("er det ingen tidspunkter å si noe om, er det ingen setning", () => {
    renderTab({ days: SPARSE_DAYS, site: FRONT_PAGE_ONLY });
    expect(section().queryByText(/Flest sidevisninger/)).toBeNull();
  });

  test("rutenettet er en tabell med sju ukedager og 24 timer, og hver rute sier hva den viser", () => {
    renderTab();
    expect(grid().getAllByRole("rowheader").map((header) => header.textContent)).toEqual([
      "Mandag",
      "Tirsdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "Lørdag",
      "Søndag",
    ]);
    // Every hour is named for a screen reader, though only some are written out on screen
    expect(grid().getAllByRole("columnheader").map((header) => header.textContent)).toEqual(nums(24).map((n) => String(n - 1)));
    expect(grid().getByText("Søndag kl. 10–11: 90 sidevisninger")).toBeTruthy();
    expect(grid().getByText("Søndag kl. 9–10: 50 sidevisninger")).toBeTruthy();
    expect(grid().getByText("Onsdag kl. 19–20: 30 sidevisninger")).toBeTruthy();
    expect(grid().getByText("Mandag kl. 0–1: 0 sidevisninger")).toBeTruthy();
    expect(grid().getByTitle("Søndag kl. 10–11: 90 sidevisninger")).toBeTruthy();
  });

  test("under rutenettet står sidevisningene per ukedag", () => {
    renderTab();
    const totals = section().getByRole("list");
    expect(within(totals).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Mandag0",
      "Tirsdag0",
      "Onsdag30",
      "Torsdag0",
      "Fredag0",
      "Lørdag0",
      "Søndag150",
    ]);
  });
});

describe("Besøk på nettsiden: fører besøket til noe", () => {
  const section = () => within(regionOf("Fører besøket til noe?"));
  /** The box that has this label: the label is the first line of it. */
  const stat = (label: string) => within(section().getByText(label).parentElement!);
  /** The box under this heading */
  const listUnder = (heading: string) => within(section().getByRole("heading", { name: heading }).parentElement!);

  test("fire handlinger med antall, og antallet i perioden før", () => {
    renderTab();
    expect(stat("Trykk på telefonnummer").getByText("4")).toBeTruthy();
    expect(stat("Trykk på telefonnummer").getByText("Forrige 4 uker: 1")).toBeTruthy();
    expect(stat("Trykk på e-postadresse").getByText("2")).toBeTruthy();
    expect(stat("Trykk på e-postadresse").getByText("Forrige 4 uker: 0")).toBeTruthy();
    expect(stat("Abonner på kalenderen").getByText("2")).toBeTruthy();
    expect(stat("Abonner på kalenderen").getByText("Forrige 4 uker: 0")).toBeTruthy();
    expect(stat("Avspilte taler").getByText("6")).toBeTruthy();
    expect(stat("Avspilte taler").getByText("Forrige 4 uker: 2")).toBeTruthy();
  });

  test("uten tall fra perioden før står det ingen sammenligning", () => {
    renderTab({ days: SPARSE_DAYS, site: FRONT_PAGE_ONLY });
    expect(stat("Trykk på telefonnummer").getByText("0")).toBeTruthy();
    expect(section().queryByText(/Forrige 4 uker/)).toBeNull();
  });

  test("mest leste nyheter og mest avspilte taler, med antall", () => {
    renderTab();
    const news = listUnder("Mest leste nyheter");
    expect(news.getByText("Høstfest i kirken")).toBeTruthy();
    expect(news.getByText("20 visninger")).toBeTruthy();

    const items = listUnder("Mest avspilte taler").getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Tro i hverdagen")).toBeTruthy();
    expect(within(items[0]).getByText("4 avspillinger")).toBeTruthy();
    expect(within(items[1]).getByText("Nåde og tillit")).toBeTruthy();
    expect(within(items[1]).getByText("2 avspillinger")).toBeTruthy();
  });

  test("uten nyheter og taler sier listene det", () => {
    renderTab({ days: SPARSE_DAYS, site: FRONT_PAGE_ONLY });
    expect(listUnder("Mest leste nyheter").getByText("Ingen nyheter er åpnet i perioden.")).toBeTruthy();
    expect(listUnder("Mest avspilte taler").getByText("Ingen taler er spilt av i perioden.")).toBeTruthy();
  });

  test("bare de fem første nyhetene og talene vises", () => {
    renderTab({ days: BUSY_DAYS, site: BUSY_SITE });
    const news = listUnder("Mest leste nyheter");
    expect(news.getAllByRole("listitem")).toHaveLength(5);
    expect(news.getByText("Nyhet 5")).toBeTruthy();
    expect(news.queryByText("Nyhet 6")).toBeNull();

    const sermons = listUnder("Mest avspilte taler");
    expect(sermons.getAllByRole("listitem")).toHaveLength(5);
    expect(sermons.getByText("Tale 5")).toBeTruthy();
    expect(sermons.queryByText("Tale 6")).toBeNull();
  });
});

describe("Besøk på nettsiden: merknader", () => {
  const EXAMPLES_NOTICE = "Perioden inneholder eksempeltall laget for demonstrasjon. De er ikke ekte besøk.";
  const OWN_VISITS_NOTICE = "Besøk fra denne nettleseren telles ikke.";

  test("en periode med eksempeltall sier at de ikke er ekte besøk, og tallene fjernes med knappen", async () => {
    const board = renderTab({ days: [...COUNTED_DAYS, EXAMPLE_DAY], removeExamples: vi.fn(async () => 12) });
    expect(screen.getByText(EXAMPLES_NOTICE)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Fjern eksempeltallene" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltallene er fjernet (12 dager)."));
    expect(board.removeExamples).toHaveBeenCalledTimes(1);
  });

  test("feiler fjerningen, meldes grunnen som feil, og knappen er låst mens den pågår", async () => {
    let fail: (reason: Error) => void = () => {};
    renderTab({ days: [...COUNTED_DAYS, EXAMPLE_DAY], removeExamples: vi.fn(() => new Promise<number>((_resolve, reject) => (fail = reject))) });
    const button = screen.getByRole("button", { name: "Fjern eksempeltallene" }) as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    fail(new Error("Ingen tilgang"));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltallene ble ikke fjernet: Ingen tilgang", "error"));
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  test("uten eksempeltall er det ingen merknad om dem", () => {
    renderTab();
    expect(screen.queryByText(EXAMPLES_NOTICE)).toBeNull();
    expect(screen.queryByRole("button", { name: "Fjern eksempeltallene" })).toBeNull();
  });

  test("eksempeltall i en tom periode får også merknaden, over tomtilstanden", () => {
    // Examples that lie only in the period before fill nothing in this one
    renderTab({ days: [{ ...day("2026-08-20", { visits: 4, views: { "/": 4 } }), simulated: true }] });
    expect(screen.getByText(EXAMPLES_NOTICE)).toBeTruthy();
    expect(regionOf("Ingen besøk er telt i perioden")).toBeTruthy();
  });

  test("når denne nettleserens besøk er holdt utenfor, står det, og avkrysningen er satt", () => {
    renderTab({ ownVisitsExcluded: true });
    expect(screen.getByText(OWN_VISITS_NOTICE)).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: "Ikke tell besøk fra denne nettleseren" }) as HTMLInputElement).checked).toBe(true);
  });

  test("telles besøkene herfra, er det ingen merknad, og avkrysningen er ikke satt", () => {
    renderTab();
    expect(screen.queryByText(OWN_VISITS_NOTICE)).toBeNull();
    expect((screen.getByRole("checkbox", { name: "Ikke tell besøk fra denne nettleseren" }) as HTMLInputElement).checked).toBe(false);
  });
});

describe("Besøk på nettsiden: slik telles besøkene", () => {
  const section = () => within(regionOf("Slik telles besøkene"));

  test("fem punkter sier hva tellingen bygger på og hva som ikke måles", () => {
    renderTab();
    expect(section().getByText("Hva tallene bygger på, og hva som ikke måles.")).toBeTruthy();
    expect(section().getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Nettsiden teller selv hvilken side som vises, når, hvor lenge, og hvilke knapper som trykkes. Bare summer per dag lagres.",
      "Tellingen lagrer ingenting i den besøkendes nettleser og bruker ikke informasjonskapsler. Ingen opplysninger om den besøkende eller utstyret lagres.",
      "Et besøk er én åpning av nettsiden. Kommer samme person tilbake senere, er det et nytt besøk. Nye og faste besøkende kan derfor ikke skilles; det ville krevd samtykke fra hver besøkende.",
      "Tid telles bare mens siden er synlig på skjermen, og høyst 30 minutter per side. Tallene er anslag.",
      "Forhåndsvisninger i admin og søkeroboter telles ikke. Det måles ikke hvor de besøkende kommer fra eller hva slags utstyr de bruker.",
    ]);
  });

  test("valget om å la være å telle denne nettleseren, huskes via brettet, og forklares", () => {
    const board = renderTab();
    const checkbox = section().getByRole("checkbox", { name: "Ikke tell besøk fra denne nettleseren" });
    expect(document.getElementById(checkbox.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "For deg som redigerer nettsiden. Valget huskes i denne nettleseren."
    );

    fireEvent.click(checkbox);
    expect(board.excludeOwnVisits).toHaveBeenCalledWith(true);
    expect(showFeedback).not.toHaveBeenCalled();
  });

  test("er valget satt, tar avkrysningen det bort igjen", () => {
    const board = renderTab({ ownVisitsExcluded: true });
    fireEvent.click(section().getByRole("checkbox", { name: "Ikke tell besøk fra denne nettleseren" }));
    expect(board.excludeOwnVisits).toHaveBeenCalledWith(false);
  });

  test("vil ikke nettleseren huske valget, sies det, så ingen tror besøkene er holdt utenfor", () => {
    renderTab({ excludeOwnVisits: vi.fn(() => false) });
    fireEvent.click(section().getByRole("checkbox", { name: "Ikke tell besøk fra denne nettleseren" }));
    expect(showFeedback).toHaveBeenCalledWith("Nettleseren ville ikke huske valget, så besøkene herfra telles fortsatt.", "error");
  });

  test("i produksjon kan verken eksempeltall legges inn eller tallene nullstilles, og det sies", () => {
    renderTab({ demo: false });
    expect(section().queryByRole("button", { name: "Legg inn eksempeltall" })).toBeNull();
    expect(section().queryByRole("button", { name: "Nullstill besøkstallene" })).toBeNull();
    expect(section().getByText("Appen står i produksjon. Da kan besøkstallene ikke nullstilles.")).toBeTruthy();
  });

  test("i en demonstrasjon kan begge deler, og linjen om produksjon er borte", () => {
    renderTab({ demo: true });
    expect(section().getByRole("button", { name: "Legg inn eksempeltall" })).toBeTruthy();
    expect(section().getByRole("button", { name: "Nullstill besøkstallene" })).toBeTruthy();
    expect(screen.queryByText(/Appen står i produksjon/)).toBeNull();
  });

  test("eksempeltall legges inn også når det er tall fra før, med samme melding", async () => {
    const board = renderTab({ demo: true, addExamples: vi.fn(async () => 182) });
    // The board has numbers, so this is the only button with that name
    fireEvent.click(screen.getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltall er lagt inn for 182 dager."));
    expect(board.addExamples).toHaveBeenCalledTimes(1);
  });
});

describe("Besøk på nettsiden: nullstille besøkstallene", () => {
  const openDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: "Nullstill besøkstallene" }));
    return screen.getByRole("dialog", { name: "Nullstille besøkstallene?" });
  };

  test("det spørres først, og spørsmålet sier hva som slettes og at det ikke kan angres", () => {
    const board = renderTab({ demo: true });
    expect(screen.queryByRole("dialog")).toBeNull();

    const dialog = openDialog();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      within(dialog).getByText("Alle besøk som er telt til nå, slettes, og tellingen starter på nytt. Eksempeltall slettes også. Det kan ikke angres.")
    ).toBeTruthy();
    expect(board.reset).not.toHaveBeenCalled();
  });

  test("«Avbryt» lukker spørsmålet uten at noe slettes eller meldes", () => {
    const board = renderTab({ demo: true });
    fireEvent.click(within(openDialog()).getByRole("button", { name: "Avbryt" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(board.reset).not.toHaveBeenCalled();
    expect(showFeedback).not.toHaveBeenCalled();
  });

  test("Escape er det samme som «Avbryt», og fokus går tilbake til knappen som åpnet spørsmålet", () => {
    const board = renderTab({ demo: true });
    const opener = screen.getByRole("button", { name: "Nullstill besøkstallene" });
    opener.focus();
    const dialog = openDialog();
    // The safe answer has the focus
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Avbryt" }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(board.reset).not.toHaveBeenCalled();
  });

  test("«Ja, nullstill» sletter, melder hvor mange dager som er slettet, og lukker spørsmålet", async () => {
    const board = renderTab({ demo: true, reset: vi.fn(async () => 12) });
    fireEvent.click(within(openDialog()).getByRole("button", { name: "Ja, nullstill" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Besøkstallene er nullstilt (12 dager slettet)."));
    expect(board.reset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("mens det slettes, er begge svar låst, og Escape lukker ikke spørsmålet", async () => {
    let finish: (days: number) => void = () => {};
    renderTab({ demo: true, reset: vi.fn(() => new Promise<number>((resolve) => (finish = resolve))) });
    fireEvent.click(within(openDialog()).getByRole("button", { name: "Ja, nullstill" }));

    const dialog = within(screen.getByRole("dialog"));
    for (const name of ["Avbryt", "Ja, nullstill"]) {
      expect((dialog.getByRole("button", { name }) as HTMLButtonElement).disabled, name).toBe(true);
    }
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    finish(3);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(showFeedback).toHaveBeenCalledWith("Besøkstallene er nullstilt (3 dager slettet).");
  });

  test("feiler slettingen, meldes grunnen som feil, og spørsmålet lukkes", async () => {
    renderTab({ demo: true, reset: vi.fn().mockRejectedValue(new Error("Ingen tilgang")) });
    fireEvent.click(within(openDialog()).getByRole("button", { name: "Ja, nullstill" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Besøkstallene ble ikke nullstilt: Ingen tilgang", "error"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Besøk på nettsiden: menigheten velger selv om besøk telles", () => {
  const section = () => within(regionOf("Slik telles besøkene"));
  const NOTICE = "Tellingen er slått av. Besøk på nettsiden telles ikke.";

  test("tellingen står på, og valget forklares der det gjøres", () => {
    renderTab();
    const checkbox = section().getByRole("checkbox", { name: "Tell besøk på nettsiden" }) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);
    expect(checkbox.getAttribute("aria-describedby")).toBeTruthy();
    expect(section().getByText(/Gjelder alle besøkende\. Slås tellingen av, telles ingenting før den slås på igjen\. Tallene som er telt, blir stående\./)).toBeTruthy();
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  test("slås tellingen av, lagres valget, og det sies hva som skjer", async () => {
    const board = renderTab();
    fireEvent.click(section().getByRole("checkbox", { name: "Tell besøk på nettsiden" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Tellingen er slått av. Besøk telles ikke før den slås på igjen."));
    expect(board.setCounting).toHaveBeenCalledWith(false);
  });

  test("er tellingen av, står det øverst på bordet, og den slås på igjen samme sted", async () => {
    const board = renderTab({ counting: false });
    expect(screen.getByText(NOTICE)).toBeTruthy();
    const checkbox = section().getByRole("checkbox", { name: "Tell besøk på nettsiden" }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Tellingen er slått på. Besøk telles fra nå."));
    expect(board.setCounting).toHaveBeenCalledWith(true);
  });

  test("ble valget ikke lagret, sies det ikke at tellingen er endret", async () => {
    const board = renderTab({ setCounting: vi.fn(async () => false) });
    const checkbox = section().getByRole("checkbox", { name: "Tell besøk på nettsiden" }) as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => expect(board.setCounting).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(checkbox.disabled).toBe(false));
    expect(showFeedback).not.toHaveBeenCalled();
  });

  test("med tellingen av og ingenting telt sier bordet hvorfor det er tomt", () => {
    renderTab({ counting: false, days: [] });
    expect(screen.getByText("Tellingen er slått av. Slå den på under «Slik telles besøkene» for å telle besøk.")).toBeTruthy();
    expect(screen.queryByText(/Tellingen går av seg selv/)).toBeNull();
  });
});

describe("Besøk på nettsiden: ett er ikke flere", () => {
  const one = [
    day("2026-10-04", {
      visits: 1,
      views: { "/artikkel/hostfest": 1 },
      entries: { "/artikkel/hostfest": 1 },
      hours: { 10: 1 },
      actions: { "tale-avspilt": 1 },
      sermons: { s1: 1 },
    }),
  ];

  test("én sidevisning, én visning og én avspilling skrives i entall", () => {
    renderTab({ days: one });

    expect(screen.getByRole("button", { name: "4.10.: 1 besøk, 1 sidevisning" })).toBeTruthy();
    expect(screen.getByText("Søndag kl. 10–11: 1 sidevisning")).toBeTruthy();
    expect(screen.getByText("Mandag kl. 0–1: 0 sidevisninger")).toBeTruthy();
    const actions = within(regionOf("Fører besøket til noe?"));
    expect(actions.getByText("1 visning")).toBeTruthy();
    expect(actions.getByText("1 avspilling")).toBeTruthy();
  });

  test("én dag med eksempeltall lagt inn, fjernet eller nullstilt er én dag", async () => {
    const board = renderTab({
      demo: true,
      days: [{ ...one[0], simulated: true }],
      addExamples: vi.fn(async () => 1),
      removeExamples: vi.fn(async () => 1),
      reset: vi.fn(async () => 1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Fjern eksempeltallene" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltallene er fjernet (1 dag)."));

    fireEvent.click(screen.getByRole("button", { name: "Legg inn eksempeltall" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Eksempeltall er lagt inn for 1 dag."));

    fireEvent.click(screen.getByRole("button", { name: "Nullstill besøkstallene" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ja, nullstill" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Besøkstallene er nullstilt (1 dag slettet)."));
    expect(board.reset).toHaveBeenCalledTimes(1);
  });
});
