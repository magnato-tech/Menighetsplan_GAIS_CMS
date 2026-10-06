// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../src/services/demoSets", () => ({ listDemoSets: vi.fn(), loadDemoSet: vi.fn() }));
vi.mock("../src/services/churchSwitch", () => ({ switchWebsite: vi.fn() }));
vi.mock("../src/services/previousSetup", () => ({ loadPreviousSetup: vi.fn(), readPreviousSetupInfo: vi.fn() }));

import { ChurchPickerPanel } from "../src/components/admin/ChurchPickerPanel";
import { switchWebsite } from "../src/services/churchSwitch";
import { listDemoSets, loadDemoSet } from "../src/services/demoSets";
import type { OperatingMode } from "../src/services/operatingMode";
import { loadPreviousSetup, readPreviousSetupInfo } from "../src/services/previousSetup";
import { buildDataset } from "../src/utils/dataset";

const sets = [
  { id: "lmk", name: "Lillesand Misjonskirke", file: "lmk.json", source: "lillesandmisjonskirke.no", fetchedAt: "2026-10-06T13:10:18.347Z", documents: 168 },
  { id: "sogne", name: "Søgne Misjonskirke", file: "sogne.json", source: "sognemisjonskirke.no", fetchedAt: "2026-10-06T16:00:19.118Z", documents: 215 },
];
const sogne = buildDataset("Sogne_sett", "", { cms_pages: [{ id: "sogne-forside" }] });
const lillesand = buildDataset("Forrige oppsett", "", { cms_pages: [{ id: "lmk-forside" }] });
const previousInfo = { churchName: "Lillesand Misjonskirke", savedAt: "2026-10-06T18:40:00.000Z", documents: 168 };

const showFeedback = vi.fn();
const renderPanel = async (mode: OperatingMode | null = "demo") => {
  render(<ChurchPickerPanel mode={mode} showFeedback={showFeedback} />);
  await waitFor(() => expect(listDemoSets).toHaveBeenCalled());
  return screen.getByLabelText("Menighet") as HTMLSelectElement;
};
const choose = async (select: HTMLSelectElement, label: RegExp | string) => {
  const option = (await within(select).findByRole("option", { name: label })) as HTMLOptionElement;
  fireEvent.change(select, { target: { value: option.value } });
};
const swapButton = () => screen.getByRole("button", { name: "Bytt nettside" }) as HTMLButtonElement;

beforeEach(() => {
  vi.mocked(listDemoSets).mockResolvedValue(sets);
  vi.mocked(loadDemoSet).mockResolvedValue(sogne);
  vi.mocked(readPreviousSetupInfo).mockReturnValue(null);
  vi.mocked(switchWebsite).mockResolvedValue({ keptPrevious: true, deleted: 187, imported: 215 });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Velg menighet i admin", () => {
  test("listen har menighetene som følger med og demo-menigheten, og ingenting er valgt", async () => {
    const select = await renderPanel();
    await within(select).findByRole("option", { name: "Søgne Misjonskirke" });

    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Velg menighet …",
      "Lillesand Misjonskirke",
      "Søgne Misjonskirke",
      "Demo-menigheten",
    ]);
    expect(select.value).toBe("");
    expect(swapButton().disabled).toBe(true);
  });

  test("det spørres før noe skjer, og spørsmålet sier hva som lagres, slettes og hentes inn", async () => {
    const select = await renderPanel();
    await choose(select, "Søgne Misjonskirke");
    expect(screen.getByText(/Hentet fra sognemisjonskirke\.no 6\. oktober 2026: 215 dokumenter\./).textContent).toContain(
      "E-postadresser og telefonnumre er tatt ut"
    );
    fireEvent.click(swapButton());

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Bytte nettsiden til «Søgne Misjonskirke»?");
    expect(dialog.textContent).toContain("lagres som «Forrige oppsett» i denne nettleseren");
    expect(dialog.textContent).toContain("Alt i nettsiden slettes: sider, nyheter, taler, stab, innstillinger og offentlige arrangementer.");
    expect(dialog.textContent).toContain("«Søgne Misjonskirke» hentes inn (215 dokumenter)");
    expect(dialog.textContent).toContain("Planleggeren røres ikke");
    expect(loadDemoSet).not.toHaveBeenCalled();
    expect(switchWebsite).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(switchWebsite).not.toHaveBeenCalled();
  });

  test("ja henter settet, bytter nettsiden og sier hva som er gjort", async () => {
    vi.mocked(readPreviousSetupInfo).mockReturnValueOnce(null).mockReturnValue(previousInfo);
    const select = await renderPanel();
    await choose(select, "Søgne Misjonskirke");
    fireEvent.click(swapButton());
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Nettsiden er byttet til «Søgne Misjonskirke» (215 dokumenter). Den som var, ligger som «Forrige oppsett» i listen. Planleggeren er ikke rørt."
      )
    );
    expect(loadDemoSet).toHaveBeenCalledWith(sets[1]);
    expect(vi.mocked(switchWebsite).mock.calls[0][0]).toEqual({ kind: "dataset", dataset: sogne });
    expect(screen.queryByRole("dialog")).toBeNull();
    // The website that was is now a choice in the list
    expect(await within(select).findByRole("option", { name: /^Forrige oppsett: Lillesand Misjonskirke \(lagret 6\. oktober/ })).toBeTruthy();
    expect(select.value).toBe("");
  });

  test("demo-menigheten og forrige oppsett velges på samme måte", async () => {
    vi.mocked(readPreviousSetupInfo).mockReturnValue(previousInfo);
    vi.mocked(loadPreviousSetup).mockReturnValue({ ...previousInfo, dataset: lillesand });
    const select = await renderPanel();

    await choose(select, "Demo-menigheten");
    fireEvent.click(swapButton());
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));
    await waitFor(() => expect(switchWebsite).toHaveBeenCalledTimes(1));
    expect(vi.mocked(switchWebsite).mock.calls[0][0]).toEqual({ kind: "builtInDemo" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await choose(select, /^Forrige oppsett/);
    expect(screen.getByText(/Nettsiden slik den var før forrige bytte: 168 dokumenter\./)).toBeTruthy();
    fireEvent.click(swapButton());
    expect(screen.getByRole("dialog").textContent).toContain("«Lillesand Misjonskirke» hentes inn (168 dokumenter)");
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));
    await waitFor(() => expect(switchWebsite).toHaveBeenCalledTimes(2));
    expect(vi.mocked(switchWebsite).mock.calls[1][0]).toEqual({ kind: "dataset", dataset: lillesand });
    expect(loadDemoSet).not.toHaveBeenCalled();
  });

  test("mens byttet går, står det på skjermen hva som gjøres, og knappene er låst", async () => {
    let finish: () => void = () => {};
    vi.mocked(switchWebsite).mockImplementation(async (_source, onStep) => {
      onStep?.("Sletter nettsiden …");
      await new Promise<void>((resolve) => (finish = resolve));
      return { keptPrevious: true, deleted: 187, imported: 215 };
    });
    const select = await renderPanel();
    await choose(select, "Søgne Misjonskirke");
    fireEvent.click(swapButton());
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Sletter nettsiden …"));
    const dialog = within(screen.getByRole("dialog"));
    for (const label of ["Ja, bytt nettside", "Avbryt"]) {
      expect((dialog.getByRole("button", { name: label }) as HTMLButtonElement).disabled).toBe(true);
    }
    finish();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("et bytte som feiler, meldes som feil, og valget står", async () => {
    vi.mocked(switchWebsite).mockRejectedValue(new Error("Nettsiden ble ikke tømt helt, og ingenting er hentet inn: Ingen forbindelse"));
    const select = await renderPanel();
    await choose(select, "Søgne Misjonskirke");
    fireEvent.click(swapButton());
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Nettsiden ble ikke byttet: Nettsiden ble ikke tømt helt, og ingenting er hentet inn: Ingen forbindelse",
        "error"
      )
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(select.value).toBe("set:sogne");
  });

  test("kan ikke settet hentes, slettes ingenting", async () => {
    vi.mocked(loadDemoSet).mockRejectedValue(new Error("Innholdet for Søgne Misjonskirke kunne ikke hentes (404)."));
    const select = await renderPanel();
    await choose(select, "Søgne Misjonskirke");
    fireEvent.click(swapButton());
    fireEvent.click(screen.getByRole("button", { name: "Ja, bytt nettside" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith(expect.stringContaining("kunne ikke hentes (404)"), "error"));
    expect(switchWebsite).not.toHaveBeenCalled();
  });

  test("i produksjon, og før modusen er kjent, kan nettsiden ikke byttes", async () => {
    const select = await renderPanel("production");
    expect(select.disabled).toBe(true);
    expect(swapButton().disabled).toBe(true);
    expect(screen.getByText(/Appen står i produksjon\. Nettsiden kan ikke byttes/)).toBeTruthy();
    cleanup();

    const unknown = await renderPanel(null);
    expect(unknown.disabled).toBe(true);
    expect(screen.queryByText(/Appen står i produksjon/)).toBeNull();
  });

  test("kan ikke listen hentes, sies det fra, og demo-menigheten kan fortsatt velges", async () => {
    vi.mocked(listDemoSets).mockRejectedValue(new Error("Listen over menigheter kunne ikke hentes (404)."));
    const select = await renderPanel();

    expect((await screen.findByRole("alert")).textContent).toContain("Listen over menigheter kunne ikke hentes (404).");
    await choose(select, "Demo-menigheten");
    expect(swapButton().disabled).toBe(false);
  });
});
