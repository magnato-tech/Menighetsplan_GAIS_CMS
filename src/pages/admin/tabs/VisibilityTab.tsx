import React from "react";
import {
  formatNorwegianDateTime,
} from "../../../hooks/useAppHooks";
import { GatheringVisibility } from "../../../types";
import { visibilityOf, visibilityFields } from "../../../utils/visibility";
import { locationOf } from "../../../utils/gatherings";
import {
  Globe,
  Star,
  EyeOff,
} from "lucide-react";
import { StudioData, ShowFeedback } from "../studio";

interface VisibilityTabProps {
  studio: StudioData;
  showFeedback: ShowFeedback;
}

export const VisibilityTab: React.FC<VisibilityTabProps> = ({ studio, showFeedback }) => {
  const { adminGatherings, updateGathering } = studio;

  const handleSetGatheringVisibility = (gatheringId: string, visibility: GatheringVisibility) => {
    updateGathering(gatheringId, visibilityFields(visibility));
    showFeedback(`Synlighet oppdatert til: ${visibility === "fremhevet" ? "Fremhevet på forsiden" : visibility === "offentlig" ? "Offentlig kalender" : "Kun intern"}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white">Forside-overstyring for arrangementer</h2>
        <p className="text-xs text-slate-400">
          Stjernemerk gudstjenester for å fremheve dem på forsiden, eller skjul spesifikke hendelser fra den offentlige kalenderen.
        </p>
      </div>

      <div className="space-y-3">
        {adminGatherings.map((item) => {
          const g = item.gathering;
          const visibility = visibilityOf(g);
          const isFeatured = visibility === "fremhevet";
          const isHidden = visibility === "intern";
          const isPublic = visibility === "offentlig";

          return (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white text-base">{g.title}</h3>
                  {isFeatured && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300" />
                      Fremhevet på forsiden
                    </span>
                  )}
                  {isPublic && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      Offentlig i kalender
                    </span>
                  )}
                  {isHidden && (
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Kun intern (skjult på nett)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {formatNorwegianDateTime(g.startsAt)} · {locationOf(g)}
                  {g.theme && ` · Tema: ${g.theme}`}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetGatheringVisibility(g.id, "fremhevet")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isFeatured
                      ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                      : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                  title="Lås til toppen av forsiden"
                >
                  <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-slate-950" : ""}`} />
                  <span>Fremhev</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetGatheringVisibility(g.id, "offentlig")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPublic
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                  title="Vises i offentlig kalender"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Offentlig</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetGatheringVisibility(g.id, "intern")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isHidden
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                  title="Skjul fra offentlig visning (kun intern planlegger)"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Kun intern</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
