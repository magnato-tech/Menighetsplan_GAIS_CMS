import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gathering } from "../../types";
import { X } from "lucide-react";
import { GatheringDetail } from "./gatheringDetail";
import { findExistingTaskForRole, sortVolunteerRoles } from "../../utils/roleStaffing";
import { studioTabUrl } from "../../pages/admin/studio";

interface CreateTaskDialogProps {
  detail: GatheringDetail;
  gathering: Gathering;
  /** The dialog stays mounted while closed, so a half-filled form is still there when it reopens. */
  open: boolean;
  showToast: (text: string) => void;
  onClose: () => void;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  detail,
  gathering,
  open,
  showToast,
  onClose,
}) => {
  const { group, volunteerRoles, gatheringTasks, allGroups, createTask, updateGathering } = detail;

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [programTime, setProgramTime] = useState<string>("11:00");
  const [programTitle, setProgramTitle] = useState<string>("");
  const [taskGroupId, setTaskGroupId] = useState<string>("");
  const [neededCount, setNeededCount] = useState<number>(1);
  const [pendingShare, setPendingShare] = useState<{ existingTaskId: string } | null>(null);

  const preferredGroupId = group?.id || gathering.groupId;
  const sortedRoles = useMemo(
    () => sortVolunteerRoles(volunteerRoles, preferredGroupId),
    [volunteerRoles, preferredGroupId]
  );
  const selectedRole = sortedRoles.find((r) => r.id === selectedRoleId);
  const teamFieldVisible = Boolean(selectedRole?.groupId);

  useEffect(() => {
    if (!selectedRole) return;
    setProgramTitle(selectedRole.name);
    setTaskGroupId(selectedRole.groupId || "");
  }, [selectedRoleId, selectedRole]);

  const resetForm = () => {
    setSelectedRoleId("");
    setProgramTime("11:00");
    setProgramTitle("");
    setTaskGroupId("");
    setNeededCount(1);
    setPendingShare(null);
  };

  const appendProgramPost = (taskId: string) => {
    const newItem = {
      time: programTime.trim(),
      title: programTitle.trim(),
      taskId,
    };
    const updatedSchedule = [...(gathering.programSchedule || []), newItem];
    const res = updateGathering(gathering.id, { programSchedule: updatedSchedule });
    if (res.success) {
      showToast(`Programposten «${programTitle.trim()}» ble lagt til!`);
      resetForm();
      onClose();
    } else {
      showToast(res.error || "Kunne ikke lagre programposten.");
    }
  };

  const createNewTask = (): string | null => {
    if (!selectedRole) return null;
    const res = createTask({
      gatheringId: gathering.id,
      groupId: selectedRole.groupId ? taskGroupId || selectedRole.groupId : undefined,
      volunteerRoleId: selectedRole.id,
      title: selectedRole.name,
      neededCount: neededCount || 1,
    });
    if (!res.success || !res.task) {
      showToast(res.error || "Kunne ikke opprette oppgave.");
      return null;
    }
    return res.task.id;
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId || !selectedRole) {
      showToast("Velg en rolle fra biblioteket.");
      return;
    }
    if (!programTime.trim() || !programTitle.trim()) {
      showToast("Programposten trenger tid og tittel.");
      return;
    }

    const existing = findExistingTaskForRole(gatheringTasks, gathering.id, selectedRoleId);
    if (existing && !pendingShare) {
      setPendingShare({ existingTaskId: existing.id });
      return;
    }

    const taskId = pendingShare ? pendingShare.existingTaskId : createNewTask();
    if (!taskId) return;
    appendProgramPost(taskId);
  };

  const handleShareChoice = (reusePeople: boolean) => {
    if (!selectedRole) return;
    const taskId = reusePeople && pendingShare ? pendingShare.existingTaskId : createNewTask();
    if (!taskId) return;
    appendProgramPost(taskId);
  };

  if (!open) return null;

  return (
    <div
      id="modal-admin-create-task"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              Legg til i samlingen
            </span>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Ny programpost
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {volunteerRoles.length === 0 ? (
          <div className="space-y-3 text-xs text-slate-600">
            <p>Det finnes ingen roller i biblioteket ennå. Legg inn roller i admin før du setter opp programmet.</p>
            <Link
              to={studioTabUrl("planlegger-roller")}
              className="inline-flex text-indigo-700 font-bold hover:text-indigo-900 underline"
            >
              Gå til Roller
            </Link>
          </div>
        ) : pendingShare ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              Rollen <strong>{selectedRole?.name}</strong> finnes allerede på denne samlingen. Skal denne
              programposten bruke de samme personene?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleShareChoice(true)}
                className="w-full px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                Ja, samme personer
              </button>
              <button
                type="button"
                onClick={() => handleShareChoice(false)}
                className="w-full px-4 py-2.5 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Nei, egen oppgave
              </button>
              <button
                type="button"
                onClick={() => setPendingShare(null)}
                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                Tilbake
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rolle fra biblioteket *</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                required
              >
                <option value="">Velg rolle...</option>
                {sortedRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.groupId ? ` (${allGroups.find((g) => g.id === role.groupId)?.name || "team"})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Klokkeslett *</label>
                <input
                  type="text"
                  value={programTime}
                  onChange={(e) => setProgramTime(e.target.value)}
                  placeholder="11:00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Programtittel *</label>
                <input
                  type="text"
                  value={programTitle}
                  onChange={(e) => setProgramTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  required
                />
              </div>
            </div>

            {teamFieldVisible && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tjenesteteam</label>
                <select
                  value={taskGroupId}
                  onChange={(e) => setTaskGroupId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                >
                  {allGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.category || "gruppe"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bemanningsbehov (antall personer)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={neededCount}
                onChange={(e) => setNeededCount(parseInt(e.target.value, 10) || 1)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                Legg til programpost
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
