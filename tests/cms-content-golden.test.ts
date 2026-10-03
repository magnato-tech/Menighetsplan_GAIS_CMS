import { describe, expect, test } from "vitest";
import golden from "./golden/cms-content.golden.json";
import { parseCmsContent } from "../src/utils/cmsContent";

/**
 * Teksttolkeren ble flyttet fra CmsContentRenderer til src/utils/cmsContent.ts. Fasiten er hva tolkeren
 * ga før flyttingen for 434 tekster: alle sidene og blokkmalene som følger med appen, kantilfeller og 400
 * tilfeldige tekster satt sammen av alle blokktypene (også ulukkede). Den skal ikke endres for å få en
 * test til å gå grønt. Endrer du tolkeren med vilje, ta opp fasiten på nytt og si hvorfor i commit.
 */
describe("Teksttolkeren gir det samme som før flyttingen", () => {
  test("fasiten har alle blokktypene, ellers sier den ikke noe", () => {
    const types = new Set(golden.flatMap((g) => g.blocks.map((b: { type: string }) => b.type)));
    for (const t of ["heading", "callout", "media", "grid", "quote", "cta", "list", "paragraph", "person-grid", "spacer"]) {
      expect(types.has(t), `blokktypen ${t} finnes i fasiten`).toBe(true);
    }
  });

  test(`alle ${golden.length} tekstene gir samme blokker`, () => {
    const different = golden.filter((g) => JSON.stringify(parseCmsContent(g.input)) !== JSON.stringify(g.blocks)).map((g) => g.input);
    expect(different).toEqual([]);
  });
});
