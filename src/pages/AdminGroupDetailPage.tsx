import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAdminGroupDetail, GROUP_CATEGORIES } from "../hooks/useAppHooks";
import { AdminAccessRequired } from "../components/AdminAccessRequired";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { GroupBasicsFields } from "./adminGroup/GroupBasicsFields";
import { GroupGatheringsCard } from "./adminGroup/GroupGatheringsCard";
import { GroupLeadersFields } from "./adminGroup/GroupLeadersFields";
import { GroupMembersCard } from "./adminGroup/GroupMembersCard";
import { GroupScheduleFields } from "./adminGroup/GroupScheduleFields";
import { useGroupForm } from "./adminGroup/useGroupForm";
import { ArrowLeft, CheckCircle2, AlertTriangle, FolderKanban, Save } from "lucide-react";

const PAGE_CLASS =
  "w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden";

export const AdminGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { isAdmin, group, members, availablePersonsToAdd, groupGatherings, updateGroup, addGroupMember, removeGroupMember } =
    useAdminGroupDetail(groupId || "");
  const { form, setField, feedback, showFeedback, save } = useGroupForm({ group, updateGroup });

  if (!isAdmin) {
    return <AdminAccessRequired target="denne admin-siden" />;
  }

  if (!group || !form) {
    return (
      <div className={PAGE_CLASS}>
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fant ikke gruppen</h3>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Admin-oversikt
          </Link>
        </div>
      </div>
    );
  }

  const currentCategoryLabel =
    GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label || "Tjenestegruppe";

  return (
    <div className={PAGE_CLASS}>
      <UserQuickSwitcherBar />

      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Gruppeadministrasjon
        </span>
      </div>

      {feedback && (
        <div
          id="admin-group-feedback-toast"
          className={`mx-5 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-5 space-y-5">
        <form onSubmit={save} className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">{group.name}</h3>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentCategoryLabel}
              </span>
            </div>

            <GroupBasicsFields form={form} set={setField} />
            <GroupLeadersFields form={form} set={setField} members={members} />
            <GroupScheduleFields form={form} set={setField} />

            <div className="pt-2">
              <button
                type="submit"
                id="btn-save-group-detail"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Lagre endringer for gruppen
              </button>
            </div>
          </div>
        </form>

        <GroupMembersCard
          group={group}
          members={members}
          availablePersonsToAdd={availablePersonsToAdd}
          addGroupMember={addGroupMember}
          removeGroupMember={removeGroupMember}
          showFeedback={showFeedback}
        />
        <GroupGatheringsCard groupGatherings={groupGatherings} />
      </div>
    </div>
  );
};
