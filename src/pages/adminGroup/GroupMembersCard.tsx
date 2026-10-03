import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import type { ActionResult } from "../../context/FirebaseDataContext";
import type { Group, Person } from "../../types";

interface Props {
  group: Group;
  members: Person[];
  availablePersonsToAdd: Person[];
  addGroupMember: (groupId: string, personId: string) => ActionResult;
  removeGroupMember: (groupId: string, personId: string) => ActionResult;
  showFeedback: (text: string, type?: "success" | "error") => void;
}

/** The group's members with their role, a button to remove each, and a picker for adding another. */
export const GroupMembersCard: React.FC<Props> = ({
  group,
  members,
  availablePersonsToAdd,
  addGroupMember,
  removeGroupMember,
  showFeedback,
}) => {
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState("");

  const add = () => {
    if (!selectedPersonToAdd) return;
    const res = addGroupMember(group.id, selectedPersonToAdd);
    if (res.success) {
      const added = availablePersonsToAdd.find((p) => p.id === selectedPersonToAdd);
      showFeedback(`${added?.name || "Personen"} ble lagt til som medlem i gruppen!`);
      setSelectedPersonToAdd("");
    } else {
      showFeedback(res.error || "Kunne ikke legge til medlem.", "error");
    }
  };

  const remove = (personId: string, memberName: string) => {
    const res = removeGroupMember(group.id, personId);
    if (res.success) {
      showFeedback(`${memberName} ble fjernet fra gruppen.`);
    } else {
      showFeedback(res.error || "Kunne ikke fjerne medlem.", "error");
    }
  };

  return (
    <section
      id="admin-group-members-section"
      className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-500" />
          Medlemmer i gruppen ({members.length})
        </span>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isLeader = group.leaderIds.includes(member.id);
          const isDeputy = group.deputyLeaderIds?.includes(member.id);

          return (
            <div
              key={member.id}
              id={`group-member-row-${member.id}`}
              className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
            >
              <div>
                <Link
                  to={`/admin/person/${member.id}`}
                  className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  {member.name}
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {isLeader && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Leder
                  </span>
                )}
                {isDeputy && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    Nestleder
                  </span>
                )}
                {!isLeader && !isDeputy && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Medlem
                  </span>
                )}

                {!isLeader && (
                  <button
                    type="button"
                    onClick={() => remove(member.id, member.name)}
                    className="text-[10px] text-slate-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Fjern fra gruppe"
                  >
                    Fjern
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availablePersonsToAdd.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <select
            id="select-add-group-member"
            value={selectedPersonToAdd}
            onChange={(e) => setSelectedPersonToAdd(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="">-- Velg person å legge til --</option>
            {availablePersonsToAdd.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.phone || person.email || (person.globalRole === "admin" ? "Administrator" : "Medlem")})
              </option>
            ))}
          </select>
          <button
            type="button"
            id="btn-add-group-member"
            onClick={add}
            disabled={!selectedPersonToAdd}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Legg til
          </button>
        </div>
      )}
    </section>
  );
};
