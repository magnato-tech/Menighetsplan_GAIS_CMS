import { describe } from "vitest";
import { assert } from "./assert";
import { formToGroupUpdates, groupToForm, parseTags } from "../src/utils/groupForm";
import type { Group } from "../src/types";

const group = (extra: Partial<Group> = {}): Group => ({ id: "g1", name: "Lyd", memberIds: ["a", "b"], leaderIds: [], ...extra });

describe("Gruppekortet: fra gruppe til skjema", () => {
  const plain = groupToForm(group());
  assert(plain.name === "Lyd" && plain.category === "tjenestegruppe", "Uten kategori brukes tjenestegruppe");
  assert(plain.leaderId === "" && plain.deputyId === "" && plain.tags === "", "Ingen leder, nestleder eller tagger");
  assert(plain.isPublic, "En gruppe er synlig til noen skjuler den");
  assert(!plain.hasSchedule, "Uten fast møtetid er møteplanen av");
  assert(!groupToForm(group({ isPublic: false })).isPublic, "En skjult gruppe er skjult i skjemaet");

  const planned = groupToForm(
    group({ leaderIds: ["a"], deputyLeaderIds: ["b"], tags: ["bønn", "vekst"], meetingSchedule: { weekday: "Onsdag", time: "19:00", frequency: "annenhver uke" } })
  );
  assert(planned.leaderId === "a" && planned.deputyId === "b", "Leder og nestleder leses fra gruppen");
  assert(planned.tags === "bønn, vekst", "Taggene vises kommaseparert");
  assert(planned.hasSchedule && planned.weekday === "Onsdag" && planned.time === "19:00" && planned.frequency === "annenhver uke", "Møteplanen leses fra gruppen");
});

describe("Gruppekortet: fra skjema til lagring", () => {
  assert(parseTags(" Bønn,  VEKST ,, ").join("|") === "bønn|vekst", "Tagger deles på komma, blir små bokstaver og tomme fjernes");

  const form = groupToForm(group({ description: "Gammel", leaderIds: ["a"] }));
  const cleared = formToGroupUpdates({ ...form, name: "  Teknikk ", description: "  ", leaderId: "", deputyId: "" });
  assert(cleared.name === "Teknikk", "Navnet trimmes");
  assert(cleared.description === undefined, "En tømt beskrivelse fjernes");
  assert(cleared.leaderIds?.length === 0 && cleared.deputyLeaderIds?.length === 0, "Ingen valgt leder gir tom liste");

  assert(formToGroupUpdates(form).meetingSchedule === undefined, "En gruppe uten fast møtetid får ingen møteplan bare fordi skjemaet lagres");
  const scheduled = formToGroupUpdates({ ...form, hasSchedule: true, weekday: "Fredag", time: "18:30", frequency: "hver måned" });
  assert(
    JSON.stringify(scheduled.meetingSchedule) === JSON.stringify({ weekday: "Fredag", time: "18:30", frequency: "hver måned" }),
    "Med fast møtetid lagres ukedag, klokkeslett og frekvens"
  );
  assert(formToGroupUpdates({ ...form, isPublic: false }).isPublic === false, "Skjult gruppe lagres som skjult");
});
