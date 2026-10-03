// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CmsPage } from "../src/data/cmsData";

vi.mock("../src/context/CmsContext", () => ({ useCms: () => ({ settings: { churchName: "Testkirken" } }) }));
vi.mock("../src/pages/admin/tabs/pages/HeroImageUploader", () => ({ HeroImageUploader: () => null }));
vi.mock("../src/pages/admin/tabs/pages/ContentBlockPickerModal", () => ({
  ContentBlockPickerModal: ({ isOpen, onInsertBlock }: { isOpen: boolean; onInsertBlock: (s: string) => void }) =>
    isOpen ? <button onClick={() => onInsertBlock("[valgt blokk]")}>Velg blokk</button> : null,
}));

import { PageEditModal } from "../src/pages/admin/tabs/pages/PageEditModal";

const onUpdate = vi.fn();
const onSave = vi.fn((e: React.FormEvent) => e.preventDefault());
const onPreview = vi.fn();
const onClose = vi.fn();
const parents = [{ id: "grupper", title: "Grupper", slug: "grupper" } as CmsPage];

const open = (page: Partial<CmsPage>, isNewPage = false) =>
  render(
    <PageEditModal
      editingPage={page}
      isNewPage={isNewPage}
      availableParentPages={parents}
      onUpdate={onUpdate}
      onSave={onSave}
      onPreview={onPreview}
      onClose={onClose}
    />
  );
const lastUpdate = () => onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0] as Partial<CmsPage>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Redigering av en side i admin", () => {
  test("Overskriften forteller om siden er ny, en underfane eller finnes fra før", () => {
    open({}, true);
    expect(screen.getByText("Opprett ny hovedfane")).toBeDefined();
    cleanup();
    open({ parentPageId: "grupper" }, true);
    expect(screen.getByText("Opprett ny underfane")).toBeDefined();
    cleanup();
    open({ title: "Om oss" });
    expect(screen.getByText("Rediger side: Om oss")).toBeDefined();
  });

  test("Endringer går til onUpdate med resten av siden beholdt", () => {
    open({ title: "Om oss", slug: "om-oss" });
    fireEvent.change(screen.getByPlaceholderText(/f.eks. Om oss, Barn/), { target: { value: "Om menigheten" } });
    expect(lastUpdate()).toMatchObject({ title: "Om menigheten", slug: "om-oss" });
    fireEvent.change(screen.getByPlaceholderText("Kort beskrivelse som vises under tittelen på siden..."), { target: { value: "Hei" } });
    expect(lastUpdate()).toMatchObject({ summary: "Hei", slug: "om-oss" });
  });

  test("Valg av forelder og rekkefølge holder de to feltparene like", () => {
    const { container } = open({ title: "A" });
    fireEvent.change(container.querySelector("select")!, { target: { value: "grupper" } });
    expect(lastUpdate()).toMatchObject({ parentPageId: "grupper", parentId: "grupper" });
    fireEvent.change(container.querySelector('input[type="number"]')!, { target: { value: "3" } });
    expect(lastUpdate()).toMatchObject({ menuOrder: 3, navOrder: 3 });
  });

  test("Innholdsknappene legger blokken til sist i teksten", () => {
    open({ content: "Tekst" });
    fireEvent.click(screen.getByTitle("Sett inn infoboks"));
    expect(lastUpdate().content).toBe("Tekst\n\n:::callout[info] Informasjon\nDette er en fremhevet infoboks for kunngjøringer eller nyttig informasjon for menigheten.\n:::");
    fireEvent.click(screen.getByTitle("Sett inn lederskapet med verv"));
    expect(lastUpdate().content).toBe("Tekst\n\n:::personer[lederskap]");
  });

  test("Blokkvelgeren setter inn den valgte blokken", () => {
    open({ content: "" });
    expect(screen.queryByText("Velg blokk")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Legg til innhold/ }));
    fireEvent.click(screen.getByText("Velg blokk"));
    expect(lastUpdate().content).toBe("[valgt blokk]");
  });

  test("Publisering: statusmerke følger siden, og en dato fram i tid planlegger den", () => {
    open({ isPublished: false });
    expect(screen.getByText("Kladd (upublisert)")).toBeDefined();
    cleanup();
    open({});
    expect(screen.getByText("Publisert (aktiv)")).toBeDefined();
    cleanup();
    const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    open({ isPublished: true, publishAt: future });
    expect(screen.getByText("Planlagt publisering")).toBeDefined();
    fireEvent.click(screen.getByText(/Nullstill dato/));
    expect(lastUpdate().publishAt).toBeUndefined();
    cleanup();
    open({});
    fireEvent.click(screen.getByText("I morgen 09:00"));
    expect(lastUpdate()).toMatchObject({ isPublished: true, status: "scheduled" });
  });

  test("Søk og deling: viser forhåndsvisning med menighetens navn, og teller tegn", () => {
    open({ title: "Om oss", summary: "Kort ingress", metaDescription: "x".repeat(130) });
    expect(screen.getAllByText("Om oss – Testkirken").length).toBeGreaterThan(0);
    expect(screen.getByText("130/160 tegn")).toBeDefined();
    fireEvent.click(screen.getByText("Kopier fra ingress"));
    expect(lastUpdate().metaDescription).toBe("Kort ingress");
  });

  test("Knappene lagrer, forhåndsviser og lukker", () => {
    open({ title: "A" });
    fireEvent.click(screen.getByRole("button", { name: "Lagre side" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByText("Forhåndsvis kladd")[0]);
    expect(onPreview).toHaveBeenCalledWith({ title: "A" });
    fireEvent.click(screen.getByRole("button", { name: "Avbryt" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
