import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import { useMockData } from "../../context/MockDataContext";
import { UserSwitcher } from "../UserSwitcher";
import {
  Menu,
  X,
  Church,
  Calendar,
  Users,
  Info,
  Phone,
  LayoutDashboard,
  Shield,
  Heart,
  ChevronRight,
} from "lucide-react";

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { settings } = useCms();
  const { currentUser } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";

  const navLinks = [
    { to: "/", label: "Hjem", active: location.pathname === "/" },
    { to: "/hva-skjer", label: "Hva skjer", active: location.pathname.startsWith("/hva-skjer") || location.pathname.startsWith("/kalender") },
    { to: "/taler", label: "Taler", active: location.pathname.startsWith("/taler") },
    { to: "/fellesskap", label: "Grupper", active: location.pathname.startsWith("/fellesskap") },
    { to: "/om-oss", label: "Om oss", active: location.pathname === "/om-oss" },
    { to: "/lederskap", label: "Stab & Lederskap", active: location.pathname === "/lederskap" || location.pathname === "/stab" },
    { to: "/kontakt", label: "Kontakt & Gi", active: location.pathname === "/kontakt" },
  ];

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

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  link.active
                    ? "text-indigo-900 bg-indigo-50/80 font-bold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
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
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-semibold ${
                  link.active
                    ? "bg-indigo-50 text-indigo-900 font-bold"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
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
