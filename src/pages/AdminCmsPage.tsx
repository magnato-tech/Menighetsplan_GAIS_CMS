import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMockData } from "../context/MockDataContext";
import { useCms } from "../context/CmsContext";
import { CmsPage } from "../data/cmsData";
import {
  Globe,
  Settings,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Star,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

export const AdminCmsPage: React.FC = () => {
  const { gatherings, isFirestoreConnected } = useMockData();
  const {
    pages,
    overrides,
    savePage,
    deletePage,
    toggleFeatureGathering,
    toggleHideGathering,
    resetCmsToDefaults,
  } = useCms();

  const [activeTab, setActiveTab] = useState<"dashboard" | "arrangementer" | "sider">("dashboard");

  // Page modal/editor state
  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);

  // Stats
  const publicGatheringsCount = gatherings.filter((g) => g.isPublic !== false).length;
  const featuredCount = Object.values(overrides).filter((o: any) => o?.featured).length;
  const hiddenCount = Object.values(overrides).filter((o: any) => o?.hidden).length;

  const handleOpenEdit = (page: CmsPage) => {
    setEditingPage({ ...page });
    setIsNewPage(false);
  };

  const handleOpenNew = () => {
    setEditingPage({
      title: "",
      slug: "",
      summary: "",
      content: "## Ny seksjon\nSkriv tekst her...\n\n- Punkt 1\n- Punkt 2",
      isPublished: true,
    });
    setIsNewPage(true);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editingPage.title || !editingPage.slug) return;
    savePage(editingPage);
    setEditingPage(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/settings"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tilbake til Innstillinger
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Globe className="w-6 h-6 text-indigo-600" />
            Nettside CMS (ClaudeCMS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrer menighetens offentlige nettside, faste sider og arrangement-overstyringer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/nettside"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <span>Åpne nettside</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("arrangementer")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "arrangementer"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Arrangementer & Fremheving ({gatherings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sider")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sider"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Faste sider ({pages.length})</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Quick status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Kildetilkobling
              </span>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-bold text-slate-800">
                  {isFirestoreConnected ? "Firestore Sanntid" : "Koblet til mock"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Samlinger synkroniseres direkte fra Menighetsplan
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Offentlige samlinger
              </span>
              <div className="text-2xl font-black text-slate-900 pt-1">
                {publicGatheringsCount}
              </div>
              <p className="text-[11px] text-slate-400">
                {featuredCount} fremhevet på forside, {hiddenCount} skjult
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Faste nettsider
              </span>
              <div className="text-2xl font-black text-slate-900 pt-1">
                {pages.length}
              </div>
              <p className="text-[11px] text-slate-400">
                Om oss, Barn og unge, Kontakt osv.
              </p>
            </div>
          </div>

          {/* Integration card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Slik fungerer koblingen mellom appen og nettsiden
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menighetsplan fungerer som kildesystemet for menighetens kalender. Hver gang en leder eller administrator oppretter en ny samling eller avlyser en gudstjeneste her i Menighetsplan, oppdateres nettsiden øyeblikkelig.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1 font-mono">
              <div>API: GET /api/public/gatherings</div>
              <div className="text-emerald-700">Status: 200 OK (CORS aktivert)</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARRANGEMENTER & OVERSTYRINGER */}
      {activeTab === "arrangementer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Her kan du overstyre arrangementer på nettsiden uten å endre samlingen i Menighetsplan. Du kan <strong>fremheve</strong> et arrangement på forsiden, eller <strong>skjule</strong> det fra kalenderen.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {gatherings.map((g) => {
              const override = overrides[g.id];
              const isFeatured = Boolean(override?.featured);
              const isHidden = Boolean(override?.hidden);
              const startDate = new Date(g.startsAt);

              return (
                <div
                  key={g.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isHidden ? "bg-slate-50 opacity-60" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {g.title}
                      </span>
                      {isFeatured && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Fremhevet på forside
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Skjult fra nettside
                        </span>
                      )}
                      {g.cancelled && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          Avlyst i Menighetsplan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {startDate.toLocaleDateString("no-NO", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        kl.{" "}
                        {startDate.toLocaleTimeString("no-NO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {g.location || "Kirkesalen"}
                      </span>
                    </div>
                  </div>

                  {/* Overstyringsknapper */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFeatureGathering(g.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isFeatured
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-white" : ""}`} />
                      <span>{isFeatured ? "Fremhevet" : "Fremhev"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleHideGathering(g.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isHidden
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Skjult</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Synlig</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FASTE SIDER */}
      {activeTab === "sider" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Rediger menighetens faste sider eller opprett nye undersider.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetCmsToDefaults}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                title="Gjenopprett ClaudeCMS standardtekster"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nullstill maler</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNew}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ny side</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {p.title}
                    </h4>
                    <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      /nettside/{p.slug}
                    </span>
                    {p.isPublished ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Publisert
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Utkast
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {p.summary || p.content.slice(0, 100)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/nettside/${p.slug}`}
                    target="_blank"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Vis på nettside"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Rediger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePage(p.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Slett side"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAGE EDIT MODAL */}
      {editingPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isNewPage ? "Opprett ny side" : `Rediger: ${editingPage.title}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tittel</label>
                  <input
                    type="text"
                    required
                    value={editingPage.title || ""}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="f.eks. Dåp og konfirmasjon"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    URL-slug (sti)
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-500 text-xs">
                      /nettside/
                    </span>
                    <input
                      type="text"
                      required
                      value={editingPage.slug || ""}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                        })
                      }
                      className="w-full px-3 py-2 rounded-r-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="dap"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Kort ingress / sammendrag
                </label>
                <input
                  type="text"
                  value={editingPage.summary || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="En setning som forklarer hva siden handler om..."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Innhold</label>
                  <span className="text-[11px] text-slate-400">
                    Støtter ## Overskrifter og - Lister
                  </span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={editingPage.content || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, content: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="## Overskrift&#10;Innhold her..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-published"
                  checked={editingPage.isPublished !== false}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      isPublished: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="chk-published" className="font-medium text-slate-700">
                  Publiser på nettsiden (synlig for alle)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPage(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                >
                  Lagre endringer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
