import React from "react";
import { Calendar, Check, Clock, X } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import {
  presetPublishTime,
  publishState,
  toDatetimeLocal,
  withoutPublishTime,
  withPublishTime,
  type PublishPreset,
} from "../../../../utils/pageEdit";

interface Props {
  page: Partial<CmsPage>;
  onUpdate: (updated: Partial<CmsPage>) => void;
}

const PRESETS: { id: PublishPreset; label: string; title: string }[] = [
  { id: "tomorrow", label: "I morgen 09:00", title: "Sett publisering til i morgen kl. 09:00" },
  { id: "sunday", label: "Søndag 08:00", title: "Sett publisering til kommende søndag kl. 08:00" },
  { id: "monday", label: "Mandag 09:00", title: "Sett publisering til neste mandag kl. 09:00" },
];

/** Whether the page is live, a draft or held back until a time, and whether it is in the public menu. */
export const PagePublishingSection: React.FC<Props> = ({ page, onUpdate }) => {
  const { isFutureScheduled, isManuallyPublished, isDraft } = publishState(page);

  return (
    <div className="bg-slate-900/60 border border-slate-700/70 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
              <span>Publiseringsstatus & Tidsstyring</span>
              {isFutureScheduled && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/70 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" />
                  <span>Planlagt publisering</span>
                </span>
              )}
              {isManuallyPublished && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/70 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" />
                  <span>Publisert (aktiv)</span>
                </span>
              )}
              {isDraft && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/70 flex items-center gap-1 font-semibold">
                  <span>Kladd (upublisert)</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Styr når siden skal gå fra 'Kladd' til 'Publisert', enten umiddelbart eller automatisk på en valgt dato.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors">
          <input
            type="checkbox"
            checked={page.isPublished !== false}
            onChange={(e) => onUpdate({ ...page, isPublished: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-0"
          />
          <div>
            <span className="font-semibold block text-white text-xs">Aktiver publisering</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              Når aktivert, vil siden være synlig for publikum (eller automatisk fra planlagt dato).
            </span>
          </div>
        </label>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors">
          <input
            type="checkbox"
            checked={page.inNavMenu !== false}
            onChange={(e) => onUpdate({ ...page, inNavMenu: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-0"
          />
          <div>
            <span className="font-semibold block text-white text-xs">Vis i offentlig meny</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              Vises i toppmenyen eller nedtrekksmenyen. Slått av er siden bare tilgjengelig via direkte lenke.
            </span>
          </div>
        </label>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Publiseringsdato & tidspunkt (Planlegging)</span>
          </label>
          {page.publishAt && (
            <button
              type="button"
              onClick={() => onUpdate(withoutPublishTime(page))}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Fjern tidsplan og publiser umiddelbart"
            >
              <X className="w-3 h-3" />
              <span>Nullstill dato (publiser umiddelbart)</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="datetime-local"
              value={toDatetimeLocal(page.publishAt)}
              onChange={(e) => onUpdate(withPublishTime(page, e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdate(withPublishTime(page, presetPublishTime(preset.id)))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                title={preset.title}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {page.publishAt ? (
          isFutureScheduled ? (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-blue-100">Planlagt for automatisk publisering:</span>
                <p className="text-[11px] text-blue-300/90 leading-relaxed">
                  Siden holdes automatisk som en skjult kladd for publikum frem til{" "}
                  <strong className="text-white font-semibold">{formatNorwegianDateTime(page.publishAt)}</strong>. Da
                  går siden automatisk over til statusen «Publisert» uten manuell handling.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-emerald-300">
                Publiseringsdato er passert ({formatNorwegianDateTime(page.publishAt)}). Siden er aktiv og synlig på
                nettsiden.
              </span>
            </div>
          )
        ) : (
          <p className="text-[11px] text-slate-400">
            💡 La feltet stå tomt hvis du vil publisere siden umiddelbart ved lagring.
          </p>
        )}
      </div>
    </div>
  );
};
