import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useLeaderGatheringDetail,
  formatNorwegianDateTime,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { Task, Person, Assignment } from "../types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  FileText,
  Info,
  Check,
  ChevronDown,
  SlidersHorizontal,
  Edit3,
  Plus,
  Trash2,
  Printer,
} from "lucide-react";
import { InstructionDialog } from "./gathering/InstructionDialog";
import { AssignPersonDialog } from "./gathering/AssignPersonDialog";
import { EditTaskDialog } from "./gathering/EditTaskDialog";
import { CreateTaskDialog } from "./gathering/CreateTaskDialog";
import { EditGatheringDialog } from "./gathering/EditGatheringDialog";

export interface IntegratedScheduleRow {
  id: string;
  time: string;
  programTitle: string;
  programDescription?: string;
  roleTitle: string;
  groupName: string;
  groupId?: string;
  isMyGroup: boolean;
  task?: Task;
  neededCount: number;
  confirmedCount: number;
  isFullyCovered: boolean;
  hasForfall: boolean;
  assignedPersons: Array<{
    assignment?: Assignment;
    person?: Person;
    statusLabel: string;
    response: "confirmed" | "pending" | "declined" | "withdrawn";
  }>;
  instruction?: string;
}

interface GatheringDetailViewProps {
  gatheringId: string;
  mode?: "admin" | "leader";
}

export const GatheringDetailView: React.FC<GatheringDetailViewProps> = ({
  gatheringId,
  mode = "leader",
}) => {
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

  const isExplicitAdminView = mode === "admin" || (isUserAdmin && mode !== "leader");
  const canAdminister = isUserAdmin || isExplicitAdminView;

  // Filter state
  const [viewFilter, setViewFilter] = useState<"all" | "needs-action" | "my-group">("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  // Modals
  const [activeInterveneTaskId, setActiveInterveneTaskId] = useState<string | null>(null);
  const [viewInstructionTask, setViewInstructionTask] = useState<{
    taskId?: string;
    title: string;
    instruction: string;
    time?: string;
    groupName?: string;
  } | null>(null);


  // Person status dropdown modal
  const [activePersonActionId, setActivePersonActionId] = useState<string | null>(null);

  // Admin: Edit Gathering modal
  const [isEditingGathering, setIsEditingGathering] = useState<boolean>(false);

  // Admin: Edit Task modal
  const [editingTask, setEditingTask] = useState<{
    id: string;
    title: string;
    groupId: string;
    neededCount: number;
    description: string;
    instruction: string;
  } | null>(null);

  // Admin: Create Task modal
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build the unified "Kjøreplan & Hvem gjør hva" schedule timeline
  const integratedSchedule = useMemo<IntegratedScheduleRow[]>(() => {
    if (!gathering) return [];

    const rows: IntegratedScheduleRow[] = [];
    const usedTaskIds = new Set<string>();

    // 1. First, find preparation tasks that happen BEFORE service (e.g. oppmøte 09:30, 10:15, 10:35, 10:45)
    tasksWithDetails.forEach((td) => {
      const task = td.task;
      const lowerInstr = (task.instruction || "").toLowerCase();
      const lowerDesc = (task.description || "").toLowerCase();

      // Check if task has specific earlier prep time in instruction
      let prepTime = "";
      if (lowerInstr.includes("09:30") || lowerDesc.includes("09:30")) prepTime = "09:30";
      else if (lowerInstr.includes("10:00") || lowerDesc.includes("10:00")) prepTime = "10:00";
      else if (lowerInstr.includes("10:15") || lowerDesc.includes("10:15")) prepTime = "10:15";
      else if (lowerInstr.includes("10:20") || lowerDesc.includes("10:20")) prepTime = "10:20";
      else if (lowerInstr.includes("10:35") || lowerDesc.includes("10:35")) prepTime = "10:35";
      else if (lowerInstr.includes("10:45") || lowerDesc.includes("10:45")) prepTime = "10:45";

      if (prepTime) {
        usedTaskIds.add(task.id);
        rows.push({
          id: `prep-${task.id}`,
          time: prepTime,
          programTitle: prepTime < "10:30" ? "Teknisk rigg & forberedelser" : "Før gudstjenesten / Vertskap",
          programDescription: task.description || "Forberedelse i forkant av samlingen",
          roleTitle: task.title,
          groupName: td.taskGroup?.name || (td.isMyGroup ? group?.name || "Min gruppe" : "Tjenestegruppe"),
          groupId: task.groupId,
          isMyGroup: td.isMyGroup,
          task: task,
          neededCount: td.neededCount || 1,
          confirmedCount: td.confirmedPersonsCount,
          isFullyCovered: td.isFullyCovered,
          hasForfall: td.hasWithdrawn || task.status === "vacant",
          assignedPersons: td.assignedPersons,
          instruction: task.instruction || task.description,
        });
      }
    });

    // 2. Iterate through each ProgramItem in programSchedule
    programSchedule.forEach((item, index) => {
      // Find matching task if any
      let matchedTaskDetail = tasksWithDetails.find(
        (td) => td.task.id === item.taskId || (!usedTaskIds.has(td.task.id) && td.task.title.toLowerCase().includes(item.title.toLowerCase()))
      );

      // Specific domain mappings if taskId not explicitly bound
      if (!matchedTaskDetail) {
        const itemTitleLow = item.title.toLowerCase();
        if (itemTitleLow.includes("kirkekaffe") || itemTitleLow.includes("lunsj") || itemTitleLow.includes("kaffe")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-kaffe");
        } else if (itemTitleLow.includes("lovsang") || itemTitleLow.includes("sang")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-lovsang");
        } else if (itemTitleLow.includes("lyd") || itemTitleLow.includes("teknisk") || itemTitleLow.includes("bilde")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-lyd");
        } else if (itemTitleLow.includes("barnekirke") || itemTitleLow.includes("søndagsskole")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-barn");
        }
      }

      if (matchedTaskDetail) {
        usedTaskIds.add(matchedTaskDetail.task.id);
        rows.push({
          id: `prog-${matchedTaskDetail.task.id}-${index}`,
          time: item.time,
          programTitle: item.title,
          programDescription: item.description,
          roleTitle: matchedTaskDetail.task.title,
          groupName: matchedTaskDetail.taskGroup?.name || (matchedTaskDetail.isMyGroup ? group?.name || "Min gruppe" : "Gruppe"),
          groupId: matchedTaskDetail.task.groupId,
          isMyGroup: matchedTaskDetail.isMyGroup,
          task: matchedTaskDetail.task,
          neededCount: matchedTaskDetail.neededCount || 1,
          confirmedCount: matchedTaskDetail.confirmedPersonsCount,
          isFullyCovered: matchedTaskDetail.isFullyCovered,
          hasForfall: matchedTaskDetail.hasWithdrawn || matchedTaskDetail.task.status === "vacant",
          assignedPersons: matchedTaskDetail.assignedPersons,
          instruction: matchedTaskDetail.task.instruction || matchedTaskDetail.task.description,
        });
      } else {
        // Program item without a specific volunteer Task object in DB
        let role = "Liturg / Møteleder";
        let responsiblePersonName = "Jonas Lie";
        let roleGroupName = "Felles / Liturgi";
        let roleGroupId = "group-liturgi";

        const titleLow = item.title.toLowerCase();
        if (titleLow.includes("preken") || titleLow.includes("tale")) {
          role = "Taler / Pastor";
          responsiblePersonName = "Per prest";
          roleGroupName = "Pastorteam";
        } else if (titleLow.includes("lovsang") || titleLow.includes("sang")) {
          role = "Lovsangsleder";
          responsiblePersonName = "Line & team";
          roleGroupName = "Lovsang";
          roleGroupId = "group-lovsang";
        } else if (titleLow.includes("dåp")) {
          role = "Liturg / Prest";
          responsiblePersonName = "Kari Nordmann";
          roleGroupName = "Prester";
        } else if (titleLow.includes("barnekirke") || titleLow.includes("søndagsskole")) {
          role = "Barnekirkeleder";
          responsiblePersonName = "Ingrid Berg";
          roleGroupName = "Barnekirke";
          roleGroupId = "group-barn";
        } else if (titleLow.includes("nattverd") || titleLow.includes("forbønn")) {
          role = "Forbønnsteam & nattverd";
          responsiblePersonName = "Kari + Ola";
          roleGroupName = "Diakoni";
        } else if (titleLow.includes("kirkekaffe")) {
          role = "Kaffeteam";
          responsiblePersonName = "Kaffegruppen";
          roleGroupName = "Kirkekaffe";
          roleGroupId = "group-kaffe";
        }

        rows.push({
          id: `prog-general-${index}`,
          time: item.time,
          programTitle: item.title,
          programDescription: item.description,
          roleTitle: role,
          groupName: roleGroupName,
          groupId: roleGroupId,
          isMyGroup: false,
          neededCount: 1,
          confirmedCount: 1,
          isFullyCovered: true,
          hasForfall: false,
          assignedPersons: [
            {
              person: { id: `resp-${index}`, name: responsiblePersonName, globalRole: "member" },
              statusLabel: "Bekreftet",
              response: "confirmed",
            },
          ],
        });
      }
    });

    // 3. Add any remaining tasks that were not matched to the program
    tasksWithDetails.forEach((td, idx) => {
      if (!usedTaskIds.has(td.task.id)) {
        rows.push({
          id: `task-extra-${td.task.id}-${idx}`,
          time: "11:00",
          programTitle: "Gudstjeneste & gjennomføring",
          programDescription: td.task.description,
          roleTitle: td.task.title,
          groupName: td.taskGroup?.name || (td.isMyGroup ? group?.name || "Min gruppe" : "Gruppe"),
          groupId: td.task.groupId,
          isMyGroup: td.isMyGroup,
          task: td.task,
          neededCount: td.neededCount || 1,
          confirmedCount: td.confirmedPersonsCount,
          isFullyCovered: td.isFullyCovered,
          hasForfall: td.hasWithdrawn || td.task.status === "vacant",
          assignedPersons: td.assignedPersons,
          instruction: td.task.instruction || td.task.description,
        });
      }
    });

    // Sort chronologically by time
    return rows.sort((a, b) => {
      const timeA = a.time.replace(/[^0-9:]/g, "") || "99:99";
      const timeB = b.time.replace(/[^0-9:]/g, "") || "99:99";
      return timeA.localeCompare(timeB);
    });
  }, [gathering, tasksWithDetails, programSchedule, group]);

  // Distinct groups present in the schedule for filtering
  const groupsInSchedule = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    integratedSchedule.forEach((r) => {
      const gId = r.groupId || r.groupName;
      const curr = map.get(gId) || { id: gId, name: r.groupName, count: 0 };
      curr.count += 1;
      map.set(gId, curr);
    });
    return Array.from(map.values());
  }, [integratedSchedule]);

  // Filtered rows based on view filters
  const filteredSchedule = useMemo(() => {
    return integratedSchedule.filter((row) => {
      if (selectedGroupFilter !== "all") {
        if (row.groupId !== selectedGroupFilter && row.groupName !== selectedGroupFilter) {
          return false;
        }
      }
      if (viewFilter === "my-group") {
        return row.isMyGroup;
      }
      if (viewFilter === "needs-action") {
        return !row.isFullyCovered || row.hasForfall;
      }
      return true;
    });
  }, [integratedSchedule, viewFilter, selectedGroupFilter]);

  // Staffing barometer calculations
  const totalTasks = tasksWithDetails.length;
  const vacantTasks = tasksWithDetails.filter((t) => t.task.status === "vacant" || t.hasWithdrawn);
  const coveredTasks = tasksWithDetails.filter((t) => t.isFullyCovered);
  const myGroupTasks = tasksWithDetails.filter((t) => t.isMyGroup);
  const myGroupNeedsAction = myGroupTasks.filter((t) => !t.isFullyCovered || t.hasWithdrawn);

  // Access check
  if (!gathering || !hasAccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">
              Arrangementet krever leder- eller admin-tilgang
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {!gathering
                ? "Arrangementet ble ikke funnet."
                : `Du har ikke tilgang til dette arrangementet med din nåværende rolle.`}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to={canAdminister ? "/admin?tab=samlinger" : "/leder?tab=samlinger"}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til {canAdminister ? "Samlinger" : "Samlingsoversikt"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Status changer handler
  const handleStatusChange = (assignmentId: string, newResponse: "confirmed" | "pending" | "withdrawn" | "declined", personName?: string) => {
    const res = updateAssignmentStatus(assignmentId, newResponse);
    if (res.success) {
      setActivePersonActionId(null);
      const label =
        newResponse === "confirmed"
          ? "Akseptert"
          : newResponse === "pending"
          ? "Forespurt"
          : newResponse === "withdrawn"
          ? "Forfall"
          : "Avslått";
      showToast(`Status for ${personName || "personen"} ble endret til ${label}.`);
    } else {
      showToast(res.error || "Kunne ikke oppdatere status.");
    }
  };

  // Unassign handler
  const handleRemovePerson = (assignmentId: string, personName?: string) => {
    const res = removeAssignment(assignmentId);
    if (res.success) {
      setActivePersonActionId(null);
      showToast(`${personName || "Personen"} ble fjernet fra oppgaven.`);
    } else {
      showToast(res.error || "Kunne ikke fjerne tildeling.");
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const backLink = isExplicitAdminView
    ? "/admin?tab=arrangementer"
    : "/leder?tab=samlinger";

  const backLabel = isExplicitAdminView
    ? "Tilbake til arrangementer"
    : "Tilbake til samlingsoversikt";

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden flex flex-col print:max-w-none print:shadow-none print:my-0 print:border-none print:bg-white">
      {/* User Switcher bar - hidden in print */}
      <div className="print:hidden">
        <UserQuickSwitcherBar />
      </div>

      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-xs transition-all animate-fadeIn print:hidden">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="p-4 bg-white border-b border-slate-200/80 space-y-3 print:border-b-2 print:border-slate-800 print:p-2">
        {/* Navigation Breadcrumb - hidden in print */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to={backLink}
            id="btn-back-to-group-or-admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>

          <div className="flex items-center gap-2">
            {canAdminister && (
              <>
                <button
                  type="button"
                  id="btn-admin-edit-gathering"
                  onClick={() => setIsEditingGathering(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Rediger tittel, dato, tid og sted"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rediger</span>
                </button>
                <button
                  type="button"
                  id="btn-admin-add-task"
                  onClick={() => setIsCreatingTask(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ny oppgave</span>
                </button>
              </>
            )}

            <button
              type="button"
              id="btn-print-schedule"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Skriv ut eller lagre kjøreplan som PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Skriv ut</span>
            </button>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isExplicitAdminView
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}
            >
              {isExplicitAdminView ? "Admin-visning" : isDeputy ? "Nestleder" : "Gruppeleder"}
            </span>
          </div>
        </div>

        {/* Gathering Title & Metadata */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {gathering.type === "arrangement" ? "Gudstjeneste / Arrangement" : "Samling"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {gathering.id}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 leading-tight">
            {gathering.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatNorwegianDateTime(gathering.startsAt)}
            </span>
            {gathering.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {gathering.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {involvedGroups.length} {involvedGroups.length === 1 ? "tjenestegruppe" : "tjenestegrupper"} involvert
            </span>
          </div>
        </div>

        {/* Staffing Barometer / Status Banner */}
        <div
          id="gathering-staffing-barometer"
          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            vacantTasks.length > 0
              ? "bg-red-50/80 border-red-200 text-red-900"
              : coveredTasks.length === totalTasks && totalTasks > 0
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-amber-50/80 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {vacantTasks.length > 0 ? (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            ) : coveredTasks.length === totalTasks && totalTasks > 0 ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-bold block truncate">
                {vacantTasks.length > 0
                  ? `${vacantTasks.length} ${vacantTasks.length === 1 ? "oppgave krever oppfølging (forfall/vikar)" : "oppgaver krever oppfølging"}`
                  : coveredTasks.length === totalTasks && totalTasks > 0
                  ? "Fullt bemannet arrangement"
                  : "Mangler bemanning på noen oppgaver"}
              </span>
              <span className="text-[11px] opacity-80 block truncate">
                Total dekning: {coveredTasks.length} av {totalTasks} oppgaver dekket
                {!isExplicitAdminView && group && ` • Min gruppe (${group.name}): ${myGroupTasks.length - myGroupNeedsAction.length}/${myGroupTasks.length}`}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 font-bold text-xs">
            <span
              className={`px-2 py-0.5 rounded-full ${
                vacantTasks.length > 0
                  ? "bg-red-200/80 text-red-900"
                  : coveredTasks.length === totalTasks && totalTasks > 0
                  ? "bg-emerald-200/80 text-emerald-900"
                  : "bg-amber-200/80 text-amber-900"
              }`}
            >
              {coveredTasks.length}/{totalTasks}
            </span>
          </div>
        </div>

        {/* View Filter Controls - hidden in print */}
        <div className="space-y-2 pt-1 print:hidden">
          {/* Main quick tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              id="tab-filter-all"
              onClick={() => setViewFilter("all")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                viewFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hele programmet ({integratedSchedule.length})
            </button>

            <button
              type="button"
              id="tab-filter-needs-action"
              onClick={() => setViewFilter("needs-action")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewFilter === "needs-action"
                  ? "bg-white text-red-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Forfall / Mangler</span>
              {vacantTasks.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                  {vacantTasks.length}
                </span>
              )}
            </button>

            {!isExplicitAdminView && group && (
              <button
                type="button"
                id="tab-filter-my-group"
                onClick={() => setViewFilter("my-group")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  viewFilter === "my-group"
                    ? "bg-white text-emerald-800 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Min gruppe ({myGroupTasks.length})
              </button>
            )}
          </div>

          {/* Group Filter Dropdown / Pills for Admin & Multigroup view */}
          {groupsInSchedule.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
              <span className="text-slate-400 font-bold uppercase text-[10px] pr-1 flex items-center gap-0.5">
                <SlidersHorizontal className="w-3 h-3" />
                Gruppe:
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroupFilter("all")}
                className={`px-2 py-0.5 rounded-full border font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedGroupFilter === "all"
                    ? "bg-slate-800 text-white border-slate-800 font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Alle ({integratedSchedule.length})
              </button>
              {groupsInSchedule.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupFilter(g.id)}
                  className={`px-2 py-0.5 rounded-full border font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedGroupFilter === g.id
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {g.name} ({g.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule & Bemanning Content */}
      <div className="p-3 sm:p-4 space-y-2 flex-1 print:p-0 print:space-y-1">
        <div className="flex items-center justify-between px-1 print:hidden">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Kjøreplan & «Hvem gjør hva»</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Viser {filteredSchedule.length} av {integratedSchedule.length} punkter
          </span>
        </div>

        {/* Print-only Header */}
        <div className="hidden print:block mb-4 border-b border-slate-300 pb-2">
          <h1 className="text-xl font-bold text-black">{gathering.title}</h1>
          <p className="text-xs text-slate-600">
            {formatNorwegianDateTime(gathering.startsAt)} • {gathering.location || "Kirken"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Offisiell kjøreplan og bemanningsliste – Menighetsplan
          </p>
        </div>

        {filteredSchedule.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
            <Info className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Ingen programpunkter matcher filteret</p>
            <p className="text-[11px] text-slate-400">
              Prøv å endre filteret til «Hele programmet» eller velg en annen gruppe.
            </p>
            <button
              type="button"
              onClick={() => {
                setViewFilter("all");
                setSelectedGroupFilter("all");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer mt-1"
            >
              Nullstill alle filtre
            </button>
          </div>
        ) : (
          <div className="space-y-2 print:space-y-1">
            {filteredSchedule.map((row) => {
              const hasTask = Boolean(row.task);
              const isVacant = !row.isFullyCovered || row.hasForfall;
              const canIntervene = canAdminister || (row.isMyGroup && isLeader);

              return (
                <div
                  key={row.id}
                  id={`schedule-row-${row.id}`}
                  className={`p-3 bg-white rounded-2xl border transition-all ${
                    row.hasForfall
                      ? "border-red-300/80 bg-red-50/20 shadow-xs"
                      : !row.isFullyCovered
                      ? "border-amber-300/80 bg-amber-50/10 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300"
                  } print:rounded-none print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:border-slate-200 print:p-1.5`}
                >
                  {/* Top line: Time, Program Item, Group & Status indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Time pill */}
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/60 shrink-0 mt-0.5">
                        {row.time}
                      </span>

                      {/* Program Item and Role */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-extrabold text-slate-900">
                            {row.programTitle}
                          </h3>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {row.roleTitle}
                          </span>
                        </div>

                        {/* Program note / description if present */}
                        {row.programDescription && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {row.programDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Group Badge & Staffing Fraction */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          row.isMyGroup
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {row.groupName}
                      </span>

                      {hasTask && row.neededCount > 1 && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            row.isFullyCovered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.confirmedCount}/{row.neededCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Line: Assigned Person(s) with interactive status */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                        Ansvarlig:
                      </span>

                      {row.assignedPersons.length > 0 ? (
                        row.assignedPersons.map(({ assignment, person, statusLabel, response }) => (
                          <div
                            key={assignment ? assignment.id : person?.id || Math.random()}
                            className="relative group inline-flex items-center"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (assignment && canIntervene) {
                                  setActivePersonActionId(
                                    activePersonActionId === assignment.id ? null : assignment.id
                                  );
                                }
                              }}
                              disabled={!assignment || !canIntervene}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                response === "confirmed"
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80"
                                  : response === "withdrawn"
                                  ? "bg-red-50 text-red-900 border-red-300 hover:bg-red-100/80"
                                  : response === "declined"
                                  ? "bg-slate-100 text-slate-700 border-slate-300 line-through"
                                  : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80"
                              } ${assignment && canIntervene ? "cursor-pointer" : "cursor-default"}`}
                            >
                              <span>{person?.name || "Ukjent person"}</span>
                              {response !== "confirmed" && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    response === "withdrawn"
                                      ? "bg-red-200 text-red-800"
                                      : response === "declined"
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-amber-200 text-amber-900"
                                  }`}
                                >
                                  {response === "withdrawn" ? "Forfall" : response === "declined" ? "Avslått" : "Forespurt"}
                                </span>
                              )}
                              {assignment && canIntervene && (
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 print:hidden" />
                              )}
                            </button>

                            {/* Person Status Dropdown Menu (hidden in print) */}
                            {assignment && activePersonActionId === assignment.id && (
                              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-30 p-1.5 space-y-1 text-xs animate-fadeIn print:hidden">
                                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                                  Endre status for {person?.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(assignment.id, "confirmed", person?.name)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 font-medium flex items-center justify-between cursor-pointer"
                                >
                                  <span>Akseptert / Bekreftet</span>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(assignment.id, "pending", person?.name)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-amber-800 font-medium flex items-center justify-between cursor-pointer"
                                >
                                  <span>Sett som Forespurt</span>
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(assignment.id, "withdrawn", person?.name)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-700 font-medium flex items-center justify-between cursor-pointer"
                                >
                                  <span>Meld forfall (Trenger vikar)</span>
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                </button>
                                <div className="border-t border-slate-100 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePerson(assignment.id, person?.name)}
                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-600 font-semibold flex items-center justify-between cursor-pointer"
                                  >
                                    <span>Fjern fra oppgave</span>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
                          Ubesatt (Trenger frivillig)
                        </span>
                      )}
                    </div>

                    {/* Actions on this row (hidden in print) */}
                    <div className="flex items-center gap-1.5 print:hidden">
                      {/* On-demand Instruction button (Requirement 4) */}
                      {row.instruction && (
                        <button
                          type="button"
                          id={`btn-instruction-${row.id}`}
                          onClick={() => {
                            setViewInstructionTask({
                              taskId: row.task?.id,
                              title: `${row.programTitle} – ${row.roleTitle}`,
                              instruction: row.instruction || "",
                              time: row.time,
                              groupName: row.groupName,
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200/60 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>Instruks</span>
                        </button>
                      )}

                      {/* Direct assign button (Requirement 5) */}
                      {row.task && canIntervene && (
                        <button
                          type="button"
                          id={`btn-intervene-assign-${row.task.id}`}
                          onClick={() => {
                            setActiveInterveneTaskId(row.task!.id);
                          }}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            isVacant
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>{isVacant ? "Grip inn / Tildel" : "Tildel flere"}</span>
                        </button>
                      )}

                      {/* Admin Task Edit button (Requirement 5) */}
                      {row.task && canAdminister && (
                        <button
                          type="button"
                          id={`btn-admin-edit-task-${row.task.id}`}
                          onClick={() => {
                            setEditingTask({
                              id: row.task!.id,
                              title: row.task!.title,
                              groupId: row.task!.groupId,
                              neededCount: row.task!.neededCount || 1,
                              description: row.task!.description || "",
                              instruction: row.task!.instruction || "",
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Rediger oppgave, behov eller gruppe"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewInstructionTask && (
        <InstructionDialog
          detail={detail}
          task={viewInstructionTask}
          canAdminister={canAdminister}
          showToast={showToast}
          onClose={() => setViewInstructionTask(null)}
        />
      )}

      {activeInterveneTaskId && (
        <AssignPersonDialog
          detail={detail}
          taskId={activeInterveneTaskId}
          canAdminister={canAdminister}
          showToast={showToast}
          onClose={() => setActiveInterveneTaskId(null)}
        />
      )}

      {editingTask && (
        <EditTaskDialog
          detail={detail}
          task={editingTask}
          showToast={showToast}
          onClose={() => setEditingTask(null)}
        />
      )}

      <CreateTaskDialog
        detail={detail}
        gathering={gathering}
        open={isCreatingTask}
        showToast={showToast}
        onClose={() => setIsCreatingTask(false)}
      />

      {isEditingGathering && (
        <EditGatheringDialog
          detail={detail}
          gathering={gathering}
          showToast={showToast}
          onClose={() => setIsEditingGathering(false)}
        />
      )}
    </div>
  );
};
