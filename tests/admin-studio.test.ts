import { describe } from "vitest";
import { assert } from "./assert";
import { STUDIO_TABS, toStudioTab } from "../src/pages/admin/studio";
import { AdminCmsPanel } from "../src/components/admin/AdminCmsPanel";
import { PagePreviewModal } from "../src/pages/admin/tabs/pages/PagePreviewModal";
import { PageTreeList } from "../src/pages/admin/tabs/pages/PageTreeList";
import { initialCmsPages } from "../src/data/cmsData";

import { HeroImageUploader } from "../src/pages/admin/tabs/pages/HeroImageUploader";
import { CHURCH_HERO_PRESETS } from "../src/utils/imageUpload";
import { ThemeTab } from "../src/pages/admin/tabs/ThemeTab";
import { THEME_PRESETS, defaultCmsDesignTheme } from "../src/data/cmsData";
import { CmsContentRenderer } from "../src/components/cms/CmsContentRenderer";
import { getThemeCssVariables, getThemeRadiusClass } from "../src/utils/themeUtils";
import {
  ContentBlockPickerModal,
  CONTENT_BLOCKS,
} from "../src/pages/admin/tabs/pages/ContentBlockPickerModal";

describe("Admin Studio", () => {
  // The tab comes from the address, which anyone can type
  assert(toStudioTab("cms-sider") === "cms-sider", "En kjent fane i adressen åpnes");
  assert(toStudioTab("cms-design") === "cms-design", "Designsystem-fanen kan åpnes fra adressen");
  assert(STUDIO_TABS.every((tab) => toStudioTab(tab) === tab), "Alle fanene kan åpnes fra adressen");
  assert(toStudioTab(null) === "dashboard", "Uten fane i adressen åpnes oversikten");
  assert(toStudioTab("") === "dashboard", "En tom fane i adressen åpner oversikten");
  assert(toStudioTab("pages") === "dashboard", "En ukjent fane i adressen åpner oversikten");
  assert(typeof AdminCmsPanel === "function", "AdminCmsPanel-komponenten er eksportert og tilgjengelig");
  assert(typeof PagePreviewModal === "function", "PagePreviewModal-komponenten er eksportert og tilgjengelig for forhåndsvisning");
  assert(typeof PageTreeList === "function", "PageTreeList-komponenten er eksportert og tilgjengelig");
  assert(typeof HeroImageUploader === "function", "HeroImageUploader-komponenten er eksportert og tilgjengelig");
  assert(typeof ThemeTab === "function", "ThemeTab-komponenten for designsystemet er tilgjengelig");
  assert(typeof CmsContentRenderer === "function", "CmsContentRenderer-komponenten er tilgjengelig");
  assert(typeof ContentBlockPickerModal === "function", "ContentBlockPickerModal-komponenten er tilgjengelig");

  // Content block presets validation
  assert(CONTENT_BLOCKS.length >= 4, "Det finnes minst 4 ferdige innholdsblokker");
  const blockIds = CONTENT_BLOCKS.map((b) => b.id);
  assert(blockIds.includes("grid-2"), "To-kolonne grid finnes i innholdsblokkene");
  assert(blockIds.includes("media-left"), "Bilde med tekst (venstre) finnes i innholdsblokkene");
  assert(blockIds.includes("media-right"), "Bilde med tekst (høyre) finnes i innholdsblokkene");
  assert(blockIds.includes("quote"), "Sitatblokk finnes i innholdsblokkene");
  assert(
    CONTENT_BLOCKS.every((b) => typeof b.template === "string" && b.template.length > 10),
    "Alle blokker har fyldige forhåndsformaterte maler"
  );

  // Hero image presets validation
  assert(CHURCH_HERO_PRESETS.length >= 3, "Det finnes forhåndsdefinerte kirkebilder for rask opplasting");
  assert(
    CHURCH_HERO_PRESETS.every((p) => typeof p.url === "string" && p.url.startsWith("https://")),
    "Alle kirkebildepresets har gyldige HTTPS-adresser"
  );

  // Design system theme presets validation
  assert(THEME_PRESETS.length >= 4, "Det finnes minst 4 kuraterte menighetstemaer");
  assert(typeof defaultCmsDesignTheme.primaryColor === "string", "Standard primærfarge er definert");
  assert(typeof defaultCmsDesignTheme.accentColor === "string", "Standard aksentfarge er definert");
  const sampleThemeVars = getThemeCssVariables(defaultCmsDesignTheme);
  assert(typeof sampleThemeVars["--cms-primary"] === "string", "getThemeCssVariables genererer --cms-primary");
  assert(typeof getThemeRadiusClass(defaultCmsDesignTheme) === "string", "getThemeRadiusClass returnerer gyldig avrundingsklasse");

  // Draft vs Published checks
  const publishedPages = initialCmsPages.filter((p) => p.isPublished !== false);
  const draftPages = initialCmsPages.filter((p) => p.isPublished === false);
  assert(publishedPages.length > 0, "Det finnes publiserte sider for offentlig visning");
  assert(typeof draftPages.length === "number", "Kladd-telleren er et gyldig tall");
});


