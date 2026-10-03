import { describe } from "vitest";
import { assert } from "./assert";
import { formToPersonUpdates, personToForm } from "../src/utils/personForm";
import type { Person } from "../src/types";

const person = (extra: Partial<Person> = {}): Person => ({ id: "p1", name: "Kari", globalRole: "member", ...extra });
const NOW = "2026-01-15T10:00:00.000Z";
const consented = (extra: Partial<Person> = {}) =>
  person({ isPublicProfile: true, consentToPublishGivenAt: NOW, consentGivenBy: "admin-1", ...extra });

describe("Personkortet: fra person til skjema", () => {
  const empty = personToForm(person());
  assert(empty.name === "Kari" && empty.phone === "" && empty.email === "", "Felt som mangler blir tomme tekster");
  assert(empty.globalRole === "member" && empty.staffCategory === "stab", "Standard rolle og stabskategori");
  assert(empty.unavailablePeriods.length === 0 && !empty.isStaff && !empty.isPublicProfile, "Ingen fravær, ikke stab, ikke offentlig");

  assert(personToForm(consented()).isPublicProfile, "Offentlig profil krever registrert samtykke");
  assert(!personToForm(person({ isPublicProfile: true })).isPublicProfile, "Avkrysset uten samtykke gjelder ikke");
  assert(
    personToForm(person({ publicTitle: "Pastor" })).staffRole === "Pastor",
    "Uten stillingstittel brukes tittelen utad"
  );
  assert(personToForm(person({ staffRole: "Daglig leder", publicTitle: "Pastor" })).staffRole === "Daglig leder", "Stillingstittel går foran");
});

describe("Personkortet: fra skjema til lagring", () => {
  const base = person({ phone: "111", email: "a@b.no", avatarUrl: "x.png" });

  const cleared = formToPersonUpdates(base, { ...personToForm(base), phone: "  ", email: "", avatarUrl: "" }, "admin-1");
  assert(
    cleared.phone === undefined && cleared.email === undefined && cleared.avatarUrl === undefined,
    "Et tømt felt blir fjernet i stedet for å bli stående med gammel verdi"
  );
  assert(formToPersonUpdates(base, { ...personToForm(base), name: "  Ola  " }, "admin-1").name === "Ola", "Navnet trimmes");

  const staff = formToPersonUpdates(base, { ...personToForm(base), isStaff: true, staffRole: "Pastor" }, "admin-1");
  assert(staff.isPublicProfile === true && Boolean(staff.consentToPublishGivenAt), "En ansatt vises offentlig, og samtykket registreres");
  assert(staff.consentGivenBy === "admin-1" && staff.publicTitle === "Pastor", "Samtykket knyttes til den som lagret, og tittelen følger med");

  const kept = formToPersonUpdates(consented(), personToForm(consented()), "admin-2");
  assert(
    kept.consentToPublishGivenAt === NOW && kept.consentGivenBy === "admin-1",
    "Et samtykke som allerede er registrert, beholdes uendret"
  );

  const withdrawn = formToPersonUpdates(consented(), { ...personToForm(consented()), isPublicProfile: false }, "admin-2");
  assert(
    withdrawn.isPublicProfile === false && withdrawn.consentToPublishGivenAt === undefined,
    "Trekkes samtykket, fjernes registreringen"
  );
});
