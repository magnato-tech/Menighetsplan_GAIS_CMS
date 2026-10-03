import React from "react";
import { Clock } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import { publishState } from "../../../../utils/pageEdit";

interface Props {
  page: CmsPage;
  compact?: boolean;
  onToggle?: (page: CmsPage) => void;
}

/** Whether the page is published, a draft or scheduled. Clicking it switches between published and draft. */
export const PageStatusBadge: React.FC<Props> = ({ page, compact = false, onToggle }) => {
  const { isFutureScheduled, isManuallyPublished: published } = publishState(page);
  const size = compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]";
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(page);
  };

  if (isFutureScheduled) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all cursor-pointer ${size} bg-blue-950/90 hover:bg-blue-900 text-blue-300 border border-blue-500/80 shadow-xs hover:border-blue-400 ring-1 ring-blue-500/20`}
        title={`Status: Planlagt publisert ${formatNorwegianDateTime(page.publishAt!)}. Klikk for å endre til kladd.`}
        aria-label={`Planlagt publisert ${page.publishAt}. Klikk for å sette til kladd.`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.9)]"></span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-300" />
          <span>Planlagt</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all cursor-pointer ${size} ${
        published
          ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 shadow-xs hover:border-emerald-500"
          : "bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-500/80 shadow-xs hover:border-amber-400 ring-1 ring-amber-500/20"
      }`}
      title={
        published
          ? "Status: Publisert (synlig for alle). Klikk for å endre til kladd."
          : "Status: Kladd (upublisert og skjult). Klikk for å publisere."
      }
      aria-label={published ? "Publisert side. Klikk for å sette til kladd." : "Kladd. Klikk for å publisere."}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {published ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"></span>
        )}
      </span>
      <span>{published ? "Publisert" : "Kladd"}</span>
    </button>
  );
};
