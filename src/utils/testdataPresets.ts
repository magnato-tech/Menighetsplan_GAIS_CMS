/** How much test data to write. The same four counts the generator takes. */
export interface TestdataSize {
  personCount: number;
  groupCount: number;
  gatheringCount: number;
  taskCount: number;
}

export interface TestdataPreset extends TestdataSize {
  id: string;
  name: string;
  description: string;
  tag: string;
}

export const TESTDATA_PRESETS: TestdataPreset[] = [
  {
    id: "compact",
    name: "Kompakt testsett",
    description: "Hovedpastor, daglig leder, menighetsråd og kjerneaktiviteter.",
    personCount: 8,
    groupCount: 3,
    gatheringCount: 4,
    taskCount: 6,
    tag: "8 personer",
  },
  {
    id: "medium",
    name: "Mellomstor menighet",
    description: "Pastorer, rådsmedlemmer, stabsdiakon, lovsangsteam og barnekirke.",
    personCount: 16,
    groupCount: 6,
    gatheringCount: 10,
    taskCount: 14,
    tag: "16 personer",
  },
  {
    id: "full",
    name: "Fullskala menighet",
    description: "Komplett menighetsregister: 32 personer, 12 grupper, samlinger og oppgaver.",
    personCount: 32,
    groupCount: 12,
    gatheringCount: 19,
    taskCount: 21,
    tag: "32 personer (Maks)",
  },
];

/** Just the sizes of a pack, without its name and description. */
export function sizeOfPreset(preset: TestdataPreset): TestdataSize {
  return {
    personCount: preset.personCount,
    groupCount: preset.groupCount,
    gatheringCount: preset.gatheringCount,
    taskCount: preset.taskCount,
  };
}

/** The pack chosen when the tab opens. */
export const DEFAULT_TESTDATA_PRESET = TESTDATA_PRESETS[TESTDATA_PRESETS.length - 1];

export interface TestdataSlider {
  field: keyof TestdataSize;
  label: string;
  min: number;
  max: number;
  /** The three marks under the slider */
  marks: [string, string, string];
  /** Tailwind classes, written out in full so they are found when the page is built */
  valueClass: string;
  trackClass: string;
}

export const TESTDATA_SLIDERS: TestdataSlider[] = [
  { field: "personCount", label: "Personer:", min: 4, max: 32, marks: ["4 (Minimum)", "16", "32 (Maks)"], valueClass: "text-indigo-400", trackClass: "accent-indigo-500" },
  { field: "groupCount", label: "Grupper & Husfellesskap:", min: 2, max: 12, marks: ["2 (Kjerne)", "6", "12 (Maks)"], valueClass: "text-emerald-400", trackClass: "accent-emerald-500" },
  { field: "gatheringCount", label: "Samlinger & Gudstjenester:", min: 2, max: 19, marks: ["2", "10", "19 (Maks)"], valueClass: "text-amber-400", trackClass: "accent-amber-500" },
  { field: "taskCount", label: "Bemanningsoppgaver:", min: 2, max: 21, marks: ["2", "11", "21 (Maks)"], valueClass: "text-sky-400", trackClass: "accent-sky-500" },
];

/** The id of the pack whose sizes match, or «custom» when the sliders have been moved off all of them. */
export function matchingPresetId(size: TestdataSize): string {
  const match = TESTDATA_PRESETS.find(
    (p) =>
      p.personCount === size.personCount &&
      p.groupCount === size.groupCount &&
      p.gatheringCount === size.gatheringCount &&
      p.taskCount === size.taskCount
  );
  return match ? match.id : "custom";
}

/** What the test data will contain for a given number of persons, in words. */
export function includedSummary(personCount: number): string {
  if (personCount >= 32) {
    return "Alle 3 pastorer (Hovedpastor, Ungdomspastor, Barne- og familiepastor), hele menighetsrådet (7 personer), hele staben (diakon, musikk, teknikk), samtlige frivillige teamledere og 4 husfellesskap (Sentrum, Havna, Borkedalen, Ung Voksen).";
  }
  if (personCount >= 16) {
    return "Pastorer, rådsmedlemmer, stabsmedlemmer (diakoni, musikk), frivillige teamledere (kaffe, lovsang, lyd) og husfellesskap.";
  }
  if (personCount >= 8) {
    return "Hovedpastor, daglig leder, menighetsrådsleder, ungdomspastor, barne- og familiepastor og sentrale nøkkelpersoner.";
  }
  return "Hovedpastor Kari Nordmann, daglig leder Ola Hansen, barneleder Ingrid Berg og menighetsrådsleder Jonas Lie.";
}
