import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Globe, Image as ImageIcon, Search, Share2, X } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { useCms } from "../../../../context/CmsContext";
import { useTimedMessage } from "../../../../hooks/useTimedMessage";
import { shareableImageUrl } from "../../../../utils/seoUtils";

interface Props {
  page: Partial<CmsPage>;
  onUpdate: (updated: Partial<CmsPage>) => void;
}

const fieldClass =
  "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500";

/** How the page looks in a search result and when its link is shared, with a live preview of both. */
export const PageSeoSection: React.FC<Props> = ({ page, onUpdate }) => {
  const { settings } = useCms();
  const [showDetails, setShowDetails] = useState(false);
  const [copiedIngress, showCopiedIngress] = useTimedMessage<true>(2000);

  // What the search result and the share card will show
  const siteHost = window.location.host;
  const previewTitle = `${page.title || "Sidetittel"} – ${settings.churchName}`;
  const previewDescription =
    page.metaDescription?.trim() ||
    page.summary?.trim() ||
    `Velkommen til ${page.title || "siden"} i ${settings.churchName}.`;
  // An uploaded image has no address a sharing service can fetch
  const heroShareable = shareableImageUrl(page.heroImage, window.location.origin);
  const shareImage = shareableImageUrl(page.ogImage, window.location.origin) || heroShareable;
  const descriptionLength = (page.metaDescription || "").length;

  return (
    <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Søk og deling</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Styr hvordan siden vises i søkeresultater og når noen deler lenken.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{showDetails ? "Skjul detaljer" : "Rediger søk og deling"}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {(showDetails || page.metaDescription || page.ogImage) && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Beskrivelse i søkeresultater</span>
              </label>
              <div className="flex items-center gap-2">
                {page.summary && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ ...page, metaDescription: page.summary });
                      showCopiedIngress(true);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Kopier innholdet fra ingressen over som metabeskrivelse"
                  >
                    {copiedIngress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIngress ? "Kopiert!" : "Kopier fra ingress"}</span>
                  </button>
                )}
                <span
                  className={`text-[10px] font-mono ${
                    descriptionLength >= 120 && descriptionLength <= 160
                      ? "text-emerald-400 font-bold"
                      : descriptionLength > 160
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {descriptionLength}/160 tegn
                </span>
              </div>
            </div>
            <textarea
              rows={2}
              value={page.metaDescription || ""}
              onChange={(e) => onUpdate({ ...page, metaDescription: e.target.value })}
              placeholder="Kort, innbydende oppsummering av sidens innhold for søkeresultater (anbefalt 120–160 tegn)..."
              className={`${fieldClass} leading-relaxed`}
            />
            <p className="text-[11px] text-slate-400">
              Hvis feltet er tomt, brukes sidens ingress automatisk som reserve for søkemotorer.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Delebilde (nettadresse)</span>
              </label>
              {heroShareable && (
                <button
                  type="button"
                  onClick={() => onUpdate({ ...page, ogImage: page.heroImage })}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Bruk samme som hovedbilde</span>
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={page.ogImage || ""}
                onChange={(e) => onUpdate({ ...page, ogImage: e.target.value })}
                placeholder="https://... (adressen til delebildet, helst 1200 × 630 piksler)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
              />
              {page.ogImage && (
                <button
                  type="button"
                  onClick={() => onUpdate({ ...page, ogImage: "" })}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fjern tilpasset delebilde"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Vises som stort bildekort ved deling på sosiale medier. Anbefalt format er 1200 × 630 piksler. Bildet må
              ha en nettadresse. Et hovedbilde som er lastet opp fra maskinen, kan ikke brukes som delebilde.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Forhåndsvisning: søkeresultat</span>
            </div>

            <div className="space-y-1 bg-white p-3 rounded-lg text-left shadow-xs">
              <div className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                <span>{siteHost}</span>
                <span>›</span>
                <span className="font-mono text-[10px] text-stone-600">{page.slug || "side"}</span>
              </div>
              <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                {previewTitle}
              </div>
              <div className="text-xs text-stone-600 leading-snug line-clamp-2">{previewDescription}</div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-400">Delingskort i sosiale medier</div>
              <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900 max-w-sm">
                {shareImage ? (
                  <div className="w-full h-32 bg-slate-800 overflow-hidden">
                    <img src={shareImage} alt="Delebilde" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-20 bg-slate-800/80 flex items-center justify-center text-slate-500 text-xs italic">
                    Uten delebilde vises menighetens ikon
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">{siteHost}</span>
                  <h4 className="text-xs font-bold text-white truncate">{previewTitle}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{previewDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
