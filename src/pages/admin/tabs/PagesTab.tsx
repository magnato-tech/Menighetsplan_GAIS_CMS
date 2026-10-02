import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { CmsPage } from "../../../data/cmsData";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  ExternalLink,
  AlertTriangle,
  X,
  FolderTree,
  Folder,
  CornerDownRight,
  Layers,
} from "lucide-react";
import { ShowFeedback } from "../studio";

interface PagesTabProps {
  showFeedback: ShowFeedback;
  /** Set when another tab asks for this one to open with a new, empty editor. */
  createRequested: boolean;
  onCreateHandled: () => void;
}

export const PagesTab: React.FC<PagesTabProps> = ({ showFeedback, createRequested, onCreateHandled }) => {
  const { pages, savePage, deletePage } = useCms();

  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);

  const handleOpenEditPage = (page: CmsPage) => {
    setEditingPage({ ...page });
    setIsNewPage(false);
  };

  const handleOpenNewPage = (parentId?: string | null) => {
    const siblings = pages.filter((p) => (parentId ? p.parentId === parentId : !p.parentId));
    const nextOrder = siblings.length + 1;

    setEditingPage({
      title: "",
      slug: "",
      summary: "",
      content: "## Ny seksjon\nSkriv artikkel eller infotekst her...\n\n- Punkt 1\n- Punkt 2",
      isPublished: true,
      inNavMenu: true,
      parentId: parentId || null,
      navOrder: nextOrder,
    });
    setIsNewPage(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editingPage.title) {
      showFeedback("Siden må ha en tittel", "error");
      return;
    }
    const cleanSlug = (editingPage.slug || editingPage.title.toLowerCase().replace(/\s+/g, "-"))
      .toLowerCase()
      .replace(/^\//, "")
      .trim();

    const saved = await savePage({
      ...editingPage,
      slug: cleanSlug,
      navOrder: Number(editingPage.navOrder) || 1,
      inNavMenu: editingPage.inNavMenu !== false,
      isPublished: editingPage.isPublished !== false,
      parentId: editingPage.parentId || null,
      linkUrl: editingPage.linkUrl?.trim() || undefined,
    });
    // Keep the editor open on failure so nothing typed is lost
    if (!saved) return;
    setEditingPage(null);
    showFeedback("Siden ble lagret og menystrukturen ble oppdatert!");
  };

  // Hierarchical groupings of CMS pages for visual tree representation
  const hierarchicalPages = useMemo(() => {
    const topLevel = pages
      .filter((p) => !p.parentId)
      .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

    return topLevel.map((parent) => {
      const children = pages
        .filter((p) => p.parentId === parent.id)
        .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));
      return {
        parent,
        children,
      };
    });
  }, [pages]);

  const orphanPages = useMemo(() => {
    const topIds = new Set(pages.filter((p) => !p.parentId).map((p) => p.id));
    return pages.filter((p) => p.parentId && !topIds.has(p.parentId));
  }, [pages]);

  const availableParentPages = useMemo(() => {
    return pages.filter((p) => !p.parentId && p.id !== editingPage?.id);
  }, [pages, editingPage?.id]);

  // Delete Page Confirmation Modal State
  const [deleteConfirmPageId, setDeleteConfirmPageId] = useState<string | null>(null);

  useEffect(() => {
    if (createRequested) {
      handleOpenNewPage();
      onCreateHandled();
    }
  }, [createRequested]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Sider & Innhold på nettsiden</h2>
          <p className="text-xs text-slate-400">
            Administrer nettsidens hierarkiske menystruktur, hovedfaner og underfaner (dropdowns).
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenNewPage(null)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ny hovedfane</span>
        </button>
      </div>

      {/* Tree Overview Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
            <FolderTree className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white text-sm">📁 Hovedmeny (Offentlig nettsted)</h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                {hierarchicalPages.length} hovedfaner
              </span>
              <span className="text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded">
                {pages.filter((p) => p.parentId).length} underfaner
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trestrukturen speiles direkte i den offentlige menyen med automatisk dropdown for underfaner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/"
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Åpne nettside</span>
          </Link>
          <button
            type="button"
            onClick={() => handleOpenNewPage(null)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Legg til fane</span>
          </button>
        </div>
      </div>

      {/* Side Editor Modal / Panel */}
      {editingPage && (
        <form onSubmit={handleSavePage} className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>
                {isNewPage
                  ? editingPage.parentId
                    ? "Opprett ny underfane"
                    : "Opprett ny hovedfane"
                  : `Rediger side: ${editingPage.title}`}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tittel på siden / fanen</label>
              <input
                type="text"
                value={editingPage.title || ""}
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                placeholder="f.eks. Gospelkoret eller Utleie for kurs"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">URL-adresse (slug)</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-950 border border-r-0 border-slate-700 rounded-l-xl text-slate-400">
                  /
                </span>
                <input
                  type="text"
                  value={editingPage.slug || ""}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  placeholder="gospelkoret"
                  className="w-full px-3 py-2 rounded-r-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hierarkisk menyplassering & Rekkefølge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Menyplassering (Nivå i hierarkiet)</span>
              </label>
              <select
                value={editingPage.parentId || ""}
                onChange={(e) =>
                  setEditingPage({
                    ...editingPage,
                    parentId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 text-xs"
              >
                <option value="">📁 Hovedfane på toppmenyen (Toppnivå 1)</option>
                <optgroup label="Eller plasser som underfane (dropdown) under:">
                  {availableParentPages.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      ↳ Underfane under: {parent.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-400">
                Hovedfaner vises i navigasjonslinjen. Underfaner legges automatisk i nedtrekksmenyen.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Menyrekkefølge</span>
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={editingPage.navOrder ?? 1}
                onChange={(e) =>
                  setEditingPage({
                    ...editingPage,
                    navOrder: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">1 = først fra venstre / øverst i nedtrekk.</p>
            </div>
          </div>

          {/* Valgfri snarvei til eksisterende rute */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">
              Valgfri snarvei / tilpasset URL (f.eks. for eksisterende moduler)
            </label>
            <input
              type="text"
              value={editingPage.linkUrl || ""}
              onChange={(e) => setEditingPage({ ...editingPage, linkUrl: e.target.value })}
              placeholder="f.eks. /hva-skjer for kalender, eller /fellesskap (la stå tom for å bruke standard innhold)"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Hvis dette feltet fylles ut, leder menylenken direkte til denne ruten i stedet for artikkelvisning.
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Kort sammendrag (ingress)</label>
            <input
              type="text"
              value={editingPage.summary || ""}
              onChange={(e) => setEditingPage({ ...editingPage, summary: e.target.value })}
              placeholder="Kort beskrivelse som vises øverst og i søkemotorer..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">
              Innhold (Støtter Markdown med ## Overskrift, - Punktliste)
            </label>
            <textarea
              rows={7}
              value={editingPage.content || ""}
              onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Publiserings- og Menyinnstillinger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingPage.isPublished !== false}
                onChange={(e) => setEditingPage({ ...editingPage, isPublished: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-white">Publiser på nettsiden</span>
                <span className="text-[11px] text-slate-400">Synlig for alle besøkende (ikke kladd).</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingPage.inNavMenu !== false}
                onChange={(e) => setEditingPage({ ...editingPage, inNavMenu: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-white">Vis i offentlig meny</span>
                <span className="text-[11px] text-slate-400">
                  Vises i topplinjen/dropdown (av = kun via direkte lenke).
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Lagre side til Firestore
            </button>
          </div>
        </form>
      )}

      {/* Hierarchical Tree of Pages */}
      <div className="space-y-4">
        {hierarchicalPages.map((item) => {
          const parent = item.parent;
          const hasChildren = item.children.length > 0;
          const targetUrl = parent.linkUrl || (parent.slug ? `/${parent.slug}` : "/");

          return (
            <div
              key={parent.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xs hover:border-slate-600 transition-all space-y-3"
            >
              {/* Top Level Main Tab Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0"
                      title="Menyrekkefølge"
                    >
                      #{parent.navOrder ?? 1}
                    </span>
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="font-bold text-white text-base truncate">{parent.title}</h3>
                    <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded">
                      {targetUrl}
                    </span>

                    {parent.isPublished ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                        Publisert
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                        Kladd
                      </span>
                    )}

                    {parent.inNavMenu !== false ? (
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                        I toppmeny
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-stone-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                        Skjult fra meny
                      </span>
                    )}

                    {hasChildren && (
                      <span className="text-[10px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                        {item.children.length} underfane{item.children.length > 1 ? "r" : ""}
                      </span>
                    )}
                  </div>

                  {parent.summary && (
                    <p className="text-xs text-slate-400 line-clamp-1 pl-8">{parent.summary}</p>
                  )}
                </div>

                {/* Main Tab Actions */}
                <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenNewPage(parent.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Opprett ny underfane som legger seg under denne fanen"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Underfane</span>
                  </button>
                  <Link
                    to={targetUrl}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Forhåndsvis side"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPage(parent)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rediger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmPageId(parent.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                    title="Slett fane"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-tabs Tree (Rendered hierarchically underneath) */}
              {hasChildren && (
                <div className="ml-3 sm:ml-6 pl-3 sm:pl-6 border-l-2 border-indigo-500/30 space-y-2 pt-1 pb-1">
                  {item.children.map((child, cIdx) => (
                    <div
                      key={child.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative before:absolute before:-left-3 sm:before:-left-6 before:top-1/2 before:w-3 sm:before:w-6 before:h-0.5 before:bg-indigo-500/30"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            #{child.navOrder ?? cIdx + 1}
                          </span>
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <h4 className="font-semibold text-white text-sm truncate">{child.title}</h4>
                          <span className="text-[11px] font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded">
                            /{child.slug}
                          </span>

                          {child.isPublished ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 py-0.5 rounded">
                              Publisert
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-900 px-1.5 py-0.5 rounded">
                              Kladd
                            </span>
                          )}

                          {child.inNavMenu !== false ? (
                            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded">
                              I meny
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400 bg-slate-950 px-1.5 py-0.5 rounded">
                              Skjult
                            </span>
                          )}
                        </div>
                        {child.summary && (
                          <p className="text-xs text-slate-400 line-clamp-1 pl-6">{child.summary}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
                        <Link
                          to={child.linkUrl || `/${child.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Forhåndsvis underside"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPage(child)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Rediger</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPageId(child.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                          title="Slett underside"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Orphan Pages if any */}
        {orphanPages.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-3 mt-6">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Frittstående sider uten tilordnet overordnet fane</span>
            </h3>
            <div className="space-y-2">
              {orphanPages.map((op) => (
                <div
                  key={op.id}
                  className="p-3 rounded-xl bg-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-white">{op.title}</span>
                    <span className="font-mono text-indigo-400">/{op.slug}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPage(op)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold"
                  >
                    Tilordne overordnet fane
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slettebekreftelse Modal for Sider */}
      {deleteConfirmPageId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Slette side permanent?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Er du sikker på at du vil slette denne siden fra nettsiden? Denne handlingen kan ikke angres.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPageId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={async () => {
                  const pageId = deleteConfirmPageId;
                  setDeleteConfirmPageId(null);
                  if (await deletePage(pageId)) showFeedback("Siden ble slettet");
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Ja, slett permanent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
