import React from "react";
import { UserCheck, UserCog } from "lucide-react";
import type { Person } from "../../types";
import type { GroupFormValues } from "../../utils/groupForm";
import type { SetGroupField } from "./useGroupForm";

interface Props {
  form: GroupFormValues;
  set: SetGroupField;
  members: Person[];
}

const selectClass =
  "w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer";

/** Who leads the group and who is deputy, chosen among its members. */
export const GroupLeadersFields: React.FC<Props> = ({ form, set, members }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
    <div className="space-y-1.5">
      <label
        htmlFor="select-edit-group-leader"
        className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
      >
        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
        Leder:
      </label>
      <select
        id="select-edit-group-leader"
        value={form.leaderId}
        onChange={(e) => set("leaderId", e.target.value)}
        className={selectClass}
      >
        {/* Without this option the list would show the first member as leader of a group that has none */}
        <option value="">{members.length === 0 ? "Ingen medlemmer i gruppen" : "-- Ingen leder valgt --"}</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-slate-400">Styrer hvem som har lederadgang for gruppen</p>
    </div>

    <div className="space-y-1.5">
      <label
        htmlFor="select-edit-group-deputy"
        className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
      >
        <UserCog className="w-3.5 h-3.5 text-blue-600" />
        Nestleder:
      </label>
      <select
        id="select-edit-group-deputy"
        value={form.deputyId}
        onChange={(e) => set("deputyId", e.target.value)}
        className={selectClass}
      >
        <option value="">-- Ingen nestleder valgt --</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-slate-400">Vises som nestleder for gruppen</p>
    </div>
  </div>
);
