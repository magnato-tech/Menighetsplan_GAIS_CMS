import React from "react";
import { AlertTriangle, Eye, FileText } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { PageStatusBadge } from "./PageStatusBadge";
import type { PageActions } from "./pageTreeTypes";

interface Props extends Pick<PageActions, "onOpenEditPage" | "onPreviewPage" | "onTogglePublish"> {
  pages: CmsPage[];
}

/** Pages whose parent tab no longer exists, each with a button to give it a new one. */
export const OrphanPagesList: React.FC<Props> = ({ pages, onOpenEditPage, onPreviewPage, onTogglePublish }) => (
  <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-3 mt-6">
    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400" />
      <span>Frittstående sider uten tilordnet overordnet fane</span>
    </h3>
    <div className="space-y-2">
      {pages.map((op) => (
        <div
          key={op.id}
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
            op.isPublished === false
              ? "border-amber-700/50 bg-slate-800/95 ring-1 ring-amber-500/10"
              : "border-slate-700/80 bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-white">{op.title}</span>
            <span className="font-mono text-indigo-400">/{op.slug}</span>
            <PageStatusBadge page={op} compact onToggle={onTogglePublish} />
          </div>
          <div className="flex items-center gap-1.5">
            {onPreviewPage && (
              <button
                type="button"
                onClick={() => onPreviewPage(op)}
                className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/40 transition-colors cursor-pointer"
                title="Forhåndsvis side"
                aria-label="Forhåndsvis side"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenEditPage(op)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer transition-colors"
            >
              Tilordne overordnet fane
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
