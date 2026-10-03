import { describe } from "vitest";
import { assert } from "./assert";
import {
  canAdminister,
  canIntervene,
  editableTaskOf,
  filterRunSheet,
  groupsInRunSheet,
  instructionTargetOf,
  isAdminLook,
  responseLabel,
  roleLabel,
  staffingSummary,
} from "../src/utils/gatheringView";
import type { RunSheetRow, RunSheetTask } from "../src/utils/runSheet";

const row = (id: string, extra: Partial<RunSheetRow> = {}): RunSheetRow => ({
  id, time: "", title: "R" + id, isMyGroup: false, neededCount: 1, confirmedCount: 1, isFullyCovered: true, hasForfall: false, assignedPersons: [], ...extra,
});
const rt = (status: string, extra: Partial<RunSheetTask> = {}): RunSheetTask => ({
  task: { id: "t", gatheringId: "s", groupId: "g", title: "T", status } as RunSheetTask["task"],
  isMyGroup: false, neededCount: 1, assignedPersons: [], confirmedPersonsCount: 1, isFullyCovered: true, hasWithdrawn: false, ...extra,
});

describe("Samlingssiden: hvem som ser og kan hva", () => {
  assert(isAdminLook("admin", false) && isAdminLook("admin", true), "Admin-visning når den er bedt om");
  assert(!isAdminLook("leader", true) && !isAdminLook("leader", false), "Lederbildet beholdes for en admin som åpner som leder");
  assert(canAdminister(true, false) && canAdminister(false, true) && !canAdminister(false, false), "Admin kan administrere, også i lederbildet");
  assert(canIntervene(row("1", { isMyGroup: false }), true, false), "En admin kan gripe inn overalt");
  assert(canIntervene(row("1", { isMyGroup: true }), false, true), "En leder kan gripe inn i egen gruppe");
  assert(!canIntervene(row("1", { isMyGroup: false }), false, true), "En leder kan ikke gripe inn i en annen gruppe");
  assert(!canIntervene(row("1", { isMyGroup: true }), false, false), "Uten å være leder kan man ikke gripe inn, heller ikke i egen gruppe");
  assert(roleLabel(true, false) === "Admin-visning" && roleLabel(true, true) === "Admin-visning", "Admin-visning går foran");
  assert(roleLabel(false, true) === "Nestleder" && roleLabel(false, false) === "Gruppeleder", "Nestleder eller gruppeleder");
});

describe("Samlingssiden: ordet for et svar", () => {
  assert(responseLabel("confirmed") === "Akseptert", "Bekreftet heter akseptert");
  assert(responseLabel("pending") === "Forespurt", "Forespurt");
  assert(responseLabel("withdrawn") === "Forfall", "Trukket heter forfall");
  assert(responseLabel("declined") === "Avslått", "Avslått");
});

describe("Samlingssiden: grupper og filter", () => {
  const rows = [
    row("1", { groupId: "a", groupName: "Lyd", isMyGroup: true }),
    row("2", { groupId: "b", groupName: "Kaffe", isFullyCovered: false }),
    row("3"),
    row("4", { groupId: "a", groupName: "Lyd", isMyGroup: true, hasForfall: true }),
    row("5", { groupId: "c" }),
  ];
  const ids = (r: RunSheetRow[]) => r.map((x) => x.id).join("");

  assert(JSON.stringify(groupsInRunSheet(rows)) === JSON.stringify([{ id: "a", name: "Lyd", count: 2 }, { id: "b", name: "Kaffe", count: 1 }, { id: "c", name: "Gruppe", count: 1 }]), "Grupper telles i den rekkefølgen de dukker opp, og uten navn heter de «Gruppe»");
  assert(groupsInRunSheet([row("1")]).length === 0 && groupsInRunSheet([]).length === 0, "Rader uten gruppe gir ingen grupper");

  assert(ids(filterRunSheet(rows, "all", "all")) === "12345", "Uten filter kommer alt gjennom");
  assert(ids(filterRunSheet(rows, "all", "a")) === "14", "Én gruppe");
  assert(ids(filterRunSheet(rows, "my-group", "all")) === "14", "Bare egen gruppe");
  assert(ids(filterRunSheet(rows, "needs-action", "all")) === "24", "Ikke dekket, eller forfall selv om det er dekket");
  assert(ids(filterRunSheet(rows, "needs-action", "a")) === "4", "Gruppe og handling må treffe begge");
  assert(ids(filterRunSheet(rows, "my-group", "b")) === "", "Egen gruppe i en annen gruppe gir ingenting");
  assert(rows.length === 5, "Listen som sendes inn endres ikke");
});

describe("Samlingssiden: bemanningsstatus", () => {
  const s = (tasks: RunSheetTask[]) => staffingSummary(tasks);

  assert(s([]).tone === "amber" && s([]).headline === "Mangler bemanning på noen oppgaver", "Ingen oppgaver er ikke «fullt bemannet»");
  assert(s([rt("confirmed")]).tone === "green" && s([rt("confirmed")]).headline === "Fullt bemannet arrangement", "Alt dekket er grønt");
  assert(s([rt("open", { isFullyCovered: false })]).tone === "amber", "Noe som mangler, uten forfall, er gult");
  assert(s([rt("vacant", { isFullyCovered: false })]).tone === "red" && s([rt("vacant", { isFullyCovered: false })]).vacant === 1, "En oppgave merket ledig er rødt");
  assert(s([rt("confirmed", { hasWithdrawn: true })]).tone === "red", "Forfall gir rødt, også når oppgaven er dekket");
  assert(s([rt("vacant"), rt("open", { hasWithdrawn: true })]).headline === "2 oppgaver krever oppfølging", "Flertall");
  assert(s([rt("vacant")]).headline === "1 oppgave krever oppfølging (forfall/vikar)", "Entall");
  const mixed = s([rt("confirmed", { isMyGroup: true }), rt("open", { isMyGroup: true, isFullyCovered: false }), rt("confirmed", { isMyGroup: true, hasWithdrawn: true }), rt("confirmed")]);
  assert(mixed.total === 4 && mixed.covered === 3, "Totalt og dekket");
  assert(mixed.myGroupTotal === 3 && mixed.myGroupCovered === 1, "Egen gruppe: de som ikke trenger handling, av alle i gruppen");
});

describe("Samlingssiden: hva dialogene åpnes med", () => {
  assert(JSON.stringify(instructionTargetOf({ title: "Lovsang", roleTitle: "Kaffe", instruction: "Brygg", time: "10:15", groupName: "G", task: { id: "t2" } as never })) === JSON.stringify({ taskId: "t2", title: "Lovsang – Kaffe", instruction: "Brygg", time: "10:15", groupName: "G" }), "Tittelen får rollen etter en tankestrek");
  const bare = instructionTargetOf({ title: "Preken", time: "", groupName: undefined, roleTitle: undefined, instruction: undefined, task: undefined });
  assert(bare.title === "Preken" && bare.instruction === "" && bare.taskId === undefined, "Et programpunkt uten oppgave og instruks");
  assert(JSON.stringify(editableTaskOf({ id: "t", title: "T", groupId: "g" })) === JSON.stringify({ id: "t", title: "T", groupId: "g", neededCount: 1, description: "", instruction: "" }), "Uten behov og tekster: 1 og tomme tekster");
  assert(editableTaskOf({ id: "t", title: "T", groupId: "g", neededCount: 3, description: "d", instruction: "i" }).neededCount === 3, "Oppgitt behov beholdes");
  assert(editableTaskOf({ id: "t", title: "T", groupId: "g", neededCount: 0 }).neededCount === 1, "Behov 0 regnes som 1");
});
