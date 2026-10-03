import { createHash } from "node:crypto";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { vi } from "vitest";

/**
 * Runs the group's list of planned activities through fixed interactions and records what it shows and
 * reports. The golden file holds the result from before the component was split up.
 */

const person = (id: string, name: string) => ({ id, name, globalRole: "member" });
const p1 = person("p1", "Kari"), p2 = person("p2", "Ola"), p3 = person("p3", "Per");
const task = (id: string, title: string, status: string) => ({ id, gatheringId: "", groupId: "g", title, status });
const assigned = (id: string, p: any, response: string, statusLabel: string) => ({ assignment: { id, taskId: "", personId: p.id, response }, person: p, response, statusLabel });

const t1 = task("t1", "Lyd", "confirmed"), t2 = task("t2", "Kaffe", "open"), t3 = task("t3", "Bilde", "assigned"), t4 = task("t4", "Vert", "vacant"), t5 = task("t5", "Barnekirke", "vacant");
const item = (g: any, taskItems: any[], staffing: any, tasks: any[]) => ({
  gathering: g, tasks, taskItems,
  totalNeeded: taskItems.reduce((n, t) => n + t.neededCount, 0),
  totalConfirmed: taskItems.reduce((n, t) => n + t.confirmedCount, 0),
  staffing,
});
const ti = (t: any, assignedPersons: any[], confirmedCount: number, neededCount: number, isFullyCovered: boolean, hasForfall = false) => ({ task: t, assignedPersons, confirmedCount, neededCount, isFullyCovered, hasForfall });

const groupGatherings = [
  item({ id: "g1", title: "Gudstjeneste", startsAt: "2026-10-18T09:00:00.000Z", location: "Kirken" }, [ti(t1, [assigned("a1", p1, "confirmed", "Bekreftet")], 1, 1, true)], { color: "green", badgeText: "Dekket", coveredCount: 1, totalTasks: 1 }, [t1]),
  item({ id: "g2", title: "Bønnemøte", type: "gruppesamling", startsAt: "2026-10-25T17:00:00.000Z" }, [ti(t2, [], 0, 2, false), ti(t3, [assigned("a2", p2, "pending", "Forespurt")], 0, 1, false)], { color: "yellow", badgeText: "Mangler", coveredCount: 0, totalTasks: 2 }, [t2, t3]),
  item({ id: "g3", title: "Julemarked", type: "arrangement", startsAt: "2026-11-29T12:00:00.000Z", location: "Torget" }, [ti(t4, [assigned("a3", p1, "withdrawn", "Forfall"), assigned("a4", p2, "declined", "Avslått")], 0, 2, false, true), ti(t5, [], 0, 1, false)], { color: "red", badgeText: "Trenger vikar", coveredCount: 0, totalTasks: 2 }, [t4, t5]),
];

const norm = (html: string) => html.replace(/class="([^"]*)"/g, (_m, c) => 'class="' + c.split(/\s+/).filter(Boolean).sort().join(" ") + '"');
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export async function runGroupActivities(root: string) {
  vi.resetModules();
  const mod: any = await import(/* @vite-ignore */ root + "/src/pages/leaderGroup/GroupActivities.tsx");
  const steps: { step: string; html: string; extra?: unknown }[] = [];
  const calls: unknown[][] = [];
  let assignResult: any = { success: true };

  function Where() {
    const l = useLocation();
    return <i data-testid="where">{l.pathname}</i>;
  }
  const open = (opts: { access?: boolean; items?: any[] } = {}) => {
    const detail = {
      hasLeaderAccess: opts.access ?? true,
      members: [p1, p2, p3],
      groupGatherings: opts.items ?? groupGatherings,
      assignTaskToPerson: (...a: unknown[]) => (calls.push(["assign", ...a]), assignResult),
    };
    return render(
      <MemoryRouter>
        <mod.GroupActivities detail={detail} showToast={(t: string) => calls.push(["toast", t])} />
        <Where />
      </MemoryRouter>
    );
  };
  const snap = (api: ReturnType<typeof render>, step: string, extra?: unknown) =>
    steps.push({ step, html: hash(norm(api.container.innerHTML)), extra });
  const q = (api: ReturnType<typeof render>, sel: string) => api.container.querySelector(sel) as HTMLElement;
  const where = (api: ReturnType<typeof render>) => api.getByTestId("where").textContent;

  // Cards
  let api = open();
  snap(api, "initial cards", (api.container.textContent || "").match(/\d+ av \d+ aktiviteter/)?.[0]);
  fireEvent.change(q(api, "#select-group-filter-month"), { target: { value: "2026-11" } }); snap(api, "month: november");
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "green" } }); snap(api, "november and green: nothing");
  fireEvent.change(q(api, "#select-group-filter-month"), { target: { value: "all" } }); snap(api, "all months, green");
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "yellow" } }); snap(api, "yellow");
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "all" } });
  steps.push({ step: "month options", html: JSON.stringify([...q(api, "#select-group-filter-month").querySelectorAll("option")].map((o) => [(o as HTMLOptionElement).value, o.textContent])) });
  fireEvent.change(q(api, "#select-group-filter-month"), { target: { value: "2026-10" } });
  fireEvent.click(q(api, "#btn-group-filter-urgent-shortcut")); snap(api, "urgent shortcut resets month and filters red", [(q(api, "#select-group-filter-month") as HTMLSelectElement).value, (q(api, "#select-group-filter-status") as HTMLSelectElement).value]);
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "all" } });

  fireEvent.click(q(api, "#btn-toggle-tasks-g1")); snap(api, "expand g1");
  fireEvent.click(q(api, "#btn-toggle-tasks-g1")); snap(api, "collapse g1");
  fireEvent.click(q(api, "#btn-toggle-tasks-g3")); snap(api, "expand g3");
  fireEvent.click(q(api, "#btn-toggle-tasks-g2")); snap(api, "expand g2 closes g3");
  fireEvent.click(q(api, "#btn-toggle-tasks-g3"));
  fireEvent.click(q(api, "#btn-quick-assign-t4")); snap(api, "quick assign open on t4");
  fireEvent.click(q(api, "#btn-quick-assign-t5")); snap(api, "quick assign moves to t5");
  fireEvent.click(q(api, "#btn-quick-assign-t5")); snap(api, "quick assign closed again");
  fireEvent.click(q(api, "#btn-quick-assign-t4"));
  fireEvent.click(q(api, "#btn-do-quick-assign-t4-p3")); snap(api, "assigned directly closes the drawer");
  fireEvent.click(q(api, "#btn-quick-assign-t4"));
  assignResult = { success: false, error: "Personen er opptatt." };
  fireEvent.click(q(api, "#btn-do-quick-assign-t4-p2")); snap(api, "failed assignment keeps the drawer");
  assignResult = { success: false };
  fireEvent.click(q(api, "#btn-do-quick-assign-t4-p1"));
  assignResult = { success: true };
  fireEvent.click(q(api, "#btn-open-gathering-detail-g3")); steps.push({ step: "open detail from card", html: where(api) ?? "" });
  cleanup();

  // Table
  api = open();
  fireEvent.click(q(api, "#btn-switch-view-tabell")); snap(api, "table", api.container.querySelectorAll("tbody tr").length);
  steps.push({ step: "table rows", html: JSON.stringify([...api.container.querySelectorAll("tbody tr")].map((r) => (r.textContent || "").replace(/\s+/g, " "))) });
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "red" } }); snap(api, "table, red", api.container.querySelectorAll("tbody tr").length);
  fireEvent.change(q(api, "#select-group-filter-month"), { target: { value: "2026-10" } }); snap(api, "table, red in october: empty");
  fireEvent.change(q(api, "#select-group-filter-status"), { target: { value: "all" } });
  fireEvent.change(q(api, "#select-group-filter-month"), { target: { value: "all" } });
  fireEvent.click(api.getAllByText("Tildel vikar")[0]); snap(api, "table: assign substitute goes to cards with the drawer open");
  fireEvent.click(q(api, "#btn-switch-view-tabell"));
  fireEvent.click(api.getAllByText("Åpne")[2]); steps.push({ step: "open detail from table", html: where(api) ?? "" });
  cleanup();

  // Without leader access, and the empty and all-covered cases
  api = open({ access: false });
  fireEvent.click(q(api, "#btn-toggle-tasks-g3")); snap(api, "no access: cards have no quick assign", !!q(api, "#btn-quick-assign-t4"));
  fireEvent.click(q(api, "#btn-switch-view-tabell")); snap(api, "no access: table has no assign button", api.queryAllByText("Tildel vikar").length);
  cleanup();
  api = open({ items: [] }); snap(api, "no activities at all"); fireEvent.click(q(api, "#btn-switch-view-tabell")); snap(api, "no activities, table"); cleanup();
  api = open({ items: [groupGatherings[0]] }); snap(api, "all covered banner"); cleanup();

  return { steps, calls };
}
