import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser, useMyTasks } from "../../hooks/memberHooks";
import { formatNorwegianDateTime } from "../../utils/dates";
import { useFirebase } from "../../context/FirebaseDataContext";
import { Task, GroupMessage, Gathering, Group } from "../../types";

/**
 * Everything Min side shows, worked out from the planning data: what needs the
 * user's attention, their groups, and what comes next for them and for the congregation.
 */
export function useMyPage() {
  const { currentUser } = useCurrentUser();
  const { data: myTasks } = useMyTasks();
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
  } = useFirebase();

  const navigate = useNavigate();
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

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
  const handleTakeTask = (taskId: string) => {
    const res = assignTaskToPerson(taskId, currentUser.id, "confirmed");
    if (res.success) {
      showToast("Takk! Du har tatt oppgaven.", "success");
    } else {
      showToast(res.error || "Kunne ikke ta oppgaven.", "info");
    }
  };

  // Handler for quick response to gathering from Attention card
  const handleQuickRespondGathering = (
    gatheringId: string,
    status: "attending" | "declined"
  ) => {
    const res = respondToGathering(gatheringId, currentUser.id, status);
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
    const msgs = getGroupMessages(groupId);
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

  return {
    currentUser,
    myTasks,
    feedbackMessage,
    setFeedbackMessage,
    myGroups,
    attentionItems,
    handleTakeTask,
    handleQuickRespondGathering,
    nextChurchEvent,
    myTaskInChurchEvent,
    nextPersonalGatheringData,
    getGroupNextActivity,
    getGroupLatestMessage,
    handleOpenGroupChat,
    handleOpenGroupRoom,
  };
}

export type MyPageModel = ReturnType<typeof useMyPage>;
