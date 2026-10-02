import { describe } from "vitest";
import { assert } from "./assert";
import { calculateTaskStaffingStatus, getStaffingStatus } from "../src/utils/staffing";
import type { Task, Assignment } from "../src/types";

describe("Bemanningsstatus", () => {
  const task = (id: string, neededCount: number, status: Task["status"] = "open"): Task => ({
    id,
    gatheringId: "gathering-1",
    groupId: "group-1",
    title: "Lyd",
    status,
    neededCount,
  });
  let nextAssignment = 0;
  const assignment = (taskId: string, response: Assignment["response"]): Assignment => ({
    id: `assign-${++nextAssignment}`,
    taskId,
    personId: `person-${nextAssignment}`,
    response,
  });
  const responses = (taskId: string, ...list: Assignment["response"][]) => list.map((r) => assignment(taskId, r));

  // 1. The rules listed above calculateTaskStaffingStatus, one by one
  const full = calculateTaskStaffingStatus(task("t", 2), responses("t", "confirmed", "confirmed"));
  assert(full.color === "green" && full.statusText === "Dekket" && full.isFullyCovered, "2/2 bekreftet er grønn og dekket");
  assert(full.missingCount === 0, "En dekket oppgave mangler ingen");

  const half = calculateTaskStaffingStatus(task("t", 2), responses("t", "confirmed"));
  assert(half.color === "red" && half.statusText === "Mangler 1", "1/2 bekreftet er rød og mangler 1");
  assert(half.confirmedCount === 1 && half.neededCount === 2, "Tellingen viser 1 av 2");

  const asked = calculateTaskStaffingStatus(task("t", 2), responses("t", "pending", "pending"));
  assert(asked.color === "yellow" && asked.statusText === "Venter på svar", "0/2 bekreftet med ubesvarte forespørsler er gul");
  assert(asked.pendingCount === 2 && asked.missingCount === 2, "Ubesvarte forespørsler dekker ingen plass");

  const halfAndAsked = calculateTaskStaffingStatus(task("t", 2), responses("t", "confirmed", "pending"));
  assert(halfAndAsked.color === "red" && halfAndAsked.statusText === "Mangler 1", "1/2 bekreftet + 1 ubesvart er fortsatt rød");

  const withdrawn = calculateTaskStaffingStatus(task("t", 1), responses("t", "withdrawn"));
  assert(withdrawn.color === "red" && withdrawn.hasForfall, "Forfall som åpner en plass er rød");

  const withdrawnAndAsked = calculateTaskStaffingStatus(task("t", 1), responses("t", "withdrawn", "pending"));
  assert(withdrawnAndAsked.color === "red", "Forfall + ny forespørsel er rød til plassen er dekket");

  const replaced = calculateTaskStaffingStatus(task("t", 1), responses("t", "withdrawn", "confirmed"));
  assert(replaced.color === "green" && replaced.isFullyCovered, "Forfall som er erstattet av en bekreftet person er grønn");

  // Forfall means someone dropped out, or the task is marked vacant. Being short of people is not forfall.
  assert(!half.hasForfall, "1/2 bekreftet uten at noen har trukket seg er ikke forfall");
  assert(!halfAndAsked.hasForfall, "1/2 bekreftet + ubesvart forespørsel er ikke forfall");
  const halfWithWithdrawal = calculateTaskStaffingStatus(task("t", 2), responses("t", "confirmed", "withdrawn"));
  assert(halfWithWithdrawal.color === "red" && halfWithWithdrawal.hasForfall, "1/2 bekreftet der én har meldt forfall er forfall");
  const markedVacant = calculateTaskStaffingStatus(task("t", 2, "vacant"), responses("t", "confirmed"));
  assert(markedVacant.hasForfall, "Oppgave med status 'vacant' er forfall også uten en tilbaketrukket tildeling");
  assert(!replaced.hasForfall, "Et forfall som er dekket inn igjen er ikke lenger forfall");

  // 2. Edges the list does not spell out
  const untouched = calculateTaskStaffingStatus(task("t", 3), []);
  assert(untouched.color === "red" && untouched.statusText === "Mangler 3", "Åpen oppgave uten tildelinger mangler hele behovet");

  const declined = calculateTaskStaffingStatus(task("t", 1), responses("t", "declined"));
  assert(declined.color === "red" && declined.missingCount === 1, "Bare avslag dekker ingen plass");

  const over = calculateTaskStaffingStatus(task("t", 1), responses("t", "confirmed", "confirmed"));
  assert(over.color === "green" && over.missingCount === 0, "Flere bekreftede enn behovet gir ikke negativ mangel");

  // 3. A gathering takes the most serious colour among its tasks
  const none = getStaffingStatus([], []);
  assert(none.color === "green" && none.label === "Ingen oppgaver", "Samling uten oppgaver er grønn");

  const lyd = task("lyd", 1);
  const kaffe = task("kaffe", 2);
  const vert = task("vert", 1);

  const allCovered = getStaffingStatus([lyd, kaffe], [
    ...responses("lyd", "confirmed"),
    ...responses("kaffe", "confirmed", "confirmed"),
  ]);
  assert(allCovered.color === "green" && allCovered.coveredCount === 2 && !allCovered.needsAttention, "Alle oppgaver dekket gir grønn samling");

  const waiting = getStaffingStatus([lyd, vert], [...responses("lyd", "confirmed"), ...responses("vert", "pending")]);
  assert(waiting.color === "yellow" && waiting.label === "Venter på svar", "Dekket + ubesvart gir gul samling");
  assert(!waiting.needsAttention, "Gul samling krever ikke oppfølging");

  const missing = getStaffingStatus([lyd, kaffe, vert], [
    ...responses("lyd", "confirmed"),
    ...responses("kaffe", "confirmed"),
    ...responses("vert", "pending"),
  ]);
  assert(missing.color === "red" && missing.needsAttention, "Én rød oppgave gjør hele samlingen rød");
  assert(missing.missingPeopleCount === 2 && missing.label === "Mangler 2", "Samlingen summerer manglende personer på tvers av oppgaver");
  assert(missing.totalTasks === 3 && missing.coveredCount === 1, "Samlingen teller oppgaver og dekkede oppgaver");
  assert(missing.vacantCount === 0 && missing.openCount === 2, "Oppgaver som mangler folk uten forfall telles som åpne, ikke som forfall");

  const withForfall = getStaffingStatus([lyd, kaffe], [
    ...responses("lyd", "withdrawn"),
    ...responses("kaffe", "confirmed"),
  ]);
  assert(withForfall.vacantCount === 1 && withForfall.openCount === 1, "Samlingen skiller forfall fra oppgaver som bare mangler folk");
});
