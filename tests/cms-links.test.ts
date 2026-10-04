import { describe } from "vitest";
import { assert } from "./assert";
import type { CmsPage } from "../src/data/cmsData";
import {
  buildLinkContext,
  defaultHomePrimaryLink,
  describeCmsLink,
  ensureSectionAnchors,
  formatCmsLink,
  parseCmsLink,
  resolveCmsLink,
  validateCmsLink,
  linkChoices,
  findBrokenLinksOnPage,
} from "../src/utils/cmsLinks";
import { resolveVisualBlocks } from "../src/utils/cmsBlocks";

describe("CMS-lenker", () => {
  const home: CmsPage = {
    id: "page-forside",
    slug: "",
    title: "Forside",
    summary: "",
    content: `:::module-worship[highlight]
:::

:::module-calendar[grid]
:::`,
    isPublished: true,
    updatedAt: "2026-10-01T10:00:00.000Z",
    linkUrl: "/",
  };

  const calendarPage: CmsPage = {
    id: "page-kalender",
    slug: "hva-skjer",
    title: "Kalender",
    summary: "",
    content: `:::module-kalender[month]
:::`,
    isPublished: true,
    updatedAt: "2026-10-01T10:00:00.000Z",
  };

  const draftPage: CmsPage = {
    id: "page-draft",
    slug: "utkast",
    title: "Utkast",
    summary: "",
    content: "Tekst",
    isPublished: false,
    status: "draft",
    updatedAt: "2026-10-01T10:00:00.000Z",
  };

  const pages = [home, calendarPage, draftPage];
  const context = buildLinkContext(pages, home.id);

  assert(
    parseCmsLink("page:page-kalender")?.kind === "page",
    "page:-referanse parses som side"
  );

  assert(
    parseCmsLink("section:page-forside:hva-skjer")?.kind === "section",
    "section:-referanse parses som seksjon"
  );

  assert(
    parseCmsLink("system:taler")?.kind === "system",
    "system:-referanse parses som fast side"
  );

  assert(
    formatCmsLink({ kind: "section", pageId: "page-forside", anchor: "hva-skjer" }) ===
      "section:page-forside:hva-skjer",
    "section formateres stabilt"
  );

  const blocks = ensureSectionAnchors(resolveVisualBlocks(home, { home: true }));
  assert(
    blocks.some((block) => block.type === "module-calendar"),
    "Forside har Hva skjer-modul"
  );

  const sectionLink = formatCmsLink({
    kind: "section",
    pageId: home.id,
    anchor: "hva-skjer",
  });

  assert(
    resolveCmsLink(sectionLink, context) === "/#hva-skjer",
    "Seksjon på forsiden løses til anker på forsiden"
  );

  assert(
    resolveCmsLink(formatCmsLink({ kind: "page", pageId: calendarPage.id }), context) ===
      "/hva-skjer",
    "Side-referanse løses til pageUrl"
  );

  assert(
    resolveCmsLink("system:taler", context) === "/taler",
    "Systemlenke til Taler fungerer"
  );

  assert(
    resolveCmsLink("/om-oss", context) === null,
    "Ukjent legacy-sti gir null ved oppløsning"
  );

  assert(
    validateCmsLink(sectionLink, context).status === "ok",
    "Gyldig seksjonslenke valideres som ok"
  );

  assert(
    validateCmsLink("page:page-draft", context).status === "unpublished",
    "Upublisert side varsles"
  );

  assert(
    validateCmsLink("section:page-forside:finnes-ikke", context).status === "missing",
    "Manglende seksjon varsles"
  );

  assert(
    describeCmsLink(sectionLink, context).includes("Hva skjer"),
    "Beskrivelse bruker modulnavn, ikke URL"
  );

  const choices = linkChoices(context);
  assert(
    choices.some((choice) => choice.group === "På denne siden" && choice.label === "Hva skjer"),
    "Lenkevelgeren lister seksjon på gjeldende side"
  );

  assert(
    choices.some((choice) => choice.group === "Andre sider" && choice.label === "Kalender"),
    "Lenkevelgeren lister seksjoner på andre publiserte sider"
  );

  assert(
    defaultHomePrimaryLink(pages).startsWith("section:"),
    "Standard primærknapp peker på Hva skjer-seksjonen"
  );

  const brokenHome = {
    ...home,
    heroCtaLink: "section:page-forside:finnes-ikke",
  };
  assert(
    findBrokenLinksOnPage(brokenHome, buildLinkContext([brokenHome, calendarPage], home.id))
      .length === 1,
    "Ødelagte lenker på siden oppdages"
  );
});
