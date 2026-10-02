import React from "react";
import { formatNorwegianDateTime } from "../../utils/dates";
import { MyPageModel } from "./useMyPage";
import {
  AlertCircle,
  Check,
  Clock,
  X,
} from "lucide-react";

interface AttentionModalProps {
  page: MyPageModel;
  onClose: () => void;
}

export const AttentionModal: React.FC<AttentionModalProps> = ({ page, onClose }) => {
  const { attentionItems, handleTakeTask, handleQuickRespondGathering } = page;

  return (
    <div
      id="modal-attention-actions"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Dette trenger din handling ({attentionItems.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {attentionItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-700">Ingen utestående handlinger</p>
              <p>Du har håndtert alle dine saker!</p>
            </div>
          ) : (
            attentionItems.map((item) => {
              if (item.type === "pending_task") {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        Trenger vikar
                      </span>
                      {item.groupName && (
                        <span className="text-xs font-semibold text-slate-600">
                          {item.groupName}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    {item.startsAt && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatNorwegianDateTime(item.startsAt)}</span>
                      </div>
                    )}
                    {item.taskDescription && (
                      <p className="text-[11px] text-slate-500 italic">
                        {item.taskDescription}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (item.taskId) {
                          handleTakeTask(item.taskId);
                        }
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Ta oppgave</span>
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      Innkalling
                    </span>
                    {item.groupName && (
                      <span className="text-xs font-semibold text-slate-600">
                        {item.groupName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  {item.startsAt && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatNorwegianDateTime(item.startsAt)}</span>
                    </div>
                  )}
                  {item.theme && (
                    <p className="text-[11px] text-slate-500 italic">
                      Tema: {item.theme}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        item.gatheringId &&
                        handleQuickRespondGathering(item.gatheringId, "attending")
                      }
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Kommer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        item.gatheringId &&
                        handleQuickRespondGathering(item.gatheringId, "declined")
                      }
                      className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kan ikke</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
