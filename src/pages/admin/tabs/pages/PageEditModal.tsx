import React, { useState } from "react";
import { CmsPage } from "../../../../data/cmsData";
import {
  Edit3,
  X,
  FolderTree,
  Layers,
  Eye,
  Sparkles,
  Info,
  AlertTriangle,
  LayoutGrid,
  Quote,
  MousePointerClick,
  Plus,
  Globe,
  Search,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Clock,
  Calendar,
} from "lucide-react";
import { HeroImageUploader } from "./HeroImageUploader";
import { ContentBlockPickerModal } from "./ContentBlockPickerModal";
import { useCms } from "../../../../context/CmsContext";
import { useTimedMessage } from "../../../../hooks/useTimedMessage";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import { shareableImageUrl } from "../../../../utils/seoUtils";

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return "";
  }
}

function getPresetDate(type: "tomorrow" | "sunday" | "monday"): string {
  const d = new Date();
  if (type === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (type === "sunday") {
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(8, 0, 0, 0);
  } else if (type === "monday") {
    const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

interface PageEditModalProps {
  editingPage: Partial<CmsPage>;
  isNewPage: boolean;
  availableParentPages: CmsPage[];
  onUpdate: (updated: Partial<CmsPage>) => void;
  onSave: (e: React.FormEvent) => void;
  onPreview: (draft: Partial<CmsPage>) => void;
  onClose: () => void;
}

export const PageEditModal: React.FC<PageEditModalProps> = ({
  editingPage,
  isNewPage,
  availableParentPages,
  onUpdate,
  onSave,
  onPreview,
  onClose,
}) => {
  const { settings } = useCms();
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [showSeoDetails, setShowSeoDetails] = useState(false);
  const [copiedIngress, showCopiedIngress] = useTimedMessage<true>(2000);

  // What the search result and the share card will show
  const siteHost = window.location.host;
  const previewTitle = `${editingPage.title || "Sidetittel"} – ${settings.churchName}`;
  const previewDescription =
    editingPage.metaDescription?.trim() ||
    editingPage.summary?.trim() ||
    `Velkommen til ${editingPage.title || "siden"} i ${settings.churchName}.`;
  // An uploaded image has no address a sharing service can fetch
  const shareImage =
    shareableImageUrl(editingPage.ogImage, window.location.origin) ||
    shareableImageUrl(editingPage.heroImage, window.location.origin);

  const insertComponentSnippet = (snippet: string) => {
    const current = editingPage.content || "";
    const separator = current && !current.endsWith("\n\n") ? (current.endsWith("\n") ? "\n" : "\n\n") : "";
    onUpdate({ ...editingPage, content: current + separator + snippet });
  };

  const currentParentId =
    editingPage.parentPageId !== undefined
      ? editingPage.parentPageId
      : editingPage.parentId || null;

  const currentOrder =
    typeof editingPage.menuOrder === "number"
      ? editingPage.menuOrder
      : typeof editingPage.navOrder === "number"
      ? editingPage.navOrder
      : 1;

  const handleParentChange = (val: string) => {
    const parentVal = val ? val : null;
    onUpdate({
      ...editingPage,
      parentPageId: parentVal,
      parentId: parentVal, // Keep compatibility alias in sync
    });
  };

  const handleOrderChange = (num: number) => {
    onUpdate({
      ...editingPage,
      menuOrder: num,
      navOrder: num, // Keep compatibility alias in sync
    });
  };

  const publishTime = editingPage.publishAt ? new Date(editingPage.publishAt).getTime() : 0;
  const isFutureScheduled =
    editingPage.isPublished !== false &&
    Boolean(publishTime && publishTime > Date.now());
  const isManuallyPublished = editingPage.isPublished !== false && !isFutureScheduled;
  const isDraft = editingPage.isPublished === false;

  const handlePublishDateChange = (val: string) => {
    if (!val) {
      onUpdate({
        ...editingPage,
        publishAt: undefined,
        publishedAt: undefined,
      });
      return;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return;
    const iso = d.toISOString();
    const isFuture = d.getTime() > Date.now();
    onUpdate({
      ...editingPage,
      publishAt: iso,
      publishedAt: iso,
      isPublished: true, // Auto-enable publishing when scheduling a date
      status: isFuture ? "scheduled" : "published",
    });
  };

  return (
    <form
      onSubmit={onSave}
      className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4 transition-all"
    >
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-indigo-400" />
          <span>
            {isNewPage
              ? currentParentId
                ? "Opprett ny underfane"
                : "Opprett ny hovedfane"
              : `Rediger side: ${editingPage.title || "Uten tittel"}`}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(editingPage)}
            className="px-2.5 py-1 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Forhåndsvis hvordan denne kladden vil se ut for besøkende"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Forhåndsvis kladd</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tittel */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 block">Sidetittel (Vises i meny og header)</label>
          <input
            type="text"
            required
            value={editingPage.title || ""}
            onChange={(e) => onUpdate({ ...editingPage, title: e.target.value })}
            placeholder="f.eks. Om oss, Barn & Unge, Kontakt"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* URL Slug */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 block">Adresse / Slug (f.eks. /om-oss)</label>
          <input
            type="text"
            value={editingPage.slug || ""}
            onChange={(e) => onUpdate({ ...editingPage, slug: e.target.value })}
            placeholder="om-oss (eller genereres automatisk fra tittel)"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Ekstern eller overstyrt intern lenke */}
      <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 block">
            Overstyr lenkeadresse (valgfritt)
          </label>
          <span className="text-[10px] text-slate-400">
            For lenker til eksisterende moduler som /hva-skjer, /grupper, /taler, eller full URL
          </span>
        </div>
        <input
          type="text"
          value={editingPage.linkUrl || ""}
          onChange={(e) => onUpdate({ ...editingPage, linkUrl: e.target.value })}
          placeholder="f.eks. /hva-skjer eller https://..."
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
        />
      </div>

      {/* Hovedmeny-hierarki og Rekkefølge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hovedfane / Forelder</span>
          </label>
          <select
            value={currentParentId || ""}
            onChange={(e) => handleParentChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Ingen (Dette er en topp-nivå hovedfane)</option>
            {availableParentPages.map((parent) => (
              <option key={parent.id} value={parent.id}>
                📁 Underfane under: {parent.title} (/{parent.slug})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Velg om siden skal ligge direkte i menylinjen eller som et valg i en dropdown under en hovedfane.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Menyrekkefølge</span>
          </label>
          <input
            type="number"
            min={1}
            value={currentOrder}
            onChange={(e) => handleOrderChange(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-400">
            Lavt tall vises først fra venstre (f.eks. 1 = først, 2 = neste).
          </p>
        </div>
      </div>

      {/* Sammendrag / Ingress */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-300 block">Kort ingress / sammendrag</label>
        <input
          type="text"
          value={editingPage.summary || ""}
          onChange={(e) => onUpdate({ ...editingPage, summary: e.target.value })}
          placeholder="Kort beskrivelse som vises under tittelen på siden..."
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
        />
      </div>

      {/* Hovedbilde (Hero Image) Opplasting */}
      <HeroImageUploader
        currentImageUrl={editingPage.heroImage}
        onImageChange={(url) => onUpdate({ ...editingPage, heroImage: url })}
        pageTitle={editingPage.title}
      />

      {/* Innhold med komponentvelger */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Hovedinnhold (Markdown & kontrollerte komponenter)
          </label>
          <span className="text-[10px] text-indigo-400">Kontrollert Tailwind designsystem</span>
        </div>

        {/* Komponent-verktøylinje */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ferdige innholdsblokker:</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBlockPickerOpen(true)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Åpne visuell blokkvelger med forhåndsvisning av alle innholdsblokker"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Legg til innhold</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() =>
                insertComponentSnippet(
                  `:::callout[info] Informasjon\nDette er en fremhevet infoboks for kunngjøringer eller nyttig informasjon for menigheten.\n:::`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sett inn infoboks"
            >
              <Info className="w-3 h-3 text-sky-400" />
              <span>Infoboks</span>
            </button>

            <button
              type="button"
              onClick={() =>
                insertComponentSnippet(
                  `:::callout[warning] Viktig merknad\nVennligst merk at arrangementet krever forhåndspåmelding eller spesiell oppfølging.\n:::`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sett inn viktig varsel"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Viktig varsel</span>
            </button>

            <button
              type="button"
              onClick={() =>
                insertComponentSnippet(
                  `:::grid\n:::card Fellesskap & Grupper\nBli med i en av våre livsnære cellegrupper eller temakvelder.\n:::\n:::card Bønn & Omsorg\nVi ber for hverandre og tilbyr samtaler og forbønn ved behov.\n:::\n:::`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sett inn to likeverdige kort side ved side"
            >
              <LayoutGrid className="w-3 h-3 text-emerald-400" />
              <span>2-kolonners kort</span>
            </button>

            <button
              type="button"
              onClick={() =>
                insertComponentSnippet(
                  `:::quote[Pastorens hilsen]\nVelkommen hjem til et varmt og inkluderende fellesskap for alle generasjoner.\n:::`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sett inn sitatblokk"
            >
              <Quote className="w-3 h-3 text-indigo-400" />
              <span>Sitatblokk</span>
            </button>

            <button
              type="button"
              onClick={() =>
                insertComponentSnippet(
                  `[Knapp: Meld deg på samlingen](/kontakt)`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sett inn handlingsknapp (CTA)"
            >
              <MousePointerClick className="w-3 h-3 text-indigo-400" />
              <span>Handlingsknapp (CTA)</span>
            </button>
          </div>
        </div>

        <textarea
          rows={7}
          value={editingPage.content || ""}
          onChange={(e) => onUpdate({ ...editingPage, content: e.target.value })}
          placeholder="Skriv tekst eller bruk komponentknappene ovenfor..."
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
        />
      </div>

      {/* Søkemotoroptimalisering (SEO) & Sosiale medier (OpenGraph) */}
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
                Styr hvordan siden vises på Google og ved deling på Facebook, X, Slack og iMessage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSeoDetails(!showSeoDetails)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showSeoDetails ? "Skjul detaljer" : "Rediger SEO-felter"}</span>
            {showSeoDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* SEO Fields - can be expanded or previewed */}
        {(showSeoDetails || editingPage.metaDescription || editingPage.ogImage) && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Beskrivelse i søkeresultater</span>
                </label>
                <div className="flex items-center gap-2">
                  {editingPage.summary && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdate({ ...editingPage, metaDescription: editingPage.summary });
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
                      (editingPage.metaDescription || "").length >= 120 &&
                      (editingPage.metaDescription || "").length <= 160
                        ? "text-emerald-400 font-bold"
                        : (editingPage.metaDescription || "").length > 160
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {(editingPage.metaDescription || "").length}/160 tegn
                  </span>
                </div>
              </div>
              <textarea
                rows={2}
                value={editingPage.metaDescription || ""}
                onChange={(e) => onUpdate({ ...editingPage, metaDescription: e.target.value })}
                placeholder="Kort, innbydende oppsummering av sidens innhold for søkeresultater (anbefalt 120–160 tegn)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                Hvis feltet er tomt, brukes sidens ingress automatisk som reserve for søkemotorer.
              </p>
            </div>

            {/* OG Image */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Delebilde (nettadresse)</span>
                </label>
                {shareableImageUrl(editingPage.heroImage, window.location.origin) && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...editingPage, ogImage: editingPage.heroImage })}
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
                  value={editingPage.ogImage || ""}
                  onChange={(e) => onUpdate({ ...editingPage, ogImage: e.target.value })}
                  placeholder="https://... (URL til delebilde, anbefalt 1200x630px)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                />
                {editingPage.ogImage && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...editingPage, ogImage: "" })}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Fjern tilpasset delebilde"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Vises som stort bildekort ved deling på sosiale medier. Anbefalt format er 1200 × 630 piksler.
                Bildet må ha en nettadresse. Et hovedbilde som er lastet opp fra maskinen, kan ikke brukes som delebilde.
              </p>
            </div>

            {/* Live Search & Social Preview Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Forhåndsvisning: søkeresultat</span>
              </div>

              <div className="space-y-1 bg-white p-3 rounded-lg text-left shadow-xs">
                <div className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                  <span>{siteHost}</span>
                  <span>›</span>
                  <span className="font-mono text-[10px] text-stone-600">{editingPage.slug || "side"}</span>
                </div>
                <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                  {previewTitle}
                </div>
                <div className="text-xs text-stone-600 leading-snug line-clamp-2">{previewDescription}</div>
              </div>

              {/* Social share card preview */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-slate-400">
                  Delingskort i sosiale medier
                </div>
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

      {/* Publiserings- og Tidsstyringsinnstillinger */}
      <div className="bg-slate-900/60 border border-slate-700/70 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                <span>Publiseringsstatus & Tidsstyring</span>
                {isFutureScheduled && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/70 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>Planlagt publisering</span>
                  </span>
                )}
                {isManuallyPublished && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/70 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" />
                    <span>Publisert (aktiv)</span>
                  </span>
                )}
                {isDraft && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/70 flex items-center gap-1 font-semibold">
                    <span>Kladd (upublisert)</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Styr når siden skal gå fra 'Kladd' til 'Publisert', enten umiddelbart eller automatisk på en valgt dato.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Hovedmodus: Publisert vs Kladd */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={editingPage.isPublished !== false}
              onChange={(e) => onUpdate({ ...editingPage, isPublished: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-white text-xs">Aktiver publisering</span>
              <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                Når aktivert, vil siden være synlig for publikum (eller automatisk fra planlagt dato).
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={editingPage.inNavMenu !== false}
              onChange={(e) => onUpdate({ ...editingPage, inNavMenu: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-white text-xs">Vis i offentlig meny</span>
              <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                Vises i toppmenyen eller dropdown (hvis av: kun tilgjengelig via direkte lenke).
              </span>
            </div>
          </label>
        </div>

        {/* 2. 'Publiseringsdato'-velger (Planlagt publisering) */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Publiseringsdato & tidspunkt (Planlegging)</span>
            </label>
            {editingPage.publishAt && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...editingPage,
                    publishAt: undefined,
                    publishedAt: undefined,
                  })
                }
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="Fjern tidsplan og publiser umiddelbart"
              >
                <X className="w-3 h-3" />
                <span>Nullstill dato (publiser umiddelbart)</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type="datetime-local"
                value={toDatetimeLocal(editingPage.publishAt)}
                onChange={(e) => handlePublishDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Hurtigvalg-knapper */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePublishDateChange(getPresetDate("tomorrow"))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Sett publisering til i morgen kl. 09:00"
              >
                I morgen 09:00
              </button>
              <button
                type="button"
                onClick={() => handlePublishDateChange(getPresetDate("sunday"))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Sett publisering til kommende søndag kl. 08:00"
              >
                Søndag 08:00
              </button>
              <button
                type="button"
                onClick={() => handlePublishDateChange(getPresetDate("monday"))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Sett publisering til neste mandag kl. 09:00"
              >
                Mandag 09:00
              </button>
            </div>
          </div>

          {/* Forklarende statusmelding basert på valgt dato */}
          {editingPage.publishAt ? (
            isFutureScheduled ? (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-blue-100">
                    Planlagt for automatisk publisering:
                  </span>
                  <p className="text-[11px] text-blue-300/90 leading-relaxed">
                    Siden holdes automatisk som en skjult kladd for publikum frem til{" "}
                    <strong className="text-white font-semibold">
                      {formatNorwegianDateTime(editingPage.publishAt)}
                    </strong>
                    . Da går siden automatisk over til statusen «Publisert» uten manuell handling.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300">
                  Publiseringsdato er passert ({formatNorwegianDateTime(editingPage.publishAt)}). Siden er aktiv og synlig på nettsiden.
                </span>
              </div>
            )
          ) : (
            <p className="text-[11px] text-slate-400">
              💡 La feltet stå tomt hvis du vil publisere siden umiddelbart ved lagring.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => onPreview(editingPage)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-indigo-300 hover:text-indigo-200 border border-indigo-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          title="Forhåndsvis hvordan denne kladden ser ut med offentlig styling før publisering"
        >
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>Forhåndsvis kladd</span>
        </button>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            Lagre side til Firestore
          </button>
        </div>
      </div>

      <ContentBlockPickerModal
        isOpen={isBlockPickerOpen}
        onClose={() => setIsBlockPickerOpen(false)}
        onInsertBlock={insertComponentSnippet}
      />
    </form>
  );
};
