// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/screens.golden.json";
import { runAllScreens } from "./support/screenHarness";

/**
 * Personkortet, gruppekortet, sideredigeringen og databasefanen ble delt i mindre deler uten at de skulle
 * oppføre seg annerledes. Her kjøres de gjennom de samme scenariene som koden fra før oppdelingen, og
 * resultatet må være det samme: hva som lagres, hvilke meldinger brukeren får og hva feltene inneholder.
 * Fasiten i tests/golden/screens.golden.json er tatt opp fra den gamle koden og skal ikke endres for å få
 * en test til å gå grønt. Endrer du en skjerm med vilje, ta opp fasiten på nytt og si hvorfor i commit.
 */

type Golden = typeof golden;
let actual: Golden;

beforeAll(async () => {
  actual = (await runAllScreens(join(__dirname, ".."))) as unknown as Golden;
}, 120000);

describe("Personkortet gjør det samme som før", () => {
  test.each(Object.keys(golden.person))("%s", (name) => {
    expect(actual.person[name as keyof Golden["person"]]).toEqual(golden.person[name as keyof Golden["person"]]);
  });
});

describe("Gruppekortet gjør det samme som før", () => {
  test.each(Object.keys(golden.group))("%s", (name) => {
    expect(actual.group[name as keyof Golden["group"]]).toEqual(golden.group[name as keyof Golden["group"]]);
  });
});

describe("Sideredigeringen gjør det samme som før", () => {
  test.each(Object.keys(golden.pageEditor))("%s", (name) => {
    expect(actual.pageEditor[name as keyof Golden["pageEditor"]]).toEqual(golden.pageEditor[name as keyof Golden["pageEditor"]]);
  });
});

describe("Databasefanen gjør det samme som før", () => {
  test("de samme valgene gir de samme skrivingene, meldingene og tallene", () => {
    expect(actual.database).toEqual(golden.database);
  });
  test("fasiten dekker det den skal: fylling med tre ulike oppsett, tømming, sletting og begge modulbryterne", () => {
    const names = golden.database.calls.map((c) => c[0]);
    expect(names).toEqual(["populate", "populate", "populate", "clearPlanner", "deleteAll", "toggleKalender", "toggleMeldinger"]);
  });
});
