import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../firebase-service";
import { CMS_COLLECTIONS, CMS_OVERRIDES_COLLECTION, CMS_SETTINGS_DOC_ID } from "../data/collections";
import { reportWriteError } from "../services/writeErrors";
import {
  CmsPage,
  CmsNewsArticle,
  CmsSermon,
  CmsStaffMember,
  CmsSettings,
  CmsEventOverride,
  initialCmsPages,
  initialCmsNews,
  initialCmsSermons,
  initialCmsStaff,
  initialCmsSettings,
} from "../data/cmsData";

interface CmsContextValue {
  pages: CmsPage[];
  news: CmsNewsArticle[];
  sermons: CmsSermon[];
  staff: CmsStaffMember[];
  settings: CmsSettings;
  overrides: Record<string, CmsEventOverride>;
  isFirestoreSyncing: boolean;
  // Every write resolves to whether it reached Firestore. A failure is already shown to the user.
  savePage: (page: Partial<CmsPage> & { id?: string }) => Promise<boolean>;
  deletePage: (pageId: string) => Promise<boolean>;
  saveNews: (newsData: Partial<CmsNewsArticle> & { id?: string }) => Promise<boolean>;
  deleteNews: (newsId: string) => Promise<boolean>;
  saveSermon: (sermonData: Partial<CmsSermon> & { id?: string }) => Promise<boolean>;
  deleteSermon: (sermonId: string) => Promise<boolean>;
  saveStaff: (staffData: Partial<CmsStaffMember> & { id?: string }) => Promise<boolean>;
  deleteStaff: (staffId: string) => Promise<boolean>;
  saveSettings: (settingsData: Partial<CmsSettings>) => Promise<boolean>;
  toggleFeatureGathering: (gatheringId: string) => Promise<boolean>;
  toggleHideGathering: (gatheringId: string) => Promise<boolean>;
  resetCmsToDefaults: () => Promise<boolean>;
  getPageBySlug: (slug: string) => CmsPage | undefined;
  getNewsById: (id: string) => CmsNewsArticle | undefined;
  getNewsBySlug: (slug: string) => CmsNewsArticle | undefined;
  getSermonById: (id: string) => CmsSermon | undefined;
}

const CmsContext = createContext<CmsContextValue | null>(null);

const STORAGE_KEY_PAGES = "menighetsplan_cms_pages_v3";
const STORAGE_KEY_NEWS = "menighetsplan_cms_news_v3";
const STORAGE_KEY_SERMONS = "menighetsplan_cms_sermons_v3";
const STORAGE_KEY_STAFF = "menighetsplan_cms_staff_v3";
const STORAGE_KEY_SETTINGS = "menighetsplan_cms_settings_v3";
const STORAGE_KEY_OVERRIDES = "menighetsplan_cms_overrides_v3";

async function attempt(action: string, write: () => Promise<unknown>): Promise<boolean> {
  try {
    await write();
    return true;
  } catch (err) {
    reportWriteError(action, err);
    return false;
  }
}

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The lists start from the local cache of the last Firestore snapshot, never from mock data
  const [pages, setPages] = useState<CmsPage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAGES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [news, setNews] = useState<CmsNewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NEWS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [sermons, setSermons] = useState<CmsSermon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERMONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [staff, setStaff] = useState<CmsStaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [settings, setSettings] = useState<CmsSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialCmsSettings;
  });

  const [overrides, setOverrides] = useState<Record<string, CmsEventOverride>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState(false);

  // Firestore real-time subscriptions
  useEffect(() => {
    let unsubPages: (() => void) | undefined;
    let unsubNews: (() => void) | undefined;
    let unsubSermons: (() => void) | undefined;
    let unsubStaff: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubOverrides: (() => void) | undefined;

    // A listener that fails stops for good, so say which one it was
    const onError = (name: string) => (err: Error) => console.warn(`Firestore sync error (${name}):`, err);

    const setupFirestore = async () => {
      try {
        setIsFirestoreSyncing(true);

        // 1. Pages
        unsubPages = onSnapshot(collection(db, CMS_COLLECTIONS.PAGES), (snapshot) => {
          const list: CmsPage[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsPage));
          setPages(list);
          localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(list));
        }, onError(CMS_COLLECTIONS.PAGES));

        // 2. News
        unsubNews = onSnapshot(collection(db, CMS_COLLECTIONS.NEWS), (snapshot) => {
          const list: CmsNewsArticle[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsNewsArticle));
          list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setNews(list);
          localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(list));
        }, onError(CMS_COLLECTIONS.NEWS));

        // 3. Sermons (Taler)
        unsubSermons = onSnapshot(collection(db, CMS_COLLECTIONS.SERMONS), (snapshot) => {
          const list: CmsSermon[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsSermon));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSermons(list);
          localStorage.setItem(STORAGE_KEY_SERMONS, JSON.stringify(list));
        }, onError(CMS_COLLECTIONS.SERMONS));

        // 4. Staff (Lederskap & Stab)
        unsubStaff = onSnapshot(collection(db, CMS_COLLECTIONS.STAFF), (snapshot) => {
          const list: CmsStaffMember[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsStaffMember));
          setStaff(list);
          localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(list));
        }, onError(CMS_COLLECTIONS.STAFF));

        // 5. Settings (the built-in defaults apply while no settings document exists)
        const settingsDocRef = doc(db, CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID);
        unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as CmsSettings;
            setSettings(data);
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
          } else {
            setSettings(initialCmsSettings);
            localStorage.removeItem(STORAGE_KEY_SETTINGS);
          }
        }, onError(CMS_COLLECTIONS.SETTINGS));

        // 6. Overrides
        unsubOverrides = onSnapshot(collection(db, CMS_OVERRIDES_COLLECTION), (snapshot) => {
          const map: Record<string, CmsEventOverride> = {};
          snapshot.forEach((docSnap) => {
            map[docSnap.id] = docSnap.data() as CmsEventOverride;
          });
          setOverrides(map);
          localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(map));
        }, onError(CMS_OVERRIDES_COLLECTION));
      } catch (err) {
        console.warn("Firestore sync error:", err);
      } finally {
        setIsFirestoreSyncing(false);
      }
    };

    setupFirestore();

    return () => {
      if (unsubPages) unsubPages();
      if (unsubNews) unsubNews();
      if (unsubSermons) unsubSermons();
      if (unsubStaff) unsubStaff();
      if (unsubSettings) unsubSettings();
      if (unsubOverrides) unsubOverrides();
    };
  }, []);

  // CRUD Pages
  const savePage = async (pageData: Partial<CmsPage> & { id?: string }) => {
    const now = new Date().toISOString();
    const id = pageData.id || `page-${Date.now()}`;
    const pageToSave: CmsPage = {
      id,
      slug: (pageData.slug || `side-${Date.now()}`).toLowerCase().trim().replace(/^\//, ""),
      title: pageData.title || "Uten tittel",
      summary: pageData.summary || "",
      content: pageData.content || "",
      isPublished: pageData.isPublished !== false,
      status: pageData.isPublished !== false ? "published" : "draft",
      navOrder: typeof pageData.navOrder === "number" ? pageData.navOrder : 99,
      inNavMenu: pageData.inNavMenu !== false,
      parentId: pageData.parentId || null,
      linkUrl: pageData.linkUrl || undefined,
      updatedAt: now,
      heroImage: pageData.heroImage || "",
      heroCtaText: pageData.heroCtaText || "",
      heroCtaLink: pageData.heroCtaLink || "",
    };

    setPages((prev) => {
      const exists = prev.some((p) => p.id === id);
      const next = exists ? prev.map((p) => (p.id === id ? pageToSave : p)) : [...prev, pageToSave];
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(next));
      return next;
    });

    // Firestore rejects `undefined`, and `linkUrl` is undefined on every page without an external link
    return attempt("lagre siden", () =>
      setDoc(doc(db, CMS_COLLECTIONS.PAGES, id), sanitizeForFirestore(pageToSave))
    );
  };

  const deletePage = async (pageId: string) => {
    setPages((prev) => {
      // Re-parent any direct children so they become top-level if parent is deleted
      const next = prev
        .filter((p) => p.id !== pageId)
        .map((p) => (p.parentId === pageId ? { ...p, parentId: null } : p));
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(next));
      return next;
    });
    return attempt("slette siden", () => deleteDoc(doc(db, CMS_COLLECTIONS.PAGES, pageId)));
  };

  // CRUD News
  const saveNews = async (newsData: Partial<CmsNewsArticle> & { id?: string }) => {
    const now = new Date().toISOString();
    const id = newsData.id || `news-${Date.now()}`;
    const articleToSave: CmsNewsArticle = {
      id,
      title: newsData.title || "Nyhetsartikkel",
      slug: (newsData.slug || `nyhet-${Date.now()}`).toLowerCase().trim(),
      summary: newsData.summary || "",
      content: newsData.content || "",
      category: newsData.category || "aktuelt",
      author: newsData.author || "Menigheten",
      publishedAt: newsData.publishedAt || now,
      isPublished: newsData.isPublished !== false,
      imageUrl: newsData.imageUrl || "",
    };

    setNews((prev) => {
      const exists = prev.some((n) => n.id === id);
      const next = exists ? prev.map((n) => (n.id === id ? articleToSave : n)) : [articleToSave, ...prev];
      localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(next));
      return next;
    });

    return attempt("lagre nyhetsartikkelen", () =>
      setDoc(doc(db, CMS_COLLECTIONS.NEWS, id), sanitizeForFirestore(articleToSave))
    );
  };

  const deleteNews = async (newsId: string) => {
    setNews((prev) => {
      const next = prev.filter((n) => n.id !== newsId);
      localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(next));
      return next;
    });
    return attempt("slette nyhetsartikkelen", () => deleteDoc(doc(db, CMS_COLLECTIONS.NEWS, newsId)));
  };

  // CRUD Sermons
  const saveSermon = async (sermonData: Partial<CmsSermon> & { id?: string }) => {
    const id = sermonData.id || `sermon-${Date.now()}`;
    const sermonToSave: CmsSermon = {
      id,
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

    setSermons((prev) => {
      const exists = prev.some((s) => s.id === id);
      const next = exists ? prev.map((s) => (s.id === id ? sermonToSave : s)) : [sermonToSave, ...prev];
      localStorage.setItem(STORAGE_KEY_SERMONS, JSON.stringify(next));
      return next;
    });

    return attempt("lagre talen", () =>
      setDoc(doc(db, CMS_COLLECTIONS.SERMONS, id), sanitizeForFirestore(sermonToSave))
    );
  };

  const deleteSermon = async (sermonId: string) => {
    setSermons((prev) => {
      const next = prev.filter((s) => s.id !== sermonId);
      localStorage.setItem(STORAGE_KEY_SERMONS, JSON.stringify(next));
      return next;
    });
    return attempt("slette talen", () => deleteDoc(doc(db, CMS_COLLECTIONS.SERMONS, sermonId)));
  };

  // CRUD Staff
  const saveStaff = async (staffData: Partial<CmsStaffMember> & { id?: string }) => {
    const id = staffData.id || `staff-${Date.now()}`;
    const staffToSave: CmsStaffMember = {
      id,
      name: staffData.name || "Navn",
      role: staffData.role || "Medarbeider",
      email: staffData.email || "",
      phone: staffData.phone || "",
      category: staffData.category || "stab",
      bio: staffData.bio || "",
      imageUrl: staffData.imageUrl || "",
    };

    setStaff((prev) => {
      const exists = prev.some((st) => st.id === id);
      const next = exists ? prev.map((st) => (st.id === id ? staffToSave : st)) : [...prev, staffToSave];
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(next));
      return next;
    });

    return attempt("lagre medarbeideren", () =>
      setDoc(doc(db, CMS_COLLECTIONS.STAFF, id), sanitizeForFirestore(staffToSave))
    );
  };

  const deleteStaff = async (staffId: string) => {
    setStaff((prev) => {
      const next = prev.filter((st) => st.id !== staffId);
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(next));
      return next;
    });
    return attempt("slette medarbeideren", () => deleteDoc(doc(db, CMS_COLLECTIONS.STAFF, staffId)));
  };

  // CRUD Settings
  const saveSettings = async (settingsData: Partial<CmsSettings>) => {
    const updated: CmsSettings = { ...settings, ...settingsData };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    return attempt("lagre innstillingene", () =>
      setDoc(doc(db, CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID), sanitizeForFirestore(updated))
    );
  };

  // Overrides
  const toggleFeatureGathering = async (gatheringId: string) => {
    const current = overrides[gatheringId] || {
      gatheringId,
      featured: false,
      hidden: false,
      updatedAt: new Date().toISOString(),
    };
    const nextOverride: CmsEventOverride = {
      ...current,
      featured: !current.featured,
      hidden: current.featured ? current.hidden : false,
      updatedAt: new Date().toISOString(),
    };
    setOverrides((prev) => ({ ...prev, [gatheringId]: nextOverride }));
    return attempt("lagre fremhevingen", () =>
      setDoc(doc(db, CMS_OVERRIDES_COLLECTION, gatheringId), sanitizeForFirestore(nextOverride))
    );
  };

  const toggleHideGathering = async (gatheringId: string) => {
    const current = overrides[gatheringId] || {
      gatheringId,
      featured: false,
      hidden: false,
      updatedAt: new Date().toISOString(),
    };
    const nextOverride: CmsEventOverride = {
      ...current,
      hidden: !current.hidden,
      featured: current.hidden ? current.featured : false,
      updatedAt: new Date().toISOString(),
    };
    setOverrides((prev) => ({ ...prev, [gatheringId]: nextOverride }));
    return attempt("lagre skjulingen", () =>
      setDoc(doc(db, CMS_OVERRIDES_COLLECTION, gatheringId), sanitizeForFirestore(nextOverride))
    );
  };

  const resetCmsToDefaults = async () => {
    setPages(initialCmsPages);
    setNews(initialCmsNews);
    setSermons(initialCmsSermons);
    setStaff(initialCmsStaff);
    setSettings(initialCmsSettings);
    setOverrides({});
    return attempt("tilbakestille CMS-innholdet", async () => {
      for (const p of initialCmsPages) await setDoc(doc(db, CMS_COLLECTIONS.PAGES, p.id), sanitizeForFirestore(p));
      for (const n of initialCmsNews) await setDoc(doc(db, CMS_COLLECTIONS.NEWS, n.id), sanitizeForFirestore(n));
      for (const s of initialCmsSermons) await setDoc(doc(db, CMS_COLLECTIONS.SERMONS, s.id), sanitizeForFirestore(s));
      for (const st of initialCmsStaff) await setDoc(doc(db, CMS_COLLECTIONS.STAFF, st.id), sanitizeForFirestore(st));
      await setDoc(doc(db, CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID), sanitizeForFirestore(initialCmsSettings));
    });
  };

  const getPageBySlug = (slug: string) => {
    const clean = slug.toLowerCase().replace(/^\//, "").trim();
    return pages.find((p) => p.slug.toLowerCase().replace(/^\//, "").trim() === clean);
  };

  const getNewsById = (id: string) => news.find((n) => n.id === id);
  const getNewsBySlug = (slug: string) => news.find((n) => n.slug.toLowerCase() === slug.toLowerCase());
  const getSermonById = (id: string) => sermons.find((s) => s.id === id);

  return (
    <CmsContext.Provider
      value={{
        pages,
        news,
        sermons,
        staff,
        settings,
        overrides,
        isFirestoreSyncing,
        savePage,
        deletePage,
        saveNews,
        deleteNews,
        saveSermon,
        deleteSermon,
        saveStaff,
        deleteStaff,
        saveSettings,
        toggleFeatureGathering,
        toggleHideGathering,
        resetCmsToDefaults,
        getPageBySlug,
        getNewsById,
        getNewsBySlug,
        getSermonById,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error("useCms must be used within a CmsProvider");
  return context;
};
