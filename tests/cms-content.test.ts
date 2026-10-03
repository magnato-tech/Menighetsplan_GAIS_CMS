import { describe } from "vitest";
import { assert } from "./assert";
import { parseCmsContent } from "../src/utils/cmsContent";

const types = (text: string) => parseCmsContent(text).map((b) => b.type).join(",");

describe("Innholdsblokkene på en CMS-side", () => {
  assert(types("") === "" && types("  \n ") === "", "Tom tekst gir ingen blokker");
  assert(types("Hei") === "paragraph", "Vanlig tekst blir et avsnitt");
  assert(types("# En\n## To\n### Tre") === "heading,heading,heading", "Overskrifter på tre nivåer");
  assert(
    JSON.stringify(parseCmsContent("## To")[0]) === JSON.stringify({ type: "heading", level: 2, text: "To" }),
    "Overskriften beholder nivå og tekst"
  );
  assert(types("- a\n- b\n\nTekst") === "list,spacer,paragraph", "En punktliste er én blokk, og en tom linje gir luft");
  assert(types("> sitat") === "quote", "En linje med > er et sitat");
  assert(types(":::cta[Gi en gave](/gaver)") === "cta", "En knapp");
  assert(types(":::personer[stab]") === "person-grid", "En personblokk");
  assert(
    JSON.stringify(parseCmsContent(":::personer[kategori=pastor]")[0]) ===
      JSON.stringify({ type: "person-grid", filter: "kategori=pastor" }),
    "Personblokken husker filteret"
  );
  assert(types("# Hei\n:::lederskap\nTekst") === "heading,person-grid,paragraph", "Blokker kommer i den rekkefølgen de står");
});
