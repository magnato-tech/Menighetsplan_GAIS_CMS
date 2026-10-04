import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import { CmsPage } from "../../data/cmsData";
import { buildPageTree, findOrphanPages, getParentId } from "../../utils/menu";
import { Plus, FolderTree, ExternalLink, Palette } from "lucide-react";
import { ShowFeedback } from "../../pages/admin/studio";
import { PageTreeList } from "../../pages/admin/tabs/pages/PageTreeList";
import { PageEditModal } from "../../pages/admin/tabs/pages/PageEditModal";
import { PageDeleteDialog } from "../../pages/admin/tabs/pages/PageDeleteDialog";

export interface AdminCmsPanelProps {
  showFeedback: ShowFeedback;
  /** Set when another tab/shortcut asks for this panel to open with a new, empty editor. */
  createRequested?: boolean;
  onCreateHandled?: () => void;
}

/**
 * AdminCmsPanel - Komponent for komplett hierarkisk side- og innholdshåndtering.
 * Isolerer administrasjonslogikk for nettsidens CMS-sider ut av AdminStudio.
 */
export const AdminCmsPanel: React.FC<AdminCmsPanelProps> = ({
  showFeedback,
  createRequested = false,
  onCreateHandled,
}) => {
  const { pages, savePage, deletePage, reorderPages } = useCms();

  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);
  const [deleteConfirmPageId, setDeleteConfirmPageId] = useState<string | null>(null);

  const handleOpenEditPage = (page: CmsPage) => {
    setEditingPage({ ...page });
    setIsNewPage(false);
  };

  const handleOpenNewPage = (parentId?: string | null) => {
    const parentVal = parentId || null;
    const siblings = pages.filter((p) => getParentId(p) === parentVal);
    const nextOrder = siblings.length + 1;

    setEditingPage({
      title: "",
      slug: "",
      summary: "",
      content: "## Ny seksjon\nSkriv artikkel eller infotekst her...\n\n- Punkt 1\n- Punkt 2",
      isPublished: true,
      inNavMenu: true,
      parentPageId: parentVal,
      parentId: parentVal,
      menuOrder: nextOrder,
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

    const parentVal =
      editingPage.parentPageId !== undefined
        ? editingPage.parentPageId
        : editingPage.parentId || null;

    const orderVal =
      typeof editingPage.menuOrder === "number"
        ? editingPage.menuOrder
        : typeof editingPage.navOrder === "number"
        ? editingPage.navOrder
        : 1;

    const saved = await savePage({
      ...editingPage,
      slug: cleanSlug,
      parentPageId: parentVal,
      parentId: parentVal,
      menuOrder: orderVal,
      navOrder: orderVal,
      inNavMenu: editingPage.inNavMenu !== false,
      isPublished: editingPage.isPublished !== false,
      linkUrl: editingPage.linkUrl?.trim() || undefined,
    });

    if (!saved) return;
    setEditingPage(null);
    showFeedback("Siden ble lagret og menystrukturen ble oppdatert!");
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmPageId) return;
    const pageId = deleteConfirmPageId;
    setDeleteConfirmPageId(null);
    const success = await deletePage(pageId);
    if (success) {
      showFeedback("Siden ble slettet");
    }
  };

  const handleReorder = async (orderedPageIds: string[]) => {
    const success = await reorderPages(orderedPageIds);
    if (success) {
      showFeedback("Menyrekkefølgen ble oppdatert!");
    } else {
      showFeedback("Kunne ikke oppdatere menyrekkefølgen", "error");
    }
  };

  const handleTogglePublish = async (page: CmsPage) => {
    const isCurrentlyPublished = page.isPublished !== false;
    const willBePublished = !isCurrentlyPublished;
    const success = await savePage({
      ...page,
      isPublished: willBePublished,
    });
    if (success) {
      showFeedback(
        willBePublished
          ? `«${page.title}» er nå publisert på nettsiden!`
          : `«${page.title}» er satt til kladd (upublisert).`
      );
    } else {
      showFeedback("Kunne ikke oppdatere publiseringsstatus", "error");
    }
  };

  // Published, scheduled, and draft counters for quick visual overview
  const scheduledCount = useMemo(
    () =>
      pages.filter(
        (p) =>
          p.isPublished !== false &&
          Boolean(p.publishAt && new Date(p.publishAt).getTime() > Date.now())
      ).length,
    [pages]
  );
  const publishedCount = useMemo(
    () =>
      pages.filter(
        (p) =>
          p.isPublished !== false &&
          (!p.publishAt || new Date(p.publishAt).getTime() <= Date.now())
      ).length,
    [pages]
  );
  const draftCount = useMemo(
    () => pages.filter((p) => p.isPublished === false || p.status === "draft").length,
    [pages]
  );

  // Every page is listed here, drafts and pages hidden from the menu included
  const hierarchicalPages = useMemo(() => buildPageTree(pages), [pages]);
  const orphanPages = useMemo(() => findOrphanPages(pages), [pages]);

  const availableParentPages = useMemo(() => {
    return pages.filter((p) => !getParentId(p) && p.id !== editingPage?.id);
  }, [pages, editingPage?.id]);

  const subPagesOfDeleted = useMemo(() => {
    if (!deleteConfirmPageId) return 0;
    return pages.filter((p) => getParentId(p) === deleteConfirmPageId).length;
  }, [pages, deleteConfirmPageId]);

  useEffect(() => {
    if (createRequested) {
      handleOpenNewPage();
      onCreateHandled?.();
    }
  }, [createRequested, onCreateHandled]);

  return (
    <div className="w-full space-y-6 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Sider & Innhold på nettsiden</h2>
          <p className="text-xs text-slate-400">
            Bygg menyen på nettsiden: hovedfaner og underfaner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin?tab=cms-design"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs"
            title="Gå til Tema & Designsystem for fargetilpasning og typografi"
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Design</span>
          </Link>

          <button
            type="button"
            onClick={() => handleOpenNewPage(null)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ny hovedfane</span>
          </button>
        </div>
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
                {pages.filter((p) => Boolean(getParentId(p))).length} underfaner
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                <span>{publishedCount} publisert</span>
              </span>
              {scheduledCount > 0 && (
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.8)]" />
                  <span>{scheduledCount} planlagt</span>
                </span>
              )}
              {draftCount > 0 && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                  <span>{draftCount} kladd{draftCount !== 1 ? "er" : ""}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trestrukturen speiles direkte i den offentlige menyen. Klikk på statusknappene for raskt å publisere eller sette en side til kladd.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/"
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Åpne nettside</span>
          </Link>
          <button
            type="button"
            onClick={() => handleOpenNewPage(null)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Legg til fane</span>
          </button>
        </div>
      </div>

      {/* Side Editor Modal / Form */}
      {editingPage && (
        <PageEditModal
          editingPage={editingPage}
          isNewPage={isNewPage}
          availableParentPages={availableParentPages}
          onUpdate={setEditingPage}
          onSave={handleSavePage}
          onClose={() => setEditingPage(null)}
        />
      )}

      {/* Hierarchical Tree of Pages with Drag & Drop */}
      <PageTreeList
        hierarchicalPages={hierarchicalPages}
        orphanPages={orphanPages}
        onOpenNewPage={handleOpenNewPage}
        onOpenEditPage={handleOpenEditPage}
        onRequestDelete={setDeleteConfirmPageId}
        onReorder={handleReorder}
        onTogglePublish={handleTogglePublish}
      />

      {/* Slettebekreftelse Modal */}
      <PageDeleteDialog
        pageId={deleteConfirmPageId}
        subPagesCount={subPagesOfDeleted}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmPageId(null)}
      />
    </div>
  );
};
