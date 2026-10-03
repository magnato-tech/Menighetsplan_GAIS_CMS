// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/group-activities.golden.json";
import { runGroupActivities } from "./support/groupActivitiesHarness";

/**
 * Gruppens liste over planlagte aktiviteter ble delt i mindre deler (filter, kort, oppgaver, tabell og en
 * hook for visningsvalgene). Her kjøres den gjennom de samme trinnene som koden fra før delingen: filtrere på
 * måned og status, åpne kort, tildele direkte (som lykkes og som feiler), bytte til tabell, «Tildel vikar»,
 * åpne en aktivitet, uten lederadgang og uten aktiviteter. Etter hvert trinn må utseendet (som sjekksum av
 * HTML-en) og det som meldes ut være det samme.
 * Fasiten i tests/golden/group-activities.golden.json skal ikke endres for å få en test til å gå grønt.
 */

let actual: typeof golden;
beforeAll(async () => {
  actual = JSON.parse(JSON.stringify(await runGroupActivities(join(__dirname, ".."))));
}, 60000);

describe("Gruppens aktiviteter gjør det samme som før", () => {
  test.each(golden.steps.map((s, i) => [i, s.step] as const))("trinn %i: %s", (i) => {
    expect(actual.steps[i]).toEqual(golden.steps[i]);
  });

  test("tildelinger og meldinger kommer i samme rekkefølge med samme tekst", () => {
    expect(actual.calls).toEqual(golden.calls);
    expect(golden.calls.map((c) => c[0])).toEqual(["assign", "toast", "assign", "toast", "assign", "toast"]);
  });

  test("fasiten dekker det den skal", () => {
    const names = golden.steps.map((s) => s.step);
    for (const needed of ["urgent shortcut resets month and filters red", "assigned directly closes the drawer", "failed assignment keeps the drawer", "table: assign substitute goes to cards with the drawer open", "no access: table has no assign button", "all covered banner"]) {
      expect(names).toContain(needed);
    }
  });
});
