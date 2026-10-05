import React from "react";
import { EyeOff } from "lucide-react";

interface AnalyticsSectionProps {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  /** Controls on the right of the heading, such as a filter or a view switch. */
  actions?: React.ReactNode;
  /** Hides the module from this person's board. */
  onHide?: () => void;
  children: React.ReactNode;
}

/** A titled card on the analysis board. */
export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ id, title, description, icon, actions, onHide, children }) => (
  <section
    aria-labelledby={id}
    className="p-5 sm:p-6 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] space-y-5"
  >
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-[var(--studio-icon)]">{icon}</span>
        <div>
          <h2 id={id} className="text-base font-bold text-[var(--studio-text)]">
            {title}
          </h2>
          {description && <p className="text-xs text-[var(--studio-muted)] mt-0.5 max-w-2xl">{description}</p>}
        </div>
      </div>
      {(actions || onHide) && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              aria-label={`Skjul ${title}`}
              title="Skjul modulen. Den kan vises igjen under Tilpass bordet."
              className="p-1.5 rounded-lg text-[var(--studio-muted)] hover:text-[var(--studio-text)] hover:bg-[var(--studio-hover)] cursor-pointer"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
    {children}
  </section>
);

/** A small figure inside a section: "Forfall · 3 · hvorav 1 akutt". */
export const MiniStat: React.FC<{ label: string; value: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="p-3 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)]">
    <div className="text-[11px] font-bold text-[var(--studio-muted)]">{label}</div>
    <div className="text-xl font-black text-[var(--studio-text)] mt-0.5">{value}</div>
    {children && <div className="text-[11px] text-[var(--studio-muted)] mt-0.5">{children}</div>}
  </div>
);
