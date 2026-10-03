import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { formatNorwegianDateTime, type useAdminGroupDetail } from "../../hooks/useAppHooks";

interface Props {
  groupGatherings: ReturnType<typeof useAdminGroupDetail>["groupGatherings"];
}

const TASK_STATUS_LABEL = (status: string) =>
  status === "confirmed" ? "Dekket" : status === "vacant" ? "Trenger vikar" : "Ledig";

/** The group's planned gatherings with how well each is staffed and the tasks on it. */
export const GroupGatheringsCard: React.FC<Props> = ({ groupGatherings }) => (
  <section
    id="admin-group-gatherings-section"
    className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
  >
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-emerald-600" />
        Konkrete samlinger for gruppen ({groupGatherings.length})
      </span>
    </div>

    <p className="text-[11px] text-slate-500 leading-relaxed">
      Dette er faktiske, planlagte samlinger knyttet til gruppen (uavhengig av den generelle møteplanen over).
    </p>

    {groupGatherings.length === 0 ? (
      <p className="text-xs text-slate-400 italic py-2">Ingen konkrete samlinger opprettet for denne gruppen ennå.</p>
    ) : (
      <div className="space-y-2">
        {groupGatherings.map(({ gathering, tasks: gTasks, staffing }) => (
          <div
            key={gathering.id}
            id={`group-gathering-card-${gathering.id}`}
            className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-slate-800">{gathering.title}</h5>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatNorwegianDateTime(gathering.startsAt)}
                  </span>
                  {gathering.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {gathering.location}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  staffing.color === "red"
                    ? "bg-red-100 text-red-700"
                    : staffing.color === "yellow"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {staffing.badgeText} ({staffing.coveredCount}/{staffing.totalTasks})
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-200/60 text-[11px] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Tilknyttede oppgaver ({gTasks.length}):
              </span>
              {gTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-0.5">
                  <Link
                    to={`/admin/oppgave/${task.id}`}
                    className="text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    {task.title}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        task.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : task.status === "vacant"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {TASK_STATUS_LABEL(task.status)}
                    </span>
                    <Link
                      to={`/admin/oppgave/${task.id}`}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Kort →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);
