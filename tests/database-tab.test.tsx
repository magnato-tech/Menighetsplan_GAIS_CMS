// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const populateCustomMockData = vi.fn();
const clearPlannerTestData = vi.fn();
const deleteAllData = vi.fn();
const toggleKalender = vi.fn();
const toggleMeldinger = vi.fn();
let moduleConfig = { kalender: "on" as "on" | "off", meldinger: "off" as "on" | "off" };

vi.mock("../src/services/databaseAdmin", () => ({
  populateCustomMockData: (...args: unknown[]) => populateCustomMockData(...args),
  clearPlannerTestData: () => clearPlannerTestData(),
  deleteAllData: () => deleteAllData(),
}));
vi.mock("../src/context/FirebaseDataContext", () => ({
  useFirebase: () => ({
    isFirestoreConnected: true,
    allPersons: [{}, {}],
    groups: [{}],
    gatherings: [{}, {}, {}],
    tasks: [{}],
    assignments: [{}],
    moduleConfig,
    toggleKalender,
    toggleMeldinger,
  }),
}));
vi.mock("../src/context/CmsContext", () => ({ useCms: () => ({ pages: [{}, {}], news: [{}], sermons: [] }) }));

import { DatabaseTab } from "../src/pages/admin/tabs/DatabaseTab";

const ok = { success: true, counts: {}, total: 0, failures: [] };
const showFeedback = vi.fn();
const open = () => render(<DatabaseTab showFeedback={showFeedback} />);
const slider = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => {
  populateCustomMockData.mockResolvedValue(ok);
  clearPlannerTestData.mockResolvedValue(ok);
  deleteAllData.mockResolvedValue(ok);
  moduleConfig = { kalender: "on", meldinger: "off" };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Database og testdata i admin", () => {
  test("Viser hvor mye som ligger i databasen", () => {
    open();
    // 2 persons + 1 group + 3 gatherings + 1 task + 1 assignment + 3 content documents
    expect(screen.getByText("Gjeldende innhold i databasen (11 dokumenter)")).toBeDefined();
    expect(screen.getByText("Databasen er tilkoblet")).toBeDefined();
    expect(screen.getByText("Personer").previousSibling?.textContent).toBe("2");
    expect(screen.getByText("CMS & Innhold").previousSibling?.textContent).toBe("3");
  });

  test("Fullskala er valgt, og fyllingen sender de fire tallene og at planleggerdata tømmes først", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: /Populer databasen/ }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalled());
    expect(populateCustomMockData).toHaveBeenCalledWith(
      { personCount: 32, groupCount: 12, gatheringCount: 19, taskCount: 21 },
      { clearPlannerFirst: true }
    );
    expect(showFeedback).toHaveBeenCalledWith(
      "Tidligere testdata ble ryddet. Databasen er nå fylt med 32 personer, 12 grupper, 19 samlinger og 21 oppgaver!"
    );
  });

  test("En pakke setter alle glidebryterne, og flytter man en, er oppsettet egendefinert", async () => {
    open();
    fireEvent.click(screen.getByText("Kompakt testsett"));
    expect(slider("Personer:").value).toBe("8");
    expect(slider("Grupper & Husfellesskap:").value).toBe("3");
    expect(screen.queryByText("Egendefinert oppsett")).toBeNull();

    fireEvent.change(slider("Personer:"), { target: { value: "20" } });
    expect(screen.getByText("Egendefinert oppsett")).toBeDefined();
    expect(screen.getByRole("button", { name: /Populer databasen \(20 personer, 3 grupper\)/ })).toBeDefined();

    fireEvent.click(screen.getByLabelText(/Tøm eksisterende testpersoner/));
    expect(screen.getByText(/Overskriver eksisterende dokumenter/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Populer databasen/ }));
    await waitFor(() => expect(populateCustomMockData).toHaveBeenCalled());
    expect(populateCustomMockData).toHaveBeenCalledWith(
      { personCount: 20, groupCount: 3, gatheringCount: 4, taskCount: 6 },
      { clearPlannerFirst: false }
    );
  });

  test("Feil fra fyllingen meldes, også når tjenesten kaster", async () => {
    populateCustomMockData.mockResolvedValueOnce({ ...ok, failures: [{ collection: "persons", message: "Nektet" }] });
    open();
    fireEvent.click(screen.getByRole("button", { name: /Populer databasen/ }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Fylling fullført med noen feil: Nektet", "error"));

    populateCustomMockData.mockRejectedValueOnce(new Error("Ingen nett"));
    fireEvent.click(screen.getByRole("button", { name: /Populer databasen/ }));
    await waitFor(() => expect(showFeedback).toHaveBeenCalledWith("Ingen nett", "error"));
    // The button is usable again after a failure
    expect((screen.getByRole("button", { name: /Populer databasen/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  test("Tømming av planleggerdata krever bekreftelse og kan avbrytes", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tøm planlegger-testdata" }));
    expect(screen.getByText(/personer \(2\), grupper \(1\), samlinger \(3\) og oppgaver \(1\)/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Avbryt" }));
    expect(screen.queryByText("Tømme testpersoner og planleggerdata?")).toBeNull();
    expect(clearPlannerTestData).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tøm planlegger-testdata" }));
    fireEvent.click(screen.getByRole("button", { name: "Ja, tøm testdata" }));
    await waitFor(() => expect(clearPlannerTestData).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Tømme testpersoner og planleggerdata?")).toBeNull());
    expect(showFeedback).toHaveBeenCalledWith("Testpersoner, grupper og planlegger-data er nå tømt. CMS-sider og nyheter ble bevart.");
  });

  test("Sletting av alt sier hvor mange dokumenter det gjelder, og sletter først etter bekreftelse", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Slett alt i databasen" }));
    expect(screen.getByText("Slette absolutt alle data i databasen?")).toBeDefined();
    expect(screen.getByText("11 dokumenter")).toBeDefined();
    expect(deleteAllData).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ja, slett alt permanent" }));
    await waitFor(() => expect(deleteAllData).toHaveBeenCalledTimes(1));
    expect(showFeedback).toHaveBeenCalledWith("Alle data i databasen er nå slettet.");
  });

  test("Modulbryterne viser status og slår av og på", () => {
    open();
    expect(screen.getAllByText("PÅ")).toHaveLength(1);
    expect(screen.getAllByText("AV")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Slå av" }));
    expect(toggleKalender).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Slå på" }));
    expect(toggleMeldinger).toHaveBeenCalledTimes(1);
  });

  test("Testen av utvekslingen viser antall samlinger, og feil når den ikke svarer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ gatherings: [1, 2, 3] }) }));
    open();
    fireEvent.click(screen.getByRole("button", { name: /Test utvekslingen nå/ }));
    await screen.findByText("Suksess: Mottok 3 offentlige samlinger.");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }));
    fireEvent.click(screen.getByRole("button", { name: /Test utvekslingen nå/ }));
    await screen.findByText("Feil: HTTP 503");
    expect(showFeedback).toHaveBeenCalledWith("Kunne ikke nå utvekslingen med eksterne nettsider: HTTP 503", "error");
  });
});
