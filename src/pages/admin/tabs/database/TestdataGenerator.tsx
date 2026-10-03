import React, { useState } from "react";
import { AlertCircle, Check, CheckCircle2, Loader2, RefreshCw, Sliders, Sparkles } from "lucide-react";
import {
  DEFAULT_TESTDATA_PRESET,
  TESTDATA_PRESETS,
  TESTDATA_SLIDERS,
  includedSummary,
  matchingPresetId,
  sizeOfPreset,
  type TestdataPreset,
  type TestdataSize,
} from "../../../../utils/testdataPresets";

interface Props {
  isWorking: boolean;
  onPopulate: (size: TestdataSize, clearPlannerFirst: boolean) => void;
}

/** Choose a ready-made pack or set the sizes by hand, then fill the database with test data. */
export const TestdataGenerator: React.FC<Props> = ({ isWorking, onPopulate }) => {
  const [size, setSize] = useState<TestdataSize>(sizeOfPreset(DEFAULT_TESTDATA_PRESET));
  const [clearPlannerFirst, setClearPlannerFirst] = useState(true);
  const activePreset = matchingPresetId(size);

  const choose = (preset: TestdataPreset) => setSize(sizeOfPreset(preset));

  return (
    <section className="space-y-4">
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generer og populer testdata</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Velg en ferdig pakke eller finjuster glidebryterne for nøyaktig antall personer, grupper, samlinger og
              oppgaver.
            </p>
          </div>
          <span className="text-[11px] text-indigo-300 font-semibold bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-1 rounded-lg">
            Maks oppsett: 32 personer / 12 grupper
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Velg en forhåndsdefinert pakke:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TESTDATA_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => choose(preset)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                      : "bg-slate-900/60 border-slate-700 hover:border-slate-600 hover:bg-slate-900"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{preset.name}</span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {preset.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span>{preset.personCount} personer</span>
                    <span>{preset.groupCount} grupper</span>
                    <span>{preset.gatheringCount} samlinger</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Finjuster antall elementer for populering</span>
            </span>
            {activePreset === "custom" && (
              <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                Egendefinert oppsett
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {TESTDATA_SLIDERS.map((slider) => (
              <div key={slider.field} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{slider.label}</span>
                  <span className={`font-mono font-bold text-sm ${slider.valueClass}`}>
                    {size[slider.field]} av {slider.max}
                  </span>
                </div>
                <input
                  type="range"
                  aria-label={slider.label}
                  min={slider.min}
                  max={slider.max}
                  value={size[slider.field]}
                  onChange={(e) => setSize({ ...size, [slider.field]: Number(e.target.value) })}
                  className={`w-full cursor-pointer ${slider.trackClass}`}
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  {slider.marks.map((mark) => (
                    <span key={mark}>{mark}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Hva inkluderes med {size.personCount} personer og {size.groupCount} grupper:
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">{includedSummary(size.personCount)}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-start gap-3">
          <input
            id="clear-before-populate-checkbox"
            type="checkbox"
            checked={clearPlannerFirst}
            onChange={(e) => setClearPlannerFirst(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer accent-indigo-600"
          />
          <label htmlFor="clear-before-populate-checkbox" className="text-xs space-y-0.5 cursor-pointer">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>Tøm eksisterende testpersoner og planleggerdata før fylling</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
                Standard / Anbefalt
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fjerner tidligere testpersoner, grupper, samlinger og oppgaver i planleggeren før nye data legges inn,
              slik at databasen forblir ren og fri for duplikater.
              <span className="text-emerald-300 font-medium ml-1">
                CMS-sider, artikler, taler og nettstedsinnstillinger bevares trygt intakt.
              </span>
            </p>
          </label>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {clearPlannerFirst ? (
              <span className="text-amber-300/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Tømmer eksisterende planleggerdata før fylling
              </span>
            ) : (
              <span className="text-slate-400">Overskriver eksisterende dokumenter med samme ID (uten sletting)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPopulate(size, clearPlannerFirst)}
            disabled={isWorking}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            {isWorking ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <RefreshCw className="w-4 h-4 text-white" />}
            <span>
              {isWorking
                ? "Skriver til databasen …"
                : `Populer databasen (${size.personCount} personer, ${size.groupCount} grupper)`}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
