import React from "react";
import { formatNorwegianDateTime } from "../../utils/dates";
import { MyPageModel } from "./useMyPage";
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  X,
  BookOpen,
} from "lucide-react";

interface NextForYouSectionProps {
  page: MyPageModel;
}

export const NextForYouSection: React.FC<NextForYouSectionProps> = ({ page }) => {
  const { nextPersonalGatheringData, handleOpenGroupRoom } = page;

  return (
    <section id="section-neste-for-deg" className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Neste for deg</span>
        </h2>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Din gruppe
        </span>
      </div>

      {nextPersonalGatheringData ? (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-emerald-200 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {nextPersonalGatheringData.group.name}
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {nextPersonalGatheringData.gathering.title}
              </h3>
            </div>

            {/* Svarstatus badge */}
            {nextPersonalGatheringData.attendance?.status === "attending" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Kommer</span>
              </span>
            )}
            {nextPersonalGatheringData.attendance?.status === "declined" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                <X className="w-3 h-3" />
                <span>Kommer ikke</span>
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-900">
                {formatNorwegianDateTime(
                  nextPersonalGatheringData.gathering.startsAt
                )}
              </span>
            </div>
            {nextPersonalGatheringData.gathering.location && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{nextPersonalGatheringData.gathering.location}</span>
              </div>
            )}
            {nextPersonalGatheringData.gathering.theme && (
              <div className="flex items-start gap-2 text-slate-600 pt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  Tema: {nextPersonalGatheringData.gathering.theme}
                  {nextPersonalGatheringData.gathering.bibleText && (
                    <span className="text-slate-500">
                      {" "}
                      ({nextPersonalGatheringData.gathering.bibleText})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Action link to group room */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                handleOpenGroupRoom(nextPersonalGatheringData.group)
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
            >
              <span>Gå til grupperommet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
          Ingen personlige gruppesamlinger planlagt.
        </div>
      )}
    </section>
  );
};
