import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { moduleName, type StudioAddon } from "../../addons";
import type { StudioTab } from "../../studio";
import { studioCard, studioSecondaryButton } from "../../studioTheme";
import { AddonSwitch } from "./AddonSwitch";

interface AddonCardProps {
  addon: StudioAddon;
  on: boolean;
  /** While the choice is on its way to the database. The switch waits, so it is not pressed twice. */
  saving: boolean;
  onToggle: (on: boolean) => void;
  onOpen: (tab: StudioTab) => void;
}

/** One add-on: what it is, what it gives, its switch, and the way into it while it is on. */
export const AddonCard: React.FC<AddonCardProps> = ({ addon, on, saving, onToggle, onOpen }) => {
  const Icon = addon.icon;
  const headingId = `tillegg-${addon.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={`${studioCard} p-5 flex flex-col gap-4 transition-colors ${on ? "border-emerald-600/60" : ""}`}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
            on ? "bg-emerald-600 text-white" : "bg-[var(--studio-row)] text-[var(--studio-icon)] border border-[var(--studio-border)]"
          }`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={headingId} className="text-sm font-black text-[var(--studio-text)]">
              {addon.name}
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                on ? "bg-emerald-600 text-white" : "bg-[var(--studio-row)] text-[var(--studio-muted)] border border-[var(--studio-border)]"
              }`}
            >
              {on ? "På" : "Av"}
            </span>
          </div>
          <p className="text-xs text-[var(--studio-muted)] mt-1">{addon.summary}</p>
        </div>
        <AddonSwitch on={on} label={addon.name} onChange={onToggle} disabled={saving} />
      </header>

      <ul className="space-y-1.5">
        {addon.gives.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-[var(--studio-text)]">
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3 border-t border-[var(--studio-border)] flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--studio-muted)] min-w-0 flex-1">
          {on ? `På: ligger i menyen under ${moduleName(addon.module)}.` : addon.whenOff}
        </p>
        {on &&
          addon.menu.map((entry) => (
            <button key={entry.tab} type="button" onClick={() => onOpen(entry.tab)} className={`${studioSecondaryButton} flex items-center gap-1.5`}>
              Åpne {entry.label}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ))}
      </div>
    </article>
  );
};
