// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Group, Person, Task } from "../src/types";

const updatePerson = vi.fn(() => ({ success: true as const }));
let person: Person | undefined;
let isAdmin = true;
const groups: Group[] = [
  { id: "g1", name: "Lyd og bilde", memberIds: ["p1"], leaderIds: ["p1"] },
  { id: "g2", name: "Barnekirke", memberIds: ["p1"], leaderIds: [], deputyLeaderIds: ["p1"] },
];
const tasks: Task[] = [
  { id: "t1", gatheringId: "s1", groupId: "g1", title: "Lydtekniker", status: "confirmed" },
  { id: "t2", gatheringId: "s1", groupId: "g1", title: "Bilde", status: "vacant" },
];

vi.mock("../src/hooks/useAppHooks", () => ({
  useAdminPersonDetail: () => ({
    isAdmin,
    currentUser: { id: "admin-1", name: "Admin", globalRole: "admin" },
    person,
    personGroups: groups,
    personTasks: tasks,
    updatePerson,
  }),
}));
vi.mock("../src/components/UserSwitcher", () => ({ UserQuickSwitcherBar: () => null }));
vi.mock("../src/components/AdminAccessRequired", () => ({ AdminAccessRequired: () => <p>Admin-tilgang kreves</p> }));

import { AdminPersonDetailPage } from "../src/pages/AdminPersonDetailPage";

const open = () =>
  render(
    <MemoryRouter initialEntries={["/admin/person/p1"]}>
      <Routes>
        <Route path="/admin/person/:personId" element={<AdminPersonDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
  updatePerson.mockClear();
  isAdmin = true;
});

describe("Personkortet i admin", () => {
  test("Viser personen, gruppene med rolle og oppgavene med norsk status", () => {
    person = { id: "p1", name: "Kari Nordmann", globalRole: "admin", phone: "911 11 111" };
    open();
    expect((screen.getByLabelText(/Fullt navn/) as HTMLInputElement).value).toBe("Kari Nordmann");
    expect((screen.getByLabelText(/Mobilnummer/) as HTMLInputElement).value).toBe("911 11 111");
    expect(screen.getByText("Leder")).toBeDefined();
    expect(screen.getByText("Nestleder")).toBeDefined();
    expect(screen.getByText("Bekreftet")).toBeDefined();
    expect(screen.getByText("Ledig")).toBeDefined();
  });

  test("Lagring sender det som er endret, trimmet", () => {
    person = { id: "p1", name: "Kari Nordmann", globalRole: "member", phone: "911 11 111" };
    open();
    fireEvent.change(screen.getByLabelText(/Fullt navn/), { target: { value: "  Kari Hansen  " } });
    fireEvent.click(screen.getByRole("button", { name: /Lagre alle personopplysninger/ }));
    expect(updatePerson).toHaveBeenCalledTimes(1);
    expect(updatePerson.mock.calls[0]).toMatchObject(["p1", { name: "Kari Hansen", phone: "911 11 111", globalRole: "member" }]);
    expect(screen.getByText("Personopplysninger og tilganger ble lagret!")).toBeDefined();
  });

  test("Tomt navn lagres ikke", () => {
    person = { id: "p1", name: "Kari", globalRole: "member" };
    open();
    fireEvent.change(screen.getByLabelText(/Fullt navn/), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: /Lagre alle personopplysninger/ }));
    expect(updatePerson).not.toHaveBeenCalled();
    expect(screen.getByText("Navn kan ikke være tomt.")).toBeDefined();
  });

  test("En ansatt får bilde- og tittelfelt, og samtykke krysses av", () => {
    person = { id: "p1", name: "Kari", globalRole: "member" };
    open();
    expect(screen.queryByText("Stillingstittel utad")).toBeNull();
    fireEvent.click(screen.getByLabelText(/ansatt i staben/));
    expect(screen.getByText("Stillingstittel utad")).toBeDefined();
    expect((screen.getByLabelText(/samtykket til å stå med navn/) as HTMLInputElement).checked).toBe(true);
  });

  test("Et fravær legges til og kan fjernes, og mangler det dato, sies det fra", () => {
    person = { id: "p1", name: "Kari", globalRole: "member" };
    const { container } = open();
    fireEvent.click(screen.getByTitle("Legg til fravær"));
    expect(screen.getByText("Både fra- og til-dato må oppgis for fravær.")).toBeDefined();

    const dates = container.querySelectorAll('input[type="date"]');
    // The police certificate is the first date field; the absence fields follow it
    fireEvent.change(dates[1], { target: { value: "2026-07-01" } });
    fireEvent.change(dates[2], { target: { value: "2026-07-14" } });
    fireEvent.click(screen.getByTitle("Legg til fravær"));
    expect(screen.getByText("2026-07-01 til 2026-07-14")).toBeDefined();
    fireEvent.click(screen.getByTitle("Fjern fraværsperiode"));
    expect(screen.queryByText("2026-07-01 til 2026-07-14")).toBeNull();
  });

  test("Uten tilgang vises beskjed, og ukjent person gir «Fant ikke personen»", () => {
    person = { id: "p1", name: "Kari", globalRole: "member" };
    isAdmin = false;
    open();
    expect(screen.getByText("Admin-tilgang kreves")).toBeDefined();
    expect(screen.queryByLabelText(/Fullt navn/)).toBeNull();
    cleanup();
    isAdmin = true;
    person = undefined;
    open();
    expect(screen.getByText("Fant ikke personen")).toBeDefined();
  });
});
