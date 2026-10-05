import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { studioTabUrl } from "./studio";
import type { StudioTab } from "./studio";
import { studioDetailPage } from "./studioDetailTheme";

interface StudioDetailShellProps {
  backTab: StudioTab;
  backLabel: string;
  badge: string;
  feedback?: { text: string; type: "success" | "error" } | null;
  children: React.ReactNode;
}

export const StudioDetailShell: React.FC<StudioDetailShellProps> = ({
  backTab,
  backLabel,
  badge,
  feedback,
  children,
}) => {
  return (
    <div className={studioDetailPage}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--studio-border)] pb-4">
        <Link
          to={studioTabUrl(backTab)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--studio-muted)] hover:text-[var(--studio-text)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[var(--studio-accent-bg)] text-[var(--studio-accent-text)] border border-[var(--studio-accent-border)] self-start">
          {badge}
        </span>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/60 text-emerald-200 border border-emerald-800/80"
              : "bg-rose-950/60 text-rose-200 border border-rose-800/80"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {children}
    </div>
  );
};

interface StudioDetailNotFoundProps {
  backTab: StudioTab;
  backLabel: string;
  title: string;
  description?: string;
}

export const StudioDetailNotFound: React.FC<StudioDetailNotFoundProps> = ({
  backTab,
  backLabel,
  title,
  description,
}) => (
  <div className={studioDetailPage}>
    <div className="p-8 text-center space-y-4 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)]">
      <h3 className="text-base font-bold text-[var(--studio-text)]">{title}</h3>
      {description && <p className="text-xs text-[var(--studio-muted)]">{description}</p>}
      <Link
        to={studioTabUrl(backTab)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
    </div>
  </div>
);
