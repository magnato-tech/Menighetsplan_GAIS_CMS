import React, { useState, useEffect } from "react";
import { CmsPage } from "../../../../data/cmsData";
import { useCms } from "../../../../context/CmsContext";
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  ArrowLeft,
  Users,
  Heart,
  Clock,
  Globe,
  Search,
  Share2,
} from "lucide-react";
import { CmsContentRenderer } from "../../../../components/cms/CmsContentRenderer";
import { SITE_THEME_CLASS, getThemeCssVariables } from "../../../../utils/themeUtils";
import { formatNorwegianDateTime } from "../../../../utils/dates";

export interface PagePreviewModalProps {
  page: Partial<CmsPage>;
  parentPageTitle?: string;
  onClose: () => void;
  onContinueEditing?: () => void;
}

type ViewportType = "desktop" | "tablet" | "mobile" | "seo";

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  page,
  parentPageTitle,
  onClose,
  onContinueEditing,
}) => {
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const { settings } = useCms();
  const themeCssVars = getThemeCssVariables(settings?.theme);
  const churchInitials = settings.churchName
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isAboutPage = (page.slug || "").includes("om-oss");
  const isContactPage = (page.slug || "").includes("kontakt");

  // Container width styling based on viewport mode
  const getViewportContainerStyles = () => {
    switch (viewport) {
      case "seo":
        return "w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl my-4";
      case "mobile":
        return "w-[390px] max-w-full rounded-3xl border-8 border-slate-700 shadow-2xl my-6";
      case "tablet":
        return "w-[768px] max-w-full rounded-2xl border-4 border-slate-700 shadow-2xl my-6";
      case "desktop":
      default:
        return "w-full max-w-5xl rounded-2xl border border-stone-300 shadow-2xl my-4";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Forhåndsvisning av side"
    >
      {/* Top Utility & Control Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-xs">
                {page.title || "Uten tittel (kladd)"}
              </span>
              <span className="text-xs font-mono text-indigo-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                /{page.slug || "kladd"}
              </span>
              {page.isPublished !== false ? (
                page.publishAt && new Date(page.publishAt).getTime() > Date.now() ? (
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-700/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Planlagt: {formatNorwegianDateTime(page.publishAt)}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                    Publisert
                  </span>
                )
              ) : (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                  Kladd (upublisert)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Forhåndsvisning med nøyaktig samme styling og typografi som offentlig nettside.
            </p>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewport === "desktop"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
            title="Skrivebordsvisning (100% bredde)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skrivebord</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewport === "tablet"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
            title="Nettbrettvisning (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nettbrett (768px)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewport === "mobile"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
            title="Mobilvisning (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobil (390px)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("seo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewport === "seo"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
            title="Forhåndsvisning av søkeresultat og sosiale delingskort (OpenGraph)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SEO & Deling</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onContinueEditing && (
            <button
              type="button"
              onClick={onContinueEditing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Fortsett redigering
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Lukk forhåndsvisning (Esc)"
            aria-label="Lukk forhåndsvisning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Preview Scrollable Canvas */}
      <main className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-8 flex justify-center items-start">
        {viewport === "seo" ? (
          <div className="w-full max-w-3xl space-y-6 my-4">
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-400">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold text-base">Søkemotor- og deleforhåndsvisning</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Her ser du hvordan siden blir indeksert av Google og hvordan lenken presenteres med tittel, bilde og beskrivelse når den deles på Facebook, X, Slack eller iMessage.
              </p>
            </div>

            {/* Google SERP Preview */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Google-søkeresultat</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  Google Snippet
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-stone-500 flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                    L
                  </div>
                  <span className="font-medium text-stone-700">lillesandmisjonskirke.no</span>
                  <span>›</span>
                  <span className="font-mono text-stone-500">{page.slug || "side"}</span>
                </div>
                <h4 className="text-lg font-medium text-blue-800 hover:underline cursor-pointer tracking-tight">
                  {page.title ? `${page.title} – ${settings.churchName}` : `Menighetsplan – ${settings.churchName}`}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                  {page.metaDescription?.trim() ||
                    page.summary?.trim() ||
                    `Velkommen til ${page.title || "siden"} i ${settings.churchName}.`}
                </p>
              </div>

              <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-between">
                <span>
                  Meta-beskrivelse kilde:{" "}
                  <strong className="text-stone-700">
                    {page.metaDescription ? "Egendefinert metaDescription" : "Reserve fra sammendrag/ingress"}
                  </strong>
                </span>
                <span>{(page.metaDescription || page.summary || "").length} tegn</span>
              </div>
            </div>

            {/* Social Share Card (OpenGraph) */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sosialt delingskort (OpenGraph & Twitter Card)</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                  og:image 1200×630
                </span>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50 max-w-md shadow-xs">
                {(page.ogImage || page.heroImage) ? (
                  <div className="w-full h-48 bg-stone-200 relative overflow-hidden">
                    <img
                      src={page.ogImage || page.heroImage}
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                      {page.ogImage ? "Egendefinert ogImage" : "Hero-bilde som og:image"}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-indigo-900 to-slate-900 flex flex-col items-center justify-center text-white p-4 text-center">
                    <span className="font-bold text-sm">{settings.churchName}</span>
                    <span className="text-xs text-indigo-200 mt-1">Standard menighetsprofil</span>
                  </div>
                )}

                <div className="p-4 space-y-1.5 bg-white">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-semibold block">
                    lillesandmisjonskirke.no
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {page.title ? `${page.title} – ${settings.churchName}` : `Menighetsplan – ${settings.churchName}`}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {page.metaDescription?.trim() ||
                      page.summary?.trim() ||
                      `Velkommen til ${page.title || "siden"} i ${settings.churchName}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Injected Head Metadata Code Inspector */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-slate-300 space-y-3 font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs">Injisert i &lt;head&gt; av PublicStaticPage</span>
                <span className="text-[10px] text-indigo-400">SEO / OpenGraph / Schema.org</span>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-indigo-200 bg-slate-950 p-4 rounded-xl border border-slate-800">
{`<title>${page.title ? `${page.title} – ${settings.churchName}` : settings.appName}</title>
<meta name="description" content="${(page.metaDescription || page.summary || `Velkommen til ${settings.churchName}`).replace(/"/g, '&quot;')}" />
<meta property="og:title" content="${page.title ? `${page.title} – ${settings.churchName}` : settings.appName}" />
<meta property="og:description" content="${(page.metaDescription || page.summary || `Velkommen til ${settings.churchName}`).replace(/"/g, '&quot;')}" />
<meta property="og:image" content="${page.ogImage || page.heroImage || "/icon.svg"}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${page.title || ""}",
  "description": "${(page.metaDescription || page.summary || "").replace(/"/g, '\\"')}",
  "publisher": { "@type": "Church", "name": "${settings.churchName}" }
}
</script>`}
              </pre>
            </div>
          </div>
        ) : (
        <div className={`${getViewportContainerStyles()} flex flex-col overflow-hidden transition-all duration-300`}>
        {/* The frame above belongs to admin. Everything inside follows the website's theme. */}
        <div style={themeCssVars} className={`${SITE_THEME_CLASS} bg-page text-stone-900 flex flex-col flex-1`}>
          {/* Simulated Public Navigation Bar */}
          <nav className="border-b border-stone-200 bg-white/95 backdrop-blur-xs px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-700 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {churchInitials}
              </div>
              <div>
                <span className="font-black text-stone-900 text-sm tracking-tight block">
                  {settings.churchName}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest block font-medium">
                  Offentlig forhåndsvisning
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-5 text-xs font-semibold text-stone-600">
              <span className="text-stone-400">Hva skjer</span>
              <span className="text-stone-400">Grupper</span>
              <span className="text-stone-400">Taler</span>
              <span className="font-bold border-b-2 pb-0.5 text-primary-700 border-primary-700">
                {parentPageTitle || page.title || "Aktuell side"}
              </span>
            </div>
          </nav>

          {/* Public Page Viewport Body */}
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
            {/* Header & Breadcrumb */}
            <div className="space-y-3 border-b border-stone-200 pb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Forside</span>
                {parentPageTitle && (
                  <>
                    <span className="text-stone-300">/</span>
                    <span>{parentPageTitle}</span>
                  </>
                )}
                <span className="text-stone-300">/</span>
                <span className="text-stone-900 font-bold">{page.title || "Uten tittel"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
                {page.title || "Tittel på siden"}
              </h1>

              {page.summary && (
                <p className="text-base sm:text-lg text-stone-600 max-w-2xl font-medium leading-relaxed">
                  {page.summary}
                </p>
              )}
            </div>

            {/* Hovedbilde (Hero Image) */}
            {page.heroImage && (
              <div className="w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs relative bg-stone-100">
                <img
                  src={page.heroImage}
                  alt={page.title || "Hovedbilde"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-10 shadow-xs space-y-4">
              <CmsContentRenderer content={page.content} />
            </div>

            {/* Simulated About section for Om oss pages */}
            {isAboutPage && (
              <section className="space-y-4 pt-4 border-t border-stone-200">
                <div className="flex items-center gap-2 text-stone-900 font-black text-lg">
                  <Users className="w-5 h-5 text-primary-700" />
                  <span>Lederskap & Stab</span>
                </div>
                <p className="text-xs text-stone-500">
                  På nettsiden vises stab og lederskap her, under innholdet på «Om oss».
                </p>
              </section>
            )}

            {/* Simulated Contact section for Kontakt pages */}
            {isContactPage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-5 space-y-2">
                  <h4 className="font-bold text-primary-950 text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary-700" />
                    <span>Givertjeneste & Gaver</span>
                  </h4>
                  <p className="text-xs text-primary-900/80">
                    Vipps og kontonummer vises automatisk for menighetens kontakt- og giversider.
                  </p>
                </div>
                <div className="bg-stone-100 border border-stone-200 rounded-2xl p-5 space-y-2">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-700" />
                    <span>Kontortid & Samtaler</span>
                  </h4>
                  <p className="text-xs text-stone-600">
                    Telefon- og kontortider oppført i innstillingene integreres her.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Simulated Public Footer */}
          <footer className="border-t border-stone-200 bg-stone-100/90 px-6 py-6 text-center text-xs text-stone-500 space-y-2 mt-auto">
            <div className="font-bold text-stone-700">{settings.churchName}</div>
            <div className="text-[11px] text-stone-400">
              Dette er en forhåndsvisning av hvordan siden vil se ut for offentlige besøkende.
            </div>
          </footer>
        </div>
        </div>
        )}
      </main>

      {/* Footer bar indicator */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 text-xs text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Aktiv visningsmodus: </span>
          <span className="text-white font-semibold">
            {viewport === "desktop"
              ? "Skrivebord (Full bredde / Responsiv)"
              : viewport === "tablet"
              ? "Nettbrett (768px bredde)"
              : viewport === "mobile"
              ? "Mobil (390px bredde)"
              : "SEO & Sosiale delingskort (Google & OpenGraph)"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
        >
          Lukk forhåndsvisning ✕
        </button>
      </footer>
    </div>
  );
};
