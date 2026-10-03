import React from "react";
import { Camera } from "lucide-react";
import type { Person } from "../../types";
import type { PersonFormValues } from "../../utils/personForm";

interface Props {
  person: Person;
  form: PersonFormValues;
  onUploadAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Portrait, name and role at the top of the person card, with the camera button for a new portrait. */
export const PersonIdentityHeader: React.FC<Props> = ({ person, form, onUploadAvatar }) => (
  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
    <div className="flex items-center gap-3">
      <div className="relative group">
        {form.avatarUrl ? (
          <img
            src={form.avatarUrl}
            alt={person.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shadow-2xs"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base">
            {person.name.charAt(0)}
          </div>
        )}
        <label
          htmlFor="input-avatar-upload"
          className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-xs"
          title="Last opp portrettbilde"
        >
          <Camera className="w-3 h-3" />
        </label>
        <input type="file" id="input-avatar-upload" accept="image/*" onChange={onUploadAvatar} className="hidden" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-800">{person.name}</h3>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {form.staffRole ? (
            <span className="font-semibold text-indigo-600">{form.staffRole}</span>
          ) : (
            <span>{person.email || "Ingen e-post"}</span>
          )}
        </div>
      </div>
    </div>
    <span
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
        person.globalRole === "admin"
          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
          : "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      {person.globalRole === "admin" ? "Administrator" : "Medlem"}
    </span>
  </div>
);
