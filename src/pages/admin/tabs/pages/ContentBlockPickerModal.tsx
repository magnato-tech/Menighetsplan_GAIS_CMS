import React, { useEffect } from "react";
import {
  X,
  LayoutGrid,
  Image,
  Quote,
  Info,
  MousePointerClick,
  Sparkles,
  Plus,
} from "lucide-react";

export interface ContentBlockDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  template: string;
  previewNode: React.ReactNode;
}

interface ContentBlockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlock: (snippet: string) => void;
}

export const CONTENT_BLOCKS: ContentBlockDefinition[] = [
  {
    id: "grid-2",
    title: "To-kolonne innholdsgrid",
    category: "Struktur",
    description: "To likeverdige kort side ved side med overskrift og ramme. Ideelt for aktiviteter, grupper og tilbud.",
    icon: <LayoutGrid className="w-5 h-5 text-emerald-400" />,
    template: `:::grid
:::card Fellesskap & Husgrupper
Bli med i et livsnært fellesskap som møtes i hjemmene annenhver uke for samtale, bibel og kaffe.
:::
:::card Bønn & Omsorg
Vi ber sammen for hverandre og menigheten. Ta kontakt om du ønsker en samtale eller forbønn.
:::
:::`,
    previewNode: (
      <div className="grid grid-cols-2 gap-2 text-[10px] w-full">
        <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-800 space-y-1">
          <div className="font-bold text-stone-900 truncate">Kort 1: Fellesskap</div>
          <div className="h-1.5 w-4/5 bg-stone-300 rounded" />
          <div className="h-1.5 w-3/5 bg-stone-300 rounded" />
        </div>
        <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-800 space-y-1">
          <div className="font-bold text-stone-900 truncate">Kort 2: Bønn</div>
          <div className="h-1.5 w-4/5 bg-stone-300 rounded" />
          <div className="h-1.5 w-3/5 bg-stone-300 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "media-left",
    title: "Bilde med tekst (Venstre)",
    category: "Media & Tekst",
    description: "Illustrasjonsbilde på venstre side med tilhørende overskrift og brødtekst til høyre.",
    icon: <Image className="w-5 h-5 text-indigo-400" />,
    template: `:::media-left[https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80]
### Fellesskap for alle generasjoner
Vi tror på verdien av nære relasjoner der alle blir sett, inkludert og verdsatt. Hos oss er det rom for både store og små spørsmål.
:::`,
    previewNode: (
      <div className="flex items-center gap-2.5 text-[10px] w-full p-2 rounded-lg bg-stone-100 border border-stone-300">
        <div className="w-12 h-10 rounded bg-indigo-200 border border-indigo-300 shrink-0 flex items-center justify-center text-indigo-700 font-bold text-[9px]">
          Bilde
        </div>
        <div className="flex-1 space-y-1">
          <div className="font-bold text-stone-900 text-[11px] truncate">Tittel overskrift</div>
          <div className="h-1.5 w-full bg-stone-300 rounded" />
          <div className="h-1.5 w-2/3 bg-stone-300 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "media-right",
    title: "Bilde med tekst (Høyre)",
    category: "Media & Tekst",
    description: "Tekst og overskrift til venstre, bilde til høyre for en variert og dynamisk sidelayout.",
    icon: <Image className="w-5 h-5 text-sky-400" />,
    template: `:::media-right[https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80]
### Søndagssamlinger og gudstjenester
Hver søndag feirer vi gudstjeneste kl. 11:00 med sang, inspirerende forkynnelse og Sprell Levende barnekirke.
:::`,
    previewNode: (
      <div className="flex items-center gap-2.5 text-[10px] w-full p-2 rounded-lg bg-stone-100 border border-stone-300">
        <div className="flex-1 space-y-1">
          <div className="font-bold text-stone-900 text-[11px] truncate">Tittel overskrift</div>
          <div className="h-1.5 w-full bg-stone-300 rounded" />
          <div className="h-1.5 w-2/3 bg-stone-300 rounded" />
        </div>
        <div className="w-12 h-10 rounded bg-sky-200 border border-sky-300 shrink-0 flex items-center justify-center text-sky-700 font-bold text-[9px]">
          Bilde
        </div>
      </div>
    ),
  },
  {
    id: "quote",
    title: "Sitatblokk med kilde",
    category: "Typografi",
    description: "Fremhevet sitat med vertikal farget designstrek og forfatterangivelse.",
    icon: <Quote className="w-5 h-5 text-amber-400" />,
    template: `:::quote[Kari Nordmann, Hovedpastor]
Vårt ønske er at menigheten skal være et åpent hjem for alle som søker tro, varme og fellesskap.
:::`,
    previewNode: (
      <div className="w-full p-2.5 border-l-4 border-amber-500 bg-amber-50/70 rounded-r-lg text-amber-950 space-y-1">
        <div className="italic text-[11px] font-serif">«Vårt ønske er at menigheten skal være et åpent hjem...»</div>
        <div className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">— Kari Nordmann, Hovedpastor</div>
      </div>
    ),
  },
  {
    id: "callout-info",
    title: "Fremhevet infoboks",
    category: "Varsler",
    description: "Blå eller farget informasjonsboks med ikon for praktiske opplysninger eller viktige beskjeder.",
    icon: <Info className="w-5 h-5 text-sky-400" />,
    template: `:::callout[info] Praktisk informasjon
Husk å ta med egen kopp til kirkekaffen om du har lyst! Det er gratis parkering bak kirken.
:::`,
    previewNode: (
      <div className="w-full p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-2">
        <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
        <div className="space-y-0.5">
          <div className="font-bold text-[10px] uppercase text-sky-800">Praktisk informasjon</div>
          <div className="text-[10px] text-sky-900">Fremhevet varselboks med ikon og ren layout.</div>
        </div>
      </div>
    ),
  },
  {
    id: "cta",
    title: "Handlingsknapp (CTA)",
    category: "Interaksjon",
    description: "Sentrert eller venstrestilt farget handlingsknapp for påmelding, kontakt eller arrangementer.",
    icon: <MousePointerClick className="w-5 h-5 text-rose-400" />,
    template: `[Knapp: Meld deg på samlingen](/kontakt)`,
    previewNode: (
      <div className="w-full flex items-center justify-center p-2">
        <div className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5">
          <span>Meld deg på samlingen</span>
          <span>→</span>
        </div>
      </div>
    ),
  },
];

export const ContentBlockPickerModal: React.FC<ContentBlockPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertBlock,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Velg innholdsblokk"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Legg til ferdig innholdsblokk</h3>
              <p className="text-xs text-slate-400">
                Velg en forhåndsformatert Tailwind-blokk. Malen settes rett inn i innholdet for enkel redigering.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Lukk (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list with previews */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTENT_BLOCKS.map((block) => (
              <div
                key={block.id}
                className="p-4 rounded-xl bg-slate-850/80 border border-slate-700/80 hover:border-indigo-500/80 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        {block.icon}
                      </div>
                      <span className="font-bold text-white text-sm">{block.title}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {block.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {block.description}
                  </p>

                  {/* Micro Visual Preview */}
                  <div className="pt-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Forhåndsvisning:
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-200/90 border border-stone-300">
                      {block.previewNode}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertBlock(block.template);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sett inn denne blokken</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <span>Innholdet formateres automatisk i henhold til menighetens designsystem.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};
