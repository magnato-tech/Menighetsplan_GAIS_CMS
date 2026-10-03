// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/gathering-view.golden.json";
import { runGatheringView } from "./support/gatheringViewHarness";

/**
 * Siden for én samling (kjøreplan, bemanning og «hvem gjør hva») ble delt i mindre deler (topp, bemanningsstatus,
 * filter, kjøreplan, tilgangsmelding og to hooks). Her kjøres den gjennom de samme trinnene som koden fra før
 * delingen: leder-, nestleder- og adminvisning, alle filtre, statusendring og fjerning av personer (som lykkes
 * og som feiler), alle dialogene og hva de åpnes med, bemanningsstatus i alle tilstander, og samling som mangler
 * eller uten tilgang. Dialogene er byttet ut med stand-ins som viser hva de får. Etter hvert trinn må utseendet
 * (som sjekksum av HTML-en) og det som meldes ut være det samme.
 * Fasiten i tests/golden/gathering-view.golden.json skal ikke endres for å få en test til å gå grønt.
 */

let actual: typeof golden;
beforeAll(async () => {
  actual = JSON.parse(JSON.stringify(await runGatheringView(join(__dirname, ".."))));
}, 90000);

describe("Samlingssiden gjør det samme som før", () => {
  test.each(golden.steps.map((s, i) => [i, s.step] as const))("trinn %i: %s", (i) => {
    expect(actual.steps[i]).toEqual(golden.steps[i]);
  });

  test("fasiten dekker det den skal", () => {
    const names = golden.steps.map((s) => s.step);
    for (const needed of [
      "leader: needs action", "status changed: withdrawn", "status change fails and tells why, menu stays", "person removed",
      "instruction dialog for a programme item with a task", "admin: initial", "edit task dialog (defaults: need 1, empty texts)",
      "banner: fully staffed", "banner: two tasks need follow-up", "no tasks and no programme", "gathering not found", "no access as admin",
    ]) {
      expect(names).toContain(needed);
    }
  });
});
