// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/page-tree.golden.json";
import { runPageTree, runPageTreeWithoutCallbacks } from "./support/pageTreeHarness";

/**
 * Sidetreet i admin ble delt i mindre deler (rekker, statusmerke, flytteknapper og en hook for dra og
 * slipp). Her kjøres det gjennom de samme trinnene som koden fra før delingen: flytting med piler, dra og
 * slipp på riktig og feil nivå, publisering, redigering, sletting og forhåndsvisning. Etter hvert trinn
 * må både det som meldes ut og utseendet (som sjekksum av HTML-en) være det samme.
 * Fasiten i tests/golden/page-tree.golden.json skal ikke endres for å få en test til å gå grønt.
 */

let actual: typeof golden;
beforeAll(async () => {
  const root = join(__dirname, "..");
  actual = JSON.parse(JSON.stringify({ main: await runPageTree(root), withoutCallbacks: await runPageTreeWithoutCallbacks(root) }));
}, 60000);

describe("Sidetreet gjør det samme som før", () => {
  test.each(golden.main.steps.map((s, i) => [i, s.step] as const))("trinn %i: %s", (i) => {
    expect(actual.main.steps[i]).toEqual(golden.main.steps[i]);
  });

  test("alle kall til sidene rundt kommer i samme rekkefølge med samme innhold", () => {
    expect(actual.main.calls).toEqual(golden.main.calls);
  });

  test("uten valgfrie funksjoner vises ingen forhåndsvisning, flytting gjør ingenting, og sletting virker", () => {
    expect(actual.withoutCallbacks).toEqual(golden.withoutCallbacks);
    expect(golden.withoutCallbacks.hadPreview).toBe(false);
  });

  test("fasiten dekker det den skal: piler, dra og slipp på begge nivåer, og alle knappene", () => {
    const names = golden.main.steps.map((s) => s.step);
    for (const needed of ["move first top down", "dropped before first", "sub dropped after third", "sub across parents: ignored", "top onto sub: ignored", "status toggles"]) {
      expect(names).toContain(needed);
    }
    const kinds = new Set(golden.main.calls.map((c) => c[0]));
    expect([...kinds].sort()).toEqual(["delete", "edit", "new", "preview", "reorder", "toggle"]);
  });
});
