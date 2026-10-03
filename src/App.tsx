import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FirebaseDataProvider } from "./context/FirebaseDataContext";
import { CmsProvider, useCms } from "./context/CmsContext";
import { SITE_THEME_CLASS, getThemeCssVariables } from "./utils/themeUtils";
import { isAdminStudioPath, isMinSidePath } from "./utils/routes";
import { injectPageSeo } from "./utils/seoUtils";
import { seoForPath } from "./utils/siteSeo";
import { WriteErrorBanner } from "./components/WriteErrorBanner";
import { PublicNavbar } from "./components/public/PublicNavbar";
import { PublicFooter } from "./components/public/PublicFooter";

// Public Pages
import { PublicHomePage } from "./pages/public/PublicHomePage";
import { PublicCalendarPage } from "./pages/public/PublicCalendarPage";
import { PublicGroupsPage } from "./pages/public/PublicGroupsPage";
import { PublicStaticPage } from "./pages/public/PublicStaticPage";
import { PublicArticlePage } from "./pages/public/PublicArticlePage";
import { PublicSermonsPage } from "./pages/public/PublicSermonsPage";
import { PublicLeadershipPage } from "./pages/public/PublicLeadershipPage";

// Internal App / Min Side Pages

// Fullscreen Admin & CMS Studio

/**
 * Keeps the tab title, the description and the share card in step with the page being shown.
 * The server writes the same into the HTML it sends (server.ts), from the same rules.
 */
// Admin Studio and Min side are only opened by signed-in people, so visitors to the website do not download them
const AdminStudio = lazy(() => import("./pages/admin/AdminStudio").then((m) => ({ default: m.AdminStudio })));
const MinSideApp = lazy(() => import("./MinSideApp"));

const LoadingScreen = () => <div className="p-8 text-center text-sm text-slate-500">Laster …</div>;

function useSiteSeo(pathname: string) {
  const { pages, news, settings } = useCms();

  useEffect(() => {
    const config = seoForPath(pathname, { pages, news, settings });
    if (config) return injectPageSeo(config);
    // Min side and admin carry the app's own name
    document.title = settings.appName;
    return undefined;
  }, [pathname, pages, news, settings]);
}

function AppContent() {
  const location = useLocation();
  const { settings } = useCms();
  // The design chosen in admin, as the CSS variables the public pages read
  const themeVariables = useMemo(() => getThemeCssVariables(settings?.theme), [settings?.theme]);
  useSiteSeo(location.pathname);

  // Route type checks
  const isAdminStudio = isAdminStudioPath(location.pathname);
  const isMinSideRoute = isMinSidePath(location.pathname);

  // 1. Fullscreen Admin Studio
  if (isAdminStudio) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminStudio />
      </Suspense>
    );
  }

  // 2. Min Side / Internal Planlegger Layout
  if (isMinSideRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MinSideApp />
      </Suspense>
    );
  }

  // 3. Public Website Layout (Menighetsplan - Offentlig nettside for Lillesand Misjonskirke)
  return (
    <div style={themeVariables} className={`${SITE_THEME_CLASS} min-h-screen flex flex-col bg-page text-stone-900`}>
      <PublicNavbar />
      <main className="flex-1">
        <Routes>
          {/* Public Home */}
          <Route path="/" element={<PublicHomePage />} />

          {/* Public Calendar & Events */}
          <Route path="/hva-skjer" element={<PublicCalendarPage />} />
          <Route path="/kalender" element={<PublicCalendarPage />} />

          {/* Public Sermons */}
          <Route path="/taler" element={<PublicSermonsPage />} />

          {/* Public Groups & Fellowship */}
          <Route path="/fellesskap" element={<PublicGroupsPage />} />
          <Route path="/grupper" element={<PublicGroupsPage />} />

          {/* Public Static CMS Pages */}
          <Route path="/om-oss" element={<PublicStaticPage forcedSlug="om-oss" />} />
          <Route path="/stab" element={<PublicStaticPage forcedSlug="stab" fallbackComponent={<PublicLeadershipPage />} />} />
          <Route path="/lederskap" element={<PublicStaticPage forcedSlug="lederskap" fallbackComponent={<PublicLeadershipPage />} />} />
          <Route path="/kontakt" element={<PublicStaticPage forcedSlug="kontakt" />} />
          <Route path="/side/:slug" element={<PublicStaticPage />} />
          <Route path="/:slug" element={<PublicStaticPage />} />

          {/* Public News & Articles */}
          <Route path="/artikkel/:id" element={<PublicArticlePage />} />

          {/* Aliases for old /nettside routes */}
          <Route path="/nettside" element={<Navigate to="/" replace />} />
          <Route path="/nettside/:slug" element={<PublicStaticPage />} />

          {/* Catch-all to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PublicFooter />
    </div>
  );
}

function DataProviders({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const internal = isAdminStudioPath(pathname) || isMinSidePath(pathname);

  return (
    <FirebaseDataProvider internal={internal}>
      <CmsProvider>{children}</CmsProvider>
    </FirebaseDataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProviders>
        <AppContent />
        <WriteErrorBanner />
      </DataProviders>
    </BrowserRouter>
  );
}
