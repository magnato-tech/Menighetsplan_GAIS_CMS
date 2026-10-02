import React, { useState, useEffect } from "react";
import { useCms } from "../../../context/CmsContext";
import {
  CmsDesignTheme,
  defaultCmsDesignTheme,
  THEME_PRESETS,
} from "../../../data/cmsData";
import {
  Palette,
  Check,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  LayoutTemplate,
  Info,
  Layers,
} from "lucide-react";
import { getThemeCssVariables, getThemeRadiusClass } from "../../../utils/themeUtils";

interface ThemeTabProps {
  showFeedback?: (text: string, type?: "success" | "error") => void;
}

const PRIMARY_SWATCHES = [
  { name: "Menighetsblå", hex: "#1e3a8a" },
  { name: "Kongeblå", hex: "#1d4ed8" },
  { name: "Salviegrønn", hex: "#166534" },
  { name: "Smaragdgrønn", hex: "#047857" },
  { name: "Terracotta", hex: "#c2410c" },
  { name: "Dyp Vinrød", hex: "#881337" },
  { name: "Plomme / Lilla", hex: "#581c87" },
  { name: "Skifergrå", hex: "#334155" },
];

const ACCENT_SWATCHES = [
  { name: "Varmt Gull", hex: "#d97706" },
  { name: "Himmelblå", hex: "#0284c7" },
  { name: "Dyp Petrol", hex: "#0d9488" },
  { name: "Liturgisk Rav", hex: "#ca8a04" },
  { name: "Frisk Cyan", hex: "#06b6d4" },
  { name: "Korallrød", hex: "#e11d48" },
  { name: "Myk Oliven", hex: "#65a30d" },
];

export const ThemeTab: React.FC<ThemeTabProps> = ({ showFeedback }) => {
  const { settings, saveSettings } = useCms();
  const [theme, setTheme] = useState<CmsDesignTheme>(() => settings.theme || defaultCmsDesignTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    if (settings.theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme]);

  const handleApplyPreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTheme({ ...found.theme });
    }
  };

  const handleSaveTheme = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const success = await saveSettings({ theme });
    setIsSaving(false);

    if (success) {
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
      showFeedback?.("Designtema og fargeprofil ble lagret i Firestore!");
    } else {
      showFeedback?.("Kunne ikke lagre designtema", "error");
    }
  };

  const handleReset = () => {
    setTheme({ ...defaultCmsDesignTheme });
  };

  const previewVars = getThemeCssVariables(theme);
  const previewRadiusClass = getThemeRadiusClass(theme);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-indigo-400" />
            <span>Tema & Designsystem</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sentral styring av menighetens globale farger, typografi, overflater og hjørneavrunding.
            Alle endringer oppdateres automatisk på alle offentlige CMS-sider og i forhåndsvisningen.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Gjenopprett opprinnelig standardtema"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tilbakestill</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveTheme()}
            disabled={isSaving}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              isSavedRecently
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="w-4 h-4" />
                <span>Lagret!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Lagrer..." : "Lagre designtema"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seksjon 1: Forhåndsdefinerte Kuraterte Temaer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Kuraterte Menighetstemaer</span>
          </h3>
          <span className="text-xs text-slate-400">Klikk for å laste ferdig palett</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected =
              theme.primaryColor === preset.theme.primaryColor &&
              theme.accentColor === preset.theme.accentColor &&
              theme.backgroundTone === preset.theme.backgroundTone;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500"
                    : "bg-slate-850/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-white text-sm">{preset.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Aktivt</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/40">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.theme.primaryColor }}
                      title={`Primær: ${preset.theme.primaryColor}`}
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.theme.accentColor }}
                      title={`Aksent: ${preset.theme.accentColor}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {preset.theme.headingFont === "serif" ? "Klassisk Serif" : "Moderne Sans"} · {preset.theme.borderRadius}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seksjon 2: Fargetilpasning og Variabler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venstre kolonne: Farger & Overflater */}
        <div className="space-y-6">
          {/* Primærfarge */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Primærfarge (Hovedprofil)</h4>
                <p className="text-xs text-slate-400">
                  Benyttes til primærknapper, tittelaksenter, fremhevede bokser og logo.
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-xl border border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: theme.primaryColor }}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-slate-900 border border-slate-700 p-1 shrink-0"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                placeholder="#1e3a8a"
              />
            </div>

            {/* Hurtigvalg for primærfarge */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Anbefalte toner:</span>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setTheme({ ...theme, primaryColor: swatch.hex })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      theme.primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                        ? "bg-slate-700 text-white ring-1 ring-white/50"
                        : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aksentfarge */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Aksentfarge (Detaljer & Kontraster)</h4>
                <p className="text-xs text-slate-400">
                  Benyttes til varsler, understreker, merker og sekundære fokuspunkter.
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-xl border border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-slate-900 border border-slate-700 p-1 shrink-0"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                placeholder="#d97706"
              />
            </div>

            {/* Hurtigvalg for aksentfarge */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Anbefalte toner:</span>
              <div className="flex flex-wrap gap-2">
                {ACCENT_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setTheme({ ...theme, accentColor: swatch.hex })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      theme.accentColor.toLowerCase() === swatch.hex.toLowerCase()
                        ? "bg-slate-700 text-white ring-1 ring-white/50"
                        : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bakgrunnstone */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-indigo-400" />
              <span>Bakgrunnstone på offentlige sider</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { id: "stone", label: "Nøytral Grå (Stone)", desc: "Klassisk, harmonisk og rolig tone" },
                { id: "warm", label: "Varm Sand (Warm)", desc: "Lun, innbydende og organisk følelse" },
                { id: "slate", label: "Kjølig Skifer (Slate)", desc: "Frisk, moderne og nøytral kontrast" },
                { id: "pure-white", label: "Ren Hvit (Pure)", desc: "Maksimalt lys og minimalistisk preg" },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setTheme({ ...theme, backgroundTone: bg.id as any })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    theme.backgroundTone === bg.id
                      ? "bg-indigo-950/60 border-indigo-500 text-white shadow-xs"
                      : "bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600"
                  }`}
                >
                  <div className="font-bold">{bg.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{bg.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Høyre kolonne: Typografi, Hjørner & Sanntids Forhåndsvisningskort */}
        <div className="space-y-6">
          {/* Typografi & Avrunding */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-400" />
              <span>Typografi & Skrifttyper</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Overskrifter (Heading font)</label>
                <select
                  value={theme.headingFont}
                  onChange={(e) => setTheme({ ...theme, headingFont: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold cursor-pointer"
                >
                  <option value="sans">Moderne Sans-serif (Ren og tydelig)</option>
                  <option value="serif">Klassisk Serif (Høytidelig og tradisjonsrik)</option>
                  <option value="display">Display Grotesk (Markant og kraftfull)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Brødtekst (Body font)</label>
                <select
                  value={theme.bodyFont}
                  onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold cursor-pointer"
                >
                  <option value="sans">Sans-serif (Enkelt og universelt lesbart)</option>
                  <option value="serif">Serif (Klassisk trykksak-følelse)</option>
                </select>
              </div>
            </div>

            {/* Hjørneavrunding */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <label className="font-semibold text-slate-300 text-xs flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hjørneavrunding på kort og bokser</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "sharp", label: "Skarp (6px)", radius: "rounded-md" },
                  { id: "medium", label: "Balansert (16px)", radius: "rounded-2xl" },
                  { id: "smooth", label: "Myk (24px)", radius: "rounded-3xl" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setTheme({ ...theme, borderRadius: r.id as any })}
                    className={`py-2 px-3 border text-center transition-all cursor-pointer ${r.radius} ${
                      theme.borderRadius === r.id
                        ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-xs"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sanntids demonstrasjonskort */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sanntids forhåndsvisning av designtema
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Direkte gjengivelse</span>
            </div>

            {/* Mocked public card */}
            <div
              style={previewVars}
              className={`p-6 bg-stone-50 border border-stone-200 text-stone-900 ${previewRadiusClass} space-y-4 shadow-sm`}
            >
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: previewVars["--cms-primary"] }}
                    className="w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-xs"
                  >
                    LMK
                  </div>
                  <span className="font-bold text-xs text-stone-800">Lillesand Misjonskirke</span>
                </div>
                <span
                  style={{
                    backgroundColor: `${theme.accentColor}20`,
                    color: theme.accentColor,
                    borderColor: `${theme.accentColor}50`,
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                >
                  Eksempelaksent
                </span>
              </div>

              <div>
                <h3
                  style={{ fontFamily: previewVars["--cms-font-heading"] }}
                  className="text-lg font-black text-stone-900"
                >
                  Varmt fellesskap og tydelig tro
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Dette viser hvordan typografi, bakgrunn og fargetoner samspiller på menighetens offentlige sider.
                </p>
              </div>

              {/* Sample callout */}
              <div className={`p-3 bg-sky-50 border border-sky-200 text-sky-950 ${previewRadiusClass} text-xs flex items-start gap-2 shadow-xs`}>
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="block text-[11px] uppercase tracking-wide">Ferdig infoboks</strong>
                  Komponenter bruker designsystemets avrunding og proporsjoner.
                </div>
              </div>

              {/* Action button */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  style={{
                    backgroundColor: previewVars["--cms-primary"],
                  }}
                  className={`px-4 py-2 text-white text-xs font-bold ${previewRadiusClass} shadow-xs`}
                >
                  Primærknapp
                </button>
                <span className="text-[11px] font-mono text-stone-500">
                  {theme.primaryColor} · {theme.headingFont}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lagreknapp i bunnen */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => handleSaveTheme()}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
            isSavedRecently
              ? "bg-emerald-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {isSavedRecently ? (
            <>
              <Check className="w-4 h-4" />
              <span>Endringer lagret!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Lagrer tema..." : "Lagre tema til Firestore"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
