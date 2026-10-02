import React from "react";
import { formatNorwegianDateTime } from "../../utils/dates";
import { MyPageModel } from "./useMyPage";
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  X,
} from "lucide-react";

interface AttentionSectionProps {
  page: MyPageModel;
  /** Opens the list of everything that needs attention. */
  onShowAll: () => void;
}

export const AttentionSection: React.FC<AttentionSectionProps> = ({ page, onShowAll }) => {
  const { attentionItems, handleTakeTask, handleQuickRespondGathering } = page;

  return (
    <section
      id="section-trenger-oppmerksomhet"
      className="space-y-2.5 animate-in fade-in duration-200"
    >
      {attentionItems.length >= 3 ? (
        /* 3+ handlinger: Én samlet, kompakt boks */
        <div
          id="card-consolidated-attention"
          className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/90 text-amber-900 px-2.5 py-0.5 rounded-md">
              Dette trenger din handling
            </span>
            <span className="text-xs font-black bg-amber-800 text-white px-2.5 py-0.5 rounded-full">
              {attentionItems.length} saker
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {attentionItems.length} saker venter på deg
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Du har ubesvarte innkallinger eller ledige oppgaver i dine grupper.
            </p>
          </div>

          <button
            type="button"
            id="btn-see-and-handle-attention"
            onClick={() => onShowAll()}
            className="w-full py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Se og håndter</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* 1–2 handlinger: Vises direkte på Min side */
        <>
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Trenger din oppmerksomhet</span>
            </h2>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/60">
              {attentionItems.length} {attentionItems.length === 1 ? "sak" : "saker"}
            </span>
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => {
              if (item.type === "pending_task") {
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-300/80 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                            Trenger vikar
                          </span>
                          {item.groupName && (
                            <span className="text-xs font-semibold text-slate-700">
                              {item.groupName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700">
                      {item.startsAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-semibold">
                            {formatNorwegianDateTime(item.startsAt)}
                          </span>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.taskDescription && (
                        <p className="text-[11px] text-slate-600 italic pt-0.5">
                          {item.taskDescription}
                        </p>
                      )}
                    </div>

                    {/* Action for Task */}
                    <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                      <button
                        type="button"
                        id={`btn-take-task-${item.taskId}`}
                        onClick={() => item.taskId && handleTakeTask(item.taskId)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Ta oppgave</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Default: unanswered_invitation
              return (
                <div
                  key={item.id}
                  className="p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-300/80 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                          Innkalling
                        </span>
                        {item.groupName && (
                          <span className="text-xs font-semibold text-slate-700">
                            {item.groupName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="font-semibold">
                        {formatNorwegianDateTime(item.startsAt)}
                      </span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.theme && (
                      <p className="text-[11px] text-slate-600 italic pt-0.5">
                        Tema: {item.theme}
                      </p>
                    )}
                  </div>

                  {/* Immediate Response Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                    <button
                      type="button"
                      id={`btn-attend-${item.gatheringId}`}
                      onClick={() =>
                        item.gatheringId &&
                        handleQuickRespondGathering(item.gatheringId, "attending")
                      }
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Kommer</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-decline-${item.gatheringId}`}
                      onClick={() =>
                        item.gatheringId &&
                        handleQuickRespondGathering(item.gatheringId, "declined")
                      }
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kan ikke</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
