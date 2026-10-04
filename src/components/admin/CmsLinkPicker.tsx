import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, Link2, Search, X } from "lucide-react";
import { useCms } from "../../context/CmsContext";
import {
  buildLinkContext,
  defaultHomePrimaryLink,
  describeCmsLink,
  findHomePage,
  linkChoices,
  validateCmsLink,
} from "../../utils/cmsLinks";

interface CmsLinkPickerProps {
  value: string;
  onChange: (value: string) => void;
  currentPageId?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

export const CmsLinkPicker: React.FC<CmsLinkPickerProps> = ({
  value,
  onChange,
  currentPageId,
  allowEmpty = false,
  emptyLabel = "Ingen lenke",
  className = "",
}) => {
  const { pages } = useCms();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [externalMode, setExternalMode] = useState(false);
  const [externalDraft, setExternalDraft] = useState("");

  const context = useMemo(
    () => buildLinkContext(pages, currentPageId),
    [pages, currentPageId]
  );

  const trimmed = value.trim();
  const isHomeEditor = currentPageId && findHomePage(pages)?.id === currentPageId;
  const effectiveValue =
    trimmed || (allowEmpty && isHomeEditor ? defaultHomePrimaryLink(pages) : trimmed);

  const validation = validateCmsLink(trimmed || effectiveValue, context, {
    allowUnpublished: true,
  });
  const displayLabel = trimmed
    ? describeCmsLink(trimmed, context)
    : allowEmpty
    ? emptyLabel
    : describeCmsLink(effectiveValue, context);

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = linkChoices(context);
    if (!q) return all;
    return all.filter(
      (choice) =>
        choice.label.toLowerCase().includes(q) || choice.group.toLowerCase().includes(q)
    );
  }, [context, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof choices>();
    for (const choice of choices) {
      const list = map.get(choice.group) || [];
      list.push(choice);
      map.set(choice.group, list);
    }
    return [...map.entries()];
  }, [choices]);

  const showWarning = Boolean(trimmed) && validation.status !== "ok";

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setExternalMode(false);
    setQuery("");
  };

  const openPanel = () => {
    setOpen(true);
    setExternalMode(false);
    setExternalDraft(trimmed.startsWith("http") ? trimmed : "");
    setQuery("");
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-white">
            <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate font-medium">{displayLabel}</span>
          </div>
          {trimmed && (
            <p className="mt-0.5 text-[10px] text-slate-500 truncate font-mono">{trimmed}</p>
          )}
        </div>
        <button
          type="button"
          onClick={openPanel}
          className="shrink-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold cursor-pointer"
        >
          Endre
        </button>
        {allowEmpty && trimmed && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Fjern lenke"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showWarning && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{validation.message || "Denne lenken peker på noe som ikke finnes lenger."}</span>
        </p>
      )}

      {open && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søk etter side eller seksjon..."
                className="flex-1 bg-transparent text-white text-xs focus:outline-hidden"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowEmpty && (
                <button
                  type="button"
                  onClick={() => pick("")}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  {emptyLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => setExternalMode((prev) => !prev)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border cursor-pointer inline-flex items-center gap-1 ${
                  externalMode
                    ? "border-indigo-500 text-indigo-300 bg-indigo-950/40"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Annen nettadresse</span>
              </button>
            </div>
          </div>

          {externalMode ? (
            <div className="p-3 space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 block">
                Full nettadresse
              </label>
              <input
                type="url"
                value={externalDraft}
                onChange={(e) => setExternalDraft(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => pick(externalDraft.trim())}
                disabled={!externalDraft.trim()}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                Bruk nettadresse
              </button>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto p-2 space-y-3">
              {groups.length === 0 && (
                <p className="text-xs text-slate-500 px-2 py-4 text-center">
                  Ingen treff. Prøv et annet søkeord.
                </p>
              )}
              {groups.map(([group, items]) => (
                <div key={group}>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.value}>
                        <button
                          type="button"
                          onClick={() => pick(item.value)}
                          className={`w-full text-left px-2 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between gap-2 ${
                            value === item.value
                              ? "bg-indigo-950/60 text-indigo-200 border border-indigo-800/60"
                              : "text-slate-200 hover:bg-slate-800"
                          }`}
                        >
                          <span>{item.label}</span>
                          {value === item.value && (
                            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg] text-indigo-400" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
