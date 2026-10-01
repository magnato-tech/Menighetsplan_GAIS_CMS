import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useLeaderGroupDetail,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
  MEETING_FREQUENCIES,
  WEEKDAYS,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { HusfellesskapView } from "../components/HusfellesskapView";
import { GroupChat } from "../components/GroupChat";
import { GroupCategory, MeetingSchedule } from "../types";
import {
  ArrowLeft,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Sparkles,
  LayoutGrid,
  Table2,
} from "lucide-react";

export const LeaderGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const {
    hasAccess,
    isMember,
    hasLeaderAccess,
    isLeader,
    isDeputy,
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    groupGatherings,
    messages,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    sendMessage,
    assignTaskToPerson,
  } = useLeaderGroupDetail(groupId || "");

  // Editing state for group basic metadata
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState(group?.name || "");
  const [editCategory, setEditCategory] = useState<GroupCategory>(group?.category || "tjenestegruppe");
  const [editLeaderId, setEditLeaderId] = useState<string>(group?.leaderIds[0] || "");
  const [editDeputyId, setEditDeputyId] = useState<string>(group?.deputyLeaderIds?.[0] || "");

  // Editing state for meeting schedule
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleWeekday, setScheduleWeekday] = useState(group?.meetingSchedule?.weekday || "Søndag");
  const [scheduleTime, setScheduleTime] = useState(group?.meetingSchedule?.time || "10:00");
  const [scheduleFrequency, setScheduleFrequency] = useState<MeetingSchedule["frequency"]>(
    group?.meetingSchedule?.frequency || "hver uke"
  );

  // Add member selector
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState<string>("");

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as "aktiviteter" | "chat" | "medlemmer" | null;

  // Room Tab for non-husgruppe: 'aktiviteter' | 'chat' | 'medlemmer'
  const [activeRoomTab, setActiveRoomTab] = useState<"aktiviteter" | "chat" | "medlemmer">(urlTab || "aktiviteter");

  useEffect(() => {
    if (urlTab) {
      setActiveRoomTab(urlTab);
    }
  }, [urlTab]);

  // Semester Filter states (Aug 2026 - Jan 2027)
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "red" | "yellow" | "green">("all");
  const [viewMode, setViewMode] = useState<"kort" | "tabell">("kort");
  const [expandedGatheringId, setExpandedGatheringId] = useState<string | null>(null);
  const [quickAssignTaskId, setQuickAssignTaskId] = useState<string | null>(null);

  // New message input
  const [newMessageText, setNewMessageText] = useState("");
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showToast = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const monthOptions = [
    { id: "all", label: "Alle måneder" },
    { id: "2026-08", label: "Aug 2026" },
    { id: "2026-09", label: "Sep 2026" },
    { id: "2026-10", label: "Okt 2026" },
    { id: "2026-11", label: "Nov 2026" },
    { id: "2026-12", label: "Des 2026" },
    { id: "2027-01", label: "Jan 2027" },
  ];

  // Filtered gatherings for this group
  const filteredGroupGatherings = useMemo(() => {
    return groupGatherings.filter((item) => {
      if (selectedMonth !== "all") {
        const itemMonth = item.gathering.startsAt.substring(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }
      if (selectedStatusFilter !== "all") {
        if (item.staffing.color !== selectedStatusFilter) return false;
      }
      return true;
    });
  }, [groupGatherings, selectedMonth, selectedStatusFilter]);

  // Flattened table rows for fast tabular overview across all semester activities
  const tableRows = useMemo(() => {
    const rows: {
      rowId: string;
      gatheringId: string;
      gatheringTitle: string;
      gatheringType: "arrangement" | "gruppesamling";
      startsAt: string;
      location?: string;
      taskId: string;
      taskTitle: string;
      neededCount: number;
      confirmedCount: number;
      assignedPersonName?: string;
      assignedPersonId?: string;
      statusLabel: string;
      statusType: "confirmed" | "pending" | "withdrawn" | "declined" | "vacant";
    }[] = [];

    filteredGroupGatherings.forEach((item) => {
      const { gathering, taskItems } = item;
      const gType = gathering.type === "arrangement" || !gathering.type ? "arrangement" : "gruppesamling";

      taskItems.forEach(({ task, assignedPersons, confirmedCount, neededCount, hasForfall }) => {
        if (assignedPersons.length > 0) {
          assignedPersons.forEach(({ assignment, person, statusLabel, response }) => {
            rows.push({
              rowId: `${gathering.id}-${task.id}-${assignment.id}`,
              gatheringId: gathering.id,
              gatheringTitle: gathering.title,
              gatheringType: gType,
              startsAt: gathering.startsAt,
              location: gathering.location,
              taskId: task.id,
              taskTitle: task.title,
              neededCount,
              confirmedCount,
              assignedPersonName: person?.name,
              assignedPersonId: person?.id,
              statusLabel,
              statusType: response,
            });
          });
        } else {
          // Vacant task without assignment
          rows.push({
            rowId: `${gathering.id}-${task.id}-vacant`,
            gatheringId: gathering.id,
            gatheringTitle: gathering.title,
            gatheringType: gType,
            startsAt: gathering.startsAt,
            location: gathering.location,
            taskId: task.id,
            taskTitle: task.title,
            neededCount,
            confirmedCount: 0,
            assignedPersonName: undefined,
            assignedPersonId: undefined,
            statusLabel: "Ubesatt",
            statusType: "vacant",
          });
        }
      });
    });

    return rows;
  }, [filteredGroupGatherings]);

  // Total urgent tasks in this group
  const totalGroupUrgentTasks = useMemo(() => {
    return groupGatherings.reduce((acc, item) => {
      const urgentInGathering = item.tasks.filter((t) => t.status === "vacant").length;
      return acc + urgentInGathering;
    }, 0);
  }, [groupGatherings]);

  // If group not found or unauthorized
  if (!group || !hasAccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">
              Ingen tilgang til gruppen
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {!group
                ? "Gruppen ble ikke funnet."
                : `Du har ikke tilgang til denne gruppen. ${currentUser.name} er ikke registrert som medlem eller leder for ${group.name}.`}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              id="btn-back-to-home"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til Min side
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Meta Save
  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast("Gruppenavn kan ikke være tomt.");
      return;
    }

    const newLeaderIds = editLeaderId ? [editLeaderId] : group.leaderIds;
    const newDeputyIds = editDeputyId ? [editDeputyId] : [];

    const res = updateGroup(group.id, {
      name: editName.trim(),
      category: editCategory,
      leaderIds: newLeaderIds,
      deputyLeaderIds: newDeputyIds,
    });

    if (res.success) {
      setIsEditingMeta(false);
      showToast("Gruppedetaljer ble lagret!");
    }
  };

  // Handle Schedule Save
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateGroup(group.id, {
      meetingSchedule: {
        weekday: scheduleWeekday,
        time: scheduleTime,
        frequency: scheduleFrequency,
      },
    });

    if (res.success) {
      setIsEditingSchedule(false);
      showToast("Møteplan ble oppdatert!");
    }
  };

  // Handle Add Member
  const handleAddMember = () => {
    if (!selectedPersonToAdd) return;
    const res = addGroupMember(group.id, selectedPersonToAdd);
    if (res.success) {
      setSelectedPersonToAdd("");
      showToast("Personen ble lagt til som medlem i gruppen!");
    }
  };

  // Handle Remove Member
  const handleRemoveMember = (personId: string, personName: string) => {
    if (confirm(`Er du sikker på at du vil fjerne ${personName} fra gruppen?`)) {
      const res = removeGroupMember(group.id, personId);
      if (res.success) {
        showToast(`${personName} ble fjernet fra gruppen.`);
      }
    }
  };

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const res = sendMessage(newMessageText);
    if (res.success) {
      setNewMessageText("");
      setMessageFeedback("Beskjeden ble publisert for medlemmene i gruppen.");
      setTimeout(() => setMessageFeedback(null), 3500);
    }
  };

  if (group.category === "husgruppe") {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        {/* Quick Switcher Bar */}
        <UserQuickSwitcherBar />

        {/* Header & Breadcrumb */}
        <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            {hasLeaderAccess ? (
              <Link
                to="/leder"
                id="btn-back-to-leader-nav"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Gruppeleder</span>
              </Link>
            ) : (
              <Link
                to="/"
                id="btn-back-to-home-nav"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Min side</span>
              </Link>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isLeader
                  ? "bg-emerald-100 text-emerald-800"
                  : isDeputy
                  ? "bg-blue-100 text-blue-800"
                  : isAdmin
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {isLeader ? "Gruppeleder" : isDeputy ? "Nestleder" : isAdmin ? "Admin" : "Medlem"}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <HusfellesskapView groupId={group.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Header & Breadcrumb */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          {hasLeaderAccess ? (
            <Link
              to="/leder"
              id="btn-back-to-leader-nav"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Gruppeleder</span>
            </Link>
          ) : (
            <Link
              to="/"
              id="btn-back-to-home-nav"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Min side</span>
            </Link>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              isLeader
                ? "bg-emerald-100 text-emerald-800"
                : isDeputy
                ? "bg-blue-100 text-blue-800"
                : isAdmin
                ? "bg-indigo-100 text-indigo-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {isLeader ? "Gruppeleder" : isDeputy ? "Nestleder" : isAdmin ? "Admin" : "Medlem"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2 pt-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{group.name}</h1>
            <p className="text-xs text-slate-500 capitalize">
              {group.category || "Tjenestegruppe"} • {members.length} medlemmer
            </p>
          </div>
          {hasLeaderAccess && !isEditingMeta && (
            <button
              type="button"
              id="btn-edit-group-meta"
              onClick={() => {
                setEditName(group.name);
                setEditCategory(group.category || "tjenestegruppe");
                setEditLeaderId(group.leaderIds[0] || "");
                setEditDeputyId(group.deputyLeaderIds?.[0] || "");
                setIsEditingMeta(true);
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rediger</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation: Aktiviteter, Gruppechat, Medlemmer */}
      <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200/60 flex items-center gap-1.5">
        <button
          type="button"
          id="tab-btn-group-aktiviteter"
          onClick={() => setActiveRoomTab("aktiviteter")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeRoomTab === "aktiviteter"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Aktiviteter</span>
        </button>

        <button
          type="button"
          id="tab-btn-group-chat"
          onClick={() => setActiveRoomTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeRoomTab === "chat"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>Gruppechat</span>
          {messages.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              {messages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-btn-group-medlemmer"
          onClick={() => setActiveRoomTab("medlemmer")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeRoomTab === "medlemmer"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Medlemmer ({members.length})</span>
        </button>
      </div>

      {/* Toast feedback */}
      {actionFeedback && (
        <div
          id="group-card-toast"
          className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="p-5 space-y-6">

        {/* GRUPPEKORT DETALJER / REDIGERING */}
        {isEditingMeta && (
          <section
            id="section-group-details"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rediger gruppedetaljer</span>
            </h2>

            <form onSubmit={handleSaveMeta} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Gruppenavn
                </label>
                <input
                  type="text"
                  id="input-edit-group-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kategori
                </label>
                <select
                  id="select-edit-group-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GroupCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                >
                  {GROUP_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gruppeleder
                  </label>
                  <select
                    id="select-edit-group-leader"
                    value={editLeaderId}
                    onChange={(e) => setEditLeaderId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Velg leder...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nestleder
                  </label>
                  <select
                    id="select-edit-group-deputy"
                    value={editDeputyId}
                    onChange={(e) => setEditDeputyId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Ingen nestleder</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-group-meta"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Lagre endringer
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMeta(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 1: AKTIVITETER */}
        {activeRoomTab === "aktiviteter" && (
          <div id="section-group-aktiviteter-tab" className="space-y-6">
            {/* MØTEPLAN */}
            <section
              id="section-group-schedule"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fast møteplan</span>
            </h2>
            {!isEditingSchedule && hasLeaderAccess && (
              <button
                type="button"
                id="btn-edit-schedule"
                onClick={() => {
                  setScheduleWeekday(group.meetingSchedule?.weekday || "Søndag");
                  setScheduleTime(group.meetingSchedule?.time || "10:00");
                  setScheduleFrequency(group.meetingSchedule?.frequency || "hver uke");
                  setIsEditingSchedule(true);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Endre møteplan
              </button>
            )}
          </div>

          {isEditingSchedule ? (
            <form onSubmit={handleSaveSchedule} className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Ukedag
                  </label>
                  <select
                    id="select-schedule-weekday"
                    value={scheduleWeekday}
                    onChange={(e) => setScheduleWeekday(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Tidspunkt
                  </label>
                  <input
                    type="time"
                    id="input-schedule-time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Frekvens
                  </label>
                  <select
                    id="select-schedule-frequency"
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as MeetingSchedule["frequency"])}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    {MEETING_FREQUENCIES.map((freq) => (
                      <option key={freq.id} value={freq.id}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-schedule"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Lagre møteplan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSchedule(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
              {group.meetingSchedule ? (
                <div className="flex items-center justify-between">
                  <span>
                    {group.meetingSchedule.weekday}er kl. {group.meetingSchedule.time}
                  </span>
                  <span className="text-slate-500 font-normal">
                    ({group.meetingSchedule.frequency})
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Ingen fast møteplan angitt.</span>
              )}
            </div>
          )}
        </section>

        {/* KOMMENDE AKTIVITETER FOR DENNE GRUPPEN */}
        <section
          id="section-group-gatherings"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Planlagte aktiviteter</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredGroupGatherings.length} av {groupGatherings.length} aktiviteter
            </span>
          </div>

          {/* Compact Group Status Indicator */}
          {totalGroupUrgentTasks > 0 ? (
            <div className="px-3.5 py-2.5 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-red-900">
                  {totalGroupUrgentTasks} {totalGroupUrgentTasks === 1 ? "oppgave trenger oppfølging / vikar" : "oppgaver trenger oppfølging / vikar"}
                </span>
              </div>
              <button
                type="button"
                id="btn-group-filter-urgent-shortcut"
                onClick={() => {
                  setSelectedStatusFilter("red");
                  setSelectedMonth("all");
                }}
                className="text-[11px] font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Filtrer forfall →
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-emerald-900">
                  Alle oppgaver er dekket for planlagte aktiviteter
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                🟢 I rute
              </span>
            </div>
          )}

          {/* 1 Kompakt Kontrollrad: Filter + Visningsvalg */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1.5 border-b border-slate-100">
            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Periode */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Periode:</span>
                <select
                  id="select-group-filter-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  {monthOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Status:</span>
                <select
                  id="select-group-filter-status"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">Alle statuser</option>
                  <option value="red">🔴 Forfall / Trenger vikar</option>
                  <option value="yellow">🟡 Mangler frivillig</option>
                  <option value="green">🟢 Fullt dekket</option>
                </select>
              </div>
            </div>

            {/* Visningsvalg: Kort / Tabell */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto border border-slate-200/60">
              <button
                type="button"
                id="btn-switch-view-kort"
                onClick={() => setViewMode("kort")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "kort"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Kortvisning"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kort</span>
              </button>
              <button
                type="button"
                id="btn-switch-view-tabell"
                onClick={() => setViewMode("tabell")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "tabell"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tabellvisning"
              >
                <Table2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Tabell</span>
              </button>
            </div>
          </div>

          {/* VISNING 1: KORTVISNING */}
          {viewMode === "kort" && (
            <div>
              {filteredGroupGatherings.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Ingen aktiviteter matcher valgt måned eller filter for denne gruppen.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {filteredGroupGatherings.map((item) => {
                    const { gathering, tasks: gTasks, taskItems, totalNeeded, totalConfirmed, staffing } = item;
                    const isArrangement = gathering.type === "arrangement" || !gathering.type;
                    const isExpanded = expandedGatheringId === gathering.id;

                    return (
                      <div
                        key={gathering.id}
                        id={`group-gathering-card-${gathering.id}`}
                        className={`p-3.5 bg-slate-50 rounded-2xl border transition-all space-y-3 ${
                          staffing.color === "red"
                            ? "border-red-200 ring-1 ring-red-100 bg-red-50/20"
                            : staffing.color === "yellow"
                            ? "border-amber-200 bg-amber-50/20"
                            : "border-slate-200"
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xs font-bold text-slate-900">{gathering.title}</h3>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  isArrangement
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : "bg-purple-50 text-purple-700 border border-purple-100"
                                }`}
                              >
                                {isArrangement ? "Arrangement" : "Gruppesamling"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {formatNorwegianDateTime(gathering.startsAt)}
                              </span>
                              {gathering.location && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {gathering.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Staffing Pill */}
                          <div className="text-right space-y-0.5">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                staffing.color === "red"
                                  ? "bg-red-100 text-red-700"
                                  : staffing.color === "yellow"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {staffing.color === "green" ? "🟢 Dekket" : staffing.badgeText}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {totalConfirmed} av {totalNeeded} dekket
                            </p>
                          </div>
                        </div>

                        {/* Tasks Summary / Expander toggle */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            type="button"
                            id={`btn-toggle-tasks-${gathering.id}`}
                            onClick={() => setExpandedGatheringId(isExpanded ? null : gathering.id)}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{gTasks.length} {gTasks.length === 1 ? "oppgave" : "oppgaver"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                          </button>

                          <button
                            type="button"
                            id={`btn-open-gathering-detail-${gathering.id}`}
                            onClick={() => navigate(`/leder/samling/${gathering.id}`)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Åpne aktivitetsdetalj</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Expanded Task list with assigned persons & direct action */}
                        {isExpanded && (
                          <div className="pt-2 space-y-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                            {taskItems.map(({ task, assignedPersons, confirmedCount, neededCount, isFullyCovered: taskCovered, hasForfall: taskForfall }) => (
                              <div
                                key={task.id}
                                id={`group-gathering-task-${task.id}`}
                                className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div>
                                    <span className="font-bold text-slate-800">{task.title}</span>
                                    <span className="text-[11px] text-slate-500 ml-2">
                                      ({confirmedCount}/{neededCount} dekket)
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                      taskForfall
                                        ? "bg-red-100 text-red-700"
                                        : taskCovered
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {taskForfall ? "Forfall" : taskCovered ? "Dekket" : "Mangler"}
                                  </span>
                                </div>

                                {/* Assigned persons tags */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {assignedPersons.length > 0 ? (
                                    assignedPersons.map(({ assignment, person, statusLabel, response }) => (
                                      <span
                                        key={assignment.id}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                          response === "confirmed"
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                                            : response === "withdrawn"
                                            ? "bg-red-50 text-red-800 border border-red-300"
                                            : "bg-amber-50 text-amber-800 border border-amber-300"
                                        }`}
                                      >
                                        <span>{person?.name || "Ukjent"}</span>
                                        {response !== "confirmed" && (
                                          <span className="text-[9px] font-bold opacity-90">
                                            ({response === "withdrawn" ? "Forfall" : response === "declined" ? "Avslått" : "Forespurt"})
                                          </span>
                                        )}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Ingen tildelt</span>
                                  )}
                                </div>

                                {/* Quick Assign action button */}
                                {!taskCovered && hasLeaderAccess && (
                                  <div className="pt-1 flex items-center justify-between">
                                    <button
                                      type="button"
                                      id={`btn-quick-assign-${task.id}`}
                                      onClick={() => setQuickAssignTaskId(quickAssignTaskId === task.id ? null : task.id)}
                                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Tildel fra gruppen</span>
                                    </button>
                                  </div>
                                )}

                                {/* Quick Assign Dropdown Drawer */}
                                {quickAssignTaskId === task.id && (
                                  <div className="p-2.5 bg-slate-900 text-white rounded-xl space-y-2 mt-1">
                                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                                      Velg medlem for direkte tildeling:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                      {members.map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          id={`btn-do-quick-assign-${task.id}-${m.id}`}
                                          onClick={async () => {
                                            const res = await assignTaskToPerson(task.id, m.id);
                                            if (res.success) {
                                              setQuickAssignTaskId(null);
                                              showToast(`Oppgaven ble direkte tildelt ${m.name}!`);
                                            } else {
                                              showToast(res.error || "Kunne ikke tildele oppgaven.");
                                            }
                                          }}
                                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-left rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between cursor-pointer"
                                        >
                                          <span>{m.name}</span>
                                          <UserPlus className="w-3 h-3 text-emerald-400" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISNING 2: TABELLVISNING (Kompakt Excel-stil oversikt over oppgaver) */}
          {viewMode === "tabell" && (
            <div className="pt-1">
              {tableRows.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Ingen oppgaver matcher valgt filter for denne gruppen.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Dato & Tid</th>
                        <th className="py-2.5 px-3">Aktivitet</th>
                        <th className="py-2.5 px-3">Rolle / Oppgave</th>
                        <th className="py-2.5 px-3">Person</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Handling</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {tableRows.map((row) => {
                        const isVacant = row.statusType === "vacant";
                        const isForfall = row.statusType === "withdrawn" || row.statusType === "declined";
                        const isConfirmed = row.statusType === "confirmed";

                        return (
                          <tr
                            key={row.rowId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isForfall ? "bg-red-50/30" : isVacant ? "bg-amber-50/20" : ""
                            }`}
                          >
                            {/* Dato & Tid */}
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
                              {formatNorwegianDateTime(row.startsAt)}
                            </td>

                            {/* Aktivitet */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900 block">{row.gatheringTitle}</span>
                              {row.location && (
                                <span className="text-[10px] text-slate-400 block">{row.location}</span>
                              )}
                            </td>

                            {/* Rolle / Oppgave */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800">{row.taskTitle}</span>
                            </td>

                            {/* Person */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {row.assignedPersonName ? (
                                <span className="font-bold text-slate-900">{row.assignedPersonName}</span>
                              ) : (
                                <span className="text-amber-700 font-bold italic text-[11px]">Ubesatt</span>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isConfirmed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isForfall
                                    ? "bg-red-100 text-red-800"
                                    : isVacant
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isConfirmed
                                      ? "bg-emerald-600"
                                      : isForfall
                                      ? "bg-red-600"
                                      : isVacant
                                      ? "bg-amber-600"
                                      : "bg-blue-600"
                                  }`}
                                />
                                <span>{row.statusLabel}</span>
                              </span>
                            </td>

                            {/* Handling */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {(isVacant || isForfall) && hasLeaderAccess && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedGatheringId(row.gatheringId);
                                      setQuickAssignTaskId(row.taskId);
                                      setViewMode("kort");
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                  >
                                    Tildel vikar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => navigate(`/leder/samling/${row.gatheringId}`)}
                                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer ml-1"
                                >
                                  <span>Åpne</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
          </div>
        )}

        {/* TAB 2: CHAT */}
        {activeRoomTab === "chat" && (
          <div id="section-group-chat-tab" className="space-y-4">
            <GroupChat groupId={group.id} />
          </div>
        )}

        {/* TAB 3: MEDLEMMER */}
        {activeRoomTab === "medlemmer" && (
          <div id="section-group-medlemmer-tab" className="space-y-4">
            <section
              id="section-group-members"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Medlemmer ({members.length})</span>
                </h2>
              </div>

              {/* Member List */}
              <div className="space-y-2">
                {members.map((member) => {
                  const isGroupLeader = group.leaderIds.includes(member.id);
                  const isGroupDeputy = group.deputyLeaderIds?.includes(member.id);

                  return (
                    <div
                      key={member.id}
                      id={`member-row-${member.id}`}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2"
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
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {member.phone || member.email || "Ingen kontaktinfo"}
                          </p>
                        </div>
                      </div>

                      {/* Remove Member button (disabled for non-leaders and main leader to prevent orphan group) */}
                      {hasLeaderAccess && !isGroupLeader && (
                        <button
                          type="button"
                          id={`btn-remove-member-${member.id}`}
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Fjern fra gruppen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Member form - for leaders only */}
              {hasLeaderAccess && (
                availablePersonsToAdd.length > 0 ? (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Legg til person i gruppen:
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="select-add-member"
                        value={selectedPersonToAdd}
                        onChange={(e) => setSelectedPersonToAdd(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                      >
                        <option value="">Velg person fra listen...</option>
                        {availablePersonsToAdd.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        id="btn-add-member"
                        onClick={handleAddMember}
                        disabled={!selectedPersonToAdd}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Legg til</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    Alle registrerte personer er allerede medlemmer i denne gruppen.
                  </p>
                )
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
