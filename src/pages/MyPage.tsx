import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useCurrentUser,
  useMyTasks,
  useOpenTasks,
  formatNorwegianDateTime,
  formatChatMessageTime,
} from "../hooks/useAppHooks";
import { useMockData } from "../context/MockDataContext";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { ActionCard } from "../components/ActionCard";
import { Task, GroupMessage, Gathering, Group } from "../types";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Info,
  Layers,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  X,
  ListTodo,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export const MyPage: React.FC = () => {
  const { currentUser } = useCurrentUser();
  const { data: myTasks } = useMyTasks();
  const { data: openTasks } = useOpenTasks();
  const {
    tasks,
    assignments,
    gatherings,
    getUserGroups,
    getGroupMessages,
    getPersonAttendance,
    respondToGathering,
    assignTaskToPerson,
    getGatheringsForGroup,
    getGatheringById,
    getGroupById,
    getAllAssignmentsForTask,
  } = useMockData();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

  // Active view toggle for mobile tasks modal / drawer if requested
  const [showTasksModal, setShowTasksModal] = useState(
    searchParams.get("view") === "oppgaver"
  );
  const [showAttentionModal, setShowAttentionModal] = useState(false);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. User's groups
  const myGroups = useMemo(
    () => getUserGroups(currentUser.id),
    [getUserGroups, currentUser.id]
  );

  const myGroupIds = useMemo(() => myGroups.map((g) => g.id), [myGroups]);

  // =========================================================================
  // 1. TRENGER DIN OPPMERKSOMHET
  // Vises BARE dersom brukeren faktisk har noe å gjøre (ingen tom 0-boks)
  // =========================================================================
  const attentionItems = useMemo(() => {
    const items: Array<{
      type: "unanswered_invitation" | "pending_task";
      id: string;
      title: string;
      startsAt: string;
      location?: string;
      groupName?: string;
      groupId?: string;
      gatheringId?: string;
      taskId?: string;
      theme?: string;
      taskDescription?: string;
      isReporter?: boolean;
    }> = [];

    // A) Ubesvarte innkallinger til samlinger i brukerens grupper
    myGroups.forEach((group) => {
      const gList = getGatheringsForGroup(group.id);
      gList.forEach((gathering) => {
        // Kun samlinger der innkalling er sendt
        if (gathering.invitationSent || gathering.invitationSentAt) {
          const att = getPersonAttendance(gathering.id, currentUser.id);
          // Hvis ikke svart
          if (!att) {
            items.push({
              type: "unanswered_invitation",
              id: `inv-${gathering.id}`,
              gatheringId: gathering.id,
              groupId: group.id,
              groupName: group.name,
              title: gathering.title,
              startsAt: gathering.startsAt,
              location: gathering.location,
              theme: gathering.theme,
            });
          }
        }
      });
    });

    // B) Oppgaver med forfall / ledig behov i grupper brukeren er medlem av
    const myGroupSet = new Set(myGroupIds);
    const relevantTasks = tasks.filter(
      (t) =>
        myGroupSet.has(t.groupId) &&
        (t.status === "vacant" || t.status === "open")
    );

    relevantTasks.forEach((task) => {
      const g = task.gatheringId ? getGatheringById(task.gatheringId) : undefined;
      const grp = getGroupById(task.groupId);
      const allTaskAssigns = getAllAssignmentsForTask(task.id);
      
      // Check if current user reported absence on this task
      const userAbsenceAssign = allTaskAssigns.find(
        (a) =>
          a.personId === currentUser.id &&
          (a.response === "declined" || a.response === "withdrawn")
      );
      const isReporter = !!userAbsenceAssign;

      // Check if current user is already assigned and confirmed on this task
      const isAlreadyAssigned = allTaskAssigns.some(
        (a) => a.personId === currentUser.id && a.response === "confirmed"
      );

      // Filter out past tasks/events
      const taskDate = g?.startsAt || new Date().toISOString();
      const isFutureOrToday =
        new Date(taskDate).getTime() >=
        new Date("2026-09-02T00:00:00.000Z").getTime();

      // Only include active actionable tasks where user is not the one who declined
      // and not already assigned (Ditt forfall regnes ikke som en aktiv oppmerksomhetssak)
      if (!isReporter && !isAlreadyAssigned && isFutureOrToday) {
        items.push({
          type: "pending_task",
          id: `attention-task-${task.id}`,
          taskId: task.id,
          title: task.title,
          taskDescription: task.description,
          startsAt: g?.startsAt || "",
          location: g?.location || g?.title,
          groupId: task.groupId,
          groupName: grp?.name || "",
          gatheringId: task.gatheringId,
        });
      }
    });

    return items;
  }, [
    myGroups,
    myGroupIds,
    tasks,
    assignments,
    getGatheringsForGroup,
    getPersonAttendance,
    getGatheringById,
    getGroupById,
    getAllAssignmentsForTask,
    currentUser.id,
  ]);

  // Handler for taking a task directly from the Attention card
  const handleTakeTask = async (taskId: string) => {
    const res = await assignTaskToPerson(taskId, currentUser.id, "confirmed");
    if (res.success) {
      showToast("Takk! Du har tatt oppgaven.", "success");
    } else {
      showToast(res.error || "Kunne ikke ta oppgaven.", "info");
    }
  };

  // Handler for quick response to gathering from Attention card
  const handleQuickRespondGathering = async (
    gatheringId: string,
    status: "attending" | "declined"
  ) => {
    const res = await respondToGathering(gatheringId, currentUser.id, status);
    if (res.success) {
      showToast(
        status === "attending"
          ? "Takk for svar! Du er registrert som KOMMER."
          : "Takk for beskjed. Du er registrert som KOMMER IKKE.",
        "success"
      );
    } else {
      showToast(res.error || "Kunne ikke lagre svar.", "info");
    }
  };

  // Time threshold for current moment (filters out passed events before current date/time)
  const currentTimestamp = useMemo(() => {
    const liveTime = Date.now();
    const mockBaseline = new Date("2026-09-02T00:00:00.000Z").getTime();
    return Math.max(liveTime, mockBaseline);
  }, []);

  // =========================================================================
  // 2. NESTE I MENIGHETEN
  // Neste gudstjeneste / arrangement som gjelder hele menigheten (fremtidig dato)
  // =========================================================================
  const nextChurchEvent = useMemo(() => {
    // Finn alle fremtidige fellesarrangementer/gudstjenester
    const churchEvents = gatherings.filter((g) => {
      const isFuture = new Date(g.startsAt).getTime() >= currentTimestamp;
      const isChurchWide =
        g.type === "arrangement" ||
        g.title.toLowerCase().includes("gudstjeneste") ||
        g.title.toLowerCase().includes("storsamling") ||
        g.title.toLowerCase().includes("fest") ||
        g.location?.toLowerCase().includes("hovedsalen");
      return isFuture && isChurchWide;
    });

    if (churchEvents.length === 0) return null;

    // Sorter kronologisk
    const sorted = [...churchEvents].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    return sorted[0];
  }, [gatherings, currentTimestamp]);

  // Check if current user has a task in the next church event
  const myTaskInChurchEvent = useMemo(() => {
    if (!nextChurchEvent) return null;
    return myTasks.find((t) => t.gatheringId === nextChurchEvent.id);
  }, [nextChurchEvent, myTasks]);

  // =========================================================================
  // 3. NESTE FOR DEG
  // Brukerens neste relevante aktivitet (f.eks. husfellesskap eller tjenesteaktivitet)
  // Skiller seg fra «Neste i menigheten» når dataene tilsier det.
  // =========================================================================
  const nextPersonalGatheringData = useMemo(() => {
    const userGatherings: Array<{
      gathering: Gathering;
      group: Group;
      attendance?: ReturnType<typeof getPersonAttendance>;
      userTask?: Task;
      isDistinctFromChurchWide: boolean;
    }> = [];

    myGroups.forEach((group) => {
      const gList = getGatheringsForGroup(group.id);
      gList.forEach((gathering) => {
        // Kun fremtidige samlinger
        if (new Date(gathering.startsAt).getTime() >= currentTimestamp) {
          const att = getPersonAttendance(gathering.id, currentUser.id);
          const task = myTasks.find((t) => t.gatheringId === gathering.id);
          const isDistinct = nextChurchEvent ? gathering.id !== nextChurchEvent.id : true;
          userGatherings.push({
            gathering,
            group,
            attendance: att,
            userTask: task,
            isDistinctFromChurchWide: isDistinct,
          });
        }
      });
    });

    if (userGatherings.length === 0) return null;

    // Sorter kronologisk
    userGatherings.sort(
      (a, b) =>
        new Date(a.gathering.startsAt).getTime() -
        new Date(b.gathering.startsAt).getTime()
    );

    // Prioriter en samling som er ulik «Neste i menigheten» (f.eks. husfellesskap eller tjenestemøte)
    const distinctPersonal = userGatherings.find((item) => item.isDistinctFromChurchWide);
    return distinctPersonal || userGatherings[0];
  }, [myGroups, getGatheringsForGroup, getPersonAttendance, currentUser.id, myTasks, currentTimestamp, nextChurchEvent]);

  // Helper to get next activity / meeting time for a group
  const getGroupNextActivity = (group: Group): string | null => {
    if (group.meetingSchedule) {
      return `${group.meetingSchedule.weekday} kl. ${group.meetingSchedule.time}`;
    }
    const groupGatherings = getGatheringsForGroup(group.id);
    const upcoming = groupGatherings.find(
      (g) => new Date(g.startsAt).getTime() >= currentTimestamp
    );
    if (upcoming) {
      return formatNorwegianDateTime(upcoming.startsAt);
    }
    return null;
  };

  // Helper to get the latest chat message for a group
  const getGroupLatestMessage = (groupId: string): GroupMessage | null => {
    const msgs = getGroupMessages(groupId, currentUser.id);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  // Navigation helper to open specific group chat
  const handleOpenGroupChat = (group: Group) => {
    if (group.category === "husgruppe") {
      navigate(`/husfellesskap/${group.id}?tab=chat`);
    } else {
      navigate(`/gruppe/${group.id}?tab=chat`);
    }
  };

  // Navigation helper to open group room
  const handleOpenGroupRoom = (group: Group) => {
    if (group.category === "husgruppe") {
      navigate(`/husfellesskap/${group.id}`);
    } else {
      navigate(`/gruppe/${group.id}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden pb-20 sm:pb-8">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Floating Feedback Notification */}
        {feedbackMessage && (
          <div
            role="status"
            className={`p-3.5 rounded-2xl border transition-all text-xs sm:text-sm flex items-start gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                : "bg-amber-50 text-amber-950 border-amber-300"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{feedbackMessage.text}</div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Dashboard Header Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Min side</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Oversikt for {currentUser.name}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs">
            {myGroups.length} {myGroups.length === 1 ? "gruppe" : "grupper"}
          </span>
        </div>

        {/* =========================================================================
            1. TRENGER DIN OPPMERKSOMHET
            Vises BARE dersom brukeren faktisk har aktive handlinger.
            0 handlinger: Seksjonen skjules helt (går direkte til Neste i menigheten).
            1–2 handlinger: Vises direkte med eksisterende handlingskort.
            3+ handlinger: Vises som én samlet, kompakt boks [Se og håndter →].
           ========================================================================= */}
        {attentionItems.length > 0 && (
          <section
            id="section-trenger-oppmerksomhet"
            className="space-y-2.5 animate-in fade-in duration-200"
          >
            {attentionItems.length >= 3 ? (
              /* 3+ handlinger: Én samlet, kompakt boks */
              <div
                id="card-consolidated-attention"
                className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/90 text-amber-900 px-2.5 py-0.5 rounded-md">
                    Dette trenger din handling
                  </span>
                  <span className="text-xs font-black bg-amber-800 text-white px-2.5 py-0.5 rounded-full">
                    {attentionItems.length} saker
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {attentionItems.length} saker venter på deg
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Du har ubesvarte innkallinger eller ledige oppgaver i dine grupper.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-see-and-handle-attention"
                  onClick={() => setShowAttentionModal(true)}
                  className="w-full py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Se og håndter</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              /* 1–2 handlinger: Vises direkte på Min side */
              <>
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Trenger din oppmerksomhet</span>
                  </h2>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/60">
                    {attentionItems.length} {attentionItems.length === 1 ? "sak" : "saker"}
                  </span>
                </div>

                <div className="space-y-3">
                  {attentionItems.map((item) => {
                    if (item.type === "pending_task") {
                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-300/80 rounded-2xl shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                                  Trenger vikar
                                </span>
                                {item.groupName && (
                                  <span className="text-xs font-semibold text-slate-700">
                                    {item.groupName}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-slate-900">
                                {item.title}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-slate-700">
                            {item.startsAt && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="font-semibold">
                                  {formatNorwegianDateTime(item.startsAt)}
                                </span>
                              </div>
                            )}
                            {item.location && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            {item.taskDescription && (
                              <p className="text-[11px] text-slate-600 italic pt-0.5">
                                {item.taskDescription}
                              </p>
                            )}
                          </div>

                          {/* Action for Task */}
                          <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                            <button
                              type="button"
                              id={`btn-take-task-${item.taskId}`}
                              onClick={() => item.taskId && handleTakeTask(item.taskId)}
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>Ta oppgave</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Default: unanswered_invitation
                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-300/80 rounded-2xl shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                                Innkalling
                              </span>
                              {item.groupName && (
                                <span className="text-xs font-semibold text-slate-700">
                                  {item.groupName}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="font-semibold">
                              {formatNorwegianDateTime(item.startsAt)}
                            </span>
                          </div>
                          {item.location && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.theme && (
                            <p className="text-[11px] text-slate-600 italic pt-0.5">
                              Tema: {item.theme}
                            </p>
                          )}
                        </div>

                        {/* Immediate Response Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                          <button
                            type="button"
                            id={`btn-attend-${item.gatheringId}`}
                            onClick={() =>
                              item.gatheringId &&
                              handleQuickRespondGathering(item.gatheringId, "attending")
                            }
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Kommer</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-decline-${item.gatheringId}`}
                            onClick={() =>
                              item.gatheringId &&
                              handleQuickRespondGathering(item.gatheringId, "declined")
                            }
                            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-slate-500" />
                            <span>Kan ikke</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* =========================================================================
            2. MINE GRUPPER
            Hovedinngang til brukerens gruppeliv med siste melding integrert
           ========================================================================= */}
        <section id="section-mine-grupper" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mine grupper ({myGroups.length})</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Medlemskap
            </span>
          </div>

          {myGroups.length > 0 ? (
            <div className="space-y-2.5">
              {myGroups.map((group) => {
                const isGroupLeader = group.leaderIds.includes(currentUser.id);
                const isGroupDeputy = group.deputyLeaderIds?.includes(currentUser.id);
                const nextActivity = getGroupNextActivity(group);
                const latestMsg = getGroupLatestMessage(group.id);

                return (
                  <div
                    key={group.id}
                    id={`my-group-card-${group.id}`}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    {/* Header: Type, Rolle og Gruppenavn */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {group.category === "husgruppe"
                            ? "Husfellesskap"
                            : group.category === "tjeneste" || group.category === "tjenestegruppe"
                            ? "Tjenestegruppe"
                            : group.category}
                        </span>
                        {isGroupLeader ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Leder
                          </span>
                        ) : isGroupDeputy ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            Nestleder
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Medlem
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {group.name}
                      </h3>
                    </div>

                    {/* Meta: antall medlemmer · neste aktivitet */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {group.memberIds.length}{" "}
                          {group.memberIds.length === 1 ? "medlem" : "medlemmer"}
                        </span>
                      </span>
                      {nextActivity && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{nextActivity}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Siste melding fra gruppens chat (sekundær informasjon) - skjules dersom ingen melding */}
                    {latestMsg && (
                      <div
                        onClick={() => handleOpenGroupChat(group)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-colors cursor-pointer space-y-1 group/msg"
                        title="Trykk for å gå til chatten"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {latestMsg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatChatMessageTime(latestMsg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {latestMsg.content || (latestMsg.imageUrl ? "[Bilde]" : "")}
                        </p>
                      </div>
                    )}

                    {/* Handlinger: Gå til grupperommet →       Chat */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        id={`btn-open-group-${group.id}`}
                        onClick={() => handleOpenGroupRoom(group)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                      >
                        <span>Gå til grupperommet</span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        id={`btn-open-group-chat-${group.id}`}
                        onClick={() => handleOpenGroupChat(group)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50"
                        title="Åpne gruppechat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              Du er ikke lagt til i noen grupper ennå.
            </div>
          )}
        </section>

        {/* =========================================================================
            3. NESTE I MENIGHETEN
            Neste gudstjeneste/arrangement som gjelder hele menigheten
           ========================================================================= */}
        <section id="section-neste-i-menigheten" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Neste i menigheten</span>
            </h2>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Felles
            </span>
          </div>

          {nextChurchEvent ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Gudstjeneste & storsamling
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {nextChurchEvent.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-900">
                    {formatNorwegianDateTime(nextChurchEvent.startsAt)}
                  </span>
                </div>
                {nextChurchEvent.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{nextChurchEvent.location}</span>
                  </div>
                )}
              </div>

              {/* Highlight if current user is serving in this service */}
              {myTaskInChurchEvent && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Din oppgave: {myTaskInChurchEvent.title}</span>
                  </div>
                  <Link
                    to={`/oppgave/${myTaskInChurchEvent.id}`}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Se oppgave
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              Ingen fellesarrangementer planlagt for øyeblikket.
            </div>
          )}
        </section>

        {/* =========================================================================
            3. NESTE FOR DEG
            Brukerens neste relevante aktivitet (f.eks. husfellesskap eller tjeneste)
           ========================================================================= */}
        <section id="section-neste-for-deg" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Neste for deg</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Din gruppe
            </span>
          </div>

          {nextPersonalGatheringData ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-emerald-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {nextPersonalGatheringData.group.name}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {nextPersonalGatheringData.gathering.title}
                  </h3>
                </div>

                {/* Svarstatus badge */}
                {nextPersonalGatheringData.attendance?.status === "attending" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Kommer</span>
                  </span>
                )}
                {nextPersonalGatheringData.attendance?.status === "declined" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    <X className="w-3 h-3" />
                    <span>Kommer ikke</span>
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">
                    {formatNorwegianDateTime(
                      nextPersonalGatheringData.gathering.startsAt
                    )}
                  </span>
                </div>
                {nextPersonalGatheringData.gathering.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{nextPersonalGatheringData.gathering.location}</span>
                  </div>
                )}
                {nextPersonalGatheringData.gathering.theme && (
                  <div className="flex items-start gap-2 text-slate-600 pt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px]">
                      Tema: {nextPersonalGatheringData.gathering.theme}
                      {nextPersonalGatheringData.gathering.bibleText && (
                        <span className="text-slate-500">
                          {" "}
                          ({nextPersonalGatheringData.gathering.bibleText})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Action link to group room */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenGroupRoom(nextPersonalGatheringData.group)
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <span>Gå til grupperommet</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              Ingen personlige gruppesamlinger planlagt.
            </div>
          )}
        </section>

        {/* Quick Access to User Groups & Tasks */}
        <div className="pt-2">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-slate-500" />
              <span>Dine oppgaver ({myTasks.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowTasksModal(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Vis oppgaveliste
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TASKS MODAL / DRAWER (for viewing task details without cluttering dashboard)
         ========================================================================= */}
      {showTasksModal && (
        <div
          id="modal-my-tasks"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Dine tildelte oppgaver ({myTasks.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTasksModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {myTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-700">Ingen oppgaver tildelt</p>
                  <p>Du har ingen aktive oppgaver tildelt akkurat nå.</p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setShowTasksModal(false);
                      navigate(`/oppgave/${task.id}`);
                    }}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5 hover:border-emerald-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {task.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Tildelt
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-600">{task.description}</p>
                    )}
                    <div className="pt-1 flex items-center justify-end text-[11px] font-bold text-emerald-700">
                      <span>Se detaljer →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ATTENTION MODAL / DRAWER (for viewing & handling 3+ pending actions)
         ========================================================================= */}
      {showAttentionModal && (
        <div
          id="modal-attention-actions"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Dette trenger din handling ({attentionItems.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttentionModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {attentionItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-700">Ingen utestående handlinger</p>
                  <p>Du har håndtert alle dine saker!</p>
                </div>
              ) : (
                attentionItems.map((item) => {
                  if (item.type === "pending_task") {
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            Trenger vikar
                          </span>
                          {item.groupName && (
                            <span className="text-xs font-semibold text-slate-600">
                              {item.groupName}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        {item.startsAt && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatNorwegianDateTime(item.startsAt)}</span>
                          </div>
                        )}
                        {item.taskDescription && (
                          <p className="text-[11px] text-slate-500 italic">
                            {item.taskDescription}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.taskId) {
                              handleTakeTask(item.taskId);
                            }
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Ta oppgave</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          Innkalling
                        </span>
                        {item.groupName && (
                          <span className="text-xs font-semibold text-slate-600">
                            {item.groupName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      {item.startsAt && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatNorwegianDateTime(item.startsAt)}</span>
                        </div>
                      )}
                      {item.theme && (
                        <p className="text-[11px] text-slate-500 italic">
                          Tema: {item.theme}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            item.gatheringId &&
                            handleQuickRespondGathering(item.gatheringId, "attending")
                          }
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Kommer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            item.gatheringId &&
                            handleQuickRespondGathering(item.gatheringId, "declined")
                          }
                          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-slate-500" />
                          <span>Kan ikke</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FAST BUNNNAVIGASJON PÅ MOBIL:
          MIN SIDE | GRUPPER | OPPGAVER | MELDINGER
         ========================================================================= */}
      <nav
        id="mobile-bottom-navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 py-1.5 px-3 shadow-lg flex items-center justify-around sm:hidden"
      >
        {/* 1. Min side */}
        <Link
          to="/"
          id="mobile-nav-min-side"
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-emerald-800 font-bold transition-colors cursor-pointer"
        >
          <Home className="w-5 h-5 text-emerald-700 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight">Min side</span>
        </Link>

        {/* 2. Grupper */}
        <Link
          to="/husfellesskap"
          id="mobile-nav-grupper"
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <Users className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] tracking-tight">Grupper</span>
        </Link>

        {/* 3. Oppgaver */}
        <button
          type="button"
          id="mobile-nav-oppgaver"
          onClick={() => setShowTasksModal(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <ListTodo className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] tracking-tight">Oppgaver</span>
        </button>

        {/* 4. Meldinger */}
        <Link
          to="/meldinger"
          id="mobile-nav-meldinger"
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] tracking-tight">Meldinger</span>
        </Link>
      </nav>
    </div>
  );
};
