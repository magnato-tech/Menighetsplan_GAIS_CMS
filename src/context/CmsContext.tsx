import React, { createContext, useContext, useState, useEffect } from "react";
import { CmsPage, CmsEventOverride, initialCmsPages } from "../data/cmsData";

interface CmsContextValue {
  pages: CmsPage[];
  overrides: Record<string, CmsEventOverride>;
  savePage: (page: Partial<CmsPage> & { id?: string }) => void;
  deletePage: (pageId: string) => void;
  toggleFeatureGathering: (gatheringId: string) => void;
  toggleHideGathering: (gatheringId: string) => void;
  resetCmsToDefaults: () => void;
  getPageBySlug: (slug: string) => CmsPage | undefined;
}

const CmsContext = createContext<CmsContextValue | null>(null);

const STORAGE_KEY_PAGES = "menighetsplan_cms_pages_v1";
const STORAGE_KEY_OVERRIDES = "menighetsplan_cms_overrides_v1";

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<CmsPage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAGES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return initialCmsPages;
  });

  const [overrides, setOverrides] = useState<Record<string, CmsEventOverride>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(pages));
    } catch (e) {
      console.warn("Could not save pages to localStorage", e);
    }
  }, [pages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      console.warn("Could not save overrides to localStorage", e);
    }
  }, [overrides]);

  const savePage = (pageData: Partial<CmsPage> & { id?: string }) => {
    setPages((prev) => {
      const now = new Date().toISOString();
      if (pageData.id) {
        // Update existing
        return prev.map((p) =>
          p.id === pageData.id
            ? { ...p, ...pageData, updatedAt: now } as CmsPage
            : p
        );
      } else {
        // Create new
        const id = `page-${Date.now()}`;
        const newPage: CmsPage = {
          id,
          slug: pageData.slug || `side-${Date.now()}`,
          title: pageData.title || "Uten tittel",
          summary: pageData.summary || "",
          content: pageData.content || "",
          isPublished: pageData.isPublished !== false,
          updatedAt: now,
        };
        return [...prev, newPage];
      }
    });
  };

  const deletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const toggleFeatureGathering = (gatheringId: string) => {
    setOverrides((prev) => {
      const current = prev[gatheringId] || {
        gatheringId,
        featured: false,
        hidden: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [gatheringId]: {
          ...current,
          featured: !current.featured,
          hidden: current.featured ? current.hidden : false, // Un-hide if featured
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const toggleHideGathering = (gatheringId: string) => {
    setOverrides((prev) => {
      const current = prev[gatheringId] || {
        gatheringId,
        featured: false,
        hidden: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [gatheringId]: {
          ...current,
          hidden: !current.hidden,
          featured: current.hidden ? current.featured : false, // Un-feature if hidden
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const resetCmsToDefaults = () => {
    setPages(initialCmsPages);
    setOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY_PAGES);
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    } catch {
      // ignore
    }
  };

  const getPageBySlug = (slug: string) => {
    return pages.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
  };

  return (
    <CmsContext.Provider
      value={{
        pages,
        overrides,
        savePage,
        deletePage,
        toggleFeatureGathering,
        toggleHideGathering,
        resetCmsToDefaults,
        getPageBySlug,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = (): CmsContextValue => {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error("useCms must be used within a CmsProvider");
  }
  return ctx;
};
