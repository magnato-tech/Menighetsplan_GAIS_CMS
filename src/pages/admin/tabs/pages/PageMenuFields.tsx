import React from "react";
import { FolderTree, Layers } from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { menuOrderOf, parentIdOf, withMenuOrder, withParent } from "../../../../utils/pageEdit";

interface Props {
  page: Partial<CmsPage>;
  availableParentPages: CmsPage[];
  onUpdate: (updated: Partial<CmsPage>) => void;
}

const fieldClass =
  "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500";

/** Where the page sits in the menu: under which main tab, and in what order. */
export const PageMenuFields: React.FC<Props> = ({ page, availableParentPages, onUpdate }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-white flex items-center gap-1.5">
        <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
        <span>Hovedfane / Forelder</span>
      </label>
      <select
        value={parentIdOf(page) || ""}
        onChange={(e) => onUpdate(withParent(page, e.target.value))}
        className={`${fieldClass} cursor-pointer`}
      >
        <option value="">Ingen (Dette er en topp-nivå hovedfane)</option>
        {availableParentPages.map((parent) => (
          <option key={parent.id} value={parent.id}>
            📁 Underfane under: {parent.title} (/{parent.slug})
          </option>
        ))}
      </select>
      <p className="text-[11px] text-slate-400">
        Velg om siden skal ligge direkte i menylinjen eller som et valg i nedtrekksmenyen under en hovedfane.
      </p>
    </div>

    <div className="space-y-1.5">
      <label className="text-xs font-bold text-white flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>Menyrekkefølge</span>
      </label>
      <input
        type="number"
        min={1}
        value={menuOrderOf(page)}
        onChange={(e) => onUpdate(withMenuOrder(page, parseInt(e.target.value, 10) || 1))}
        className={fieldClass}
      />
      <p className="text-[11px] text-slate-400">Lavt tall vises først fra venstre (f.eks. 1 = først, 2 = neste).</p>
    </div>
  </div>
);
