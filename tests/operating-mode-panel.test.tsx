// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("../src/services/operatingMode", async () => ({
  ...(await vi.importActual<typeof import("../src/services/operatingMode")>("../src/services/operatingMode")),
  setOperatingMode: vi.fn(),
}));

import { OperatingModePanel } from "../src/components/admin/OperatingModePanel";
import { setOperatingMode } from "../src/services/operatingMode";

const showFeedback = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Driftsmodus i admin", () => {
  test("i demo sier panelet hva som kan gjøres, og låsingen skjer med ett trykk", async () => {
    vi.mocked(setOperatingMode).mockResolvedValue();
    render(<OperatingModePanel mode="demo" showFeedback={showFeedback} />);

    expect(screen.getByText("Demo")).toBeTruthy();
    expect(screen.getByText(/Innholdet kan tømmes og byttes fra denne fanen/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sett i produksjon" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith("Appen står nå i produksjon. Data kan ikke slettes eller byttes fra denne fanen.")
    );
    expect(setOperatingMode).toHaveBeenCalledWith("production");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("i produksjon spørres det før appen settes i demo igjen", async () => {
    vi.mocked(setOperatingMode).mockResolvedValue();
    render(<OperatingModePanel mode="production" showFeedback={showFeedback} />);

    expect(screen.getByText("Produksjon")).toBeTruthy();
    expect(screen.getByText(/Ingenting kan tømmes eller byttes fra denne fanen/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sett i demo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Da kan nettsiden og planleggeren tømmes og byttes fra denne fanen igjen.");
    expect(setOperatingMode).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(setOperatingMode).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sett i demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Ja, sett i demo" }));
    await waitFor(() => expect(setOperatingMode).toHaveBeenCalledWith("demo"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("før modusen er kjent, finnes ingen knapp, og en endring som feiler, meldes som feil", async () => {
    render(<OperatingModePanel mode={null} showFeedback={showFeedback} />);
    expect(screen.getByText("Leser driftsmodus fra databasen …")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    cleanup();

    vi.mocked(setOperatingMode).mockRejectedValue(new Error("Ingen tilgang"));
    render(<OperatingModePanel mode="demo" showFeedback={showFeedback} />);
    fireEvent.click(screen.getByRole("button", { name: "Sett i produksjon" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Driftsmodus ble ikke endret: Ingen tilgang", "error"));
  });
});
