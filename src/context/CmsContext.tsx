import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "../data/collections";
import {
  createDocument,
  setDocument,
  deleteDocument,
  deletePage as deletePageWithSubPages,
  reorderPages as reorderPagesInFirestore,
} from "../services/firestore";
import { reportWriteError } from "../services/writeErrors";
import { newId } from "../utils/id";
import {
  CmsPage,
  CmsNewsArticle,
  CmsSermon,
  CmsSettings,
  initialCmsSettings,
} from "../data/cmsData";

interface CmsContextValue {
  pages: CmsPage[];
  news: CmsNewsArticle[];
  sermons: CmsSermon[];
  settings: CmsSettings;
  // Every write resolves to whether it reached Firestore. A failure is already shown to the user.
  savePage: (page: Partial<CmsPage> & { id?: string }) => Promise<boolean>;
  deletePage: (pageId: string) => Promise<boolean>;
  reorderPages: (orderedPageIds: string[]) => Promise<boolean>;
  saveNews: (newsData: Partial<CmsNewsArticle> & { id?: string }) => Promise<boolean>;
  deleteNews: (newsId: string) => Promise<boolean>;
  saveSermon: (sermonData: Partial<CmsSermon> & { id?: string }) => Promise<boolean>;
  deleteSermon: (sermonId: string) => Promise<boolean>;
  saveSettings: (settingsData: Partial<CmsSettings>) => Promise<boolean>;
  getPageBySlug: (slug: string) => CmsPage | undefined;
  getNewsById: (id: string) => CmsNewsArticle | undefined;
  getNewsBySlug: (slug: string) => CmsNewsArticle | undefined;
}

const CmsContext = createContext<CmsContextValue | null>(null);

// The last content received is kept in the browser, so the public site has
// something to show before Firestore has answered.
const STORAGE_KEYS = {
  pages: "menighetsplan_cms_pages_v3",
  news: "menighetsplan_cms_news_v3",
  sermons: "menighetsplan_cms_sermons_v3",
  settings: "menighetsplan_cms_settings_v3",
};

function readCache<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    // Unreadable or blocked storage only means there is nothing to show yet
    return null;
  }
}

/** Keeps `value` for the next visit, or forgets the entry when `value` is null. */
function writeCache(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked storage costs the head start on the next visit, nothing else
  }
}

// A listener that fails stops for good, so say which one it was
const onListenerError = (name: string) => (error: Error) => console.warn(`Firestore sync error (${name}):`, error);

const newestFirst = (a: { publishedAt: string }, b: { publishedAt: string }) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
const latestDateFirst = (a: { date: string }, b: { date: string }) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

/**
 * A CMS collection as Firestore has it, starting from the copy kept in the browser.
 * A write shows up here through the listener; nothing else changes the list.
 */
function useCmsCollection<T>(name: string, storageKey: string, compare?: (a: T, b: T) => number): T[] {
  const [items, setItems] = useState<T[]>(() => readCache<T[]>(storageKey) ?? []);

  useEffect(() => {
    let isFirst = true;
    return onSnapshot(
      collection(db, name),
      (snapshot) => {
        // Opened without a connection, Firestore first reports an empty collection. Keep the copy we have.
        const emptyBecauseOffline = isFirst && snapshot.empty && snapshot.metadata.fromCache;
        isFirst = false;
        if (emptyBecauseOffline) return;

        const list = snapshot.docs.map((d) => d.data() as T);
        if (compare) list.sort(compare);
        setItems(list);
        writeCache(storageKey, list);
      },
      onListenerError(name)
    );
  }, [name, storageKey, compare]);

  return items;
}

/** The site settings. The built-in defaults apply for as long as no settings document exists. */
function useCmsSettings(): CmsSettings {
  const [settings, setSettings] = useState<CmsSettings>(
    () => readCache<CmsSettings>(STORAGE_KEYS.settings) ?? initialCmsSettings
  );

  useEffect(
    () =>
      onSnapshot(
        doc(db, CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as CmsSettings;
            setSettings(data);
            writeCache(STORAGE_KEYS.settings, data);
          } else if (!snapshot.metadata.fromCache) {
            // Only the server can say the document is gone; without a connection it is merely not fetched yet
            setSettings(initialCmsSettings);
            writeCache(STORAGE_KEYS.settings, null);
          }
        },
        onListenerError(CMS_COLLECTIONS.SETTINGS)
      ),
    []
  );

  return settings;
}

/** Waits for the server's answer, so an editor can stay open with what was typed if the save fails. */
async function attempt(action: string, write: () => Promise<unknown>): Promise<boolean> {
  try {
    await write();
    return true;
  } catch (err) {
    reportWriteError(action, err);
    return false;
  }
}

// Each write builds the complete document, so a field left out in the editor gets its default
const writes = {
  savePage: (pageData: Partial<CmsPage> & { id?: string }) => {
    const resolvedParent =
      pageData.parentPageId !== undefined
        ? pageData.parentPageId
        : pageData.parentId || null;

    const resolvedOrder =
      typeof pageData.menuOrder === "number"
        ? pageData.menuOrder
        : typeof pageData.navOrder === "number"
        ? pageData.navOrder
        : 99;

    const isPublished = pageData.isPublished !== false;
    const publishAt = pageData.publishAt?.trim() || pageData.publishedAt?.trim() || undefined;
    const isFutureScheduled = Boolean(
      isPublished && publishAt && new Date(publishAt).getTime() > Date.now()
    );

    const resolvedStatus: "draft" | "published" | "scheduled" = !isPublished
      ? "draft"
      : isFutureScheduled
      ? "scheduled"
      : "published";

    const page: CmsPage = {
      id: pageData.id || newId("page"),
      slug: (pageData.slug || `side-${Date.now()}`).toLowerCase().trim().replace(/^\//, ""),
      title: pageData.title || "Uten tittel",
      summary: pageData.summary || "",
      content: pageData.content || "",
      isPublished,
      status: resolvedStatus,
      parentPageId: resolvedParent,
      parentId: resolvedParent, // dual compatibility alias
      menuOrder: resolvedOrder,
      navOrder: resolvedOrder, // dual compatibility alias
      inNavMenu: pageData.inNavMenu !== false,
      // Left out of the stored document when the page has no link of its own
      linkUrl: pageData.linkUrl || undefined,
      updatedAt: new Date().toISOString(),
      heroImage: pageData.heroImage || "",
      heroCtaText: pageData.heroCtaText || "",
      heroCtaLink: pageData.heroCtaLink || "",
      metaDescription: pageData.metaDescription?.trim() || undefined,
      ogImage: pageData.ogImage?.trim() || undefined,
      publishAt,
      publishedAt: publishAt,
    };
    return attempt("lagre siden", () => createDocument(CMS_COLLECTIONS.PAGES, page));
  },

  saveNews: (newsData: Partial<CmsNewsArticle> & { id?: string }) => {
    const article: CmsNewsArticle = {
      id: newsData.id || newId("news"),
      title: newsData.title || "Nyhetsartikkel",
      slug: (newsData.slug || `nyhet-${Date.now()}`).toLowerCase().trim(),
      summary: newsData.summary || "",
      content: newsData.content || "",
      category: newsData.category || "aktuelt",
      author: newsData.author || "Menigheten",
      publishedAt: newsData.publishedAt || new Date().toISOString(),
      isPublished: newsData.isPublished !== false,
      imageUrl: newsData.imageUrl || "",
    };
    return attempt("lagre nyhetsartikkelen", () => createDocument(CMS_COLLECTIONS.NEWS, article));
  },
  deleteNews: (newsId: string) =>
    attempt("slette nyhetsartikkelen", () => deleteDocument(CMS_COLLECTIONS.NEWS, newsId)),

  saveSermon: (sermonData: Partial<CmsSermon> & { id?: string }) => {
    const sermon: CmsSermon = {
      id: sermonData.id || newId("sermon"),
      title: sermonData.title || "Tale",
      speaker: sermonData.speaker || "Pastor",
      date: sermonData.date || new Date().toISOString(),
      bibleText: sermonData.bibleText || "",
      series: sermonData.series || "",
      audioUrl: sermonData.audioUrl || "",
      spotifyUrl: sermonData.spotifyUrl || "",
      videoUrl: sermonData.videoUrl || "",
      summary: sermonData.summary || "",
    };
    return attempt("lagre talen", () => createDocument(CMS_COLLECTIONS.SERMONS, sermon));
  },
  deleteSermon: (sermonId: string) => attempt("slette talen", () => deleteDocument(CMS_COLLECTIONS.SERMONS, sermonId)),

};

const normalizeSlug = (slug: string) => slug.toLowerCase().replace(/^\//, "").trim();

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pages = useCmsCollection<CmsPage>(CMS_COLLECTIONS.PAGES, STORAGE_KEYS.pages);
  const news = useCmsCollection<CmsNewsArticle>(CMS_COLLECTIONS.NEWS, STORAGE_KEYS.news, newestFirst);
  const sermons = useCmsCollection<CmsSermon>(CMS_COLLECTIONS.SERMONS, STORAGE_KEYS.sermons, latestDateFirst);
  const settings = useCmsSettings();

  const value: CmsContextValue = useMemo(
    () => ({
      pages,
      news,
      sermons,
      settings,
      ...writes,
      deletePage: (pageId: string) => {
        const subPageIds = pages
          .filter((p) => (p.parentPageId !== undefined ? p.parentPageId === pageId : p.parentId === pageId))
          .map((p) => p.id);
        return attempt("slette siden", () => deletePageWithSubPages(pageId, subPageIds));
      },
      reorderPages: (orderedPageIds: string[]) =>
        attempt("endre rekkefølge på sidene", () => reorderPagesInFirestore(orderedPageIds)),
      saveSettings: (settingsData: Partial<CmsSettings>) =>
        attempt("lagre innstillingene", () =>
          setDocument(CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID, { ...settings, ...settingsData })
        ),
      getPageBySlug: (slug: string) => pages.find((p) => normalizeSlug(p.slug) === normalizeSlug(slug)),
      getNewsById: (id: string) => news.find((n) => n.id === id),
      getNewsBySlug: (slug: string) => news.find((n) => n.slug.toLowerCase() === slug.toLowerCase()),
    }),
    [pages, news, sermons, settings]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error("useCms must be used within a CmsProvider");
  return context;
};
