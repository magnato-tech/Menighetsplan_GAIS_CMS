import React from "react";
import { FolderKanban, Tag } from "lucide-react";
import { GROUP_CATEGORIES } from "../../hooks/useAppHooks";
import type { GroupCategory } from "../../types";
import type { GroupFormValues } from "../../utils/groupForm";
import type { SetGroupField } from "./useGroupForm";

interface Props {
  form: GroupFormValues;
  set: SetGroupField;
}

const inputClass =
  "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

/** Name, category, tags, description, and whether the group is shown on the website. */
export const GroupBasicsFields: React.FC<Props> = ({ form, set }) => (
  <>
    <div className="space-y-1.5">
      <label htmlFor="input-edit-group-name" className={labelClass}>
        <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
        Gruppenavn:
      </label>
      <input
        type="text"
        id="input-edit-group-name"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="F.eks. Lyd og bilde..."
        className={inputClass}
      />
    </div>

    <div className="space-y-1.5">
      <label htmlFor="select-edit-group-category" className={labelClass}>
        <Tag className="w-3.5 h-3.5 text-indigo-600" />
        Gruppekategori:
      </label>
      <select
        id="select-edit-group-category"
        value={form.category}
        onChange={(e) => set("category", e.target.value as GroupCategory)}
        className={`${inputClass} cursor-pointer`}
      >
        {GROUP_CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.label}
          </option>
        ))}
      </select>
    </div>

    <div className="space-y-1.5">
      <label htmlFor="input-edit-group-tags" className={labelClass}>
        <Tag className="w-3.5 h-3.5 text-indigo-600" />
        Tagger (kommaseparert, f.eks. vekstgruppe, menighetsskole, bønn):
      </label>
      <input
        type="text"
        id="input-edit-group-tags"
        value={form.tags}
        onChange={(e) => set("tags", e.target.value)}
        placeholder="f.eks. vekstgruppe, menighetsskole, bønn"
        className={inputClass}
      />
    </div>

    <div className="space-y-1.5">
      <label htmlFor="input-edit-group-description" className={labelClass}>
        <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
        Beskrivelse / formål:
      </label>
      <textarea
        id="input-edit-group-description"
        rows={2}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Beskriv gruppens formål og målgruppe..."
        className={inputClass}
      />
    </div>

    <label
      htmlFor="input-edit-group-public"
      className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/70 cursor-pointer"
    >
      <input
        type="checkbox"
        id="input-edit-group-public"
        checked={form.isPublic}
        onChange={(e) => set("isPublic", e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-0"
      />
      <span className="text-xs">
        <span className="font-bold text-slate-800 block">Vis gruppen på nettsiden</span>
        <span className="text-[11px] text-slate-500">
          Uten krysset vises gruppen bare i planleggeren, ikke på nettsiden og ikke for eksterne nettsider som henter
          grupper herfra.
        </span>
      </span>
    </label>
  </>
);
