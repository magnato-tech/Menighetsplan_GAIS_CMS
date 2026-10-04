import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import { CmsPage } from "../../data/cmsData";
import { CmsContentRenderer } from "../../components/cms/CmsContentRenderer";
import { WorshipModule } from "../../components/cms/modules/WorshipModule";
import { CalendarModule } from "../../components/cms/modules/CalendarModule";
import { NewsModule } from "../../components/cms/modules/NewsModule";
import { SermonModule } from "../../components/cms/modules/SermonModule";
import { GroupsModule } from "../../components/cms/modules/GroupsModule";
import { GivingModule } from "../../components/cms/modules/GivingModule";
import { ArrowRight, Sparkles } from "lucide-react";

interface PublicHomePageProps {
  pageOverride?: Partial<CmsPage>;
  hidePreviewBanner?: boolean;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  pageOverride,
  hidePreviewBanner,
}) => {
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get("preview") === "true";
  const { pages, settings } = useCms();

  // Find stored preview in sessionStorage if in preview mode without pageOverride
  const storedDraft = React.useMemo(() => {
    if (!isPreviewMode || pageOverride) return null;
    try {
      const activeRaw = sessionStorage.getItem("cms_preview_active");
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        if (parsed.slug === "" || parsed.slug === "forside" || parsed.linkUrl === "/") {
          return parsed as Partial<CmsPage>;
        }
      }
    } catch {}
    return null;
  }, [isPreviewMode, pageOverride]);

  const activePage =
    pageOverride ||
    storedDraft ||
    pages.find((p) => p.slug === "forside" || p.slug === "" || p.linkUrl === "/") ||
    null;

  const showHero = activePage?.showHero !== false;

  const heroHeadline =
    (activePage?.title && activePage.title !== "Forside" ? activePage.title : settings.welcomeHeadline) ||
    "Velkommen til menighetens fellesskap";

  const heroSubtext =
    activePage?.summary ||
    settings.welcomeSubtext ||
    "Et åpent hjem for alle generasjoner. Vi samles til gudstjeneste, bønn og nære fellesskap der tro og hverdag møtes.";

  const heroImage = activePage?.heroImage;

  // Render a single visual block
  const renderVisualBlock = (block: any, idx: number) => {
    if (block.hidden) return null;

    switch (block.type) {
      case "module-worship":
        return <WorshipModule key={block.id || idx} variant={block.variant} />;
      case "module-calendar":
        return <CalendarModule key={block.id || idx} variant={block.variant} />;
      case "module-news":
        return <NewsModule key={block.id || idx} variant={block.variant} />;
      case "module-sermon":
        return <SermonModule key={block.id || idx} variant={block.variant} />;
      case "module-groups":
        return <GroupsModule key={block.id || idx} variant={block.variant} />;
      case "module-giving":
        return <GivingModule key={block.id || idx} variant={block.variant} />;
      default:
        // Static content block
        return (
          <div key={block.id || idx} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
            <CmsContentRenderer content={block.rawContent} />
          </div>
        );
    }
  };

  const hasStructuredBlocks = activePage?.blocks && activePage.blocks.length > 0;
  const content = activePage?.content || "";
  const hasModuleDirectives = content.includes(":::module-");

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Top Banner when previewing Forside in separate tab */}
      {isPreviewMode && !hidePreviewBanner && (
        <div className="bg-stone-900 text-stone-200 border-b border-stone-700 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <span className="font-bold text-stone-100">Forhåndsvisning: Forside</span>
            <span className="text-stone-300 hidden sm:inline">· Ekte offentlig forside med modularkitektur</span>
          </div>
          <Link
            to="/admin?tab=pages"
            className="text-[11px] font-semibold text-white bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg transition-colors border border-stone-600"
          >
            Tilbake til CMS
          </Link>
        </div>
      )}

      {/* 1. Hero-ramme (Valgfri / kontrollerbar per side) */}
      {showHero && (
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-primary-950 to-stone-900 text-white py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8">
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <img
                src={heroImage}
                alt={heroHeadline}
                className="w-full h-full object-cover opacity-25 filter blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent" />
            </div>
          )}

          {/* Decorative subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-accent-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.churchName}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {heroHeadline}
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-300 leading-relaxed font-normal">
              {heroSubtext}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/hva-skjer"
                className="px-6 py-3.5 rounded-xl bg-accent-400 hover:bg-accent-300 text-stone-950 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>Se hva som skjer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/om-oss"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all"
              >
                Bli kjent med oss
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Modulbasert innholdsflyt */}
      {hasStructuredBlocks ? (
        <div className="space-y-6">
          {activePage.blocks!.map((block, idx) => renderVisualBlock(block, idx))}
        </div>
      ) : hasModuleDirectives ? (
        <CmsContentRenderer content={content} />
      ) : (
        // Fallback for sider uten blokker/modultagger
        <div className="space-y-12">
          <WorshipModule variant="highlight" />
          {content && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CmsContentRenderer content={content} />
            </div>
          )}
          <CalendarModule variant="grid" />
          <NewsModule variant="grid" />
          <SermonModule variant="player" />
          <GroupsModule variant="banner" />
          <GivingModule variant="card" />
        </div>
      )}
    </div>
  );
};
