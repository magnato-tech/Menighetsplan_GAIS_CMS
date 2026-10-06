// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("../src/services/stockImages", async () => ({
  ...(await vi.importActual<typeof import("../src/services/stockImages")>("../src/services/stockImages")),
  listStockImages: vi.fn(),
}));
vi.mock("../src/hooks/useMediaMap", () => ({ useResolvedMediaUrl: (value: string) => value }));
vi.mock("../src/components/admin/MediaLibraryPanel", () => ({ MediaLibraryPanel: () => null }));

import { CmsMediaPicker } from "../src/components/admin/CmsMediaPicker";
import { StockImageGrid } from "../src/components/admin/StockImageGrid";
import { listStockImages, type StockImage } from "../src/services/stockImages";

const image = (id: string, title: string, altText: string, tags: string[]): StockImage => ({
  id,
  title,
  altText,
  tags,
  file: `${id}.jpg`,
  thumb: `${id}-liten.jpg`,
  width: 1600,
  height: 1067,
  credit: "Toa Heftiba",
  source: "Unsplash",
  sourceUrl: `https://unsplash.com/photos/${id}`,
});
const images = [
  image("gruppe", "Smågruppe rundt bordet", "Fem personer som sitter rundt et lavt bord med kopper.", ["smågruppe", "kaffe"]),
  image("familie", "Familie med baby", "En mor og en far som smiler, med en baby mellom seg.", ["familie", "dåp"]),
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Bildene som følger med, i admin", () => {
  test("hvert bilde vises med beskrivelse, tittel, fotograf og lenke til kilden", async () => {
    vi.mocked(listStockImages).mockResolvedValue(images);
    render(<StockImageGrid />);

    const picture = (await screen.findByAltText("Fem personer som sitter rundt et lavt bord med kopper.")) as HTMLImageElement;
    expect(picture.getAttribute("src")).toBe("/bildebibliotek/gruppe-liten.jpg");
    expect(screen.getByText("Bilder som følger med (2)")).toBeTruthy();
    expect(screen.getByText("Smågruppe rundt bordet")).toBeTruthy();
    const credit = screen.getAllByRole("link", { name: "Foto: Toa Heftiba / Unsplash" })[0] as HTMLAnchorElement;
    expect(credit.href).toBe("https://unsplash.com/photos/gruppe");
    // As an overview there is nothing to press
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("et eget bilde vises med fotografen, uten lenke", async () => {
    const own = { ...images[0], id: "eget", title: "Kirkekaffe", credit: "Kari Nordmann", source: "Egne bilder", sourceUrl: undefined };
    vi.mocked(listStockImages).mockResolvedValue([own]);
    render(<StockImageGrid />);

    expect(await screen.findByText("Foto: Kari Nordmann")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("søket snevrer inn, og sier fra når ingenting passer", async () => {
    vi.mocked(listStockImages).mockResolvedValue(images);
    render(<StockImageGrid />);
    await screen.findByText("Familie med baby");

    fireEvent.change(screen.getByLabelText("Søk i bildene som følger med"), { target: { value: "dåp" } });
    expect(screen.queryByText("Smågruppe rundt bordet")).toBeNull();
    expect(screen.getByText("Familie med baby")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Søk i bildene som følger med"), { target: { value: "romfart" } });
    expect(screen.getByText("Ingen bilder passer til søket.")).toBeTruthy();
  });

  test("kan ikke bildene hentes, sies det fra", async () => {
    vi.mocked(listStockImages).mockRejectedValue(new Error("Bildene som følger med, kunne ikke hentes (404)."));
    render(<StockImageGrid />);
    expect((await screen.findByRole("alert")).textContent).toBe("Bildene som følger med, kunne ikke hentes (404).");
  });

  test("når et bilde velges til en side, gis adressen videre, og bildet som er i bruk, er merket", async () => {
    vi.mocked(listStockImages).mockResolvedValue(images);
    const onSelect = vi.fn();
    render(<StockImageGrid onSelect={onSelect} selectedUrl="/bildebibliotek/familie.jpg" />);

    const cards = await screen.findAllByRole("listitem");
    expect(within(cards[1]).getByText("Valgt")).toBeTruthy();
    expect(within(cards[0]).queryByText("Valgt")).toBeNull();
    fireEvent.click(within(cards[0]).getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("/bildebibliotek/gruppe.jpg", images[0]);
  });
});

describe("Bildevelgeren med bildene som følger med", () => {
  test("«Bibliotek» viser bildene, og et trykk setter adressen og fyller en tom beskrivelse", async () => {
    vi.mocked(listStockImages).mockResolvedValue(images);
    const onChange = vi.fn();
    const onAltChange = vi.fn();
    render(<CmsMediaPicker label="Bilde" value="" onChange={onChange} decorative altValue="" onAltChange={onAltChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Bibliotek" }));
    fireEvent.click((await screen.findByAltText("En mor og en far som smiler, med en baby mellom seg.")).closest("button")!);

    expect(onChange).toHaveBeenCalledWith("/bildebibliotek/familie.jpg");
    expect(onAltChange).toHaveBeenCalledWith("En mor og en far som smiler, med en baby mellom seg.");
    // The library closes when the image is chosen
    expect(screen.queryByText("Bilder som følger med (2)")).toBeNull();
  });

  test("en beskrivelse som er skrevet, blir stående", async () => {
    vi.mocked(listStockImages).mockResolvedValue(images);
    const onAltChange = vi.fn();
    render(<CmsMediaPicker label="Bilde" value="" onChange={vi.fn()} decorative altValue="Vår egen tekst" onAltChange={onAltChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Bibliotek" }));
    fireEvent.click((await screen.findByAltText("En mor og en far som smiler, med en baby mellom seg.")).closest("button")!);
    expect(onAltChange).not.toHaveBeenCalled();
  });

  test("adressen til et bilde som følger med, kan også skrives inn", () => {
    const onChange = vi.fn();
    render(<CmsMediaPicker label="Bilde" value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "URL" }));
    fireEvent.change(screen.getByPlaceholderText("https://... eller media:id"), { target: { value: "/bildebibliotek/gruppe.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Bruk" }));
    expect(onChange).toHaveBeenCalledWith("/bildebibliotek/gruppe.jpg");
  });
});
