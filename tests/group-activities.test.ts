import { describe } from "vitest";
import { assert } from "./assert";
import {
  activityKind,
  activityTableRows,
  countVacantTasks,
  filterActivities,
  monthFilterOptions,
  type ActivityItem,
} from "../src/utils/groupActivities";

const person = (id: string, name: string) => ({ id, name });
const item = (id: string, startsAt: string, color: string, extra: Partial<ActivityItem> = {}): ActivityItem => ({
  gathering: { id, title: "A" + id, startsAt, location: "Kirken" },
  tasks: [],
  taskItems: [],
  staffing: { color },
  ...extra,
});
const taskItem = (id: string, assignedPersons: ActivityItem["taskItems"][number]["assignedPersons"], confirmedCount: number, neededCount: number) => ({
  task: { id, title: "T" + id },
  assignedPersons,
  confirmedCount,
  neededCount,
});
const on = (id: string, p: ReturnType<typeof person> | undefined, response: "pending" | "confirmed" | "declined" | "withdrawn") => ({
  assignment: { id },
  person: p,
  statusLabel: "S" + id,
  response,
});

const oct = item("1", "2026-10-18T09:00:00.000Z", "green");
const oct2 = item("2", "2026-10-25T09:00:00.000Z", "red");
const nov = item("3", "2026-11-29T09:00:00.000Z", "yellow");
const all = [nov, oct, oct2];

describe("Gruppens aktiviteter: filter", () => {
  assert(filterActivities(all, "all", "all").length === 3, "Uten filter kommer alt gjennom");
  assert(filterActivities(all, "2026-10", "all").map((i) => i.gathering.id).join() === "1,2", "Én måned");
  assert(filterActivities(all, "all", "red").map((i) => i.gathering.id).join() === "2", "Én statusfarge");
  assert(filterActivities(all, "2026-11", "red").length === 0, "Måned og status må treffe begge");
  assert(filterActivities(all, "2026-12", "all").length === 0, "En måned uten aktiviteter gir ingen");
  assert(filterActivities([], "all", "all").length === 0, "Ingen aktiviteter gir ingen");
  assert(all.map((i) => i.gathering.id).join() === "3,1,2", "Listen som sendes inn endres ikke");

  const options = monthFilterOptions(all);
  assert(options[0].id === "all" && options[0].label === "Alle måneder", "Først «Alle måneder»");
  assert(options.slice(1).map((o) => o.id).join() === "2026-10,2026-11", "Så hver måned med noe i, i rekkefølge, hver én gang");
  assert(monthFilterOptions([]).length === 1, "Uten aktiviteter bare «Alle måneder»");
});

describe("Gruppens aktiviteter: type", () => {
  assert(activityKind({}) === "arrangement" && activityKind({ type: "arrangement" }) === "arrangement", "Uten type, eller arrangement, er et arrangement");
  assert(activityKind({ type: "gruppesamling" }) === "gruppesamling", "Gruppesamling");
});

describe("Gruppens aktiviteter: tabellinjer", () => {
  const withTasks = item("1", "2026-10-18T09:00:00.000Z", "red", {
    gathering: { id: "1", title: "Gudstjeneste", startsAt: "2026-10-18T09:00:00.000Z", location: "Kirken", type: "gruppesamling" },
    taskItems: [
      taskItem("a", [on("x", person("p1", "Kari"), "confirmed"), on("y", person("p2", "Ola"), "withdrawn")], 1, 2),
      taskItem("b", [], 1, 3),
      taskItem("c", [on("z", undefined, "pending")], 0, 1),
    ],
  });
  const rows = activityTableRows([withTasks]);

  assert(rows.length === 4, "Én linje per person på en oppgave, og én for en oppgave uten noen");
  assert(rows.map((r) => r.rowId).join() === "1-a-x,1-a-y,1-b-vacant,1-c-z", "Linje-ID-ene er aktivitet, oppgave og tildeling");
  assert(rows[0].assignedPersonName === "Kari" && rows[0].assignedPersonId === "p1" && rows[0].statusType === "confirmed", "En person på en oppgave");
  assert(rows[1].statusType === "withdrawn" && rows[1].statusLabel === "Sy", "Status og tekst følger tildelingen");
  assert(rows[0].confirmedCount === 1 && rows[0].neededCount === 2, "Antall følger oppgaven");

  const vacant = rows[2];
  assert(vacant.statusType === "vacant" && vacant.statusLabel === "Ubesatt", "En oppgave uten noen står som ubesatt");
  assert(vacant.assignedPersonName === undefined && vacant.assignedPersonId === undefined, "Ingen person på en ubesatt linje");
  assert(vacant.confirmedCount === 0 && vacant.neededCount === 3, "Ubesatt har ingen bekreftede, selv om oppgaven sier ett");
  assert(rows[3].assignedPersonName === undefined && rows[3].statusType === "pending", "En tildeling uten kjent person får ikke navn");
  assert(rows.every((r) => r.gatheringType === "gruppesamling" && r.location === "Kirken" && r.gatheringTitle === "Gudstjeneste"), "Aktivitetens type, sted og tittel følger hver linje");
  assert(activityTableRows([]).length === 0 && activityTableRows([oct]).length === 0, "Ingen oppgaver gir ingen linjer");
});

describe("Gruppens aktiviteter: ledige oppgaver", () => {
  const task = (status: string) => ({ status });
  assert(countVacantTasks([]) === 0, "Ingen aktiviteter");
  assert(countVacantTasks([item("1", "2026-10-18T09:00:00.000Z", "red", { tasks: [task("vacant"), task("open"), task("vacant")] }), item("2", "2026-10-25T09:00:00.000Z", "red", { tasks: [task("vacant"), task("confirmed")] })]) === 3, "Teller bare ledige, på tvers av aktiviteter");
  assert(countVacantTasks([item("1", "2026-10-18T09:00:00.000Z", "green", { tasks: [task("confirmed"), task("assigned")] })]) === 0, "Ingen ledige");
});
