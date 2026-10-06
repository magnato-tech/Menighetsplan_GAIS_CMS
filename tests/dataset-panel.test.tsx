// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../src/context/CmsContext", () => ({
  useCms: () => ({ settings: { churchName: "Lillesand Misjonskirke" } }),
}));
vi.mock("../src/services/datasetService", () => ({
  clearDatabase: vi.fn(),
  databaseHasContent: vi.fn(),
  exportDataset: vi.fn(),
  importDataset: vi.fn(),
}));

import { DatasetPanel } from "../src/components/admin/DatasetPanel";
import { clearDatabase, databaseHasContent, exportDataset, importDataset } from "../src/services/datasetService";
import { CMS_COLLECTIONS, COLLECTIONS } from "../src/data/collections";
import { buildDataset, serializeDataset } from "../src/utils/dataset";

const dataset = buildDataset(
  "LMK_sett",
  "Innholdet fra den gamle nettsiden.",
  {
    [CMS_COLLECTIONS.PAGES]: [{ id: "page-forside" }, { id: "page-om-oss" }],
    [CMS_COLLECTIONS.SERMONS]: [{ id: "sermon-1" }],
    [COLLECTIONS.GATHERINGS]: [{ id: "gathering-1" }],
  },
  new Date("2026-10-06T12:00:00.000Z")
);

const showFeedback = vi.fn();
const chooseFile = (name: string, text: string) =>
  fireEvent.change(screen.getByLabelText("Datasettfil"), { target: { files: [new File([text], name, { type: "application/json" })] } });
/** The panel as the database tab shows it, over a database holding this many documents. */
const renderPanel = (documentsInDatabase = 0) => {
  vi.mocked(databaseHasContent).mockResolvedValue(documentsInDatabase > 0);
  return render(<DatasetPanel showFeedback={showFeedback} />);
};
const imported = { success: true, counts: {}, total: 4, failures: [] };
const backup = buildDataset("Sikkerhetskopi Lillesand Misjonskirke", "", { [COLLECTIONS.GROUPS]: [{ id: "group-lyd" }] }, new Date("2026-10-06T12:00:00.000Z"));
/** Chooses the file and presses «Hent inn datasettet», which is where the question is asked. */
const startImport = async () => {
  chooseFile("lmk-sett.json", serializeDataset(dataset));
  fireEvent.click(await screen.findByRole("button", { name: "Hent inn datasettet" }));
};

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:datasett");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Datasett inn i en database som har innhold fra før", () => {
  test("det spørres før noe skjer, og spørsmålet sier hva ja og nei gjør", async () => {
    renderPanel(141);
    await startImport();

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Slette databasen først?");
    expect(dialog.textContent).toContain("Anbefalt");
    expect(dialog.textContent).toContain("sikkerhetskopi");
    expect(dialog.textContent).toContain("Alt i databasen slettes");
    expect(dialog.textContent).toContain("«LMK_sett» hentes inn (4 dokumenter)");
    expect(dialog.textContent).toContain("Svarer du nei, slettes ingenting");
    for (const service of [exportDataset, clearDatabase, importDataset]) expect(service).not.toHaveBeenCalled();
  });

  test("ja: sikkerhetskopi, tømming og innhenting i den rekkefølgen, og meldingen sier hva som er gjort", async () => {
    const order: string[] = [];
    vi.mocked(exportDataset).mockImplementation(async () => (order.push("kopi"), { dataset: backup, unreadable: [] }));
    vi.mocked(clearDatabase).mockImplementation(async () => (order.push("tøm"), { deleted: 165, failures: [] }));
    vi.mocked(importDataset).mockImplementation(async () => (order.push("hent inn"), imported));
    const saved: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download);
    });
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Ja, slett og hent inn" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Databasen er tømt (165 dokumenter slettet), og «LMK_sett» er hentet inn (4 dokumenter). Sikkerhetskopien heter sikkerhetskopi-lillesand-misjonskirke-2026-10-06.json."
      )
    );
    expect(order).toEqual(["kopi", "tøm", "hent inn"]);
    expect(saved).toEqual(["sikkerhetskopi-lillesand-misjonskirke-2026-10-06.json"]);
    expect(vi.mocked(importDataset).mock.calls[0][0]).toEqual(dataset);
    expect(screen.queryByRole("dialog")).toBeNull();
    click.mockRestore();
  });

  test("mens operasjonen går, står det på skjermen hva som gjøres, og knappene er låst", async () => {
    let release: (value: { deleted: number; failures: [] }) => void = () => {};
    vi.mocked(exportDataset).mockResolvedValue({ dataset: backup, unreadable: [] });
    vi.mocked(clearDatabase).mockReturnValue(new Promise((resolve) => (release = resolve)));
    vi.mocked(importDataset).mockResolvedValue(imported);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Ja, slett og hent inn" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Sletter alt i databasen …"));
    // The panel behind has an «Avbryt» of its own, so the buttons are looked up inside the dialog
    const dialog = within(screen.getByRole("dialog"));
    for (const label of ["Ja, slett og hent inn", "Nei, legg til uten å slette", "Avbryt"]) {
      expect((dialog.getByRole("button", { name: label }) as HTMLButtonElement).disabled).toBe(true);
    }
    release({ deleted: 165, failures: [] });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    click.mockRestore();
  });

  test("nei: datasettet legges til, og ingenting slettes eller lastes ned", async () => {
    vi.mocked(importDataset).mockResolvedValue(imported);
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Nei, legg til uten å slette" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Datasettet «LMK_sett» er hentet inn (4 dokumenter)."));
    expect(clearDatabase).not.toHaveBeenCalled();
    expect(exportDataset).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("kan ikke databasen si om den har innhold, spørres det likevel", async () => {
    renderPanel(0);
    vi.mocked(databaseHasContent).mockRejectedValue(new Error("Ingen forbindelse"));
    await startImport();

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(importDataset).not.toHaveBeenCalled();
  });

  test("avbryt: ingenting skjer, og filen står klar", async () => {
    renderPanel(141);
    await startImport();
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Avbryt" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    for (const service of [exportDataset, clearDatabase, importDataset]) expect(service).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Hent inn datasettet" })).toBeTruthy();
  });

  test("kan ikke sikkerhetskopien lages, slettes ingenting", async () => {
    vi.mocked(exportDataset).mockRejectedValue(new Error("Ingen forbindelse"));
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Ja, slett og hent inn" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Sikkerhetskopien kunne ikke lages, så ingenting er slettet eller hentet inn: Ingen forbindelse",
        "error"
      )
    );
    expect(clearDatabase).not.toHaveBeenCalled();
    expect(importDataset).not.toHaveBeenCalled();
  });

  test("blir ikke databasen tømt helt, hentes ikke datasettet inn", async () => {
    vi.mocked(exportDataset).mockResolvedValue({ dataset: backup, unreadable: [] });
    vi.mocked(clearDatabase).mockResolvedValue({ deleted: 40, failures: [{ collection: COLLECTIONS.PERSONS, message: "Ingen forbindelse" }] });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Ja, slett og hent inn" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Databasen ble ikke tømt helt, og datasettet er ikke hentet inn. «Personer» kunne ikke slettes: Ingen forbindelse. Sikkerhetskopien heter sikkerhetskopi-lillesand-misjonskirke-2026-10-06.json.",
        "error"
      )
    );
    expect(importDataset).not.toHaveBeenCalled();
    // The file is still chosen, so the admin can try again
    expect(screen.getByRole("button", { name: "Hent inn datasettet" })).toBeTruthy();
    click.mockRestore();
  });

  test("feiler innhentingen etter tømming, sier meldingen at databasen er tom og hvor kopien er", async () => {
    vi.mocked(exportDataset).mockResolvedValue({ dataset: backup, unreadable: [] });
    vi.mocked(clearDatabase).mockResolvedValue({ deleted: 165, failures: [] });
    vi.mocked(importDataset).mockResolvedValue({ success: false, counts: {}, total: 0, failures: [{ collection: CMS_COLLECTIONS.PAGES, message: "Ingen tilgang" }] });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel(141);
    await startImport();
    fireEvent.click(await screen.findByRole("button", { name: "Ja, slett og hent inn" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Databasen er tømt, men datasettet ble ikke hentet inn i sin helhet. «Sider» ble ikke lagret: Ingen tilgang. Sikkerhetskopien heter sikkerhetskopi-lillesand-misjonskirke-2026-10-06.json.",
        "error"
      )
    );
    click.mockRestore();
  });
});

describe("Datasett-panelet i admin", () => {
  test("i en tom database hentes datasettet inn uten spørsmål", async () => {
    vi.mocked(importDataset).mockResolvedValue(imported);
    renderPanel(0);
    await startImport();

    await waitFor(() => expect(importDataset).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(clearDatabase).not.toHaveBeenCalled();
  });

  test("en valgt fil vises med navn og innhold før noe hentes inn", async () => {
    renderPanel();
    chooseFile("lmk-sett.json", serializeDataset(dataset));

    expect(await screen.findByText("LMK_sett")).toBeTruthy();
    expect(screen.getByText("Innholdet fra den gamle nettsiden.")).toBeTruthy();
    expect(screen.getByText(/lmk-sett\.json · laget 6\. oktober 2026 · 4 dokumenter/)).toBeTruthy();
    for (const label of ["Sider", "Taler", "Samlinger"]) expect(screen.getByText(label)).toBeTruthy();
    expect(importDataset).not.toHaveBeenCalled();
  });

  test("«Hent inn datasettet» skriver filens innhold og melder fra", async () => {
    vi.mocked(importDataset).mockResolvedValue({ success: true, counts: {}, total: 4, failures: [] });
    renderPanel();
    chooseFile("lmk-sett.json", serializeDataset(dataset));
    fireEvent.click(await screen.findByRole("button", { name: "Hent inn datasettet" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Datasettet «LMK_sett» er hentet inn (4 dokumenter)."));
    expect(vi.mocked(importDataset).mock.calls[0][0]).toEqual(dataset);
    // The summary closes, so the same file is not brought in twice by a second click
    expect(screen.queryByRole("button", { name: "Hent inn datasettet" })).toBeNull();
  });

  test("en innhenting som feiler, meldes som feil og lar filen stå klar til et nytt forsøk", async () => {
    vi.mocked(importDataset).mockResolvedValue({
      success: false,
      counts: {},
      total: 0,
      failures: [{ collection: CMS_COLLECTIONS.PAGES, message: "Ingen tilgang" }],
    });
    renderPanel();
    chooseFile("lmk-sett.json", serializeDataset(dataset));
    fireEvent.click(await screen.findByRole("button", { name: "Hent inn datasettet" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Datasettet ble ikke hentet inn i sin helhet. «Sider» ble ikke lagret: Ingen tilgang",
        "error"
      )
    );
    expect(screen.getByRole("button", { name: "Hent inn datasettet" })).toBeTruthy();
  });

  test("en fil som ikke er et datasett, avvises uten at noe kan hentes inn", async () => {
    renderPanel();
    chooseFile("bilde.json", "dette er ikke et datasett");

    expect((await screen.findByRole("alert")).textContent).toContain("bilde.json");
    expect(screen.queryByRole("button", { name: "Hent inn datasettet" })).toBeNull();
  });

  test("«Avbryt» legger bort den valgte filen", async () => {
    renderPanel();
    chooseFile("lmk-sett.json", serializeDataset(dataset));
    fireEvent.click(await screen.findByRole("button", { name: "Avbryt" }));

    expect(screen.queryByText("LMK_sett")).toBeNull();
    expect(importDataset).not.toHaveBeenCalled();
  });

  test("nedlasting bruker menighetens navn når feltet står tomt, og gir en fil med navn og dato", async () => {
    vi.mocked(exportDataset).mockResolvedValue({ dataset, unreadable: [] });
    const clicked: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.download);
    });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Last ned datasett" }));

    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Datasettet «LMK_sett» er lastet ned (4 dokumenter)."));
    expect(exportDataset).toHaveBeenCalledWith("Lillesand Misjonskirke");
    expect(clicked).toEqual(["lmk-sett-2026-10-06.json"]);
    click.mockRestore();
  });

  test("det som ikke kunne leses fra databasen, nevnes ved navn når filen er lastet ned", async () => {
    vi.mocked(exportDataset).mockResolvedValue({ dataset, unreadable: [CMS_COLLECTIONS.MEDIA] });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Last ned datasett" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        "Datasettet «LMK_sett» er lastet ned (4 dokumenter). «Bilder» kunne ikke leses fra databasen og er ikke med."
      )
    );
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  test("navnet som skrives inn, blir navnet på datasettet", async () => {
    vi.mocked(exportDataset).mockResolvedValue({ dataset, unreadable: [] });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel();
    fireEvent.change(screen.getByLabelText("Navn på datasettet"), { target: { value: "  Før opprydding  " } });
    fireEvent.click(screen.getByRole("button", { name: "Last ned datasett" }));

    await waitFor(() => expect(exportDataset).toHaveBeenCalledWith("Før opprydding"));
    click.mockRestore();
  });

  test("en tom database gir ingen fil, og en nedlasting som feiler, meldes som feil", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.mocked(exportDataset).mockResolvedValueOnce({ dataset: buildDataset("Tom", "", {}), unreadable: [] });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Last ned datasett" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith(expect.stringContaining("tom"), "error"));

    vi.mocked(exportDataset).mockRejectedValueOnce(new Error("Ingen tilgang"));
    fireEvent.click(screen.getByRole("button", { name: "Last ned datasett" }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith(expect.stringContaining("Ingen tilgang"), "error"));
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
  });
});
