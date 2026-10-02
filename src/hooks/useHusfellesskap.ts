import { useMemo, useState, useCallback } from "react";
import { useFirebase } from "../context/FirebaseDataContext";
import { Person, Gathering } from "../types";

export function useHusfellesskap(explicitGroupId?: string, explicitGatheringId?: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    attendances,
    groupMessages,
    getPersonById,
    getGatheringAttendances,
    getPersonAttendance,
    getUpcomingGatheringForGroup,
    getGatheringsForGroup,
    createGathering,
    updateGathering,
    deleteGathering,
    sendGatheringInvitation,
    respondToGathering,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    toggleGroupNotifications,
    getGroupNotificationsEnabled,
  } = useFirebase();

  // Selected meeting ID override state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(explicitGatheringId || null);

  // Find the target group (either by ID or find the first group current user is member/leader in)
  const group = useMemo(() => {
    if (explicitGroupId) {
      return groups.find((g) => g.id === explicitGroupId) || null;
    }
    // Find user's husfellesskap first
    const userHus = groups.find(
      (g) =>
        g.category === "husgruppe" &&
        (g.memberIds.includes(currentUser.id) ||
          g.leaderIds.includes(currentUser.id) ||
          (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id)))
    );
    if (userHus) return userHus;
    // Or any group user is member/leader in
    const anyUserGroup = groups.find(
      (g) =>
        g.memberIds.includes(currentUser.id) ||
        g.leaderIds.includes(currentUser.id) ||
        (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id))
    );
    if (anyUserGroup) return anyUserGroup;
    // Fallback: any husgruppe or first group
    return groups.find((g) => g.category === "husgruppe") || groups[0] || null;
  }, [groups, explicitGroupId, currentUser.id]);

  const isMember = useMemo(() => {
    if (!group) return false;
    return (
      group.memberIds.includes(currentUser.id) ||
      group.leaderIds.includes(currentUser.id) ||
      (group.deputyLeaderIds ? group.deputyLeaderIds.includes(currentUser.id) : false)
    );
  }, [group, currentUser.id]);

  const isLeader = useMemo(() => {
    if (!group) return false;
    return group.leaderIds.includes(currentUser.id);
  }, [group, currentUser.id]);

  const isDeputyLeader = useMemo(() => {
    if (!group || !group.deputyLeaderIds) return false;
    return group.deputyLeaderIds.includes(currentUser.id);
  }, [group, currentUser.id]);

  const leaders = useMemo(() => {
    if (!group) return [];
    return group.leaderIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group || !group.deputyLeaderIds) return [];
    return group.deputyLeaderIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    // Distinct members including leaders and deputy leaders or pure members
    const allMemberIds = Array.from(
      new Set([...group.memberIds, ...group.leaderIds, ...(group.deputyLeaderIds || [])])
    );
    return allMemberIds.map((id) => getPersonById(id)).filter(Boolean) as Person[];
  }, [group, getPersonById, allPersons]);

  // All planned meetings for this husfellesskap
  const allGroupMeetings = useMemo(() => {
    if (!group) return [];
    return getGatheringsForGroup(group.id);
  }, [group, getGatheringsForGroup, gatherings]);

  // Active meeting: explicitly selected, or the next upcoming meeting, or the first meeting
  const activeMeeting = useMemo(() => {
    if (!group) return null;
    if (selectedMeetingId) {
      const match = allGroupMeetings.find((g) => g.id === selectedMeetingId);
      if (match) return match;
    }
    const upcoming = getUpcomingGatheringForGroup(group.id);
    if (upcoming) return upcoming;
    return allGroupMeetings[0] || null;
  }, [group, selectedMeetingId, allGroupMeetings, getUpcomingGatheringForGroup]);

  // Host person for active meeting
  const hostPerson = useMemo(() => {
    if (!activeMeeting?.hostPersonId) return null;
    return getPersonById(activeMeeting.hostPersonId) || null;
  }, [activeMeeting, getPersonById, allPersons]);

  // Attendances for active meeting
  const activeMeetingAttendances = useMemo(() => {
    if (!activeMeeting) return [];
    return getGatheringAttendances(activeMeeting.id);
  }, [activeMeeting, getGatheringAttendances, attendances]);

  // Hvem kommer (members who answered "attending")
  const attendingMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return att?.status === "attending";
    });
  }, [members, activeMeetingAttendances]);

  // Hvem kommer ikke (members who answered "declined")
  const declinedMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return att?.status === "declined";
    });
  }, [members, activeMeetingAttendances]);

  // Hvem har ikke svart (members with no response recorded)
  const unrespondedMembers = useMemo(() => {
    return members.filter((m) => {
      const att = activeMeetingAttendances.find((a) => a.personId === m.id);
      return !att;
    });
  }, [members, activeMeetingAttendances]);

  // Current user's attendance status
  const currentUserAttendance = useMemo(() => {
    if (!activeMeeting) return undefined;
    return getPersonAttendance(activeMeeting.id, currentUser.id);
  }, [activeMeeting, getPersonAttendance, currentUser.id, attendances]);

  const respond = useCallback(
    async (status: "attending" | "declined", gatheringId?: string) => {
      const targetId = gatheringId || activeMeeting?.id;
      if (!targetId) return { success: false, error: "Ingen møte funnet" };
      return respondToGathering(targetId, currentUser.id, status);
    },
    [activeMeeting, respondToGathering, currentUser.id]
  );

  // Leader Actions
  const createMeeting = useCallback(
    async (data: {
      title: string;
      startsAt: string;
      location?: string;
      theme?: string;
      bibleText?: string;
      hostPersonId?: string;
      sendInvitationImmediately?: boolean;
    }) => {
      if (!group) return { success: false, error: "Ingen husfellesskap valgt" };
      const res = createGathering({
        groupId: group.id,
        type: "gruppesamling",
        ...data,
      });
      if (res.success && res.gathering) {
        setSelectedMeetingId(res.gathering.id);
      }
      return res;
    },
    [group, createGathering]
  );

  const updateMeeting = useCallback(
    async (gatheringId: string, updates: Partial<Gathering>) => {
      return updateGathering(gatheringId, updates);
    },
    [updateGathering]
  );

  const deleteMeeting = useCallback(
    async (gatheringId: string) => {
      const res = deleteGathering(gatheringId);
      if (res.success && selectedMeetingId === gatheringId) {
        setSelectedMeetingId(null);
      }
      return res;
    },
    [deleteGathering, selectedMeetingId]
  );

  const sendInvitation = useCallback(
    async (gatheringId?: string) => {
      const targetId = gatheringId || activeMeeting?.id;
      if (!targetId) return { success: false, error: "Ingen samling valgt" };
      return sendGatheringInvitation(targetId);
    },
    [activeMeeting, sendGatheringInvitation]
  );

  // Group messages filtered by membership and join date
  const messages = useMemo(() => {
    if (!group || !isMember) return [];
    return getGroupMessages(group.id, currentUser.id);
  }, [group, isMember, getGroupMessages, currentUser.id, groupMessages]);

  const sendMessage = useCallback(
    (content: string, imageUrl?: string) => {
      if (!group) return { success: false, error: "Ingen gruppe valgt" };
      if (!isMember) return { success: false, error: "Du er ikke medlem av denne gruppen." };
      return sendGroupMessage(group.id, content, imageUrl);
    },
    [group, isMember, sendGroupMessage]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      return deleteGroupMessage(messageId, currentUser.id);
    },
    [deleteGroupMessage, currentUser.id]
  );

  const notificationsEnabled = useMemo(() => {
    if (!group) return true;
    return getGroupNotificationsEnabled(group.id, currentUser.id);
  }, [group, getGroupNotificationsEnabled, currentUser.id, groups]);

  const toggleNotifications = useCallback(
    (forced?: boolean) => {
      if (!group) return { success: false, enabled: true };
      return toggleGroupNotifications(group.id, currentUser.id, forced);
    },
    [group, toggleGroupNotifications, currentUser.id]
  );

  return {
    group,
    isMember,
    isLeader,
    isDeputyLeader,
    leaders,
    deputyLeaders,
    members,
    allGroupMeetings,
    nextMeeting: activeMeeting,
    activeMeeting,
    selectedMeetingId,
    setSelectedMeetingId,
    hostPerson,
    attendingMembers,
    declinedMembers,
    unrespondedMembers,
    currentUserAttendance,
    respond,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    sendInvitation,
    messages,
    sendMessage,
    deleteMessage,
    notificationsEnabled,
    toggleNotifications,
    currentUser,
    allPersons,
  };
}

// Universal Group Room hook alias
export const useGroupRoom = useHusfellesskap;
