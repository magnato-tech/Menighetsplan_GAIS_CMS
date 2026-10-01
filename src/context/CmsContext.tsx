import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
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
  savePage: (page: Partial<CmsPage> & { id?: string }) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  saveNews: (newsData: Partial<CmsNewsArticle> & { id?: string }) => Promise<void>;
  deleteNews: (newsId: string) => Promise<void>;
  saveSermon: (sermonData: Partial<CmsSermon> & { id?: string }) => Promise<void>;
  deleteSermon: (sermonId: string) => Promise<void>;
  saveStaff: (staffData: Partial<CmsStaffMember> & { id?: string }) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  saveSettings: (settingsData: Partial<CmsSettings>) => Promise<void>;
  toggleFeatureGathering: (gatheringId: string) => Promise<void>;
  toggleHideGathering: (gatheringId: string) => Promise<void>;
  resetCmsToDefaults: () => Promise<void>;
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

    const setupFirestore = async () => {
      try {
        setIsFirestoreSyncing(true);

        // 1. Pages
        unsubPages = onSnapshot(collection(db, "cms_pages"), (snapshot) => {
          const list: CmsPage[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsPage));
          setPages(list);
          localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(list));
        });

        // 2. News
        unsubNews = onSnapshot(collection(db, "cms_news"), (snapshot) => {
          const list: CmsNewsArticle[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsNewsArticle));
          list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setNews(list);
          localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(list));
        });

        // 3. Sermons (Taler)
        unsubSermons = onSnapshot(collection(db, "cms_sermons"), (snapshot) => {
          const list: CmsSermon[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsSermon));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSermons(list);
          localStorage.setItem(STORAGE_KEY_SERMONS, JSON.stringify(list));
        });

        // 4. Staff (Lederskap & Stab)
        unsubStaff = onSnapshot(collection(db, "cms_staff"), (snapshot) => {
          const list: CmsStaffMember[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CmsStaffMember));
          setStaff(list);
          localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(list));
        });

        // 5. Settings (the built-in defaults apply while no settings document exists)
        const settingsDocRef = doc(db, "cms_settings", "global");
        unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as CmsSettings;
            setSettings(data);
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
          } else {
            setSettings(initialCmsSettings);
            localStorage.removeItem(STORAGE_KEY_SETTINGS);
          }
        });

        // 6. Overrides
        unsubOverrides = onSnapshot(collection(db, "cms_overrides"), (snapshot) => {
          const map: Record<string, CmsEventOverride> = {};
          snapshot.forEach((docSnap) => {
            map[docSnap.id] = docSnap.data() as CmsEventOverride;
          });
          setOverrides(map);
          localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(map));
        });
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

    try {
      await setDoc(doc(db, "cms_pages", id), pageToSave);
    } catch (err) {}
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
    try {
      await deleteDoc(doc(db, "cms_pages", pageId));
    } catch (err) {}
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

    try {
      await setDoc(doc(db, "cms_news", id), articleToSave);
    } catch (err) {}
  };

  const deleteNews = async (newsId: string) => {
    setNews((prev) => {
      const next = prev.filter((n) => n.id !== newsId);
      localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(next));
      return next;
    });
    try {
      await deleteDoc(doc(db, "cms_news", newsId));
    } catch (err) {}
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

    try {
      await setDoc(doc(db, "cms_sermons", id), sermonToSave);
    } catch (err) {}
  };

  const deleteSermon = async (sermonId: string) => {
    setSermons((prev) => {
      const next = prev.filter((s) => s.id !== sermonId);
      localStorage.setItem(STORAGE_KEY_SERMONS, JSON.stringify(next));
      return next;
    });
    try {
      await deleteDoc(doc(db, "cms_sermons", sermonId));
    } catch (err) {}
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

    try {
      await setDoc(doc(db, "cms_staff", id), staffToSave);
    } catch (err) {}
  };

  const deleteStaff = async (staffId: string) => {
    setStaff((prev) => {
      const next = prev.filter((st) => st.id !== staffId);
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(next));
      return next;
    });
    try {
      await deleteDoc(doc(db, "cms_staff", staffId));
    } catch (err) {}
  };

  // CRUD Settings
  const saveSettings = async (settingsData: Partial<CmsSettings>) => {
    const updated: CmsSettings = { ...settings, ...settingsData };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    try {
      await setDoc(doc(db, "cms_settings", "global"), updated);
    } catch (err) {}
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
    try {
      await setDoc(doc(db, "cms_overrides", gatheringId), nextOverride);
    } catch (err) {}
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
    try {
      await setDoc(doc(db, "cms_overrides", gatheringId), nextOverride);
    } catch (err) {}
  };

  const resetCmsToDefaults = async () => {
    setPages(initialCmsPages);
    setNews(initialCmsNews);
    setSermons(initialCmsSermons);
    setStaff(initialCmsStaff);
    setSettings(initialCmsSettings);
    setOverrides({});
    try {
      for (const p of initialCmsPages) await setDoc(doc(db, "cms_pages", p.id), p);
      for (const n of initialCmsNews) await setDoc(doc(db, "cms_news", n.id), n);
      for (const s of initialCmsSermons) await setDoc(doc(db, "cms_sermons", s.id), s);
      for (const st of initialCmsStaff) await setDoc(doc(db, "cms_staff", st.id), st);
      await setDoc(doc(db, "cms_settings", "global"), initialCmsSettings);
    } catch (err) {}
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
