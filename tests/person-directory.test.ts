import { describe } from "vitest";
import { assert } from "./assert";
import {
  matchesPersonSearch,
  nextSort,
  personAccess,
  personGroupNames,
  sortPersonRows,
} from "../src/utils/personDirectory";
import type { Group, Person } from "../src/types";

describe("Personregister-tabell", () => {
  const person = (id: string, name: string, extra: Partial<Person> = {}): Person => ({
    id,
    name,
    globalRole: "member",
    ...extra,
  });

  const group = (id: string, name: string): Group => ({
    id,
    name,
    memberIds: [],
    leaderIds: [],
  });

  const kari = {
    person: person("1", "Kari Nordmann", { globalRole: "admin", email: "kari@eksempel.no", phone: "912" }),
    groups: [group("hus", "Husfellesskap Sentrum")],
    leaderInGroups: [group("stab", "Stab & Ansatte")],
    deputyInGroups: [group("hus", "Husfellesskap Sentrum")],
  };

  const ola = {
    person: person("2", "Ola Hansen", { email: "ola@eksempel.no" }),
    groups: [group("kaffe", "Kirkekaffe & vertskap")],
    leaderInGroups: [],
    deputyInGroups: [group("kaffe", "Kirkekaffe & vertskap")],
  };

  const silje = {
    person: person("3", "Silje Markussen", { phone: "900" }),
    groups: [group("barn", "Søndagsskole & barn")],
    leaderInGroups: [group("barn", "Søndagsskole & barn")],
    deputyInGroups: [],
  };

  assert(personAccess(kari) === "administrator", "Administrator går foran lederrolle");
  assert(personAccess(silje) === "gruppeleder", "Leder i minst én gruppe er gruppeleder");
  assert(personAccess(ola) === "nestleder", "Bare nestleder vises som nestleder");
  assert(
    personGroupNames(kari).join() === "Husfellesskap Sentrum,Stab & Ansatte",
    "Gruppene vises én gang, sortert på navn"
  );

  const byName = sortPersonRows([silje, kari, ola], "name", "asc");
  assert(byName.map((r) => r.person.name).join() === "Kari Nordmann,Ola Hansen,Silje Markussen", "Sortering på navn A–Å");

  const byAccess = sortPersonRows([ola, silje, kari], "access", "asc");
  assert(
    byAccess.map((r) => r.person.name).join() === "Kari Nordmann,Silje Markussen,Ola Hansen",
    "Sortering på tilgang: administrator, gruppeleder, nestleder"
  );

  assert(matchesPersonSearch(kari, "husfellesskap"), "Søk treffer gruppenavn");
  assert(matchesPersonSearch(silje, "gruppeleder"), "Søk treffer tilgang");
  assert(!matchesPersonSearch(ola, "kari"), "Søk utelater det som ikke treffer");

  const toggled = nextSort("name", "asc", "name");
  assert(toggled.key === "name" && toggled.direction === "desc", "Samme kolonne bytter retning");
  const switched = nextSort("name", "desc", "email");
  assert(switched.key === "email" && switched.direction === "asc", "Ny kolonne starter stigende");
});
