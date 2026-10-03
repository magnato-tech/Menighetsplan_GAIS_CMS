import { createHash } from "node:crypto";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

/**
 * Runs the gathering page (run sheet, staffing and who does what) through fixed interactions and records
 * what it shows, which dialogs it opens with what, and what it tells the user. The golden file holds the
 * result from before the page was split up. The dialogs are replaced by stand-ins that show what they were
 * given, since they have their own code and are not part of this.
 */

const NOW = new Date("2026-10-07T12:00:00.000Z");
const norm = (html: string) => html.replace(/class="([^"]*)"/g, (_m, c) => 'class="' + c.split(/\s+/).filter(Boolean).sort().join(" ") + '"');
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

const person = (id: string, name: string) => ({ id, name, globalRole: "member" });
const [p1, p2, p3, p4, p5] = [person("p1", "Kari"), person("p2", "Ola"), person("p3", "Per"), person("p4", "Eva"), person("p5", "Tor")];
const on = (id: string, taskId: string, p: any, response: string, statusLabel: string) => ({ assignment: { id, taskId, personId: p.id, response }, person: p, statusLabel, response });
const g1 = { id: "g1", name: "Lyd og bilde" }, g2 = { id: "g2", name: "Kaffe og vertskap" };
const task = (id: string, title: string, groupId: string, status: string, extra: Record<string, unknown> = {}) => ({ id, gatheringId: "s1", groupId, title, status, ...extra });
const detailOf = (t: any, group: any, isMyGroup: boolean, needed: number, persons: any[], covered: boolean, withdrawn: boolean) => ({
  task: t, taskGroup: group, isMyGroup, neededCount: needed, assignedPersons: persons,
  confirmedPersonsCount: persons.filter((x) => x.response === "confirmed").length, isFullyCovered: covered, hasWithdrawn: withdrawn,
});
const tasksWithDetails = [
  detailOf(task("t1", "Lyd", "g1", "confirmed", { instruction: "Møt opp kl. 9:30 for rigging", neededCount: 1 }), g1, true, 1, [on("as1", "t1", p1, "confirmed", "Bekreftet")], true, false),
  detailOf(task("t2", "Kaffe", "g2", "open", { description: "Brygg kaffe", neededCount: 2 }), g2, false, 2, [on("as2", "t2", p2, "pending", "Forespurt")], false, false),
  detailOf(task("t3", "Vert", "g1", "vacant", { neededCount: 1 }), g1, true, 1, [on("as3", "t3", p3, "withdrawn", "Forfall")], false, true),
  detailOf(task("t4", "Lys", "g2", "open", {}), g2, false, 1, [], false, false),
  // Covered by one person while another has withdrawn: it is staffed, but still needs follow-up
  detailOf(task("t5", "Scene", "g2", "confirmed", { neededCount: 1 }), g2, false, 1, [on("as5a", "t5", p4, "confirmed", "Bekreftet"), on("as5b", "t5", p5, "withdrawn", "Forfall")], true, true),
];
const programSchedule = [
  { time: "10:00", title: "Velkomst" },
  { time: "10:15", title: "Lovsang", taskId: "t2" },
  { time: "11:00", title: "Preken", description: "Tema: nåde" },
];
const gathering = { id: "s1", title: "Gudstjeneste", startsAt: "2026-10-18T09:00:00.000Z", location: "Kirken", type: "arrangement" };

interface World { detail: any; calls: unknown[][]; statusResult: any; removeResult: any }
const world: World = { detail: {}, calls: [], statusResult: { success: true }, removeResult: { success: true } };

const stub = (name: string, pick: (p: any) => unknown) => ({ [name]: (p: any) => (
  <div data-testid={"stub-" + name}>
    <span>{JSON.stringify(pick(p))}</span>
    <button onClick={() => p.showToast("Hei fra " + name)}>toast-{name}</button>
    <button onClick={p.onClose}>close-{name}</button>
  </div>
) });

async function load(root: string) {
  vi.resetModules();
  const real = await vi.importActual<Record<string, unknown>>(root + "/src/hooks/useAppHooks");
  vi.doMock(root + "/src/hooks/useAppHooks", () => ({ ...real, useLeaderGatheringDetail: () => world.detail }));
  vi.doMock(root + "/src/components/UserSwitcher", () => ({ UserQuickSwitcherBar: () => <i>bytter</i> }));
  const d = root + "/src/components/gathering/";
  vi.doMock(d + "InstructionDialog", () => stub("InstructionDialog", (p) => ({ task: p.task, canAdminister: p.canAdminister })));
  vi.doMock(d + "AssignPersonDialog", () => stub("AssignPersonDialog", (p) => ({ taskId: p.taskId, canAdminister: p.canAdminister })));
  vi.doMock(d + "EditTaskDialog", () => stub("EditTaskDialog", (p) => ({ task: p.task })));
  vi.doMock(d + "CreateTaskDialog", () => stub("CreateTaskDialog", (p) => ({ gatheringId: p.gathering?.id, open: p.open })));
  vi.doMock(d + "EditGatheringDialog", () => stub("EditGatheringDialog", (p) => ({ gatheringId: p.gathering?.id })));
  const mod: any = await import(/* @vite-ignore */ root + "/src/components/GatheringDetailView.tsx");
  return mod.GatheringDetailView;
}

export async function runGatheringView(root: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  const GatheringDetailView = await load(root);
  const steps: { step: string; html: string; extra?: unknown }[] = [];
  const print = vi.fn();
  (window as any).print = print;

  const open = (opts: { mode?: "admin" | "leader"; detail?: Record<string, unknown>; omitMode?: boolean } = {}) => {
    world.calls = [];
    world.statusResult = { success: true };
    world.removeResult = { success: true };
    world.detail = {
      hasAccess: true, isLeader: true, isDeputy: false, isAdmin: false, gathering, group: g1, involvedGroups: [g1, g2],
      tasksWithDetails, programSchedule,
      updateAssignmentStatus: (...a: unknown[]) => (world.calls.push(["status", ...a]), world.statusResult),
      removeAssignment: (...a: unknown[]) => (world.calls.push(["remove", ...a]), world.removeResult),
      ...opts.detail,
    };
    return render(
      <MemoryRouter>
        {opts.omitMode ? <GatheringDetailView gatheringId="s1" /> : <GatheringDetailView gatheringId="s1" mode={opts.mode ?? "leader"} />}
      </MemoryRouter>
    );
  };
  const snap = (api: ReturnType<typeof render>, step: string, extra?: unknown) =>
    steps.push({ step, html: hash(norm(api.container.innerHTML)), extra: extra === undefined ? undefined : JSON.parse(JSON.stringify(extra)) });
  const q = (api: ReturnType<typeof render>, sel: string) => api.container.querySelector(sel) as HTMLElement;
  const text = (api: ReturnType<typeof render>, sel: string) => (q(api, sel)?.textContent || "").replace(/\s+/g, " ").trim();
  const rows = (api: ReturnType<typeof render>) => [...api.container.querySelectorAll("[id^=schedule-row-]")].map((r) => r.id.replace("schedule-row-", ""));
  const stubText = (api: ReturnType<typeof render>, name: string) => api.queryByTestId("stub-" + name)?.querySelector("span")?.textContent ?? null;
  const toast = (api: ReturnType<typeof render>) => (api.container.querySelector(".bg-emerald-600")?.textContent || "").trim() || null;

  // Leader view
  let api = open();
  snap(api, "leader: initial", { rows: rows(api), barometer: text(api, "#gathering-staffing-barometer"), back: [q(api, "#btn-back-to-group-or-admin").getAttribute("href"), text(api, "#btn-back-to-group-or-admin")] });
  fireEvent.click(q(api, "#tab-filter-needs-action")); snap(api, "leader: needs action", rows(api));
  fireEvent.click(q(api, "#tab-filter-my-group")); snap(api, "leader: my group", rows(api));
  fireEvent.click(q(api, "#tab-filter-all"));
  fireEvent.click(api.getByText(/Kaffe og vertskap \(\d+\)/)); snap(api, "group pill: coffee", rows(api));
  fireEvent.click(q(api, "#tab-filter-my-group")); snap(api, "my group within coffee group: empty", rows(api));
  fireEvent.click(api.getByText("Nullstill alle filtre")); snap(api, "reset filters", rows(api));
  fireEvent.click(api.getByText(/Alle \(\d+\)/)); snap(api, "group pill: all");
  fireEvent.click(q(api, "#btn-print-schedule")); steps.push({ step: "print", html: String(print.mock.calls.length) });

  // Who is on what: the menu on a person, status change, removal and failures
  fireEvent.click(api.getByText("Kari")); snap(api, "person menu opens");
  fireEvent.click(api.getByText("Kari")); snap(api, "person menu closes on second click");
  fireEvent.click(api.getByText("Kari")); fireEvent.click(api.getByText("Meld forfall (Trenger vikar)")); snap(api, "status changed: withdrawn", { calls: world.calls, toast: toast(api) });
  fireEvent.click(api.getByText("Per")); fireEvent.click(api.getByText("Akseptert / Bekreftet")); snap(api, "status changed: confirmed", { calls: world.calls, toast: toast(api) });
  fireEvent.click(api.getByText("Per")); fireEvent.click(api.getByText("Sett som Forespurt")); snap(api, "status changed: pending", { toast: toast(api) });
  world.statusResult = { success: false, error: "Ikke lov." };
  fireEvent.click(api.getByText("Per")); fireEvent.click(api.getByText("Sett som Forespurt")); snap(api, "status change fails and tells why, menu stays", { toast: toast(api) });
  world.statusResult = { success: false };
  fireEvent.click(api.getByText("Sett som Forespurt")); snap(api, "status change fails without a reason", { toast: toast(api) });
  world.statusResult = { success: true };
  fireEvent.click(api.getByText("Fjern fra oppgave")); snap(api, "person removed", { calls: world.calls, toast: toast(api) });
  world.removeResult = { success: false, error: "Finnes ikke." };
  fireEvent.click(api.getByText("Per")); fireEvent.click(api.getByText("Fjern fra oppgave")); snap(api, "removal fails", { toast: toast(api) });
  world.removeResult = { success: false };
  fireEvent.click(api.getByText("Fjern fra oppgave")); snap(api, "removal fails without a reason", { toast: toast(api) });
  cleanup();

  // Dialogs from the rows (a leader can hand out tasks in the own group but not edit them)
  api = open();
  steps.push({ step: "leader buttons", html: JSON.stringify({ assign: [...api.container.querySelectorAll("[id^=btn-intervene-assign-]")].map((b) => b.id), edit: api.container.querySelectorAll("[id^=btn-admin-edit-task-]").length, instruction: [...api.container.querySelectorAll("[id^=btn-instruction-]")].map((b) => b.id), adminButtons: [!!q(api, "#btn-admin-edit-gathering"), !!q(api, "#btn-admin-add-task")] }) });
  fireEvent.click(q(api, "#btn-instruction-task-t1")); snap(api, "instruction dialog for a task", stubText(api, "InstructionDialog"));
  fireEvent.click(api.getByText("toast-InstructionDialog")); snap(api, "dialog toast reaches the banner", toast(api));
  fireEvent.click(api.getByText("close-InstructionDialog")); snap(api, "instruction dialog closed");
  fireEvent.click(q(api, "#btn-instruction-program-1")); snap(api, "instruction dialog for a programme item with a task", stubText(api, "InstructionDialog"));
  fireEvent.click(api.getByText("close-InstructionDialog"));
  fireEvent.click(q(api, "#btn-intervene-assign-t3")); snap(api, "assign dialog", stubText(api, "AssignPersonDialog"));
  fireEvent.click(api.getByText("close-AssignPersonDialog")); snap(api, "assign dialog closed");
  cleanup();

  // Admin view
  api = open({ mode: "admin", detail: { isAdmin: true, isLeader: false, group: undefined } });
  snap(api, "admin: initial", { rows: rows(api), barometer: text(api, "#gathering-staffing-barometer"), back: [q(api, "#btn-back-to-group-or-admin").getAttribute("href"), text(api, "#btn-back-to-group-or-admin")], tabs: [!!q(api, "#tab-filter-my-group")] });
  steps.push({ step: "admin buttons", html: JSON.stringify({ edit: api.container.querySelectorAll("[id^=btn-admin-edit-task-]").length, assign: api.container.querySelectorAll("[id^=btn-intervene-assign-]").length }) });
  fireEvent.click(q(api, "#btn-admin-edit-gathering")); snap(api, "edit gathering dialog", stubText(api, "EditGatheringDialog"));
  fireEvent.click(api.getByText("close-EditGatheringDialog")); snap(api, "edit gathering dialog closed");
  steps.push({ step: "create task dialog starts closed", html: String(stubText(api, "CreateTaskDialog")) });
  fireEvent.click(q(api, "#btn-admin-add-task")); snap(api, "create task dialog open", stubText(api, "CreateTaskDialog"));
  fireEvent.click(api.getByText("close-CreateTaskDialog")); snap(api, "create task dialog closed", stubText(api, "CreateTaskDialog"));
  fireEvent.click(q(api, "#btn-admin-edit-task-t2")); snap(api, "edit task dialog (needed count 2)", stubText(api, "EditTaskDialog"));
  fireEvent.click(api.getByText("close-EditTaskDialog"));
  fireEvent.click(q(api, "#btn-admin-edit-task-t4")); snap(api, "edit task dialog (defaults: need 1, empty texts)", stubText(api, "EditTaskDialog"));
  fireEvent.click(api.getByText("close-EditTaskDialog"));
  fireEvent.click(q(api, "#btn-intervene-assign-t4")); snap(api, "admin assign dialog", stubText(api, "AssignPersonDialog"));
  cleanup();

  // Mode and roles: the same person seen as leader, deputy and admin
  api = open({ detail: { isAdmin: true } }); snap(api, "admin opening in leader mode keeps leader look but can administer", { back: q(api, "#btn-back-to-group-or-admin").getAttribute("href"), buttons: [!!q(api, "#btn-admin-edit-gathering"), !!q(api, "#tab-filter-my-group")] }); cleanup();
  api = open({ omitMode: true, detail: { isAdmin: true } }); snap(api, "no mode given means leader", { back: q(api, "#btn-back-to-group-or-admin").getAttribute("href") }); cleanup();
  api = open({ detail: { isLeader: false, isDeputy: true } }); snap(api, "deputy", { buttons: [q(api, "[id^=btn-intervene-assign-]") === null] }); cleanup();
  api = open({ detail: { isLeader: false, isDeputy: false } }); snap(api, "neither leader nor deputy: no buttons on rows", { assign: api.container.querySelectorAll("[id^=btn-intervene-assign-]").length }); cleanup();
  api = open({ detail: { group: undefined } }); snap(api, "leader without a group: no my-group tab", !!q(api, "#tab-filter-my-group")); cleanup();

  // The staffing banner in each state, and the counts in the title
  api = open({ detail: { tasksWithDetails: [tasksWithDetails[0]] } }); snap(api, "banner: fully staffed", text(api, "#gathering-staffing-barometer")); cleanup();
  api = open({ detail: { tasksWithDetails: [tasksWithDetails[1], tasksWithDetails[3]] } }); snap(api, "banner: missing people, nobody withdrawn", text(api, "#gathering-staffing-barometer")); cleanup();
  api = open({ detail: { tasksWithDetails: [tasksWithDetails[2]] } }); snap(api, "banner: one task needs follow-up", text(api, "#gathering-staffing-barometer")); cleanup();
  api = open({ detail: { tasksWithDetails: [tasksWithDetails[2], { ...tasksWithDetails[1], hasWithdrawn: true }] } }); snap(api, "banner: two tasks need follow-up", text(api, "#gathering-staffing-barometer")); cleanup();
  api = open({ detail: { tasksWithDetails: [], programSchedule: [] } }); snap(api, "no tasks and no programme", text(api, "#gathering-staffing-barometer")); cleanup();
  api = open({ detail: { tasksWithDetails: [], programSchedule: [] } }); fireEvent.click(q(api, "#tab-filter-needs-action")); snap(api, "empty schedule with a filter"); cleanup();
  api = open({ detail: { involvedGroups: [g1] } }); snap(api, "one group involved: no group pills, singular", (api.container.textContent || "").match(/\d+ tjenestegrupper? involvert/)?.[0]); cleanup();
  api = open({ detail: { gathering: { ...gathering, type: "gruppesamling", location: undefined } } }); snap(api, "group meeting without a place", (api.container.textContent || "").match(/Samling|Gudstjeneste \/ Arrangement/)?.[0]); cleanup();

  // Without a gathering or without access
  api = open({ detail: { gathering: undefined } }); snap(api, "gathering not found", { text: text(api, "h3") + " | " + text(api, "p"), link: api.container.querySelector("a")?.getAttribute("href") }); cleanup();
  api = open({ detail: { hasAccess: false } }); snap(api, "no access as leader", { text: text(api, "p"), link: api.container.querySelector("a")?.getAttribute("href"), label: text(api, "a") }); cleanup();
  api = open({ mode: "admin", detail: { hasAccess: false, isAdmin: true } }); snap(api, "no access as admin", { link: api.container.querySelector("a")?.getAttribute("href"), label: text(api, "a") }); cleanup();

  vi.useRealTimers();
  return { steps };
}
