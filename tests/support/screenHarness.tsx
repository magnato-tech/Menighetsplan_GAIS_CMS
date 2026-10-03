import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

/**
 * Runs the admin screens through fixed scenarios and records what they do: what they write, what they
 * tell the user, and what the form fields hold afterwards. The same scenarios were run on the code as it
 * was before the screens were split up, and that result is stored in tests/golden/screens.golden.json.
 * Text that was reworded on purpose is not recorded, so the golden only holds behaviour.
 *
 * `root` is the folder that holds `src/`. Pass the project folder to test the current code.
 */

const NOW = new Date("2026-10-07T12:00:00.000Z");

export const persons = [
  { id: "p1", name: "Kari Nordmann", globalRole: "admin", phone: "911 11 111", email: "kari@x.no" },
  { id: "p2", name: "Ola Hansen", globalRole: "member" },
  { id: "p3", name: "Per Olsen", globalRole: "member", phone: "922 22 222" },
];
const groupsOfPerson = [
  { id: "g1", name: "Lyd og bilde", memberIds: ["p1"], leaderIds: ["p1"] },
  { id: "g2", name: "Barnekirke", memberIds: ["p1"], leaderIds: [], deputyLeaderIds: ["p1"] },
  { id: "g3", name: "Kaffe", memberIds: ["p1"], leaderIds: [] },
];
const tasks = ["confirmed", "vacant", "open", "assigned", "cancelled"].map((status, i) => ({
  id: "t" + i,
  gatheringId: "s1",
  groupId: "g1",
  title: "Oppgave " + i,
  status,
}));
const groupGatherings = [
  {
    gathering: { id: "s1", title: "Gudstjeneste", startsAt: "2026-10-18T09:00:00.000Z", location: "Kirken" },
    tasks: tasks.slice(0, 3),
    staffing: { color: "yellow", badgeText: "Mangler", coveredCount: 1, totalTasks: 3 },
  },
];

interface Shared {
  person?: unknown;
  group?: unknown;
  isAdmin: boolean;
  calls: unknown[][];
  feedback: unknown[][];
}
const shared: Shared = { isAdmin: true, calls: [], feedback: [] };
const record = (name: string) => (...args: unknown[]) => {
  shared.calls.push([name, ...args]);
  return { success: true as const };
};
const ok = { success: true, counts: {}, total: 0, failures: [] };

async function load(root: string, file: string) {
  vi.resetModules();
  const real = await vi.importActual<Record<string, unknown>>(root + "/src/hooks/useAppHooks");
  vi.doMock(root + "/src/hooks/useAppHooks", () => ({
    ...real,
    useAdminPersonDetail: () => ({
      isAdmin: shared.isAdmin,
      currentUser: { id: "admin-1", name: "A", globalRole: "admin" },
      person: shared.person,
      personGroups: groupsOfPerson,
      personTasks: tasks,
      updatePerson: record("updatePerson"),
    }),
    useAdminGroupDetail: () => ({
      isAdmin: shared.isAdmin,
      group: shared.group,
      members: persons.slice(0, 2),
      availablePersonsToAdd: [persons[2]],
      allPersons: persons,
      groupGatherings,
      updateGroup: record("updateGroup"),
      addGroupMember: record("addGroupMember"),
      removeGroupMember: record("removeGroupMember"),
    }),
  }));
  vi.doMock(root + "/src/components/UserSwitcher", () => ({ UserQuickSwitcherBar: () => null }));
  vi.doMock(root + "/src/components/AdminAccessRequired", () => ({ AdminAccessRequired: () => <p>Admin-tilgang kreves</p> }));
  vi.doMock(root + "/src/context/CmsContext", () => ({
    useCms: () => ({ settings: { churchName: "Testkirken" }, pages: [{}, {}], news: [{}], sermons: [], staff: [] }),
  }));
  vi.doMock(root + "/src/context/FirebaseDataContext", () => ({
    useFirebase: () => ({
      isFirestoreConnected: true,
      allPersons: [{}, {}],
      groups: [{}],
      gatherings: [{}, {}, {}],
      tasks: [{}],
      assignments: [{}],
      moduleConfig: { kalender: "on", meldinger: "off" },
      toggleKalender: () => shared.calls.push(["toggleKalender"]),
      toggleMeldinger: () => shared.calls.push(["toggleMeldinger"]),
    }),
  }));
  vi.doMock(root + "/src/services/databaseAdmin", () => ({
    populateCustomMockData: async (...a: unknown[]) => (shared.calls.push(["populate", ...a]), ok),
    clearPlannerTestData: async () => (shared.calls.push(["clearPlanner"]), ok),
    deleteAllData: async () => (shared.calls.push(["deleteAll"]), ok),
  }));
  vi.doMock(root + "/src/pages/admin/tabs/pages/HeroImageUploader", () => ({ HeroImageUploader: () => <i>hero</i> }));
  vi.doMock(root + "/src/pages/admin/tabs/pages/ContentBlockPickerModal", () => ({
    ContentBlockPickerModal: ({ isOpen, onInsertBlock }: { isOpen: boolean; onInsertBlock: (s: string) => void }) =>
      isOpen ? <button onClick={() => onInsertBlock("[blokk]")}>Velg blokk</button> : null,
  }));
  return import(/* @vite-ignore */ root + file);
}

/** Every field's value or checked state, in page order. */
const controls = (el: Element) =>
  [...el.querySelectorAll("input,select,textarea")]
    .filter((e) => (e as HTMLInputElement).type !== "file")
    .map((e) => {
      const f = e as HTMLInputElement;
      return `${f.id || f.placeholder || f.getAttribute("aria-label") || f.type}=${f.type === "checkbox" ? f.checked : f.value}`;
    });
const text = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();
const toast = (el: Element, id: string) => el.querySelector("#" + id)?.textContent ?? null;
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function mount(Page: React.ComponentType, path: string, route: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={<Page />} />
      </Routes>
    </MemoryRouter>
  );
}
const pause = (ms = 20) => new Promise((r) => setTimeout(r, ms));

async function personScenarios(root: string) {
  const out: Record<string, unknown> = {};
  const run = async (name: string, person: unknown, isAdmin: boolean, act: (api: ReturnType<typeof render>) => void) => {
    shared.person = person;
    shared.isAdmin = isAdmin;
    shared.calls = [];
    const mod = await load(root, "/src/pages/AdminPersonDetailPage.tsx");
    const api = mount(mod.AdminPersonDetailPage, "/admin/person/p1", "/admin/person/:personId");
    const before = controls(api.container);
    act(api);
    out[name] = {
      before,
      after: controls(api.container),
      calls: clean(shared.calls),
      toast: toast(api.container, "admin-person-feedback-toast"),
      groups: [...api.container.querySelectorAll("#person-groups-section span")].map((e) => e.textContent).filter((t) => ["Leder", "Nestleder", "Medlem"].includes(t || "")),
      tasks: api.container.querySelectorAll("#person-tasks-section .space-y-1\\.5 > div").length,
    };
    cleanup();
  };
  const save = (api: ReturnType<typeof render>) => {
    fireEvent.click(api.getByRole("button", { name: /Lagre alle personopplysninger/ }));
  };

  await run("edit and save", { ...persons[0] }, true, (api) => {
    fireEvent.change(api.getByLabelText(/Fullt navn/), { target: { value: "  Kari Hansen " } });
    fireEvent.change(api.getByLabelText(/Mobilnummer/), { target: { value: "" } });
    fireEvent.click(api.getByLabelText(/ansatt i staben/));
    fireEvent.change(api.container.querySelector('input[placeholder^="f.eks. Hovedpastor"]')!, { target: { value: "Pastor" } });
    save(api);
  });
  await run("staff with consent, new absence", {
    ...persons[0], isStaff: true, staffRole: "Hovedpastor", staffCategory: "pastor", staffBio: "Bio", isPublicProfile: true,
    consentToPublishGivenAt: "2026-01-01T00:00:00.000Z", consentGivenBy: "a0", publicTitle: "T", publicPhone: "1", publicEmail: "e@x.no",
    avatarUrl: "x.png", policeCertificateValidUntil: "2027-01-01", unavailablePeriods: [{ from: "2026-02-01", to: "2026-02-02", reason: "Ferie" }],
  }, true, (api) => {
    const d = api.container.querySelectorAll('input[type="date"]');
    fireEvent.change(d[1], { target: { value: "2026-07-01" } });
    fireEvent.change(d[2], { target: { value: "2026-07-14" } });
    fireEvent.click(api.getByTitle("Legg til fravær"));
    save(api);
  });
  await run("absence without dates", { ...persons[1] }, true, (api) => {
    fireEvent.click(api.getByTitle("Legg til fravær"));
  });
  await run("remove absence", { ...persons[1], unavailablePeriods: [{ from: "2026-02-01", to: "2026-02-02" }] }, true, (api) => {
    fireEvent.click(api.getByTitle("Fjern fraværsperiode"));
    save(api);
  });
  await run("empty name", { ...persons[1] }, true, (api) => {
    fireEvent.change(api.getByLabelText(/Fullt navn/), { target: { value: " " } });
    save(api);
  });
  await run("withdraw consent", { ...persons[0], isPublicProfile: true, consentToPublishGivenAt: "2026-01-01T00:00:00.000Z", consentGivenBy: "a0" }, true, (api) => {
    fireEvent.click(api.getByLabelText(/samtykket til å stå med navn/));
    save(api);
  });
  await run("person not found", undefined, true, () => {});
  await run("no access", { ...persons[0] }, false, () => {});
  for (const k of ["person not found", "no access"]) {
    // Whole-page text is recorded for these two, which have no reworded text
    shared.person = k === "no access" ? { ...persons[0] } : undefined;
    shared.isAdmin = k !== "no access";
    const mod = await load(root, "/src/pages/AdminPersonDetailPage.tsx");
    const api = mount(mod.AdminPersonDetailPage, "/admin/person/p1", "/admin/person/:personId");
    (out[k] as Record<string, unknown>).page = text(api.container);
    cleanup();
  }
  return out;
}

async function groupScenarios(root: string) {
  const out: Record<string, unknown> = {};
  const base = { id: "g1", name: "Lyd", description: "Beskrivelse", category: "husgruppe", tags: ["a"], memberIds: ["p1", "p2"], leaderIds: ["p1"], deputyLeaderIds: ["p2"] };
  const run = async (name: string, group: unknown, isAdmin: boolean, act: (api: ReturnType<typeof render>) => Promise<void> | void) => {
    shared.group = group;
    shared.isAdmin = isAdmin;
    shared.calls = [];
    const mod = await load(root, "/src/pages/AdminGroupDetailPage.tsx");
    const api = mount(mod.AdminGroupDetailPage, "/admin/gruppe/g1", "/admin/gruppe/:groupId");
    const before = controls(api.container);
    await act(api);
    out[name] = {
      before,
      after: controls(api.container),
      calls: clean(shared.calls),
      toast: toast(api.container, "admin-group-feedback-toast"),
      page: group === undefined || !isAdmin ? text(api.container) : undefined,
      removeButtons: api.container.querySelectorAll('[title="Fjern fra gruppe"]').length,
    };
    cleanup();
  };
  const save = (api: ReturnType<typeof render>) => {
    fireEvent.click(api.getByRole("button", { name: /Lagre endringer for gruppen/ }));
  };

  await run("edit everything and save", base, true, (api) => {
    fireEvent.change(api.getByLabelText(/Gruppenavn/), { target: { value: " Teknikk " } });
    fireEvent.change(api.getByLabelText(/Tagger/), { target: { value: "Lyd, BILDE ,," } });
    fireEvent.click(api.getByLabelText(/fast møtetid/));
    fireEvent.change(api.getByLabelText("Klokkeslett:"), { target: { value: "19:00" } });
    fireEvent.change(api.getByLabelText("Frekvens:"), { target: { value: "hver måned" } });
    fireEvent.change(api.getByLabelText(/^Leder:/), { target: { value: "p2" } });
    fireEvent.click(api.getByLabelText(/Vis gruppen på nettsiden/));
    save(api);
  });
  await run("existing schedule is kept", { ...base, meetingSchedule: { weekday: "Onsdag", time: "19:30", frequency: "annenhver uke" } }, true, (api) => save(api));
  await run("no schedule stays none", base, true, (api) => save(api));
  await run("empty name", base, true, (api) => {
    fireEvent.change(api.getByLabelText(/Gruppenavn/), { target: { value: " " } });
    save(api);
  });
  await run("hidden group", { ...base, isPublic: false }, true, () => {});
  await run("add and remove member", base, true, async (api) => {
    fireEvent.change(api.container.querySelector("#select-add-group-member")!, { target: { value: "p3" } });
    fireEvent.click(api.getByRole("button", { name: "Legg til" }));
    fireEvent.click(api.getByTitle("Fjern fra gruppe"));
    await pause();
  });
  await run("group not found", undefined, true, () => {});
  await run("no access", base, false, () => {});
  return out;
}

async function pageEditorScenarios(root: string) {
  const out: Record<string, unknown> = {};
  const parents = [{ id: "grupper", title: "Grupper", slug: "grupper" }];
  const variants: Record<string, Record<string, unknown>> = {
    empty: {},
    draft: { title: "Om oss", slug: "om-oss", summary: "Ingress", content: "Tekst", isPublished: false },
    scheduled: { title: "X", isPublished: true, publishAt: "2099-01-01T09:00:00.000Z", metaDescription: "x".repeat(130), ogImage: "https://x/y.png", heroImage: "https://x/h.png", parentPageId: "grupper", menuOrder: 3, inNavMenu: false, linkUrl: "/taler" },
    legacyFields: { title: "Gammel", parentId: "grupper", navOrder: 5, publishAt: "2020-01-01T09:00:00.000Z" },
  };
  const mod = await load(root, "/src/pages/admin/tabs/pages/PageEditModal.tsx");
  for (const [name, variant] of Object.entries(variants)) {
    for (const isNew of [false, true]) {
      const seen: unknown[] = [];
      const api = render(
        <mod.PageEditModal editingPage={variant} isNewPage={isNew} availableParentPages={parents} onUpdate={(p: unknown) => seen.push(p)} onSave={() => {}} onPreview={() => {}} onClose={() => {}} />
      );
      const q = api.container;
      const before = controls(q);
      const heading = q.querySelector("h3")?.textContent;
      fireEvent.change(q.querySelector('input[type="text"]')!, { target: { value: "Ny tittel" } });
      fireEvent.change(q.querySelector("select")!, { target: { value: "grupper" } });
      fireEvent.change(q.querySelector('input[type="number"]')!, { target: { value: "7" } });
      for (const t of ["Sett inn infoboks", "Sett inn viktig varsel", "Sett inn to likeverdige kort side ved side", "Sett inn sitatblokk", "Sett inn handlingsknapp", "Sett inn alle ansatte i staben med bilde og kontaktinfo", "Sett inn kun pastoren"]) fireEvent.click(api.getByTitle(t));
      for (const t of ["I morgen 09:00", "Søndag 08:00", "Mandag 09:00"]) fireEvent.click(api.getByText(t));
      const dt = q.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(dt, { target: { value: "2026-12-24T18:30" } });
      fireEvent.change(dt, { target: { value: "" } });
      const cb = q.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(cb[0]);
      fireEvent.click(cb[1]);
      const tas = q.querySelectorAll("textarea");
      fireEvent.change(tas[tas.length - 1], { target: { value: "Meta" } });
      fireEvent.click(api.getByRole("button", { name: /Legg til innhold/ }));
      fireEvent.click(api.getByText("Velg blokk"));
      const copy = api.queryByText("Kopier fra ingress");
      if (copy) fireEvent.click(copy);
      const badges = ["Planlagt publisering", "Publisert (aktiv)", "Kladd (upublisert)"].filter((b) => api.queryByText(b));
      out[`${name}${isNew ? " (new page)" : ""}`] = { before, heading, updates: clean(seen), badges, counter: q.textContent?.match(/\d+\/160 tegn/)?.[0] ?? null };
      cleanup();
    }
  }
  return out;
}

async function databaseScenario(root: string) {
  shared.calls = [];
  shared.feedback = [];
  const mod = await load(root, "/src/pages/admin/tabs/DatabaseTab.tsx");
  const api = render(<mod.DatabaseTab showFeedback={(...a: unknown[]) => shared.feedback.push(a)} />);
  const q = api.container;
  // The old tab opened on a quick generator; the pack-and-slider generator sat behind this button
  const advanced = api.queryByText(/Avansert planlegger-oppsett/);
  if (advanced) fireEvent.click(advanced);
  const click = async (name: RegExp | string) => {
    fireEvent.click(api.getAllByRole("button", { name })[0]);
    await waitFor(() => {});
    await pause();
  };
  await click(/Populer databasen/);
  fireEvent.click(api.getByText("Kompakt testsett"));
  await click(/Populer databasen/);
  const ranges = q.querySelectorAll('input[type="range"]');
  [24, 9, 15, 17].forEach((v, i) => fireEvent.change(ranges[i], { target: { value: String(v) } }));
  fireEvent.click(q.querySelector("#clear-before-populate-checkbox")!);
  await click(/Populer databasen/);
  fireEvent.click(api.getByText("Mellomstor menighet"));
  fireEvent.click(api.getByText("Fullskala menighet"));
  const sliders = [...q.querySelectorAll('input[type="range"]')].map((e) => (e as HTMLInputElement).value);
  await click(/Tøm planlegger-testdata/);
  await click("Avbryt");
  await click(/Tøm planlegger-testdata/);
  await click("Ja, tøm testdata");
  await pause(30);
  await click(/Slett alt i databasen/);
  await click("Avbryt");
  await click(/Slett alt i databasen/);
  await click("Ja, slett alt permanent");
  await pause(30);
  await click("Slå av");
  await click("Slå på");
  const result = {
    calls: clean(shared.calls),
    feedback: clean(shared.feedback),
    sliders,
    total: q.textContent?.match(/\((\d+) dokumenter\)/)?.[1],
    tiles: ["Personer", "Grupper", "Samlinger", "Oppgaver", "Tildelinger", "CMS & Innhold"].map((l) => api.getByText(l).previousSibling?.textContent),
  };
  cleanup();
  return result;
}

export async function runAllScreens(root: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  try {
    return {
      person: await personScenarios(root),
      group: await groupScenarios(root),
      pageEditor: await pageEditorScenarios(root),
      database: await databaseScenario(root),
    };
  } finally {
    vi.useRealTimers();
  }
}
