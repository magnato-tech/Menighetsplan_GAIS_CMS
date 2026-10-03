import React from "react";
import { Globe } from "lucide-react";
import type { Person } from "../../types";
import type { PersonFormValues } from "../../utils/personForm";
import { toPublicProfile } from "../../utils/publicProfile";
import type { SetPersonField } from "./usePersonForm";

interface Props {
  person: Person;
  form: PersonFormValues;
  set: SetPersonField;
}

const inputClass = "w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs";

/** The person's consent to appear on the website, and the title and contact details shown with the name. */
export const PublicProfileFields: React.FC<Props> = ({ person, form, set }) => (
  <div className="space-y-2 pt-2 border-t border-slate-100">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-indigo-600" />
        Offentlig profil på nettsiden:
      </span>
      {toPublicProfile(person) ? (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Vises offentlig</span>
      ) : (
        <span className="text-[10px] text-slate-400 font-normal">Vises ikke</span>
      )}
    </div>

    <label htmlFor="input-edit-person-public" className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        id="input-edit-person-public"
        checked={form.isPublicProfile}
        onChange={(e) => set("isPublicProfile", e.target.checked)}
        className="w-4 h-4 mt-0.5 border border-slate-300 rounded-md cursor-pointer"
      />
      <span className="text-[11px] font-semibold text-slate-700">
        Personen har samtykket til å stå med navn på den offentlige nettsiden
      </span>
    </label>

    {person.consentToPublishGivenAt && (
      <p className="text-[10px] text-slate-500">
        Samtykke registrert {new Date(person.consentToPublishGivenAt).toLocaleDateString("no-NO")}.
      </p>
    )}

    {form.isPublicProfile && (
      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <input
          type="text"
          id="input-edit-person-public-title"
          aria-label="Tittel utad"
          value={form.publicTitle}
          onChange={(e) => set("publicTitle", e.target.value)}
          placeholder="Tittel utad, f.eks. Hovedpastor"
          className={inputClass}
        />
        <input
          type="tel"
          id="input-edit-person-public-phone"
          aria-label="Telefon utad"
          value={form.publicPhone}
          onChange={(e) => set("publicPhone", e.target.value)}
          placeholder="Telefon utad (valgfritt)"
          className={inputClass}
        />
        <input
          type="email"
          id="input-edit-person-public-email"
          aria-label="E-post utad"
          value={form.publicEmail}
          onChange={(e) => set("publicEmail", e.target.value)}
          placeholder="E-post utad (valgfritt)"
          className={inputClass}
        />
        <p className="text-[10px] text-slate-500">
          Bare navnet og disse feltene vises utad. Privat mobilnummer og e-postadresse publiseres aldri.
        </p>
      </div>
    )}
  </div>
);
