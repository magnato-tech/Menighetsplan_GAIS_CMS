// @vitest-environment jsdom
import React, { useEffect } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { cms } = vi.hoisted(() => ({
  cms: {
    addons: {} as { analysebord?: boolean; nettsidebesok?: boolean },
    addonsState: "ready" as "loading" | "ready" | "failed",
  },
}));
vi.mock("../src/context/CmsContext", () => ({ useCms: () => cms }));

import { AddonGate } from "../src/pages/admin/AddonGate";
import type { StudioTab } from "../src/pages/admin/studio";

const started = vi.fn();
const stopped = vi.fn();
/** Stands in for a board: it starts reading when it is drawn, and stops when it is taken away. */
const Board: React.FC = () => {
  useEffect(() => {
    started();
    return stopped;
  }, []);
  return <p>Innholdet på fanen</p>;
};
const gate = (tab: StudioTab) => (
  <MemoryRouter>
    <AddonGate tab={tab}>
      <Board />
    </AddonGate>
  </MemoryRouter>
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  cms.addons = {};
  cms.addonsState = "ready";
});

describe("En fane som hører til en modul", () => {
  test("tegnes ikke mens modulen er av: siden sier det og viser veien til Moduler", () => {
    render(gate("nettsidebesok"));

    expect(screen.queryByText("Innholdet på fanen")).toBeNull();
    expect(started).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Besøk på nettsiden er ikke slått på" })).toBeTruthy();
    expect(screen.getByText(/Da får den sin plass i menyen under Analyse/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Åpne Moduler" }).getAttribute("href")).toBe("/admin?tab=moduler");
  });

  test("tegnes når modulen er på, også om den andre delen er av", () => {
    cms.addons = { nettsidebesok: true };
    render(gate("nettsidebesok"));
    expect(screen.getByText("Innholdet på fanen")).toBeTruthy();
    cleanup();

    render(gate("analyse"));
    expect(screen.queryByText("Innholdet på fanen")).toBeNull();
    expect(screen.getByRole("heading", { name: "Analysebord er ikke slått på" })).toBeTruthy();
  });

  test("slås modulen av mens fanen er åpen, tas innholdet bort, så ingenting leser eller teller videre", () => {
    cms.addons = { analysebord: true };
    const { rerender } = render(gate("analyse"));
    expect(started).toHaveBeenCalledTimes(1);

    cms.addons = {};
    rerender(gate("analyse"));
    expect(stopped).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Innholdet på fanen")).toBeNull();
  });

  test("før databasen har svart, sies det ikke at modulen er av", () => {
    cms.addonsState = "loading";
    render(gate("analyse"));

    expect(screen.getByText("Laster fane…")).toBeTruthy();
    expect(screen.queryByText(/ikke slått på/)).toBeNull();
    expect(started).not.toHaveBeenCalled();
  });

  test("kunne ikke databasen spørres, er modulen av, og siden sier det", () => {
    cms.addonsState = "failed";
    render(gate("analyse"));
    expect(screen.getByRole("heading", { name: "Analysebord er ikke slått på" })).toBeTruthy();
  });
});

describe("En fane som alltid er der", () => {
  test("slippes gjennom uansett hva som er slått på, også siden der modulene slås på", () => {
    for (const tab of ["dashboard", "cms-sider", "database-admin", "moduler"] as StudioTab[]) {
      cms.addonsState = "loading";
      render(gate(tab));
      expect(screen.getByText("Innholdet på fanen")).toBeTruthy();
      cleanup();
    }
  });
});
