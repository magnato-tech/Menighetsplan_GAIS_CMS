import { describe } from "vitest";
import { assert } from "./assert";
import { personGridMessage, selectPersonGrid, type PersonGridResult } from "../src/utils/personGrid";
import type { Group, Person } from "../src/types";

const person = (id: string, extra: Partial<Person> = {}): Person =>
  ({
    id,
    name: id,
    phone: `privat-${id}`,
    email: `${id}@privat.no`,
    globalRole: "member",
    isPublicProfile: true,
    consentToPublishGivenAt: "2026-01-01T10:00:00Z",
    ...extra,
  }) as Person;

const group = (id: string, extra: Partial<Group> = {}): Group =>
  ({ id, name: id, category: "ledergruppe", leaderIds: [], memberIds: [], ...extra }) as Group;

const names = (r: PersonGridResult) => (r.kind === "people" ? r.profiles.map((p) => p.name).join(",") : r.kind);

describe("Personblokken: stab", () => {
  const persons = [
    person("pastor", { isStaff: true, staffCategory: "pastor", staffRole: "Hovedpastor" }),
    person("barn", { isStaff: true, staffCategory: "barneleder" }),
    person("uten-samtykke", { isStaff: true, isPublicProfile: false, consentToPublishGivenAt: undefined }),
    person("frivillig"),
  ];

  assert(names(selectPersonGrid("stab", persons, [])) === "pastor,barn", "Stab er de ansatte med samtykke, ikke andre");
  assert(
    names(selectPersonGrid("stab", [person("frivillig")], [])) === "empty",
    "Uten ansatte vises ingen, og frivillige fylles ikke inn i stedet"
  );
  assert(names(selectPersonGrid("alle", persons, [])) === "pastor,barn,frivillig", "«alle» tar alle med samtykke");
  assert(names(selectPersonGrid("pastor", persons, [])) === "pastor", "Kategori som stikkord");
  assert(names(selectPersonGrid("kategori=barneleder", persons, [])) === "barn", "Kategori med kategori=");

  const profile = selectPersonGrid("stab", persons, []);
  assert(
    profile.kind === "people" && profile.profiles.every((p) => !JSON.stringify(p).includes("privat")),
    "Privat telefon og e-post følger aldri med"
  );
});

describe("Personblokken: grupper", () => {
  const persons = [
    person("leder", { publicTitle: "Styreleder" }),
    person("nestleder"),
    person("medlem"),
    person("skjult", { isPublicProfile: false }),
  ];
  const styret = group("styret", {
    name: "Lederskap",
    leaderIds: ["leder"],
    deputyLeaderIds: ["nestleder"],
    memberIds: ["medlem", "skjult"],
  });

  const r = selectPersonGrid("lederskap", persons, [styret]);
  assert(names(r) === "leder,medlem,nestleder", "Lederen først, så de andre etter navn, og ingen uten samtykke");
  assert(
    r.kind === "people" && r.profiles[0].roleInGroup === "Leder" && r.profiles[2].roleInGroup === "Nestleder",
    "Rollen kommer fra gruppen"
  );
  assert(
    r.kind === "people" && r.profiles[1].title === undefined && r.profiles[1].roleInGroup === undefined,
    "Et medlem uten tittel får ingen oppdiktet tittel"
  );
  assert(names(selectPersonGrid("lederskap", persons, [group("skjult", { isPublic: false })])) === "no-group", "En skjult gruppe vises ikke");
  const stab = group("stab", { name: "Stab", leaderIds: ["medlem"] });
  assert(
    names(selectPersonGrid("lederskap", persons, [stab, group("r", { name: "Lederskap", leaderIds: ["leder"] })])) === "leder",
    "Stikkordet finner gruppen med ordet i navnet, ikke bare den første ledergruppen"
  );
  assert(
    names(selectPersonGrid("lederskap", persons, [stab])) === "no-group",
    "En stabsgruppe tas ikke for lederskap bare fordi den heter ledergruppe"
  );
  assert(names(selectPersonGrid("lederskap", persons, [])) === "no-group", "Uten ledergruppe sier blokken fra");
  assert(names(selectPersonGrid("gruppe=finnes-ikke", persons, [styret])) === "no-group", "Ukjent gruppe faller ikke tilbake på en annen");
  assert(names(selectPersonGrid("gruppe=leder", persons, [styret])) === "leder,medlem,nestleder", "Gruppe finnes på navn");
  assert(names(selectPersonGrid("gruppe=styret", persons, [styret])) === "leder,medlem,nestleder", "Gruppe finnes på id");
});

describe("Personblokken: ukjente valg", () => {
  const persons = [person("a", { isStaff: true })];
  assert(names(selectPersonGrid("styre", persons, [])) === "unknown-filter", "Et ord koden ikke kjenner gir beskjed i stedet for å vise ansatte");
  assert(names(selectPersonGrid("menighetsråd", persons, [])) === "unknown-filter", "Det gjelder også «menighetsråd», som ikke lenger er et stikkord");
  assert(names(selectPersonGrid("pastr", persons, [])) === "unknown-filter", "Skrivefeil i et kategoriord gir beskjed");
  assert(names(selectPersonGrid("STAB", persons, [])) === "a", "Store bokstaver spiller ingen rolle");
});

describe("Personblokken: hva siden sier når ingen vises", () => {
  const say = (filter: string, persons: Person[] = [], groups: Group[] = []) => {
    const r = selectPersonGrid(filter, persons, groups);
    return r.kind === "people" ? "" : personGridMessage(r, filter);
  };
  assert(say("stab") === "Ingen stabsmedlemmer med registrert samtykke funnet.", "Ingen ansatte");
  assert(say("lederskap") === "Ingen lederskapsgruppe funnet.", "Ingen lederskapsgruppe");
  assert(say("ids=x") === "Ingen profiler funnet for de oppgitte personene.", "Ingen av personene har samtykket");
  assert(say("gruppe=lyd", [], [group("lyd", { category: "tjenestegruppe" })]) === "Ingen offentlige profiler med registrert samtykke i gruppen ennå.", "Gruppen har ingen med samtykke");
  assert(say("styre").startsWith("Ukjent valg i personblokken: «styre»."), "Ukjent valg nevner hva som ble skrevet");
});

describe("Personblokken: utvalgte personer", () => {
  const persons = [person("Ola-1"), person("kari-2"), person("hemmelig", { isPublicProfile: false })];

  assert(names(selectPersonGrid("ids=kari-2,Ola-1", persons, [])) === "kari-2,Ola-1", "Rekkefølgen følger id-ene");
  assert(names(selectPersonGrid("Ola-1", persons, [])) === "Ola-1", "En enkelt id med store bokstaver finnes");
  assert(names(selectPersonGrid("ids=hemmelig", persons, [])) === "empty", "Uten samtykke vises ingen, selv med id");
});
