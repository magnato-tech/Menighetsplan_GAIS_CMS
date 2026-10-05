import { describe } from "vitest";
import { assert } from "./assert";
import {
  MAX_HEADCOUNT,
  canRegisterHeadcount,
  headcountIdFor,
  headcountTotal,
  parseHeadcountForm,
} from "../src/utils/headcount";
import { buildHeadcount } from "../src/data/newDocuments";

describe("Oppmøtetall", () => {
  const now = new Date("2026-10-05T12:00:00.000Z").getTime();
  const past = "2026-10-04T09:00:00.000Z";
  const future = "2026-10-11T09:00:00.000Z";

  // 1. When a count can be registered
  assert(canRegisterHeadcount({ startsAt: past, type: "arrangement" }, now), "En holdt samling kan få oppmøtetall");
  assert(!canRegisterHeadcount({ startsAt: future, type: "arrangement" }, now), "En samling som ikke har vært ennå kan ikke telles");
  assert(!canRegisterHeadcount({ startsAt: past, type: "arrangement", cancelled: true }, now), "En avlyst samling kan ikke telles");
  assert(
    !canRegisterHeadcount({ startsAt: past, type: "gruppesamling" }, now),
    "En gruppesamling følges med svarene, ikke med oppmøtetall"
  );
  assert(!canRegisterHeadcount({ startsAt: "ikke en dato" }, now), "En samling uten gyldig dato kan ikke telles");

  // 2. Reading the form
  const ok = parseHeadcountForm(" 84 ", "21", "  Dåp ");
  assert(ok.ok && ok.value.adults === 84 && ok.value.children === 21 && ok.value.note === "Dåp", "Tallene og merknaden leses og trimmes");
  const noChildren = parseHeadcountForm("40", "");
  assert(noChildren.ok && noChildren.value.children === 0 && !("note" in noChildren.value), "Et tomt felt teller som 0, og tom merknad lagres ikke");
  const nobody = parseHeadcountForm("", "0");
  assert(!nobody.ok && nobody.error === "Skriv inn hvor mange som var til stede.", "En telling uten noen til stede avvises");
  const negative = parseHeadcountForm("-3", "2");
  assert(!negative.ok && negative.error.startsWith("Voksne"), "Negative tall avvises, og feilen sier hvilket felt");
  const decimal = parseHeadcountForm("10", "2,5");
  assert(!decimal.ok && decimal.error.startsWith("Barn"), "Desimaltall avvises");
  const huge = parseHeadcountForm(String(MAX_HEADCOUNT + 1), "0");
  assert(!huge.ok, "Urimelig store tall avvises");

  // 3. One count per gathering
  assert(headcountIdFor("gathering-1") === "headcount-gathering-1", "ID-en lages av samlingen");
  const built = buildHeadcount("gathering-1", { adults: 50, children: 12, note: " " }, "person-1");
  assert(built.id === headcountIdFor("gathering-1"), "En ny telling for samme samling får samme ID og erstatter den gamle");
  assert(built.note === undefined && built.registeredBy === "person-1", "Tom merknad lagres ikke; hvem som registrerte lagres");
  assert(!Number.isNaN(Date.parse(built.registeredAt)), "Tidspunktet for registreringen lagres");
  assert(headcountTotal(built) === 62, "Totalen er voksne og barn sammen");
});
