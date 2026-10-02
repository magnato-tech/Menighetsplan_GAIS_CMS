import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import { useFirebase } from "../../context/FirebaseDataContext";
import { UserSwitcher } from "../UserSwitcher";
import {
  Menu,
  X,
  Church,
  LayoutDashboard,
  Shield,
  ChevronRight,
} from "lucide-react";

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileSubmenus, setOpenMobileSubmenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { settings, pages } = useCms();
  const { currentUser } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";

  const toggleMobileSubmenu = (pageId: string) => {
    setOpenMobileSubmenus((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  // Build hierarchical navigation items from CmsContext pages
  const navigationItems = useMemo(() => {
    const activePages = pages.filter((p) => p.isPublished !== false && p.inNavMenu !== false);

    const topLevel = activePages
      .filter((p) => !p.parentId)
      .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

    return topLevel.map((parent) => {
      const children = activePages
        .filter((p) => p.parentId === parent.id)
        .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

      const targetUrl = parent.linkUrl || (parent.slug ? `/${parent.slug}` : "/");
      const isParentActive =
        location.pathname === targetUrl ||
        (targetUrl !== "/" && location.pathname.startsWith(targetUrl)) ||
        children.some((c) => {
          const cUrl = c.linkUrl || `/${c.slug}`;
          return location.pathname === cUrl;
        });

      return {
        page: parent,
        targetUrl,
        isActive: isParentActive,
        children: children.map((c) => ({
          page: c,
          targetUrl: c.linkUrl || `/${c.slug}`,
          isActive: location.pathname === (c.linkUrl || `/${c.slug}`),
        })),
      };
    });
  }, [pages, location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Church className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-950 transition-colors">
                  {settings.appName || "Menighetsplan"}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {settings.churchName || "Lillesand"}
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block font-medium">
                {settings.tagline || "Varmt fellesskap. Enkel tjeneste."}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links with Dropdown for Subpages */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              if (item.children.length === 0) {
                return (
                  <Link
                    key={item.page.id}
                    to={item.targetUrl}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      item.isActive
                        ? "text-indigo-900 bg-indigo-50/80 font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    {item.page.title}
                  </Link>
                );
              }

              return (
                <div className="relative group" key={item.page.id}>
                  <Link
                    to={item.targetUrl}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      item.isActive
                        ? "text-indigo-900 bg-indigo-50/80 font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    <span>{item.page.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 rotate-90 group-hover:rotate-270 group-hover:text-indigo-700 transition-transform" />
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full pt-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                    <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/90 py-2 min-w-[210px] space-y-0.5">
                      <Link
                        to={item.targetUrl}
                        className="block px-3.5 py-2 text-xs font-bold text-stone-900 hover:bg-indigo-50/80 hover:text-indigo-900 rounded-lg mx-1.5 transition-colors border-b border-stone-100 mb-1"
                      >
                        Oversikt: {item.page.title}
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child.page.id}
                          to={child.targetUrl}
                          className={`block px-3.5 py-2 text-xs font-medium rounded-lg mx-1.5 transition-colors ${
                            child.isActive
                              ? "bg-indigo-50 text-indigo-950 font-bold"
                              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                          }`}
                        >
                          {child.page.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right Action buttons: Min Side & Admin Studio */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* User switcher for quick testing */}
            <div className="scale-90 origin-right">
              <UserSwitcher />
            </div>

            {/* Min Side Link */}
            <Link
              to="/minside"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
              title="Gå til Min Side for planlegging og oppgaver"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
              <span>Min Side</span>
            </Link>

            {/* Admin Studio Button (Shown to Admins) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
                title="Åpne Fullskjerm Admin & CMS Workspace"
              >
                <Shield className="w-3.5 h-3.5 text-amber-200" />
                <span>Admin Studio</span>
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/minside"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
            >
              Min Side
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Åpne meny"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const hasSub = item.children.length > 0;
              const isExpanded = openMobileSubmenus[item.page.id] ?? item.isActive;

              return (
                <div key={item.page.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={item.targetUrl}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                        item.isActive
                          ? "bg-indigo-50 text-indigo-900 font-bold"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {item.page.title}
                    </Link>

                    {hasSub && (
                      <button
                        type="button"
                        onClick={() => toggleMobileSubmenu(item.page.id)}
                        className="p-2 text-stone-500 hover:text-stone-900 rounded-lg"
                        aria-label="Fold ut underfane"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90 text-indigo-600" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Mobile Submenu Accordion */}
                  {hasSub && isExpanded && (
                    <div className="pl-4 ml-2 border-l-2 border-indigo-100 space-y-1 pb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.page.id}
                          to={child.targetUrl}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3 py-1.5 rounded-lg text-xs font-medium ${
                            child.isActive
                              ? "bg-indigo-50 text-indigo-950 font-bold"
                              : "text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          {child.page.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-2">
            <Link
              to="/minside"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>Gå til Min Side (Planlegger)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-indigo-700 text-white text-sm font-bold shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-200" />
                  <span>Admin & CMS Studio</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-200" />
              </Link>
            )}

            <div className="pt-2">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Bytt aktiv bruker:</span>
              <UserSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
