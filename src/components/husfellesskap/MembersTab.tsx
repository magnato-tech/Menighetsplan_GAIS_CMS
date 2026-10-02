import React from "react";
import { Group } from "../../types";
import { HusfellesskapModel } from "./husfellesskapModel";

interface MembersTabProps {
  model: HusfellesskapModel;
  group: Group;
}

export const MembersTab: React.FC<MembersTabProps> = ({ model, group }) => {
  const { members, currentUser } = model;

  return (
    <div id="section-husfellesskap-members" className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Gruppens medlemmer ({members.length})
        </span>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isGroupLeader = group.leaderIds.includes(member.id);
          const isGroupDeputy = group.deputyLeaderIds?.includes(member.id);

          return (
            <div
              key={member.id}
              id={`hus-member-row-${member.id}`}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{member.name}</span>
                    {isGroupLeader && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Leder
                      </span>
                    )}
                    {isGroupDeputy && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        Nestleder
                      </span>
                    )}
                    {member.id === currentUser.id && (
                      <span className="text-[10px] font-medium text-slate-400">(deg)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {member.phone || member.email || "Ingen kontaktinfo"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
