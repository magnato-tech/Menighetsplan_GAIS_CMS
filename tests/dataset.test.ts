import { describe } from "vitest";
import { assert } from "./assert";
import { ALL_COLLECTIONS, CMS_COLLECTIONS, COLLECTIONS } from "../src/data/collections";
import { getMockDocuments } from "../src/data/mockDocuments";
import {
  COLLECTION_LABELS,
  DATASET_FORMAT,
  DATASET_VERSION,
  buildDataset,
  countDataset,
  datasetFileName,
  parseDataset,
  serializeDataset,
  totalDocuments,
  type DatasetDocument,
} from "../src/utils/dataset";

describe("Datasett: innholdet i databasen som én fil", () => {
  const now = new Date("2026-10-06T12:00:00.000Z");
  const file = (collections: unknown, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ format: DATASET_FORMAT, version: DATASET_VERSION, name: "Prøve", createdAt: now.toISOString(), collections, ...extra });
  const errorOf = (text: string) => {
    const parsed = parseDataset(text);
    return parsed.ok ? "" : parsed.error;
  };

  // 1. Every collection has a name people can read
  assert(
    ALL_COLLECTIONS.every((name) => typeof COLLECTION_LABELS[name] === "string" && COLLECTION_LABELS[name] !== name),
    "Alle samlinger har et norsk navn i oversikten"
  );
  assert(
    new Set(Object.values(COLLECTION_LABELS)).size === Object.values(COLLECTION_LABELS).length,
    "Ingen samlinger deler navn i oversikten"
  );

  // 2. Building: empty collections are left out, and the order is stable
  const built = buildDataset(
    "  Lillesand Misjonskirke  ",
    "",
    {
      [COLLECTIONS.GROUPS]: [{ id: "b" }, { id: "a" }],
      [CMS_COLLECTIONS.PAGES]: [{ id: "page-1", title: "Forside" }],
      [COLLECTIONS.TASKS]: [],
    },
    now
  );
  assert(built.format === DATASET_FORMAT && built.version === DATASET_VERSION, "Et datasett sier hvilket format og hvilken versjon det er");
  assert(built.name === "Lillesand Misjonskirke", "Navnet lagres uten mellomrom rundt");
  assert(!("description" in built), "En tom beskrivelse lagres ikke");
  assert(built.createdAt === "2026-10-06T12:00:00.000Z", "Tidspunktet lagres som et eksakt øyeblikk");
  assert(Object.keys(built.collections).join() === `${CMS_COLLECTIONS.PAGES},${COLLECTIONS.GROUPS}`, "Tomme samlinger tas ikke med, og nettsiden står før planleggeren");
  assert(built.collections[COLLECTIONS.GROUPS].map((d) => d.id).join() === "a,b", "Dokumentene står i fast rekkefølge, så to filer kan sammenlignes");
  assert(buildDataset("", "", {}, now).name === "Datasett uten navn", "Et datasett uten navn får et navn som sier det");
  assert(totalDocuments(built) === 3, "Antall dokumenter telles på tvers av samlingene");
  assert(
    countDataset(built).map((c) => `${c.label} ${c.count}`).join(", ") === "Sider 1, Grupper 2",
    "Oversikten viser norske navn og antall"
  );

  // 3. File name: readable, without Norwegian letters, dated
  assert(datasetFileName(built) === "lillesand-misjonskirke-2026-10-06.json", "Filnavnet er navnet og datoen");
  assert(
    datasetFileName({ name: "Østre Åsen & Ærø menighet", createdAt: "2026-01-02T00:00:00.000Z" }) === "ostre-asen-aero-menighet-2026-01-02.json",
    "Æ, ø og å skrives om i filnavnet"
  );
  assert(datasetFileName({ name: "???", createdAt: "2026-01-02T00:00:00.000Z" }) === "datasett-2026-01-02.json", "Et navn uten bokstaver gir et filnavn likevel");

  // 4. What is written can be read back unchanged
  const back = parseDataset(serializeDataset(built));
  assert(back.ok && JSON.stringify(back.dataset) === JSON.stringify(built), "En fil som lastes ned, kan hentes inn igjen uten endringer");
  assert(back.ok && back.total === 3 && back.skipped.length === 0, "Innlesingen teller dokumentene");

  // 5. The whole demo content fits the format
  const demo: Record<string, DatasetDocument[]> = {};
  for (const document of getMockDocuments()) {
    (demo[document.collection] ??= []).push({ ...(document.data as object), id: document.id });
  }
  const demoBack = parseDataset(serializeDataset(buildDataset("Demo", "Demodataene", demo, now)));
  assert(demoBack.ok && demoBack.total === getMockDocuments().length, "Hele demoinnholdet kan lagres som datasett og leses tilbake");
  assert(demoBack.ok && demoBack.dataset.description === "Demodataene", "Beskrivelsen følger med");

  // 6. Files that are not datasets are turned away, with a message a person can act on
  assert(errorOf("ikke en fil") !== "", "Tekst som ikke kan leses, avvises");
  assert(errorOf("[]") !== "" && errorOf('{"collections":{}}') !== "", "En fil uten formatmerke avvises");
  assert(errorOf(JSON.stringify({ format: "noe-annet", version: 1, collections: {} })) !== "", "En fil i et annet format avvises");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [{ id: "a" }] }, { version: DATASET_VERSION + 1 })).includes("nyere"), "Et datasett fra en nyere utgave avvises");
  assert(errorOf(file({})).includes("tomt"), "Et tomt datasett avvises");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: "ikke en liste" })) !== "", "En samling som ikke er en liste, avvises");

  // 7. A damaged file is never brought in by halves
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [{ name: "Uten nøkkel" }] })).includes("Grupper"), "Et dokument uten nøkkel stopper hele filen, og meldingen sier hvor");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [{ id: "  " }] })) !== "", "En blank nøkkel godtas ikke");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [{ id: "a/b" }] })) !== "", "En nøkkel med skråstrek godtas ikke");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [{ id: "a" }, { id: "a" }] })).includes("samme"), "To dokumenter med samme nøkkel stopper hele filen");
  assert(errorOf(file({ [COLLECTIONS.GROUPS]: [null] })) !== "", "Noe som ikke er et dokument, godtas ikke");
  assert(
    [errorOf("x"), errorOf(file({})), errorOf(file({ [COLLECTIONS.GROUPS]: [{ id: "a" }, { id: "a" }] }))].every(
      (message) => !/json|firestore|collection|\bid\b/i.test(message)
    ),
    "Feilmeldingene er uten utviklerord"
  );

  // 8. Content this version does not know is set aside, and the rest is brought in
  const withUnknown = parseDataset(file({ [COLLECTIONS.GROUPS]: [{ id: "a" }], fremtidens_samling: [{ id: "x" }] }));
  assert(
    withUnknown.ok && withUnknown.skipped.join() === "fremtidens_samling" && withUnknown.total === 1 && !("fremtidens_samling" in withUnknown.dataset.collections),
    "En samling appen ikke kjenner, hentes ikke inn, og det sies fra"
  );
  const namesOnly = parseDataset(JSON.stringify({ format: DATASET_FORMAT, version: 1, collections: { [COLLECTIONS.GROUPS]: [{ id: "a" }] } }));
  assert(namesOnly.ok && namesOnly.dataset.name === "Datasett uten navn" && namesOnly.dataset.createdAt === "", "Navn og dato kan mangle i filen");
});
