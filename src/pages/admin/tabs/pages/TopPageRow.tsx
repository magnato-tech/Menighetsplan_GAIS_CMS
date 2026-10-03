import React from "react";
import { Link } from "react-router-dom";
import { Edit2, ExternalLink, Eye, Folder, GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { getMenuOrder, pageUrl, type PageNode } from "../../../../utils/menu";
import { MoveStepButtons } from "./MoveStepButtons";
import { PageStatusBadge } from "./PageStatusBadge";
import { SubPageRow } from "./SubPageRow";
import type { PageActions } from "./pageTreeTypes";
import type { PageDrag } from "./usePageDragReorder";

interface Props extends PageActions {
  node: PageNode;
  index: number;
  topLevelPages: CmsPage[];
  drag: PageDrag;
  onMoveStep: (siblings: CmsPage[], pageId: string, direction: "up" | "down") => void;
}

/** A main tab with its sub-pages underneath. */
export const TopPageRow: React.FC<Props> = ({ node, index, topLevelPages, drag, onMoveStep, ...actions }) => {
  const { onOpenNewPage, onOpenEditPage, onRequestDelete, onPreviewPage, onTogglePublish } = actions;
  const parent = node.page;
  const hasChildren = node.children.length > 0;
  const targetUrl = pageUrl(parent);
  const isDragged = drag.draggingId === parent.id;
  const isOver = drag.overId === parent.id;

  return (
    <div
      onDragOver={(e) => drag.over(e, parent.id, null)}
      onDrop={(e) =>
        drag.drop(
          e,
          parent.id,
          null,
          topLevelPages.map((p) => p.id)
        )
      }
      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 relative ${
        isDragged
          ? "opacity-40 border-dashed border-indigo-400 bg-slate-850 shadow-inner"
          : isOver
          ? drag.position === "before"
            ? "border-t-4 border-t-indigo-400 border-slate-700 bg-slate-800 ring-2 ring-indigo-500/40"
            : "border-b-4 border-b-indigo-400 border-slate-700 bg-slate-800 ring-2 ring-indigo-500/40"
          : parent.isPublished === false
          ? "border-amber-600/60 bg-slate-850/95 shadow-xs hover:border-amber-500 ring-1 ring-amber-500/15"
          : "border-slate-700/80 bg-slate-800/90 shadow-xs hover:border-slate-600"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            draggable
            onDragStart={(e) => drag.start(e, parent.id, null)}
            onDragEnd={drag.end}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-700/60 transition-colors shrink-0"
            title="Dra og slipp for å endre rekkefølge på toppmenyen"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <MoveStepButtons
            level="top"
            isFirst={index === 0}
            isLast={index === topLevelPages.length - 1}
            onMove={(direction) => onMoveStep(topLevelPages, parent.id, direction)}
          />

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0"
                title="Menyrekkefølge"
              >
                #{getMenuOrder(parent)}
              </span>
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="font-bold text-white text-base truncate">{parent.title}</h3>
              <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded">{targetUrl}</span>

              <PageStatusBadge page={parent} onToggle={onTogglePublish} />

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
                  {node.children.length} underfane{node.children.length > 1 ? "r" : ""}
                </span>
              )}

              {parent.heroImage && (
                <span
                  className="text-[10px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded flex items-center gap-1"
                  title="Siden har et eget opplastet hovedbilde"
                >
                  <ImageIcon className="w-3 h-3 text-sky-400" />
                  <span>Hovedbilde</span>
                </span>
              )}
            </div>

            {parent.summary && <p className="text-xs text-slate-400 line-clamp-1 pl-1">{parent.summary}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenNewPage(parent.id)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Opprett ny underfane som legger seg under denne fanen"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Underfane</span>
          </button>
          {onPreviewPage && (
            <button
              type="button"
              onClick={() => onPreviewPage(parent)}
              className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/60 transition-colors cursor-pointer"
              title="Forhåndsvis side i modal med offentlig styling og responsiv sjekk"
              aria-label="Forhåndsvis side"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
            </button>
          )}
          <Link
            to={targetUrl}
            target="_blank"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Åpne i ny fane"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onOpenEditPage(parent)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Rediger</span>
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(parent.id)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
            title="Slett fane"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && (
        <div className="ml-3 sm:ml-6 pl-3 sm:pl-6 border-l-2 border-indigo-500/30 space-y-2 pt-1 pb-1">
          {node.children.map((child, childIndex) => (
            <SubPageRow
              key={child.id}
              page={child}
              parentId={parent.id}
              siblings={node.children}
              index={childIndex}
              drag={drag}
              onMoveStep={onMoveStep}
              {...actions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
