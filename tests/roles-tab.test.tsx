// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RolesTab } from "../src/pages/admin/tabs/RolesTab";
import { DEFAULT_VOLUNTEER_ROLE_NAMES } from "../src/data/defaultVolunteerRoles";
import { StudioData } from "../src/pages/admin/studio";

const createVolunteerRole = vi.fn();
const updateVolunteerRole = vi.fn();
const deleteVolunteerRole = vi.fn();

const { persistVolunteerRole, patchVolunteerRole, removeVolunteerRole } = vi.hoisted(() => ({
  persistVolunteerRole: vi.fn(async (input: { name: string; instruction?: string }) => ({
    id: "role-new",
    name: input.name,
    instruction: input.instruction || "",
    sortOrder: 2,
  })),
  patchVolunteerRole: vi.fn(async () => undefined),
  removeVolunteerRole: vi.fn(async () => undefined),
}));

vi.mock("../src/services/volunteerRoles", () => ({
  seedDefaultVolunteerRoles: vi.fn(async () => []),
  persistVolunteerRole,
  patchVolunteerRole,
  removeVolunteerRole,
}));

const studio = {
  adminVolunteerRoles: [
    { id: "role-1", name: "Lyd", instruction: "Møt kl. 09:30", sortOrder: 0 },
    { id: "role-2", name: "Kjøkken", instruction: "", sortOrder: 1 },
  ],
  adminGroups: [
    {
      group: { id: "group-lyd", name: "Lyd og bilde", memberIds: [], leaderIds: [] },
      leaders: [],
      deputyLeaders: [],
      members: [],
      tasksCount: 0,
    },
  ],
  createVolunteerRole,
  updateVolunteerRole,
  deleteVolunteerRole,
} as unknown as StudioData;

afterEach(() => cleanup());

describe("RolesTab", () => {
  test("viser roller i et søkbart kortrutenett", () => {
    render(<RolesTab studio={studio} />);
    expect(screen.getByText("Lyd")).toBeTruthy();
    expect(screen.getByText("Kjøkken")).toBeTruthy();
    expect(screen.getByPlaceholderText("Søk i roller...")).toBeTruthy();
  });

  test("tilbyr standardroller når listen er tom", () => {
    render(
      <RolesTab
        studio={{
          ...studio,
          adminVolunteerRoles: [],
        }}
      />
    );
    expect(screen.getByText(/Starter med 15 roller som Baking/i)).toBeTruthy();
    expect(DEFAULT_VOLUNTEER_ROLE_NAMES.length).toBe(15);
    expect(screen.getByRole("button", { name: /Legg inn standardroller/i })).toBeTruthy();
  });

  test("åpner instruks-dialog for valgt rolle", () => {
    render(<RolesTab studio={studio} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Instruks/i })[0]);
    expect(screen.getByText("Instruks: Lyd")).toBeTruthy();
    expect(screen.getByDisplayValue("Møt kl. 09:30")).toBeTruthy();
  });

  test("lagrer redigert instruks", async () => {
    const showFeedback = vi.fn();
    render(<RolesTab studio={studio} showFeedback={showFeedback} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Instruks/i })[0]);
    fireEvent.change(screen.getByDisplayValue("Møt kl. 09:30"), {
      target: { value: "Møt kl. 09:45" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Lagre instruks/i }));
    await waitFor(() => expect(patchVolunteerRole).toHaveBeenCalled());
    expect(patchVolunteerRole).toHaveBeenCalledWith("role-1", {
      instruction: "Møt kl. 09:45",
      groupId: undefined,
    });
    expect(showFeedback).toHaveBeenCalledWith("«Lyd» er oppdatert.");
  });

  test("kan opprette rolle med instruks i skjemaet", async () => {
    const showFeedback = vi.fn();
    render(<RolesTab studio={studio} showFeedback={showFeedback} />);
    fireEvent.click(screen.getByRole("button", { name: /Ny rolle/i }));
    fireEvent.change(screen.getByPlaceholderText(/f.eks. Teknikk/i), { target: { value: "Vertskap" } });
    fireEvent.change(screen.getByPlaceholderText(/Instruks for rollen/i), {
      target: { value: "Stå i døra fra kl. 10:40" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Lagre rolle/i }));
    await waitFor(() => expect(persistVolunteerRole).toHaveBeenCalled());
    expect(persistVolunteerRole).toHaveBeenCalledWith({
      name: "Vertskap",
      instruction: "Stå i døra fra kl. 10:40",
      sortOrder: 2,
      groupId: undefined,
    });
    expect(showFeedback).toHaveBeenCalledWith("Rollen «Vertskap» ble opprettet.");
  });
});
