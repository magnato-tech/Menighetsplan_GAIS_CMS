import React from "react";
import { Briefcase } from "lucide-react";
import type { PersonFormValues, StaffCategory } from "../../utils/personForm";
import type { SetPersonField } from "./usePersonForm";

interface Props {
  form: PersonFormValues;
  set: SetPersonField;
}

/** Whether the person is on the staff, and the title, category, bio and picture the website shows for them. */
export const StaffFields: React.FC<Props> = ({ form, set }) => (
  <div className="space-y-3 pt-3 border-t border-slate-100 bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/80">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
        Stab & Ansettelse:
      </span>
      {form.isStaff ? (
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Ansatt i staben</span>
      ) : (
        <span className="text-[10px] text-slate-400 font-normal">Frivillig / Ikke stab</span>
      )}
    </div>

    <label htmlFor="input-edit-person-is-staff" className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        id="input-edit-person-is-staff"
        checked={form.isStaff}
        onChange={(e) => {
          set("isStaff", e.target.checked);
          if (e.target.checked && !form.isPublicProfile) set("isPublicProfile", true);
        }}
        className="w-4 h-4 mt-0.5 border border-slate-300 rounded-md cursor-pointer accent-indigo-600"
      />
      <span className="text-[11px] font-semibold text-slate-800">
        Personen er ansatt i staben og kan vises i stabsseksjoner på nettsiden
      </span>
    </label>

    {form.isStaff && (
      <div className="space-y-2.5 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stillingstittel utad</label>
            <input
              type="text"
              value={form.staffRole}
              onChange={(e) => set("staffRole", e.target.value)}
              placeholder="f.eks. Hovedpastor, Daglig leder..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori</label>
            <select
              value={form.staffCategory}
              onChange={(e) => set("staffCategory", e.target.value as StaffCategory)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="pastor">Pastor / Forkynner</option>
              <option value="stab">Administrasjon & Ledelse</option>
              <option value="barneleder">Barn & Ungdom</option>
              <option value="diakoni">Diakoni & Omsorg</option>
              <option value="annet">Annet</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Kort bio / introduksjon for nettsiden
          </label>
          <textarea
            rows={2}
            value={form.staffBio}
            onChange={(e) => set("staffBio", e.target.value)}
            placeholder="Skriv 1-3 setninger om personens ansvarsområde eller bakgrunn..."
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Bilde-URL:</label>
          <input
            type="url"
            value={form.avatarUrl}
            onChange={(e) => set("avatarUrl", e.target.value)}
            placeholder="https://... eller bruk kamerasymbolet øverst"
            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
          />
          {form.avatarUrl && (
            <button
              type="button"
              onClick={() => set("avatarUrl", "")}
              className="text-rose-500 hover:text-rose-700 text-xs px-1 cursor-pointer"
              title="Fjern bilde"
            >
              Fjern
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);
