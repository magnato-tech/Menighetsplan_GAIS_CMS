// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildChurchAnalytics, type AnalyticsPeriodId, type ChurchData } from "../src/utils/churchAnalytics";
import type { Gathering } from "../src/types";

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
const service = (id: string, startsAt: string, title = "Gudstjeneste"): Gathering => ({
  id,
  groupId: "g-team",
  title,
  startsAt,
  type: "arrangement",
  visibility: "offentlig",
  isGudstjeneste: true,
});

const data: ChurchData = {
  persons: [
    { id: "p1", name: "Anne Admin", globalRole: "admin" },
    { id: "p2", name: "Bjørn Bærer", globalRole: "member" },
    { id: "p3", name: "Frode Utenfor", globalRole: "member" },
  ],
  groups: [{ id: "g-team", name: "Søndagsteam", category: "tjenestegruppe", memberIds: ["p2"], leaderIds: ["p1"] }],
  gatherings: [service("w1", daysAgo(14), "Høstgudstjeneste"), service("w2", daysAgo(7), "Familiegudstjeneste")],
  tasks: [{ id: "t1", gatheringId: "w1", title: "Lyd", status: "confirmed", neededCount: 1 }],
  assignments: [{ id: "a1", taskId: "t1", personId: "p2", response: "confirmed" }],
  attendances: [],
  headcounts: [{ id: "headcount-w1", gatheringId: "w1", adults: 80, children: 20, registeredAt: daysAgo(14) }],
  messages: [],
  volunteerRoles: [],
  pages: [],
  news: [],
  sermons: [],
};

const registerHeadcount = vi.fn(() => ({ success: true }));
const removeHeadcount = vi.fn(() => ({ success: true }));
const requestedPeriods: AnalyticsPeriodId[] = [];

vi.mock("../src/hooks/useAppHooks", () => ({
  useAdminAnalytics: (periodId: AnalyticsPeriodId) => {
    requestedPeriods.push(periodId);
    return { analytics: buildChurchAnalytics(data, periodId, now), registerHeadcount, removeHeadcount };
  },
}));

import { AnalyticsTab } from "../src/pages/admin/tabs/AnalyticsTab";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderTab() {
  const showFeedback = vi.fn();
  const onTabChange = vi.fn();
  render(
    <MemoryRouter>
      <AnalyticsTab showFeedback={showFeedback} onTabChange={onTabChange} />
    </MemoryRouter>
  );
  return { showFeedback, onTabChange };
}

describe("Analysebord", () => {
  test("viser nøkkeltallene for perioden", () => {
    renderTab();
    expect(screen.getByRole("heading", { name: "Analysebord" })).toBeTruthy();
    expect(screen.getByText("Talt på 1 av 2 gudstjenester")).toBeTruthy();
    expect(screen.getByText("1 av 1 plasser bekreftet")).toBeTruthy();
    expect(screen.getByText("2 personer i minst én gruppe, 1 uten")).toBeTruthy();
  });

  test("lister samlinger som mangler oppmøtetall, og lagrer en ny telling", () => {
    const { showFeedback } = renderTab();
    expect(screen.getByText("Mangler oppmøtetall: 1 samling")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Registrer$/ }));

    const dialog = screen.getByRole("dialog", { name: "Registrer oppmøtetall" });
    expect(within(dialog).getByText(/Familiegudstjeneste/)).toBeTruthy();

    // Nobody counted is refused, and nothing is stored
    fireEvent.click(within(dialog).getByRole("button", { name: "Lagre oppmøtetall" }));
    expect(within(dialog).getByRole("alert").textContent).toBe("Skriv inn hvor mange som var til stede.");
    expect(registerHeadcount).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText("Voksne"), { target: { value: "72" } });
    fireEvent.change(within(dialog).getByLabelText("Barn"), { target: { value: "15" } });
    expect(within(dialog).getByText("87")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Lagre oppmøtetall" }));

    expect(registerHeadcount).toHaveBeenCalledWith("w2", { adults: 72, children: 15 });
    expect(showFeedback).toHaveBeenCalledWith("Oppmøtetallet for «Familiegudstjeneste» er lagret.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("en registrert telling kan rettes eller fjernes fra diagrammet", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Høstgudstjeneste .*: 100 til stede/ }));
    const dialog = screen.getByRole("dialog", { name: "Endre oppmøtetall" });
    expect((within(dialog).getByLabelText("Voksne") as HTMLInputElement).value).toBe("80");
    fireEvent.click(within(dialog).getByRole("button", { name: "Fjern tellingen" }));
    expect(removeHeadcount).toHaveBeenCalledWith("w1");
  });

  test("tabellvisningen viser tallene uten diagram", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Vis som tabell" }));
    const table = screen.getByRole("table", { name: "Oppmøte per samling" });
    expect(within(table).getByText("Ikke registrert")).toBeTruthy();
    expect(within(table).getByText("100")).toBeTruthy();
  });

  test("perioden kan byttes", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Siste 12 måneder" }));
    expect(requestedPeriods[requestedPeriods.length - 1]).toBe("12m");
    expect(screen.getByRole("button", { name: "Siste 12 måneder" }).getAttribute("aria-pressed")).toBe("true");
  });

  test("datagrunnlaget sier hva som ikke er målt, og lenker til testdata", () => {
    const { onTabChange } = renderTab();
    expect(screen.getAllByText(/Besøk på nettsiden måles ikke/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Database og Testdata" }));
    expect(onTabChange).toHaveBeenCalledWith("database-admin");
  });
});
