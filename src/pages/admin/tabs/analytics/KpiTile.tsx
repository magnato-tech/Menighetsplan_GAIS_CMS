import React from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Change } from "../../../../utils/analyticsFormat";

interface KpiTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  /** Change since the period before. Absent when there is nothing to compare with. */
  change?: Change | null;
  /** Names the period compared with, e.g. "forrige 4 uker". */
  previousLabel?: string;
  /** Whether a rise is good news. All four key figures say yes. */
  upIsGood?: boolean;
  children?: React.ReactNode;
}

/** One key figure: label, value, how it moved, and what it rests on. */
export const KpiTile: React.FC<KpiTileProps> = ({ label, value, icon, change, previousLabel, upIsGood = true, children }) => {
  const good = change ? (change.direction === "up") === upIsGood : false;
  const changeClass =
    !change || change.direction === "flat"
      ? "text-[var(--studio-muted)]"
      : good
        ? "text-[var(--studio-good)]"
        : "text-[var(--studio-bad)]";
  const ChangeIcon = !change || change.direction === "flat" ? Minus : change.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="p-5 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[var(--studio-muted)]">{label}</span>
        <span className="text-[var(--studio-icon)]">{icon}</span>
      </div>
      <div className="text-3xl font-black text-[var(--studio-text)]">{value}</div>
      {change && previousLabel && (
        <p className={`flex items-center gap-1 text-[11px] font-bold ${changeClass}`}>
          <ChangeIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {change.text} fra {previousLabel}
          </span>
        </p>
      )}
      {children && <div className="text-[11px] text-[var(--studio-muted)] space-y-0.5">{children}</div>}
    </div>
  );
};
