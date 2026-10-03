import React from "react";
import { BadgeCheck, Mail, Phone, Shield, User } from "lucide-react";
import type { PersonFormValues } from "../../utils/personForm";
import type { SetPersonField } from "./usePersonForm";

interface Props {
  form: PersonFormValues;
  set: SetPersonField;
}

const inputClass =
  "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

/** Name, contact details, system role and police certificate. */
export const PersonBasicsFields: React.FC<Props> = ({ form, set }) => (
  <>
    <div className="space-y-1.5">
      <label htmlFor="input-edit-person-name" className={labelClass}>
        <User className="w-3.5 h-3.5 text-indigo-600" />
        Fullt navn:
      </label>
      <input
        type="text"
        id="input-edit-person-name"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="F.eks. Kari Nordmann..."
        className={inputClass}
      />
    </div>

    <div className="space-y-1.5">
      <label htmlFor="input-edit-person-phone" className={labelClass}>
        <Phone className="w-3.5 h-3.5 text-indigo-600" />
        Mobilnummer:
      </label>
      <input
        type="tel"
        id="input-edit-person-phone"
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
        placeholder="F.eks. 912 34 567"
        className={inputClass}
      />
    </div>

    <div className="space-y-1.5">
      <label htmlFor="input-edit-person-email" className={labelClass}>
        <Mail className="w-3.5 h-3.5 text-indigo-600" />
        E-postadresse:
      </label>
      <input
        type="email"
        id="input-edit-person-email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        placeholder="F.eks. kari@eksempel.no"
        className={inputClass}
      />
    </div>

    <div className="space-y-1.5 pt-1 border-t border-slate-100">
      <label
        htmlFor="select-edit-person-role"
        className="text-xs font-bold text-slate-700 flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          Rolle i systemet:
        </span>
        <span className="text-[10px] text-slate-400 font-normal">(Flere kan være administratorer)</span>
      </label>
      <select
        id="select-edit-person-role"
        value={form.globalRole}
        onChange={(e) => set("globalRole", e.target.value as "member" | "admin")}
        className={inputClass}
      >
        <option value="member">Medlem / Frivillig (standard tilgang)</option>
        <option value="admin">Administrator (full tilgang til Admin Studio & CMS)</option>
      </select>
    </div>

    <div className="space-y-1.5 pt-1 border-t border-slate-100">
      <label
        htmlFor="input-edit-person-police"
        className="text-xs font-bold text-slate-700 flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
          Politiattest (gyldig til dato):
        </span>
        {form.policeCert ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Registrert ({form.policeCert})
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-normal">Ikke registrert</span>
        )}
      </label>
      <input
        type="date"
        id="input-edit-person-police"
        value={form.policeCert}
        onChange={(e) => set("policeCert", e.target.value)}
        className={inputClass}
      />
      <p className="text-[10px] text-slate-500">
        Påkrevd for frivillige som arbeider med mindreårige (søndagsskole og barneleir).
      </p>
    </div>
  </>
);
