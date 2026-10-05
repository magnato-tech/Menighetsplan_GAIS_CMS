import React, { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Gathering, GatheringHeadcount } from "../../../../types";
import type { ActionResult } from "../../../../context/FirebaseDataContext";
import { parseHeadcountForm, headcountTotal, type HeadcountInput } from "../../../../utils/headcount";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import { locationOf } from "../../../../utils/gatherings";
import { studioInputFull, studioPrimaryButton, studioSecondaryButton } from "../../studioTheme";
import type { ShowFeedback } from "../../studio";

interface HeadcountDialogProps {
  gathering: Gathering;
  existing?: GatheringHeadcount;
  onSave: (gatheringId: string, input: HeadcountInput) => ActionResult;
  onRemove: (gatheringId: string) => ActionResult;
  onClose: () => void;
  showFeedback: ShowFeedback;
}

/** Register, correct or remove how many were at a gathering. */
export const HeadcountDialog: React.FC<HeadcountDialogProps> = ({ gathering, existing, onSave, onRemove, onClose, showFeedback }) => {
  const titleId = useId();
  const adultsId = useId();
  const childrenId = useId();
  const noteId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [adults, setAdults] = useState(existing ? String(existing.adults) : "");
  const [children, setChildren] = useState(existing ? String(existing.children) : "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  // Focus starts in the first field, and goes back to the column or button that opened the dialog
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const parsed = parseHeadcountForm(adults, children, note);
  const preview = parsed.ok ? headcountTotal(parsed.value) : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const result = onSave(gathering.id, parsed.value);
    if (!result.success) {
      setError(result.error ?? "Oppmøtetallet kunne ikke lagres.");
      return;
    }
    showFeedback(`Oppmøtetallet for «${gathering.title}» er lagret.`);
    onClose();
  };

  const handleRemove = () => {
    const result = onRemove(gathering.id);
    if (!result.success) {
      setError(result.error ?? "Oppmøtetallet kunne ikke fjernes.");
      return;
    }
    showFeedback(`Oppmøtetallet for «${gathering.title}» er fjernet.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--studio-overlay)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl bg-[var(--studio-bg)] border border-[var(--studio-border)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--studio-border)]">
          <div>
            <h3 id={titleId} className="text-sm font-bold text-[var(--studio-text)]">
              {existing ? "Endre oppmøtetall" : "Registrer oppmøtetall"}
            </h3>
            <p className="text-[11px] text-[var(--studio-muted)] mt-0.5">
              {gathering.title} · {formatNorwegianDateTime(gathering.startsAt)} · {locationOf(gathering)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--studio-muted)] hover:text-[var(--studio-text)] hover:bg-[var(--studio-surface)] cursor-pointer"
            aria-label="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <p className="text-xs text-[var(--studio-muted)]">
            Skriv inn hvor mange som var til stede, talt på dagen. Tell barn under konfirmasjonsalder som barn.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={adultsId} className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
                Voksne
              </label>
              <input
                ref={firstFieldRef}
                id={adultsId}
                inputMode="numeric"
                value={adults}
                onChange={(e) => {
                  setAdults(e.target.value);
                  setError(null);
                }}
                className={studioInputFull}
              />
            </div>
            <div>
              <label htmlFor={childrenId} className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
                Barn
              </label>
              <input
                id={childrenId}
                inputMode="numeric"
                value={children}
                onChange={(e) => {
                  setChildren(e.target.value);
                  setError(null);
                }}
                className={studioInputFull}
              />
            </div>
          </div>
          <div>
            <label htmlFor={noteId} className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
              Merknad (valgfritt)
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={studioInputFull}
              placeholder="f.eks. Dåp, mange besøkende"
              maxLength={200}
            />
          </div>

          <p className="text-xs text-[var(--studio-text)]" aria-live="polite">
            Totalt: <strong>{preview ?? "–"}</strong>
          </p>
          {error && (
            <p role="alert" className="text-xs font-bold text-[var(--studio-bad)]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {existing ? (
              <button type="button" onClick={handleRemove} className={studioSecondaryButton}>
                Fjern tellingen
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className={studioSecondaryButton}>
                Avbryt
              </button>
              <button type="submit" className={`${studioPrimaryButton} px-4 py-1.5 text-xs`}>
                Lagre oppmøtetall
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
