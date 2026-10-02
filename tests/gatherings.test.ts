import { describe } from "vitest";
import { assert } from "./assert";
import { pickHighlight, upcomingPublicGatherings } from "../src/utils/gatherings";
import type { Gathering } from "../src/types";

describe("Samlinger på den offentlige nettsiden", () => {
  const now = new Date("2026-10-02T12:00:00.000Z").getTime();
  const inHours = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();
  const gathering = (id: string, hoursAhead: number, extra: Partial<Gathering> = {}): Gathering => ({
    id,
    groupId: "group-1",
    title: id,
    startsAt: inHours(hoursAhead),
    visibility: "offentlig",
    isGudstjeneste: false,
    ...extra,
  });
  const ids = (list: Gathering[]) => list.map((g) => g.id).join(",");

  // 1. What lies ahead
  const mixed = [
    gathering("om-to-uker", 14 * 24),
    gathering("i-morgen", 24),
    gathering("i-gaar", -24),
    gathering("intern", 48, { visibility: "intern" }),
    gathering("gammel-skjult", 72, { visibility: undefined as unknown as Gathering["visibility"], isPublic: false }),
    gathering("avlyst", 36, { cancelled: true }),
  ];
  assert(
    ids(upcomingPublicGatherings(mixed, now)) === "i-morgen,avlyst,om-to-uker",
    "Kommende offentlige samlinger, den nærmeste først; avlyste er med, så de kan vises som avlyst"
  );
  assert(ids(upcomingPublicGatherings(mixed, now - 48 * 60 * 60 * 1000)).startsWith("i-gaar"), "Grensen for hva som er kommende bestemmes av kalleren");
  assert(ids(mixed).startsWith("om-to-uker"), "Listen som sendes inn blir ikke sortert om");

  // 2. The front page: a featured gathering first, then the next worship service, then whatever is next
  const pick = (list: Gathering[]) => {
    const highlight = pickHighlight(list, now);
    return highlight ? `${highlight.kind}:${highlight.gathering.id}` : "ingen";
  };
  const service = gathering("gudstjeneste", 48, { isGudstjeneste: true });
  const concert = gathering("konsert", 24);
  const christmas = gathering("julekonsert", 60 * 24, { visibility: "fremhevet" });

  assert(pick([service, concert]) === "worship:gudstjeneste", "Uten fremhevet samling løftes neste gudstjeneste fram, også når noe annet kommer før");
  assert(pick([concert]) === "next:konsert", "Uten gudstjeneste løftes det som kommer først");
  assert(pick([service, concert, christmas]) === "featured:julekonsert", "En fremhevet samling går foran, selv om den ligger langt fram");
  assert(
    pick([christmas, gathering("hostfest", 72, { visibility: "fremhevet" })]) === "featured:hostfest",
    "Av flere fremhevede løftes den nærmeste"
  );
  assert(pick([]) === "ingen", "Uten samlinger er det ingenting å løfte fram");
  assert(pick([gathering("intern", 24, { visibility: "intern", isGudstjeneste: true })]) === "ingen", "En intern samling løftes aldri fram");

  // 3. What is not lifted up
  assert(
    pick([gathering("avlyst", 24, { isGudstjeneste: true, cancelled: true }), service]) === "worship:gudstjeneste",
    "En avlyst gudstjeneste hoppes over"
  );
  assert(
    pick([gathering("avlyst", 24, { visibility: "fremhevet", cancelled: true }), concert]) === "next:konsert",
    "En avlyst fremhevet samling løftes heller ikke fram"
  );
  assert(
    pick([gathering("i-fjor", -365 * 24, { visibility: "fremhevet" }), service]) === "worship:gudstjeneste",
    "En fremhevet samling som er over, slipper taket"
  );

  // 4. A service that has just begun is still the one to show
  assert(pick([gathering("paagaar", -2, { isGudstjeneste: true }), concert]) === "worship:paagaar", "En gudstjeneste som startet for to timer siden vises fortsatt");
  assert(pick([gathering("ferdig", -5, { isGudstjeneste: true }), concert]) === "next:konsert", "Etter fire timer er den over");
});
