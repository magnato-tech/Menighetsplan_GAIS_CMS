import type { CmsPage } from "../data/cmsData";
import {
  DYNAMIC_MODULES_META,
  resolveVisualBlocks,
  type VisualBlock,
} from "./cmsBlocks";
import { isPagePublished, pageUrl } from "./menu";
import { applyModulePresentation, readModulePresentation } from "./modulePresentation";

export type CmsLinkKind = "page" | "section" | "system" | "external" | "legacy";

export interface CmsLinkTarget {
  kind: CmsLinkKind;
  pageId?: string;
  anchor?: string;
  systemKey?: string;
  url?: string;
  legacyPath?: string;
}

export type CmsLinkValidationStatus = "ok" | "missing" | "unpublished" | "hidden";

export interface CmsLinkValidation {
  status: CmsLinkValidationStatus;
  message?: string;
  label: string;
}

export interface CmsLinkChoice {
  value: string;
  label: string;
  group: string;
}

export interface CmsLinkContext {
  pages: CmsPage[];
  currentPageId?: string;
  blocksByPageId?: Record<string, VisualBlock[]>;
  now?: Date;
}

export const SYSTEM_LINKS = [
  { key: "forside", label: "Forside", path: "/" },
  { key: "taler", label: "Taler", path: "/taler" },
  { key: "fellesskap", label: "Fellesskap", path: "/fellesskap" },
] as const;

const SYSTEM_PATHS: Record<string, string> = {
  forside: "/",
  taler: "/taler",
  fellesskap: "/fellesskap",
  grupper: "/fellesskap",
  lederskap: "/lederskap",
  stab: "/stab",
};

const DEFAULT_MODULE_ANCHORS: Record<string, string> = {
  "module-calendar": "hva-skjer",
  "module-kalender": "kalender",
  "module-news": "nyheter",
  "module-worship": "gudstjeneste",
  "module-sermon": "taler",
  "module-groups": "fellesskap",
  "module-giving": "gave",
  "person-grid": "personer",
};

const ANCHOR_COMMENT_RE = /^<!--\s*cms-anchor:([a-z0-9-]+)\s*-->\s*/i;

/** Magic page id for the site's home page in section references. */
export const CMS_LINK_HOME_PAGE = "@home";

export const DEFAULT_HOME_CALENDAR_SECTION_LINK = `section:${CMS_LINK_HOME_PAGE}:hva-skjer`;

export function findHomePage(pages: CmsPage[]): CmsPage | undefined {
  return pages.find((p) => p.slug === "forside" || p.slug === "" || p.linkUrl === "/");
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "seksjon"
  );
}

function resolvePageId(pageId: string | undefined, pages: CmsPage[]): string | undefined {
  if (!pageId) return undefined;
  if (pageId === CMS_LINK_HOME_PAGE) return findHomePage(pages)?.id;
  return pageId;
}

function pageById(pages: CmsPage[], pageId: string | undefined): CmsPage | undefined {
  const resolved = resolvePageId(pageId, pages);
  if (!resolved) return undefined;
  return pages.find((p) => p.id === resolved);
}

function pageLabel(page: CmsPage): string {
  if (page.slug === "" || page.slug === "forside" || page.linkUrl === "/") return "Forside";
  return page.title?.trim() || page.slug || "Side";
}

function sectionLabel(block: VisualBlock): string {
  if (block.type.startsWith("module-")) {
    const meta = DYNAMIC_MODULES_META[block.type as keyof typeof DYNAMIC_MODULES_META];
    if (meta?.title) return meta.title;
  }
  return block.title?.trim() || "Seksjon";
}

export function readSectionAnchor(block: VisualBlock): string | undefined {
  if (block.type.startsWith("module-")) {
    const anchor = readModulePresentation(block).anchor?.trim();
    return anchor || undefined;
  }
  const raw = block.rawContent || "";
  const match = raw.match(ANCHOR_COMMENT_RE);
  return match?.[1] || undefined;
}

export function stripSectionAnchorComment(content: string): string {
  return content.replace(ANCHOR_COMMENT_RE, "");
}

function writeSectionAnchor(block: VisualBlock, anchor: string): VisualBlock {
  if (block.type.startsWith("module-")) {
    return applyModulePresentation(block, { ...readModulePresentation(block), anchor });
  }
  const raw = block.rawContent || "";
  const body = raw.replace(ANCHOR_COMMENT_RE, "");
  return { ...block, rawContent: `<!-- cms-anchor:${anchor} -->\n${body}`.trim() };
}

function defaultAnchorForBlock(block: VisualBlock): string {
  const preset = DEFAULT_MODULE_ANCHORS[block.type];
  if (preset) return preset;
  return slugify(block.title || block.type);
}

function uniqueAnchor(base: string, used: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

/** Assigns stable anchors to visible blocks that lack one. */
export function ensureSectionAnchors(blocks: VisualBlock[]): VisualBlock[] {
  const used = new Set<string>();
  return blocks.map((block) => {
    if (block.hidden) return block;
    const existing = readSectionAnchor(block);
    if (existing) {
      used.add(existing);
      return block;
    }
    const anchor = uniqueAnchor(defaultAnchorForBlock(block), used);
    return writeSectionAnchor(block, anchor);
  });
}

export function blocksForPage(page: CmsPage, pages: CmsPage[]): VisualBlock[] {
  const home = findHomePage(pages)?.id === page.id;
  return ensureSectionAnchors(resolveVisualBlocks(page, { home }));
}

export function buildLinkContext(pages: CmsPage[], currentPageId?: string): CmsLinkContext {
  const blocksByPageId: Record<string, VisualBlock[]> = {};
  for (const page of pages) {
    blocksByPageId[page.id] = blocksForPage(page, pages);
  }
  return { pages, currentPageId, blocksByPageId };
}

function findBlockByAnchor(blocks: VisualBlock[], anchor: string): VisualBlock | undefined {
  return blocks.find((block) => !block.hidden && readSectionAnchor(block) === anchor);
}

export function formatCmsLink(target: CmsLinkTarget): string {
  switch (target.kind) {
    case "page":
      return `page:${target.pageId}`;
    case "section":
      return `section:${target.pageId}:${target.anchor}`;
    case "system":
      return `system:${target.systemKey}`;
    case "external":
      return target.url || "";
    case "legacy":
      return target.legacyPath || "";
    default:
      return "";
  }
}

function legacyPathToSystemKey(path: string): string | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  if (normalized === "/") return "forside";
  const entry = Object.entries(SYSTEM_PATHS).find(([, route]) => route === normalized);
  return entry?.[0];
}

function findPageByPublicPath(pages: CmsPage[], path: string): CmsPage | undefined {
  const normalized = path.split("#")[0].replace(/\/$/, "") || "/";
  const withSlash = normalized === "/" ? "/" : normalized.startsWith("/") ? normalized : `/${normalized}`;
  return pages.find((page) => pageUrl(page) === withSlash || `/${page.slug}` === withSlash);
}

export function parseCmsLink(raw: string | undefined | null): CmsLinkTarget | null {
  const value = raw?.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return { kind: "external", url: value };
  }
  if (value.startsWith("page:")) {
    return { kind: "page", pageId: value.slice(5) };
  }
  if (value.startsWith("section:")) {
    const rest = value.slice(8);
    const splitAt = rest.indexOf(":");
    if (splitAt === -1) return null;
    return {
      kind: "section",
      pageId: rest.slice(0, splitAt),
      anchor: rest.slice(splitAt + 1),
    };
  }
  if (value.startsWith("system:")) {
    return { kind: "system", systemKey: value.slice(7) };
  }
  if (value.startsWith("/")) {
    const systemKey = legacyPathToSystemKey(value.split("#")[0]);
    if (systemKey && !value.includes("#")) {
      return { kind: "system", systemKey };
    }
    return { kind: "legacy", legacyPath: value };
  }
  return { kind: "legacy", legacyPath: value };
}

function blocksInContext(context: CmsLinkContext, pageId: string): VisualBlock[] {
  if (context.blocksByPageId?.[pageId]) return context.blocksByPageId[pageId];
  const page = pageById(context.pages, pageId);
  if (!page) return [];
  return blocksForPage(page, context.pages);
}

export function describeCmsLink(
  raw: string | undefined | null,
  context: CmsLinkContext
): string {
  const target = parseCmsLink(raw);
  if (!target) return "Ingen lenke valgt";

  if (target.kind === "external") return target.url || "Ekstern lenke";
  if (target.kind === "system") {
    const entry = SYSTEM_LINKS.find((item) => item.key === target.systemKey);
    return entry?.label || "Fast side";
  }
  if (target.kind === "page") {
    const page = pageById(context.pages, target.pageId);
    return page ? pageLabel(page) : "Side";
  }
  if (target.kind === "section") {
    const page = pageById(context.pages, target.pageId);
    const resolvedId = resolvePageId(target.pageId, context.pages);
    const blocks = resolvedId ? blocksInContext(context, resolvedId) : [];
    const block = target.anchor ? findBlockByAnchor(blocks, target.anchor) : undefined;
    const section = block ? sectionLabel(block) : "Seksjon";
    return page ? `${section} på ${pageLabel(page)}` : section;
  }
  if (target.kind === "legacy") {
    const path = target.legacyPath || "";
    const page = findPageByPublicPath(context.pages, path.split("#")[0]);
    if (page) return pageLabel(page);
    const systemKey = legacyPathToSystemKey(path.split("#")[0]);
    if (systemKey) {
      return SYSTEM_LINKS.find((item) => item.key === systemKey)?.label || path;
    }
    return path;
  }
  return "Lenke";
}

export function resolveCmsLink(
  raw: string | undefined | null,
  context: CmsLinkContext,
  options?: { allowUnpublished?: boolean }
): string | null {
  const validation = validateCmsLink(raw, context, options);
  if (validation.status !== "ok") return null;

  const target = parseCmsLink(raw);
  if (!target) return null;

  if (target.kind === "external") return target.url || null;

  if (target.kind === "system") {
    const path = target.systemKey ? SYSTEM_PATHS[target.systemKey] : undefined;
    return path ?? null;
  }

  if (target.kind === "page") {
    const page = pageById(context.pages, target.pageId);
    if (!page) return null;
    return pageUrl(page);
  }

  if (target.kind === "section") {
    const resolvedId = resolvePageId(target.pageId, context.pages);
    const page = pageById(context.pages, target.pageId);
    if (!page || !resolvedId || !target.anchor) return null;
    const base = pageUrl(page);
    const hash = `#${target.anchor}`;
    if (base === "/") return `/${hash}`;
    return `${base}${hash}`;
  }

  if (target.kind === "legacy") {
    const path = target.legacyPath || "";
    const [pathname, hash] = path.split("#");
    const page = findPageByPublicPath(context.pages, pathname);
    if (page) {
      const base = pageUrl(page);
      return hash ? `${base}#${hash}` : base;
    }
    const systemKey = legacyPathToSystemKey(pathname);
    if (systemKey) {
      const base = SYSTEM_PATHS[systemKey];
      return hash ? `${base}#${hash}` : base;
    }
    if (pathname.startsWith("/")) return path;
    return null;
  }

  return null;
}

export function validateCmsLink(
  raw: string | undefined | null,
  context: CmsLinkContext,
  options?: { allowUnpublished?: boolean }
): CmsLinkValidation {
  const label = describeCmsLink(raw, context);
  const target = parseCmsLink(raw);
  const now = context.now ?? new Date();
  const allowUnpublished = options?.allowUnpublished ?? false;

  if (!target) {
    return { status: "missing", label, message: "Ingen lenke er valgt." };
  }

  if (target.kind === "external") {
    if (!target.url || !/^https?:\/\//i.test(target.url)) {
      return { status: "missing", label, message: "Ugyldig nettadresse." };
    }
    return { status: "ok", label };
  }

  if (target.kind === "system") {
    if (target.systemKey && SYSTEM_PATHS[target.systemKey]) {
      return { status: "ok", label };
    }
    return { status: "missing", label, message: "Denne faste siden finnes ikke." };
  }

  if (target.kind === "page" || target.kind === "section") {
    const page = pageById(context.pages, target.pageId);
    if (!page) {
      return {
        status: "missing",
        label,
        message: "Denne lenken peker på noe som ikke finnes lenger.",
      };
    }
    if (!allowUnpublished && !isPagePublished(page, now)) {
      return {
        status: "unpublished",
        label,
        message: "Siden er ikke publisert ennå.",
      };
    }
    if (target.kind === "section") {
      const resolvedId = resolvePageId(target.pageId, context.pages);
      const blocks = resolvedId ? blocksInContext(context, resolvedId) : [];
      const block = target.anchor ? findBlockByAnchor(blocks, target.anchor) : undefined;
      if (!block) {
        return {
          status: "missing",
          label,
          message: "Denne lenken peker på noe som ikke finnes lenger.",
        };
      }
      if (block.hidden) {
        return {
          status: "hidden",
          label,
          message: "Seksjonen er skjult på siden.",
        };
      }
    }
    return { status: "ok", label };
  }

  if (target.kind === "legacy") {
    const path = target.legacyPath || "";
    const [pathname] = path.split("#");
    const page = findPageByPublicPath(context.pages, pathname);
    if (page) {
      if (!allowUnpublished && !isPagePublished(page, now)) {
        return {
          status: "unpublished",
          label,
          message: "Siden er ikke publisert ennå.",
        };
      }
      return { status: "ok", label };
    }
    if (legacyPathToSystemKey(pathname)) {
      return { status: "ok", label };
    }
    return {
      status: "missing",
      label,
      message: "Denne lenken peker på noe som ikke finnes lenger.",
    };
  }

  return { status: "missing", label, message: "Ugyldig lenke." };
}

function sectionChoicesForPage(
  page: CmsPage,
  context: CmsLinkContext,
  group: string
): CmsLinkChoice[] {
  const choices: CmsLinkChoice[] = [
    {
      value: formatCmsLink({ kind: "page", pageId: page.id }),
      label: `Hele ${pageLabel(page)}`,
      group,
    },
  ];
  const blocks = blocksInContext(context, page.id);
  for (const block of blocks) {
    if (block.hidden) continue;
    const anchor = readSectionAnchor(block);
    if (!anchor) continue;
    choices.push({
      value: formatCmsLink({ kind: "section", pageId: page.id, anchor }),
      label: sectionLabel(block),
      group,
    });
  }
  return choices;
}

export function linkChoices(context: CmsLinkContext): CmsLinkChoice[] {
  const now = context.now ?? new Date();
  const choices: CmsLinkChoice[] = [];
  const currentId = context.currentPageId;

  if (currentId) {
    const current = context.pages.find((p) => p.id === currentId);
    if (current) {
      choices.push(...sectionChoicesForPage(current, context, "På denne siden"));
    }
  }

  const otherPages = context.pages
    .filter((page) => page.id !== currentId && isPagePublished(page, now))
    .sort((a, b) => pageLabel(a).localeCompare(pageLabel(b), "nb"));

  for (const page of otherPages) {
    choices.push(...sectionChoicesForPage(page, context, "Andre sider"));
  }

  for (const system of SYSTEM_LINKS) {
    choices.push({
      value: formatCmsLink({ kind: "system", systemKey: system.key }),
      label: system.label,
      group: "Faste sider",
    });
  }

  return choices;
}

export function defaultHomePrimaryLink(pages: CmsPage[]): string {
  const home = findHomePage(pages);
  if (!home) return DEFAULT_HOME_CALENDAR_SECTION_LINK;
  const blocks = blocksForPage(home, pages);
  const hasCalendar = blocks.some(
    (block) => !block.hidden && block.type === "module-calendar" && readSectionAnchor(block)
  );
  if (hasCalendar) {
    const anchor = blocks.find((b) => b.type === "module-calendar")
      ? readSectionAnchor(blocks.find((b) => b.type === "module-calendar")!) || "hva-skjer"
      : "hva-skjer";
    return formatCmsLink({
      kind: "section",
      pageId: home.id,
      anchor,
    });
  }
  const calendarPage = pages.find(
    (p) => p.slug === "hva-skjer" && isPagePublished(p)
  );
  if (calendarPage) {
    return formatCmsLink({ kind: "page", pageId: calendarPage.id });
  }
  return DEFAULT_HOME_CALENDAR_SECTION_LINK;
}

export interface BrokenLinkRef {
  field: string;
  message: string;
}

export function findBrokenLinksOnPage(
  page: CmsPage,
  context: CmsLinkContext
): BrokenLinkRef[] {
  const broken: BrokenLinkRef[] = [];
  const check = (field: string, raw: string | undefined) => {
    const trimmed = raw?.trim();
    if (!trimmed) return;
    const validation = validateCmsLink(trimmed, context, { allowUnpublished: true });
    if (validation.status !== "ok") {
      broken.push({
        field,
        message: validation.message || "Lenken er ugyldig.",
      });
    }
  };

  check("heroCtaLink", page.heroCtaLink);
  check("heroCtaSecondaryLink", page.heroCtaSecondaryLink);
  check("linkUrl", page.linkUrl);

  const blocks = blocksInContext(context, page.id);
  for (const block of blocks) {
    if (block.type.startsWith("module-")) {
      const config = readModulePresentation(block);
      if (config.linkUrl?.trim()) {
        check(`${block.type}.linkUrl`, config.linkUrl);
      }
    }
    if (block.type === "cta") {
      const match =
        block.rawContent?.match(/\[(?:Knapp|Handling|CTA):.*?\]\((.*?)\)/i) ||
        block.rawContent?.match(/:::cta\[.*?\]\((.*?)\)/);
      if (match?.[1]?.trim()) {
        check("cta.url", match[1]);
      }
    }
  }

  return broken;
}

export function pageHasBrokenLinks(page: CmsPage, context: CmsLinkContext): boolean {
  return findBrokenLinksOnPage(page, context).length > 0;
}

/**
 * Resolves a link for visitors. In editor preview, falls back to the stored path so
 * buttons remain visible while the redaktør fixes broken targets.
 */
export function resolveCmsLinkForDisplay(
  raw: string | undefined | null,
  context: CmsLinkContext,
  options?: { fallback?: string; relaxValidation?: boolean }
): string | undefined {
  const trimmed = raw?.trim();
  const fallback = options?.fallback?.trim();
  const value = trimmed || fallback || "";
  if (!value) return undefined;

  const resolved = resolveCmsLink(value, context);
  if (resolved) return resolved;

  if (!options?.relaxValidation) return undefined;

  const target = parseCmsLink(value);
  if (target?.kind === "legacy") return target.legacyPath;
  if (target?.kind === "external") return target.url;
  if (target?.kind === "system" && target.systemKey) {
    return SYSTEM_PATHS[target.systemKey];
  }
  return value;
}
