import React from "react";
import { useNavigate } from "react-router-dom";
import { MyPageModel } from "./useMyPage";
import {
  X,
  ListTodo,
} from "lucide-react";

interface MyTasksModalProps {
  page: MyPageModel;
  onClose: () => void;
}

export const MyTasksModal: React.FC<MyTasksModalProps> = ({ page, onClose }) => {
  const { myTasks } = page;
  const navigate = useNavigate();

  return (
    <div
      id="modal-my-tasks"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Dine tildelte oppgaver ({myTasks.length})
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
          {myTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-700">Ingen oppgaver tildelt</p>
              <p>Du har ingen aktive oppgaver tildelt akkurat nå.</p>
            </div>
          ) : (
            myTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  onClose();
                  navigate(`/oppgave/${task.id}`);
                }}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {task.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Tildelt
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-slate-600">{task.description}</p>
                )}
                <div className="pt-1 flex items-center justify-end text-[11px] font-bold text-emerald-700">
                  <span>Se detaljer →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
