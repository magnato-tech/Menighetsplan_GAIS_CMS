// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/group-chat.golden.json";
import { runGroupChat } from "./support/groupChatHarness";

/**
 * Gruppens samtalerom ble delt i mindre deler (topp, meldingsliste, boble, lenker, skrivefelt, bilde og
 * sletting). Her kjøres det gjennom de samme trinnene som koden fra før delingen: uten gruppe og uten
 * medlemskap, tomt rom, meldinger med lenker og YouTube, varsler, sending med Enter og knapp, feil ved
 * sending, bilde som er for stort eller vedlagt, forstørret bilde og sletting. Etter hvert trinn må utseendet
 * (som sjekksum av HTML-en) og det som sendes og slettes være det samme.
 * Fasiten i tests/golden/group-chat.golden.json skal ikke endres for å få en test til å gå grønt.
 */

let actual: typeof golden;
beforeAll(async () => {
  actual = JSON.parse(JSON.stringify(await runGroupChat(join(__dirname, ".."))));
}, 60000);

describe("Samtalerommet gjør det samme som før", () => {
  test.each(golden.steps.map((s, i) => [i, s.step] as const))("trinn %i: %s", (i) => {
    expect(actual.steps[i]).toEqual(golden.steps[i]);
  });

  test("fasiten dekker det den skal", () => {
    const names = golden.steps.map((s) => s.step);
    for (const needed of [
      "not a member", "links", "enter sends and clears", "failed send keeps the text and tells why", "picture over 5 MB is refused",
      "a picture can be sent alone", "picture opened in lightbox", "delete confirmed tells it was deleted", "failed delete tells why",
    ]) {
      expect(names).toContain(needed);
    }
  });
});
