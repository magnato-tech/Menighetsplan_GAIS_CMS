import React from "react";
import { Link } from "react-router-dom";
import { CornerDownRight, Edit2, ExternalLink, Eye, FileText, GripVertical, Image as ImageIcon, Trash2 } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { getMenuOrder, pageUrl } from "../../../../utils/menu";
import { MoveStepButtons } from "./MoveStepButtons";
import { PageStatusBadge } from "./PageStatusBadge";
import type { PageActions } from "./pageTreeTypes";
import type { PageDrag } from "./usePageDragReorder";

interface Props extends PageActions {
  page: CmsPage;
  parentId: string;
  siblings: CmsPage[];
  index: number;
  drag: PageDrag;
  onMoveStep: (siblings: CmsPage[], pageId: string, direction: "up" | "down") => void;
}

/** A sub-page under a main tab, which can be dragged among its siblings. */
export const SubPageRow: React.FC<Props> = ({
  page: child,
  parentId,
  siblings,
  index,
  drag,
  onMoveStep,
  onOpenEditPage,
  onRequestDelete,
  onPreviewPage,
  onTogglePublish,
}) => {
  const childOrder = getMenuOrder(child);
  const isDragged = drag.draggingId === child.id;
  const isOver = drag.overId === child.id;

  return (
    <div
      onDragOver={(e) => drag.over(e, child.id, parentId)}
      onDrop={(e) =>
        drag.drop(
          e,
          child.id,
          parentId,
          siblings.map((c) => c.id)
        )
      }
      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative before:absolute before:-left-3 sm:before:-left-6 before:top-1/2 before:w-3 sm:before:w-6 before:h-0.5 before:bg-indigo-500/30 ${
        isDragged
          ? "opacity-40 border-dashed border-indigo-400 bg-slate-950"
          : isOver
          ? drag.position === "before"
            ? "border-t-2 border-t-indigo-400 border-slate-700 ring-1 ring-indigo-500/40"
            : "border-b-2 border-b-indigo-400 border-slate-700 ring-1 ring-indigo-500/40"
          : child.isPublished === false
          ? "border-amber-700/50 bg-slate-900/95 hover:border-amber-600/60 ring-1 ring-amber-500/10"
          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          draggable
          onDragStart={(e) => drag.start(e, child.id, parentId)}
          onDragEnd={drag.end}
          className="cursor-grab active:cursor-grabbing p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-colors shrink-0"
          title="Dra og slipp for å endre rekkefølge blant underfanene"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <MoveStepButtons
          level="sub"
          isFirst={index === 0}
          isLast={index === siblings.length - 1}
          onMove={(direction) => onMoveStep(siblings, child.id, direction)}
        />

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
              #{childOrder ?? index + 1}
            </span>
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <h4 className="font-semibold text-white text-sm truncate">{child.title}</h4>
            <span className="text-[11px] font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded">/{child.slug}</span>

            <PageStatusBadge page={child} compact onToggle={onTogglePublish} />

            {child.inNavMenu !== false ? (
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded">I meny</span>
            ) : (
              <span className="text-[10px] font-semibold text-stone-400 bg-slate-950 px-1.5 py-0.5 rounded">Skjult</span>
            )}

            {child.heroImage && (
              <span
                className="text-[10px] font-semibold text-sky-300 bg-sky-950/40 border border-sky-800/40 px-1.5 py-0.5 rounded flex items-center gap-1"
                title="Siden har et eget opplastet hovedbilde"
              >
                <ImageIcon className="w-2.5 h-2.5 text-sky-400" />
                <span>Bilde</span>
              </span>
            )}
          </div>
          {child.summary && <p className="text-xs text-slate-400 line-clamp-1 pl-1">{child.summary}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
        {onPreviewPage && (
          <button
            type="button"
            onClick={() => onPreviewPage(child)}
            className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/40 transition-colors cursor-pointer"
            title="Forhåndsvis underside i modal med offentlig styling"
            aria-label="Forhåndsvis underside"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        <Link
          to={pageUrl(child)}
          target="_blank"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Åpne i ny fane"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => onOpenEditPage(child)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          <span>Rediger</span>
        </button>
        <button
          type="button"
          onClick={() => onRequestDelete(child.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
          title="Slett underside"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
