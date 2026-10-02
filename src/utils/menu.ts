import type { CmsPage } from "../data/cmsData";

/** A top-level page with its sub-pages. The menu has exactly these two levels. */
export interface PageNode {
  page: CmsPage;
  children: CmsPage[];
}

const byNavOrder = (a: CmsPage, b: CmsPage) => (a.navOrder ?? 99) - (b.navOrder ?? 99);

/** Every top-level page in menu order, each with its sub-pages in menu order. */
export function buildPageTree(pages: CmsPage[]): PageNode[] {
  return pages
    .filter((p) => !p.parentId)
    .sort(byNavOrder)
    .map((page) => ({
      page,
      children: pages.filter((p) => p.parentId === page.id).sort(byNavOrder),
    }));
}

/** The tree visitors see: published pages that are marked for the menu. */
export function buildPublicMenu(pages: CmsPage[]): PageNode[] {
  return buildPageTree(pages.filter((p) => p.isPublished !== false && p.inNavMenu !== false));
}

/** Sub-pages that no menu reaches, because their parent is gone or is itself a sub-page. */
export function findOrphanPages(pages: CmsPage[]): CmsPage[] {
  const topLevelIds = new Set(pages.filter((p) => !p.parentId).map((p) => p.id));
  return pages.filter((p) => p.parentId && !topLevelIds.has(p.parentId));
}

/**
 * The pages left when one is deleted. Its sub-pages move to the top level,
 * since a sub-page pointing at a deleted page drops out of every menu.
 */
export function withoutPage(pages: CmsPage[], pageId: string): CmsPage[] {
  return pages
    .filter((p) => p.id !== pageId)
    .map((p) => (p.parentId === pageId ? { ...p, parentId: null } : p));
}

/** Where a page lives on the site. `linkUrl` points it at a built-in route instead of its own article. */
export function pageUrl(page: Pick<CmsPage, "slug" | "linkUrl">): string {
  return page.linkUrl || (page.slug ? `/${page.slug}` : "/");
}
