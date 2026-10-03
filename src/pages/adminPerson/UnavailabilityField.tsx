import React, { useState } from "react";
import { CalendarX, Plus, Trash2 } from "lucide-react";
import type { UnavailablePeriod } from "../../types";

interface Props {
  periods: UnavailablePeriod[];
  onChange: (periods: UnavailablePeriod[]) => void;
  showFeedback: (text: string, type?: "success" | "error") => void;
}

/** The periods the person is away, with the three fields for adding a new one. */
export const UnavailabilityField: React.FC<Props> = ({ periods, onChange, showFeedback }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  const add = () => {
    if (!from || !to) {
      showFeedback("Både fra- og til-dato må oppgis for fravær.", "error");
      return;
    }
    onChange([...periods, { from, to, reason: reason.trim() || undefined }]);
    setFrom("");
    setTo("");
    setReason("");
    showFeedback("Fraværsperiode lagt til!");
  };

  return (
    <div className="space-y-2 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <CalendarX className="w-3.5 h-3.5 text-amber-600" />
          Utilgjengelig / Bortreist:
        </span>
        <span className="text-[10px] text-slate-400">{periods.length} perioder registrert</span>
      </div>

      {periods.length > 0 && (
        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          {periods.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg border border-slate-200/60"
            >
              <div>
                <strong className="text-slate-800">
                  {p.from} til {p.to}
                </strong>
                {p.reason && <span className="text-slate-500 ml-1.5">({p.reason})</span>}
              </div>
              <button
                type="button"
                onClick={() => onChange(periods.filter((_, i) => i !== idx))}
                className="text-rose-500 hover:text-rose-700 text-[11px] p-1 cursor-pointer"
                title="Fjern fraværsperiode"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Fra dato"
          className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Til dato"
          className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
        />
        <div className="flex gap-1">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Årsak (f.eks. Ferie)"
            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <button
            type="button"
            onClick={add}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0 cursor-pointer"
            title="Legg til fravær"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
