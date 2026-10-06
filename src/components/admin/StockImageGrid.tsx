import React, { useEffect, useMemo, useState } from "react";
import { Check, Images, Search } from "lucide-react";
import { filterStockImages, listStockImages, stockImageUrl, stockThumbUrl, type StockImage } from "../../services/stockImages";

interface StockImageGridProps {
  /** Given when an image is being chosen for a page. Without it the grid is an overview. */
  onSelect?: (url: string, image: StockImage) => void;
  /** The address of the image in use now, marked in the grid. */
  selectedUrl?: string;
}

/**
 * The images that come with the app (see services/stockImages.ts), with search. Shown in the
 * media library and wherever an image is chosen. Each image names its photographer and source.
 */
export const StockImageGrid: React.FC<StockImageGridProps> = ({ onSelect, selectedUrl }) => {
  const [images, setImages] = useState<StockImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let current = true;
    listStockImages()
      .then((list) => current && setImages(list))
      .catch((reason) => current && setError(reason instanceof Error ? reason.message : "Bildene kunne ikke hentes."));
    return () => {
      current = false;
    };
  }, []);

  const shown = useMemo(() => filterStockImages(images ?? [], query), [images, query]);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 space-y-3" aria-label="Bilder som følger med">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5 text-indigo-300" />
            <span>Bilder som følger med{images ? ` (${images.length})` : ""}</span>
          </h4>
          <p className="text-[10px] text-slate-500">
            Arkivbilder og egne bilder, klare til bruk på nettsiden.
            {onSelect ? " Trykk på et bilde for å bruke det." : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk, f.eks. fellesskap eller familie"
            aria-label="Søk i bildene som følger med"
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-amber-300">
          {error}
        </p>
      )}
      {!error && images === null && <p className="text-[11px] text-slate-500">Henter bildene …</p>}
      {images !== null && shown.length === 0 && (
        <p className="text-[11px] text-slate-500">{images.length === 0 ? "Ingen bilder følger med ennå." : "Ingen bilder passer til søket."}</p>
      )}

      {shown.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {shown.map((image) => {
            const url = stockImageUrl(image);
            const selected = selectedUrl === url;
            const picture = (
              <span className="relative block aspect-[3/2] overflow-hidden rounded-lg bg-slate-900">
                <img src={stockThumbUrl(image)} alt={image.altText} loading="lazy" className="w-full h-full object-cover" />
                {selected && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-400 text-[9px] font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                    <span>Valgt</span>
                  </span>
                )}
              </span>
            );
            return (
              <li
                key={image.id}
                className={`rounded-xl border p-1.5 space-y-1 ${selected ? "border-emerald-500" : "border-slate-700"}`}
              >
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(url, image)}
                    title={image.altText}
                    className="block w-full text-left cursor-pointer rounded-lg hover:ring-2 hover:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    {picture}
                  </button>
                ) : (
                  picture
                )}
                <div className="px-0.5">
                  <div className="text-[11px] font-semibold text-slate-200 truncate">{image.title}</div>
                  {image.sourceUrl ? (
                    <a
                      href={image.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 hover:text-indigo-300 truncate block"
                    >
                      Foto: {image.credit} / {image.source}
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-500 truncate block">
                      {image.credit ? `Foto: ${image.credit}` : image.source}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
