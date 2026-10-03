import React, { useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Info,
  LayoutGrid,
  MousePointerClick,
  Plus,
  Quote,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CmsPage } from "../../../../data/cmsData";
import { appendBlock } from "../../../../utils/pageEdit";
import { ContentBlockPickerModal } from "./ContentBlockPickerModal";

interface Props {
  page: Partial<CmsPage>;
  onUpdate: (updated: Partial<CmsPage>) => void;
}

interface QuickBlock {
  label: string;
  title: string;
  snippet: string;
  Icon: LucideIcon;
  /** Button colours, and the icon's */
  button: string;
  icon: string;
}

/** The blocks that can be added with one click. The rest are in the picker behind «Legg til innhold». */
const TEXT_BLOCKS: QuickBlock[] = [
  {
    label: "Infoboks",
    title: "Sett inn infoboks",
    snippet: ":::callout[info] Informasjon\nDette er en fremhevet infoboks for kunngjøringer eller nyttig informasjon for menigheten.\n:::",
    Icon: Info,
    button: "bg-sky-950/80 hover:bg-sky-900 text-sky-300 border-sky-800/80",
    icon: "text-sky-400",
  },
  {
    label: "Viktig varsel",
    title: "Sett inn viktig varsel",
    snippet: ":::callout[warning] Viktig merknad\nVennligst merk at arrangementet krever forhåndspåmelding eller spesiell oppfølging.\n:::",
    Icon: AlertTriangle,
    button: "bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-800/80",
    icon: "text-amber-400",
  },
  {
    label: "2-kolonners kort",
    title: "Sett inn to likeverdige kort side ved side",
    snippet:
      ":::grid\n:::card Fellesskap & Grupper\nBli med i en av våre livsnære cellegrupper eller temakvelder.\n:::\n:::card Bønn & Omsorg\nVi ber for hverandre og tilbyr samtaler og forbønn ved behov.\n:::\n:::",
    Icon: LayoutGrid,
    button: "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-800/80",
    icon: "text-emerald-400",
  },
  {
    label: "Sitatblokk",
    title: "Sett inn sitatblokk",
    snippet: ":::quote[Pastorens hilsen]\nVelkommen hjem til et varmt og inkluderende fellesskap for alle generasjoner.\n:::",
    Icon: Quote,
    button: "bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800/80",
    icon: "text-indigo-400",
  },
  {
    label: "Handlingsknapp",
    title: "Sett inn handlingsknapp",
    snippet: "[Knapp: Meld deg på samlingen](/kontakt)",
    Icon: MousePointerClick,
    button: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
    icon: "text-indigo-400",
  },
];

const PERSON_BLOCKS: QuickBlock[] = [
  {
    label: "Stab (ansatte)",
    title: "Sett inn alle ansatte i staben med bilde og kontaktinfo",
    snippet: ":::personer[stab]",
    Icon: Briefcase,
    button: "bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border-indigo-800/60",
    icon: "text-indigo-400",
  },
  {
    label: "Lederskap",
    title: "Sett inn lederskapet med verv",
    snippet: ":::personer[lederskap]",
    Icon: Shield,
    button: "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-800/60",
    icon: "text-amber-400",
  },
  {
    label: "Kun pastor",
    title: "Sett inn kun pastoren",
    snippet: ":::personer[pastor]",
    Icon: Users,
    button: "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800/60",
    icon: "text-emerald-400",
  },
];

const QuickBlockButton: React.FC<{ block: QuickBlock; onInsert: (snippet: string) => void }> = ({ block, onInsert }) => (
  <button
    type="button"
    onClick={() => onInsert(block.snippet)}
    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${block.button}`}
    title={block.title}
  >
    <block.Icon className={`w-3 h-3 ${block.icon}`} />
    <span>{block.label}</span>
  </button>
);

/** The page's main text, with buttons that add ready-made blocks at the end of it. */
export const PageContentField: React.FC<Props> = ({ page, onUpdate }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const insert = (snippet: string) => onUpdate({ ...page, content: appendBlock(page.content, snippet) });

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-xs font-semibold text-slate-300 block">Hovedinnhold</label>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ferdige innholdsblokker:</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Åpne visuell blokkvelger med forhåndsvisning av alle innholdsblokker"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Legg til innhold</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {TEXT_BLOCKS.map((block) => (
            <QuickBlockButton key={block.label} block={block} onInsert={insert} />
          ))}
          <span className="w-px h-4 bg-slate-700 mx-1 hidden sm:inline-block" />
          {PERSON_BLOCKS.map((block) => (
            <QuickBlockButton key={block.label} block={block} onInsert={insert} />
          ))}
        </div>
      </div>

      <textarea
        rows={7}
        value={page.content || ""}
        onChange={(e) => onUpdate({ ...page, content: e.target.value })}
        placeholder="Skriv tekst eller bruk komponentknappene ovenfor..."
        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
      />

      <ContentBlockPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onInsertBlock={insert} />
    </div>
  );
};
