import type { CmsNewsArticle, CmsPage } from "./cmsData";
import { isPagePublished, pageUrl } from "../utils/menu";
import { TRAFFIC_ACTIONS, addDays, emptyTrafficDay, trafficAddress, weekdayOf, type TrafficDay } from "../utils/siteTraffic";

// Example numbers for the board over visits to the website, for showing it before there are
// visits to count. They follow the rhythm of a congregation's week: most on Sunday morning, a
// rise on Saturday evening, the front page first and a tail of pages nobody opens. Every day
// made here is marked, so the examples can be removed again without touching a counted day
// (see addExampleTraffic and removeExampleTraffic in services/siteTraffic.ts).

export interface TrafficSimulationInput {
  /** The days to make numbers for, both included. */
  from: string;
  to: string;
  /** The pages of the website, the front page first and then the most central ones. */
  addresses: string[];
  /** The sermons that can be played, the newest first. */
  sermonIds: string[];
  seed?: number;
}

// Monday first. Sunday is the day people look up the service, Saturday the evening before
const WEEKDAY_WEIGHT = [0.8, 0.85, 0.9, 0.95, 1.0, 1.35, 1.9];

// Where in the day the page views fall, 0 to 23
const WEEKDAY_HOURS = [1, 0, 0, 0, 0, 1, 2, 4, 6, 6, 6, 7, 9, 7, 6, 6, 7, 9, 12, 14, 13, 10, 6, 3];
const SUNDAY_HOURS = [1, 0, 0, 0, 0, 1, 3, 8, 16, 18, 12, 6, 5, 6, 6, 5, 5, 6, 8, 10, 10, 8, 5, 2];

/** Addresses nobody has a page for. Old links are what such hits usually are. */
const OLD_LINKS = ["/index.php", "/kontakt-oss.html", "/nyheter/arkiv"];

/** A small generator of numbers between 0 and 1 that gives the same row for the same seed. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Spreads a whole number over weights, as whole numbers that add up to it. */
function spread(total: number, weights: number[], random: () => number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!(sum > 0) || total <= 0) return weights.map(() => 0);
  const parts = weights.map((weight) => Math.floor((total * weight) / sum));
  let rest = total - parts.reduce((a, b) => a + b, 0);
  while (rest > 0) {
    // What rounding left over goes where the weight is, one at a time
    let pick = random() * sum;
    const index = weights.findIndex((weight) => (pick -= weight) < 0);
    parts[index === -1 ? 0 : index] += 1;
    rest -= 1;
  }
  return parts;
}

/** One day of example numbers for every day from `from` to `to`. The same input gives the same numbers. */
export function simulateSiteTraffic(input: TrafficSimulationInput): TrafficDay[] {
  const random = seeded(input.seed ?? 20261007);
  const between = (low: number, high: number) => low + random() * (high - low);
  const addresses = input.addresses.length > 0 ? input.addresses : ["/"];
  // The last quarter of the pages is never opened, which is what the board is there to show
  const opened = addresses.slice(0, Math.max(1, Math.ceil(addresses.length * 0.75)));
  // Each page after the front page gets less than the one before, and the front page a third of it all
  const others = opened.slice(1).map((_, index) => 1 / (index + 1.6));
  const pageWeights = [others.reduce((a, b) => a + b, 0) / 2 || 1, ...others];
  // Two of three visits start on the front page, the rest on the pages just after it
  const entryWeights = opened.map((_, index) => (index === 0 ? 5 : index < 6 ? 1 / index : 0));
  // How long a page holds its reader differs from page to page, but stays the same from day to day
  const secondsPerView = opened.map(() => between(18, 95));

  const days: TrafficDay[] = [];
  const length = Math.round((Date.parse(`${input.to}T00:00:00Z`) - Date.parse(`${input.from}T00:00:00Z`)) / 86400000) + 1;
  for (let index = 0; index < length; index++) {
    const date = addDays(input.from, index);
    const weekday = weekdayOf(date);
    // A slow rise through the period, as when a new website becomes known
    const growth = 0.8 + 0.4 * (length > 1 ? index / (length - 1) : 1);
    const visits = Math.max(3, Math.round(38 * WEEKDAY_WEIGHT[weekday] * growth * between(0.8, 1.2)));
    const views = Math.round(visits * between(1.9, 2.6));

    const day = emptyTrafficDay(date);
    day.simulated = true;
    day.visits = visits;
    day.deepVisits = Math.round(visits * between(0.42, 0.58));

    spread(views, pageWeights, random).forEach((value, page) => {
      if (value === 0) return;
      const address = opened[page];
      day.views[address] = value;
      day.seconds[address] = Math.max(1, Math.round(value * secondsPerView[page] * between(0.85, 1.15)));
    });
    spread(visits, entryWeights, random).forEach((value, page) => {
      // A visit can only start on a page that was opened that day
      if (value > 0 && day.views[opened[page]]) day.entries[opened[page]] = Math.min(value, day.views[opened[page]]);
    });
    spread(views, weekday === 6 ? SUNDAY_HOURS : WEEKDAY_HOURS, random).forEach((value, hour) => {
      if (value > 0) day.hours[String(hour)] = value;
    });

    const [phone, mail, calendar, sermon] = TRAFFIC_ACTIONS.map((action) => action.id);
    const pressed = (share: number) => Math.round(visits * share * between(0.4, 1.6));
    for (const [id, value] of [
      [phone, pressed(0.02)],
      [mail, pressed(0.015)],
      [calendar, pressed(0.008)],
    ] as const) {
      if (value > 0) day.actions[id] = value;
    }
    const plays = input.sermonIds.length > 0 ? pressed(0.06) : 0;
    if (plays > 0) {
      day.actions[sermon] = plays;
      // The newest sermon is the one most played
      const recent = input.sermonIds.slice(0, 6);
      spread(plays, recent.map((_, rank) => 1 / (rank + 1)), random).forEach((value, rank) => {
        if (value > 0) day.sermons[recent[rank]] = value;
      });
    }
    if (random() < 0.3) {
      const address = OLD_LINKS[Math.floor(random() * OLD_LINKS.length)];
      day.missing[address] = 1 + Math.floor(random() * 2);
    }
    days.push(day);
  }
  return days;
}

/**
 * The addresses example numbers are made for, the most central first: the front page, the
 * pages in the menu, the newest articles, and then the rest. Only what is published, so the
 * examples never point at a page a visitor could not have opened.
 */
export function exampleAddresses(site: { pages: CmsPage[]; news: CmsNewsArticle[] }, now: Date = new Date()): string[] {
  const placeOf = (page: CmsPage) => page.menuOrder ?? page.navOrder ?? 99;
  const isSubPage = (page: CmsPage) => Boolean(page.parentPageId ?? page.parentId);
  const pages = site.pages
    .filter((page) => isPagePublished(page, now))
    .sort(
      (a, b) =>
        Number(a.inNavMenu === false) - Number(b.inNavMenu === false) ||
        Number(isSubPage(a)) - Number(isSubPage(b)) ||
        placeOf(a) - placeOf(b) ||
        a.title.localeCompare(b.title, "nb")
    )
    .map((page) => pageUrl(page))
    // A menu entry that leads out of the website is not a page of it
    .filter((url) => url.startsWith("/"))
    .map(trafficAddress);
  const articles = site.news
    .filter((article) => article.isPublished !== false)
    .slice(0, 3)
    .map((article) => `/artikkel/${article.id}`);
  return [...new Set(["/", ...pages.slice(0, 6), ...articles, ...pages.slice(6)])];
}
