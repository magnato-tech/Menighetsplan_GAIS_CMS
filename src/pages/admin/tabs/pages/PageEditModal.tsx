import React from "react";
import { CmsPage } from "../../../../data/cmsData";
import { Edit3, X, Eye } from "lucide-react";
import { HeroImageUploader } from "./HeroImageUploader";
import { PageContentField } from "./PageContentField";
import { PageMenuFields } from "./PageMenuFields";
import { PagePublishingSection } from "./PagePublishingSection";
import { PageSeoSection } from "./PageSeoSection";
import { parentIdOf } from "../../../../utils/pageEdit";

interface PageEditModalProps {
  editingPage: Partial<CmsPage>;
  isNewPage: boolean;
  availableParentPages: CmsPage[];
  onUpdate: (updated: Partial<CmsPage>) => void;
  onSave: (e: React.FormEvent) => void;
  onPreview: (draft: Partial<CmsPage>) => void;
  onClose: () => void;
}

const fieldClass =
  "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500";

export const PageEditModal: React.FC<PageEditModalProps> = ({
  editingPage,
  isNewPage,
  availableParentPages,
  onUpdate,
  onSave,
  onPreview,
  onClose,
}) => (
  <form
    onSubmit={onSave}
    className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4 transition-all"
  >
    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-indigo-400" />
        <span>
          {isNewPage
            ? parentIdOf(editingPage)
              ? "Opprett ny underfane"
              : "Opprett ny hovedfane"
            : `Rediger side: ${editingPage.title || "Uten tittel"}`}
        </span>
      </h3>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPreview(editingPage)}
          className="px-2.5 py-1 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Forhåndsvis hvordan denne kladden vil se ut for besøkende"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Forhåndsvis kladd</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
          aria-label="Lukk"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-300 block">Sidetittel (Vises i meny og header)</label>
        <input
          type="text"
          required
          value={editingPage.title || ""}
          onChange={(e) => onUpdate({ ...editingPage, title: e.target.value })}
          placeholder="f.eks. Om oss, Barn & Unge, Kontakt"
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-300 block">Adresse (f.eks. om-oss)</label>
        <input
          type="text"
          value={editingPage.slug || ""}
          onChange={(e) => onUpdate({ ...editingPage, slug: e.target.value })}
          placeholder="om-oss (eller genereres automatisk fra tittel)"
          className={`${fieldClass} font-mono`}
        />
      </div>
    </div>

    <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 block">Overstyr lenkeadresse (valgfritt)</label>
        <span className="text-[10px] text-slate-400">
          Peker menyvalget til en innebygd side som /hva-skjer, /fellesskap eller /taler, eller til en full nettadresse
        </span>
      </div>
      <input
        type="text"
        value={editingPage.linkUrl || ""}
        onChange={(e) => onUpdate({ ...editingPage, linkUrl: e.target.value })}
        placeholder="f.eks. /hva-skjer eller https://..."
        className={`${fieldClass} font-mono`}
      />
    </div>

    <PageMenuFields page={editingPage} availableParentPages={availableParentPages} onUpdate={onUpdate} />

    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-300 block">Kort ingress / sammendrag</label>
      <input
        type="text"
        value={editingPage.summary || ""}
        onChange={(e) => onUpdate({ ...editingPage, summary: e.target.value })}
        placeholder="Kort beskrivelse som vises under tittelen på siden..."
        className={fieldClass}
      />
    </div>

    <HeroImageUploader
      currentImageUrl={editingPage.heroImage}
      onImageChange={(url) => onUpdate({ ...editingPage, heroImage: url })}
      pageTitle={editingPage.title}
    />

    <PageContentField page={editingPage} onUpdate={onUpdate} />
    <PageSeoSection page={editingPage} onUpdate={onUpdate} />
    <PagePublishingSection page={editingPage} onUpdate={onUpdate} />

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
      <button
        type="button"
        onClick={() => onPreview(editingPage)}
        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-indigo-300 hover:text-indigo-200 border border-indigo-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
        title="Forhåndsvis hvordan denne kladden ser ut med offentlig styling før publisering"
      >
        <Eye className="w-4 h-4 text-indigo-400" />
        <span>Forhåndsvis kladd</span>
      </button>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          Avbryt
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
        >
          Lagre side
        </button>
      </div>
    </div>
  </form>
);
