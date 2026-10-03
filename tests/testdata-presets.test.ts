import { describe } from "vitest";
import { assert } from "./assert";
import {
  DEFAULT_TESTDATA_PRESET,
  TESTDATA_PRESETS,
  TESTDATA_SLIDERS,
  includedSummary,
  matchingPresetId,
  sizeOfPreset,
} from "../src/utils/testdataPresets";

describe("Testdata: pakker og glidebrytere", () => {
  const full = sizeOfPreset(DEFAULT_TESTDATA_PRESET);

  assert(DEFAULT_TESTDATA_PRESET.id === "full", "Fullskala er valgt når fanen åpnes");
  assert(Object.keys(full).sort().join(",") === "gatheringCount,groupCount,personCount,taskCount", "Størrelsen har bare de fire tallene, ikke navn og beskrivelse");
  assert(new Set(TESTDATA_PRESETS.map((p) => p.id)).size === TESTDATA_PRESETS.length, "Pakkene har hver sin id");

  assert(
    TESTDATA_PRESETS.every((p) =>
      TESTDATA_SLIDERS.every((s) => p[s.field] >= s.min && p[s.field] <= s.max)
    ),
    "Hver pakke ligger innenfor glidebryternes område"
  );
  assert(
    TESTDATA_SLIDERS.every((s) => s.min < s.max && s.marks.length === 3),
    "Hver glidebryter har et område og tre merker"
  );
  assert(
    TESTDATA_SLIDERS.find((s) => s.field === "personCount")?.max === full.personCount &&
      TESTDATA_SLIDERS.find((s) => s.field === "taskCount")?.max === full.taskCount,
    "Største pakke er glidebryternes maks"
  );

  assert(TESTDATA_PRESETS.every((p) => matchingPresetId(sizeOfPreset(p)) === p.id), "Størrelsen til en pakke kjennes igjen som pakken");
  assert(matchingPresetId({ ...full, personCount: 20 }) === "custom", "En størrelse som ikke er en pakke er egendefinert");
  const compact = sizeOfPreset(TESTDATA_PRESETS[0]);
  assert(matchingPresetId({ ...full, ...compact }) === "compact", "Glir alle fire til en pakkes verdier, er pakken valgt");

  assert(includedSummary(32).includes("hele staben") && includedSummary(40).includes("hele staben"), "32 personer eller flere gir hele oppsettet");
  assert(includedSummary(16).includes("Pastorer, rådsmedlemmer") && includedSummary(31).includes("Pastorer, rådsmedlemmer"), "16 til 31 personer");
  assert(includedSummary(8).includes("sentrale nøkkelpersoner") && includedSummary(15).includes("sentrale nøkkelpersoner"), "8 til 15 personer");
  assert(includedSummary(4).includes("Kari Nordmann"), "Under 8 personer er de fire første");
});
