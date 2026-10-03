import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, UserCog, Users } from "lucide-react";
import type { Group } from "../../types";

interface Props {
  personId: string;
  groups: Group[];
}

/** The groups the person belongs to, with their role in each. */
export const PersonGroupsCard: React.FC<Props> = ({ personId, groups }) => (
  <section
    id="person-groups-section"
    className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
  >
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Users className="w-4 h-4 text-slate-500" />
        Gruppetilhørighet ({groups.length})
      </span>
    </div>

    {groups.length === 0 ? (
      <p className="text-xs text-slate-400 italic py-2">Personen er ikke medlem av noen grupper ennå.</p>
    ) : (
      <div className="space-y-2">
        {groups.map((group) => {
          const isLeader = group.leaderIds.includes(personId);
          const isDeputy = group.deputyLeaderIds?.includes(personId);

          return (
            <div
              key={group.id}
              className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
            >
              <div>
                <Link
                  to={`/admin/gruppe/${group.id}`}
                  className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  {group.name}
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {isLeader && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Leder
                  </span>
                )}
                {isDeputy && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <UserCog className="w-3 h-3" />
                    Nestleder
                  </span>
                )}
                {!isLeader && !isDeputy && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Medlem
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);
