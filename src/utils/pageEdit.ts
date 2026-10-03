import type { CmsPage } from "../data/cmsData";

type PageDraft = Partial<CmsPage>;

/** An ISO time as the value of a `datetime-local` field, in the browser's time zone. Empty when missing or invalid. */
export function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type PublishPreset = "tomorrow" | "sunday" | "monday";

/** The time a quick-pick button sets: tomorrow 09:00, the coming Sunday 08:00, or the next Monday 09:00. */
export function presetPublishTime(preset: PublishPreset, now: Date = new Date()): string {
  const d = new Date(now);
  if (preset === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (preset === "sunday") {
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    d.setHours(8, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

/** Where the page stands: live now, held back until a time, or a draft. */
export function publishState(page: PageDraft, now: number = Date.now()) {
  const publishTime = page.publishAt ? new Date(page.publishAt).getTime() : 0;
  const isFutureScheduled = page.isPublished !== false && Boolean(publishTime && publishTime > now);
  return {
    isFutureScheduled,
    isManuallyPublished: page.isPublished !== false && !isFutureScheduled,
    isDraft: page.isPublished === false,
  };
}

/** The page with its publish time removed, so it goes live when saved. */
export function withoutPublishTime(page: PageDraft): PageDraft {
  return { ...page, publishAt: undefined, publishedAt: undefined };
}

/**
 * The page with a new publish time from a `datetime-local` value or an ISO time. An empty value
 * clears the time. Setting a time turns publishing on; a time ahead of now makes the page "scheduled".
 */
export function withPublishTime(page: PageDraft, value: string, now: number = Date.now()): PageDraft {
  if (!value) return withoutPublishTime(page);
  const d = new Date(value);
  if (isNaN(d.getTime())) return page;
  const iso = d.toISOString();
  return {
    ...page,
    publishAt: iso,
    publishedAt: iso,
    isPublished: true,
    status: d.getTime() > now ? "scheduled" : "published",
  };
}

/** The id of the page's parent, whichever of the two parent fields is set. Null for a top-level page. */
export function parentIdOf(page: PageDraft): string | null {
  return page.parentPageId !== undefined ? page.parentPageId : page.parentId || null;
}

/** The page under a new parent (empty id for none). The two parent fields are kept equal. */
export function withParent(page: PageDraft, parentId: string): PageDraft {
  const parent = parentId || null;
  return { ...page, parentPageId: parent, parentId: parent };
}

/** The page's place in the menu, whichever of the two order fields is set. 1 when neither is. */
export function menuOrderOf(page: PageDraft): number {
  if (typeof page.menuOrder === "number") return page.menuOrder;
  if (typeof page.navOrder === "number") return page.navOrder;
  return 1;
}

/** The page at a new place in the menu. The two order fields are kept equal. */
export function withMenuOrder(page: PageDraft, order: number): PageDraft {
  return { ...page, menuOrder: order, navOrder: order };
}

/** The content with a block added at the end, set apart from the text before it by a blank line. */
export function appendBlock(content: string | undefined, block: string): string {
  const current = content || "";
  const separator = current && !current.endsWith("\n\n") ? (current.endsWith("\n") ? "\n" : "\n\n") : "";
  return current + separator + block;
}
