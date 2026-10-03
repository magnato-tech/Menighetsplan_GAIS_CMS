import { describe } from "vitest";
import { assert } from "./assert";
import {
  appendBlock,
  menuOrderOf,
  parentIdOf,
  presetPublishTime,
  publishState,
  toDatetimeLocal,
  withMenuOrder,
  withParent,
  withPublishTime,
  withoutPublishTime,
} from "../src/utils/pageEdit";

// Wednesday 7 October 2026, 12:00 local time
const NOW = new Date(2026, 9, 7, 12, 0, 0);
const local = (iso: string) => {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getDay(), d.getHours(), d.getMinutes()].join("-");
};

describe("Sideredigering: tidspunkt", () => {
  assert(toDatetimeLocal(undefined) === "" && toDatetimeLocal("ikke en dato") === "", "Manglende eller ugyldig tid gir tomt felt");
  assert(toDatetimeLocal(new Date(2026, 0, 5, 9, 7).toISOString()) === "2026-01-05T09:07", "Tid vises i feltets format, med null foran");

  assert(local(presetPublishTime("tomorrow", NOW)) === "2026-10-8-4-9-0", "I morgen kl. 09:00");
  assert(local(presetPublishTime("sunday", NOW)) === "2026-10-11-0-8-0", "Kommende søndag kl. 08:00");
  assert(local(presetPublishTime("monday", NOW)) === "2026-10-12-1-9-0", "Neste mandag kl. 09:00");
  const sunday = new Date(2026, 9, 11, 12, 0, 0);
  assert(local(presetPublishTime("sunday", sunday)) === "2026-10-18-0-8-0", "På en søndag er «søndag» neste uke");
  const monday = new Date(2026, 9, 12, 12, 0, 0);
  assert(local(presetPublishTime("monday", monday)) === "2026-10-19-1-9-0", "På en mandag er «mandag» neste uke");
});

describe("Sideredigering: publisering", () => {
  const now = NOW.getTime();
  const later = new Date(2026, 9, 20, 9, 0).toISOString();
  const earlier = new Date(2026, 9, 1, 9, 0).toISOString();

  assert(publishState({}, now).isManuallyPublished, "En side uten noe satt er publisert");
  assert(publishState({ isPublished: false }, now).isDraft, "isPublished av gir kladd");
  assert(publishState({ isPublished: true, publishAt: later }, now).isFutureScheduled, "Publisert med tid fram i tid er planlagt");
  assert(!publishState({ isPublished: true, publishAt: later }, now).isManuallyPublished, "Planlagt er ikke publisert ennå");
  assert(publishState({ isPublished: true, publishAt: earlier }, now).isManuallyPublished, "En tid som er passert gir publisert side");
  assert(!publishState({ isPublished: false, publishAt: later }, now).isFutureScheduled, "En kladd er aldri planlagt");

  const scheduled = withPublishTime({ isPublished: false, title: "A" }, later, now);
  assert(scheduled.status === "scheduled" && scheduled.isPublished === true, "Tid fram i tid slår på publisering og gir status planlagt");
  assert(scheduled.publishAt === scheduled.publishedAt && scheduled.title === "A", "Begge tidsfeltene settes, resten beholdes");
  assert(withPublishTime({}, earlier, now).status === "published", "Tid som er passert gir status publisert");
  assert(withPublishTime({ title: "A" }, "ikke en dato", now).title === "A" && withPublishTime({}, "ikke en dato", now).publishAt === undefined, "Ugyldig tid endrer ingenting");
  const cleared = withPublishTime({ publishAt: later, publishedAt: later }, "", now);
  assert(cleared.publishAt === undefined && cleared.publishedAt === undefined, "Tomt felt fjerner tidsplanen");
  assert(withoutPublishTime({ publishAt: later, publishedAt: later, isPublished: true }).isPublished === true, "Fjernet tidsplan lar publisering stå");
});

describe("Sideredigering: meny", () => {
  assert(parentIdOf({}) === null, "Ingen forelder er toppnivå");
  assert(parentIdOf({ parentId: "a" }) === "a", "Eldre felt for forelder leses");
  assert(parentIdOf({ parentPageId: "b", parentId: "a" }) === "b", "Det nye feltet går foran");
  assert(parentIdOf({ parentPageId: null, parentId: "a" }) === null, "Et nytt felt satt til ingen går foran det gamle");
  const moved = withParent({}, "x");
  assert(moved.parentPageId === "x" && moved.parentId === "x", "Begge forelder-feltene holdes like");
  assert(withParent(moved, "").parentPageId === null && withParent(moved, "").parentId === null, "Tom forelder gir toppnivå i begge");

  assert(menuOrderOf({}) === 1 && menuOrderOf({ navOrder: 4 }) === 4 && menuOrderOf({ menuOrder: 2, navOrder: 4 }) === 2, "Rekkefølge: standard 1, eldre felt, nytt felt først");
  assert(withMenuOrder({}, 3).menuOrder === 3 && withMenuOrder({}, 3).navOrder === 3, "Begge rekkefølge-feltene holdes like");
});

describe("Sideredigering: innholdsblokker", () => {
  assert(appendBlock(undefined, ":::stab") === ":::stab", "Første blokk i en tom side");
  assert(appendBlock("Tekst", "B") === "Tekst\n\nB", "En blank linje mellom tekst og blokk");
  assert(appendBlock("Tekst\n", "B") === "Tekst\n\nB", "Slutter teksten på linjeskift, legges ett til");
  assert(appendBlock("Tekst\n\n", "B") === "Tekst\n\nB", "Er det allerede en blank linje, legges ingen til");
});
