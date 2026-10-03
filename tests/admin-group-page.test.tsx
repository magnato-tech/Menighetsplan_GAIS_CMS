// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Group, Person } from "../src/types";

const updateGroup = vi.fn((_groupId: string, _updates: Partial<Group>) => ({ success: true as const }));
const addGroupMember = vi.fn((_groupId: string, _personId: string) => ({ success: true as const }));
const removeGroupMember = vi.fn((_groupId: string, _personId: string) => ({ success: true as const }));
let group: Group | undefined;
let isAdmin = true;
const kari: Person = { id: "p1", name: "Kari", globalRole: "member" };
const ola: Person = { id: "p2", name: "Ola", globalRole: "member" };
const per: Person = { id: "p3", name: "Per", globalRole: "admin" };

vi.mock("../src/hooks/useAppHooks", async () => {
  const real = await vi.importActual<typeof import("../src/hooks/useAppHooks")>("../src/hooks/useAppHooks");
  return {
    ...real,
    useAdminGroupDetail: () => ({
      isAdmin,
      group,
      members: [kari, ola],
      availablePersonsToAdd: [per],
      allPersons: [kari, ola, per],
      groupGatherings: [],
      updateGroup,
      addGroupMember,
      removeGroupMember,
    }),
  };
});
vi.mock("../src/components/UserSwitcher", () => ({ UserQuickSwitcherBar: () => null }));
vi.mock("../src/components/AdminAccessRequired", () => ({ AdminAccessRequired: () => <p>Admin-tilgang kreves</p> }));

import { AdminGroupDetailPage } from "../src/pages/AdminGroupDetailPage";

const open = () =>
  render(
    <MemoryRouter initialEntries={["/admin/gruppe/g1"]}>
      <Routes>
        <Route path="/admin/gruppe/:groupId" element={<AdminGroupDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
const saveButton = () => screen.getByRole("button", { name: /Lagre endringer for gruppen/ });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  isAdmin = true;
});

describe("Gruppekortet i admin", () => {
  test("Viser gruppen, medlemmene med rolle og at ingen samlinger finnes", () => {
    group = { id: "g1", name: "Lyd og bilde", memberIds: ["p1", "p2"], leaderIds: ["p1"], deputyLeaderIds: ["p2"] };
    open();
    expect((screen.getByLabelText(/Gruppenavn/) as HTMLInputElement).value).toBe("Lyd og bilde");
    expect((screen.getByLabelText(/^Leder:/) as HTMLSelectElement).value).toBe("p1");
    expect(screen.getByText("Medlemmer i gruppen (2)")).toBeDefined();
    expect(screen.getByText("Ingen konkrete samlinger opprettet for denne gruppen ennå.")).toBeDefined();
    // The leader cannot be removed from the group
    expect(screen.getAllByTitle("Fjern fra gruppe")).toHaveLength(1);
  });

  test("Lagring sender det som er endret og lar møteplanen være av", () => {
    group = { id: "g1", name: "Lyd", memberIds: ["p1"], leaderIds: [] };
    open();
    fireEvent.change(screen.getByLabelText(/Gruppenavn/), { target: { value: "  Teknikk " } });
    fireEvent.change(screen.getByLabelText(/Tagger/), { target: { value: "Lyd, BILDE" } });
    fireEvent.click(saveButton());
    expect(updateGroup).toHaveBeenCalledTimes(1);
    expect(updateGroup.mock.calls[0]).toMatchObject([
      "g1",
      { name: "Teknikk", tags: ["lyd", "bilde"], leaderIds: [], meetingSchedule: undefined, isPublic: true },
    ]);
    expect(screen.getByText("Gruppeinformasjon og møteplan ble lagret!")).toBeDefined();
  });

  test("Tomt navn lagres ikke", () => {
    group = { id: "g1", name: "Lyd", memberIds: [], leaderIds: [] };
    open();
    fireEvent.change(screen.getByLabelText(/Gruppenavn/), { target: { value: " " } });
    fireEvent.click(saveButton());
    expect(updateGroup).not.toHaveBeenCalled();
    expect(screen.getByText("Gruppenavn kan ikke være tomt.")).toBeDefined();
  });

  test("Fast møtetid viser feltene og lagres med ukedag, klokkeslett og frekvens", () => {
    group = { id: "g1", name: "Lyd", memberIds: [], leaderIds: [] };
    open();
    expect(screen.queryByLabelText("Ukedag:")).toBeNull();
    fireEvent.click(screen.getByLabelText(/fast møtetid/));
    fireEvent.change(screen.getByLabelText("Klokkeslett:"), { target: { value: "19:00" } });
    expect(screen.getByText(/kl\. 19:00/)).toBeDefined();
    fireEvent.click(saveButton());
    expect(updateGroup.mock.calls[0][1]).toMatchObject({ meetingSchedule: { weekday: "Søndag", time: "19:00", frequency: "hver uke" } });
  });

  test("Et medlem legges til og fjernes med melding", () => {
    group = { id: "g1", name: "Lyd", memberIds: ["p1", "p2"], leaderIds: ["p1"] };
    open();
    const add = screen.getByRole("button", { name: "Legg til" }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    fireEvent.change(document.getElementById("select-add-group-member")!, { target: { value: "p3" } });
    fireEvent.click(add);
    expect(addGroupMember).toHaveBeenCalledWith("g1", "p3");
    expect(screen.getByText("Per ble lagt til som medlem i gruppen!")).toBeDefined();

    fireEvent.click(screen.getByTitle("Fjern fra gruppe"));
    expect(removeGroupMember).toHaveBeenCalledWith("g1", "p2");
    expect(screen.getByText("Ola ble fjernet fra gruppen.")).toBeDefined();
  });

  test("Uten tilgang vises beskjed, og ukjent gruppe gir «Fant ikke gruppen»", () => {
    group = { id: "g1", name: "Lyd", memberIds: [], leaderIds: [] };
    isAdmin = false;
    open();
    expect(screen.getByText("Admin-tilgang kreves")).toBeDefined();
    cleanup();
    isAdmin = true;
    group = undefined;
    open();
    expect(screen.getByText("Fant ikke gruppen")).toBeDefined();
  });
});
