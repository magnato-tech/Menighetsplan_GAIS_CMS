import React, { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLeaderGatheringDetail } from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { useTimedMessage } from "../hooks/useTimedMessage";
import { studioTabUrl } from "../pages/admin/studio";
import { buildRunSheet } from "../utils/runSheet";
import {
  type AssignmentResponse,
  type GatheringViewMode,
  canAdminister as canAdministerGathering,
  canIntervene,
  editableTaskOf,
  instructionTargetOf,
  isAdminLook,
  responseLabel,
  roleLabel,
  staffingSummary,
} from "../utils/gatheringView";
import { InstructionDialog } from "./gathering/InstructionDialog";
import { AssignPersonDialog } from "./gathering/AssignPersonDialog";
import { EditTaskDialog } from "./gathering/EditTaskDialog";
import { CreateTaskDialog } from "./gathering/CreateTaskDialog";
import { EditGatheringDialog } from "./gathering/EditGatheringDialog";
import { GatheringAccessDenied } from "./gathering/GatheringAccessDenied";
import { GatheringHeader } from "./gathering/GatheringHeader";
import { RunSheetFilters } from "./gathering/RunSheetFilters";
import { RunSheetSection } from "./gathering/RunSheetSection";
import { StaffingBarometer } from "./gathering/StaffingBarometer";
import { useGatheringDialogs } from "./gathering/useGatheringDialogs";
import { useRunSheetFilter } from "./gathering/useRunSheetFilter";

interface GatheringDetailViewProps {
  gatheringId: string;
  mode?: GatheringViewMode;
}

export const GatheringDetailView: React.FC<GatheringDetailViewProps> = ({ gatheringId, mode = "leader" }) => {
  const detail = useLeaderGatheringDetail(gatheringId);
  const {
    hasAccess,
    isLeader,
    isDeputy,
    isAdmin: isUserAdmin,
    gathering,
    group,
    involvedGroups,
    tasksWithDetails,
    programSchedule,
    updateAssignmentStatus,
    removeAssignment,
  } = detail;

  const adminLook = isAdminLook(mode, isUserAdmin);
  const canAdminister = canAdministerGathering(isUserAdmin, adminLook);

  const dialogs = useGatheringDialogs();
  const [toastMessage, showToast] = useTimedMessage<string>();

  // The programme and the tasks on one timeline, built from what is registered and nothing else
  const schedule = useMemo(() => buildRunSheet(programSchedule, tasksWithDetails), [programSchedule, tasksWithDetails]);
  const filter = useRunSheetFilter(schedule);
  const staffing = staffingSummary(tasksWithDetails);

  if (!gathering || !hasAccess) {
    return <GatheringAccessDenied gatheringFound={Boolean(gathering)} canAdminister={canAdminister} />;
  }

  const handleStatusChange = (assignmentId: string, newResponse: AssignmentResponse, personName?: string) => {
    const res = updateAssignmentStatus(assignmentId, newResponse);
    if (res.success) {
      dialogs.setOpenMenuAssignmentId(null);
      showToast(`Status for ${personName || "personen"} ble endret til ${responseLabel(newResponse)}.`);
    } else {
      showToast(res.error || "Kunne ikke oppdatere status.");
    }
  };

  const handleRemovePerson = (assignmentId: string, personName?: string) => {
    const res = removeAssignment(assignmentId);
    if (res.success) {
      dialogs.setOpenMenuAssignmentId(null);
      showToast(`${personName || "Personen"} ble fjernet fra oppgaven.`);
    } else {
      showToast(res.error || "Kunne ikke fjerne tildeling.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden flex flex-col print:max-w-none print:shadow-none print:my-0 print:border-none print:bg-white">
      <div className="print:hidden">
        <UserQuickSwitcherBar />
      </div>

      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-xs transition-all animate-fadeIn print:hidden">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-4 bg-white border-b border-slate-200/80 space-y-3 print:border-b-2 print:border-slate-800 print:p-2">
        <GatheringHeader
          title={gathering.title}
          startsAt={gathering.startsAt}
          location={gathering.location}
          isEvent={gathering.type === "arrangement"}
          involvedGroupCount={involvedGroups.length}
          backLink={adminLook ? studioTabUrl("planlegger-samlinger") : "/leder?tab=samlinger"}
          backLabel={adminLook ? "Tilbake til arrangementer" : "Tilbake til samlingsoversikt"}
          roleLabel={roleLabel(adminLook, isDeputy)}
          adminLook={adminLook}
          canAdminister={canAdminister}
          onEdit={() => dialogs.setIsEditingGathering(true)}
          onAddTask={() => dialogs.setIsCreatingTask(true)}
          onPrint={() => window.print()}
        />

        <StaffingBarometer summary={staffing} myGroup={!adminLook && group ? group : undefined} />

        <RunSheetFilters
          view={filter.view}
          groupId={filter.groupId}
          groups={filter.groups}
          totalRows={schedule.length}
          vacantTasks={staffing.vacant}
          myGroupTasks={staffing.myGroupTotal}
          showMyGroup={!adminLook && Boolean(group)}
          onViewChange={filter.setView}
          onGroupChange={filter.setGroupId}
        />
      </div>

      <RunSheetSection
        gathering={gathering}
        rows={filter.filtered}
        totalRows={schedule.length}
        canInterveneOn={(row) => canIntervene(row, canAdminister, isLeader)}
        canAdminister={canAdminister}
        openMenuAssignmentId={dialogs.openMenuAssignmentId}
        onToggleMenu={dialogs.setOpenMenuAssignmentId}
        onStatusChange={handleStatusChange}
        onRemovePerson={handleRemovePerson}
        onShowInstruction={(row) => dialogs.setInstruction(instructionTargetOf(row))}
        onAssign={dialogs.setAssignTaskId}
        onEditTask={(task) => dialogs.setEditingTask(editableTaskOf(task))}
        onResetFilters={filter.reset}
      />

      {dialogs.instruction && (
        <InstructionDialog
          detail={detail}
          task={dialogs.instruction}
          canAdminister={canAdminister}
          showToast={showToast}
          onClose={() => dialogs.setInstruction(null)}
        />
      )}

      {dialogs.assignTaskId && (
        <AssignPersonDialog
          detail={detail}
          taskId={dialogs.assignTaskId}
          canAdminister={canAdminister}
          showToast={showToast}
          onClose={() => dialogs.setAssignTaskId(null)}
        />
      )}

      {dialogs.editingTask && (
        <EditTaskDialog detail={detail} task={dialogs.editingTask} showToast={showToast} onClose={() => dialogs.setEditingTask(null)} />
      )}

      <CreateTaskDialog
        detail={detail}
        gathering={gathering}
        open={dialogs.isCreatingTask}
        showToast={showToast}
        onClose={() => dialogs.setIsCreatingTask(false)}
      />

      {dialogs.isEditingGathering && (
        <EditGatheringDialog
          detail={detail}
          gathering={gathering}
          showToast={showToast}
          onClose={() => dialogs.setIsEditingGathering(false)}
        />
      )}
    </div>
  );
};
