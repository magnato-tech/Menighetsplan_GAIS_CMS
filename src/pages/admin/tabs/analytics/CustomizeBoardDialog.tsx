import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { ANALYTICS_MODULES, isModuleShown, type AnalyticsModuleId } from "../../../../utils/analyticsModules";
import { studioPrimaryButton, studioSecondaryButton } from "../../studioTheme";

interface CustomizeBoardDialogProps {
  hiddenModules: readonly string[];
  onToggle: (moduleId: AnalyticsModuleId, hidden: boolean) => void;
  onShowAll: () => void;
  onClose: () => void;
}

/** Choose which modules are on the analysis board. Each choice is saved at once, for the person using it. */
export const CustomizeBoardDialog: React.FC<CustomizeBoardDialogProps> = ({ hiddenModules, onToggle, onShowAll, onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const shownCount = ANALYTICS_MODULES.filter((m) => isModuleShown(hiddenModules, m.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--studio-overlay)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[var(--studio-bg)] border border-[var(--studio-border)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--studio-border)]">
          <div>
            <h3 id={titleId} className="text-sm font-bold text-[var(--studio-text)]">
              Tilpass bordet
            </h3>
            <p className="text-[11px] text-[var(--studio-muted)] mt-0.5">
              Velg hvilke moduler du vil se. Valget lagres for deg, og gjelder ikke for andre.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--studio-muted)] hover:text-[var(--studio-text)] hover:bg-[var(--studio-surface)] cursor-pointer"
            aria-label="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="p-3 space-y-1 overflow-y-auto">
          {ANALYTICS_MODULES.map((module) => {
            const shown = isModuleShown(hiddenModules, module.id);
            const inputId = `${titleId}-${module.id}`;
            return (
              <li key={module.id}>
                <label
                  htmlFor={inputId}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--studio-surface)] cursor-pointer"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={shown}
                    onChange={(e) => onToggle(module.id, !e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                  <span>
                    <span className="block text-xs font-bold text-[var(--studio-text)]">{module.title}</span>
                    <span className="block text-[11px] text-[var(--studio-muted)]">{module.description}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[var(--studio-border)]">
          <span className="text-[11px] text-[var(--studio-muted)]">
            {shownCount} av {ANALYTICS_MODULES.length} moduler vises
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onShowAll} disabled={shownCount === ANALYTICS_MODULES.length} className={`${studioSecondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}>
              Vis alle
            </button>
            <button type="button" onClick={onClose} className={`${studioPrimaryButton} px-4 py-1.5 text-xs`}>
              Ferdig
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
