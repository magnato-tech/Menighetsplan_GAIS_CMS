import { useMemo, useCallback } from "react";
import { useFirebase } from "../context/FirebaseDataContext";
import { Task, Person, Group, Gathering, Assignment, ActionCardModel, QueryResult, BadgeVariant } from "../types";
import { formatNorwegianDateTime } from "../utils/dates";

// 1. Hook: useCurrentUser
export function useCurrentUser() {
  const { currentUser, allPersons, currentUserId, setCurrentUserId, getUserGroups } = useFirebase();
  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);

  return {
    currentUser,
    allPersons,
    currentUserId,
    setCurrentUserId,
    userGroups,
  };
}

// 2. Hook: useMyTasks
export function useMyTasks(): QueryResult<Task[]> {
  const { currentUser, getTasksForPerson, tasks, assignments } = useFirebase();

  const myTasks = useMemo(() => {
    return getTasksForPerson(currentUser.id);
  }, [getTasksForPerson, currentUser.id, tasks, assignments]);

  // The data comes straight from the snapshot listeners: nothing to wait for, nothing to fail here
  return {
    data: myTasks,
    loading: false,
    error: null,
  };
}

// 3. Hook: useOpenTasks
export function useOpenTasks(): QueryResult<Task[]> {
  const { currentUser, getUserGroups, getOpenTasksForGroups, tasks } = useFirebase();

  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);
  const groupIds = useMemo(() => userGroups.map((g) => g.id), [userGroups]);

  const openTasks = useMemo(() => {
    return getOpenTasksForGroups(groupIds);
  }, [getOpenTasksForGroups, groupIds, tasks]);

  return {
    data: openTasks,
    loading: false,
    error: null,
    permissionDenied: false,
  };
}

// 4. Hook: useTaskDetail
export interface TaskDetailResult {
  task: Task | null;
  gathering: Gathering | null;
  group: Group | null;
  assignment: Assignment | null;
  assignedPerson: Person | null;
  isAssignedToMe: boolean;
  canClaim: boolean;
  canReportAbsence: boolean;
  permissionDenied: boolean;
  loading: boolean;
  error: string | null;
  claimTask: () => Promise<{ success: boolean; error?: string }>;
  reportAbsence: () => Promise<{ success: boolean; error?: string }>;
}

export function useTaskDetail(taskId: string | undefined): TaskDetailResult {
  const {
    currentUser,
    getTaskById,
    getGatheringById,
    getGroupById,
    getPersonById,
    getAssignmentForTask,
    isPersonInGroup,
    assignTaskToPerson,
    reportAbsence: performReportAbsence,
    tasks,
    assignments,
  } = useFirebase();

  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById]);

  // Check group membership permission
  const hasGroupAccess = useMemo(() => {
    if (!task) return true;
    return isPersonInGroup(currentUser.id, task.groupId);
  }, [task, currentUser.id, isPersonInGroup]);

  const isAssignedToMe = useMemo(() => {
    return assignment?.personId === currentUser.id && assignment?.response === "confirmed";
  }, [assignment, currentUser.id]);

  const canClaim = useMemo(() => {
    return (
      hasGroupAccess &&
      (task?.status === "open" || task?.status === "vacant") &&
      !isAssignedToMe
    );
  }, [hasGroupAccess, task?.status, isAssignedToMe]);

  const canReportAbsence = useMemo(() => {
    return isAssignedToMe && (task?.status === "confirmed" || task?.status === "assigned");
  }, [isAssignedToMe, task?.status]);

  const claimTask = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return assignTaskToPerson(task.id, currentUser.id);
  }, [task, currentUser.id, assignTaskToPerson]);

  const reportAbsenceAction = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return performReportAbsence(task.id, currentUser.id);
  }, [task, currentUser.id, performReportAbsence]);

  const permissionDenied = Boolean(task && !hasGroupAccess);

  return {
    task: permissionDenied ? null : task,
    gathering,
    group,
    assignment,
    assignedPerson,
    isAssignedToMe,
    canClaim,
    canReportAbsence,
    permissionDenied,
    loading: false,
    error: null,
    claimTask,
    reportAbsence: reportAbsenceAction,
  };
}

// 5. Hook / Function: useActionCardModel
export function useActionCardModel(task: Task, currentUser: Person): ActionCardModel {
  const { getGatheringById, getGroupById, getAssignmentForTask, getPersonById } = useFirebase();

  const gathering = getGatheringById(task.gatheringId);
  const group = getGroupById(task.groupId);
  const assignment = getAssignmentForTask(task.id);
  const assignedPerson = assignment ? getPersonById(assignment.personId) : null;

  const isAssignedToMe = assignment?.personId === currentUser.id && assignment?.response === "confirmed";

  let statusLabel = "Ledig";
  let badgeVariant: BadgeVariant = "neutral";
  let primaryActionLabel: string | undefined = "Ta oppgave";
  let primaryActionType: "claim" | "absence" | "view" | undefined = "claim";

  if (isAssignedToMe) {
    statusLabel = "Din oppgave";
    badgeVariant = "success";
    primaryActionLabel = "Meld forfall";
    primaryActionType = "absence";
  } else if (task.status === "vacant") {
    statusLabel = "Trenger vikar";
    badgeVariant = "urgent";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "open") {
    statusLabel = "Ledig oppgave";
    badgeVariant = "info";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "confirmed" || task.status === "assigned") {
    statusLabel = assignedPerson ? `Tildelt ${assignedPerson.name.split(" ")[0]}` : "Tildelt";
    badgeVariant = "neutral";
    primaryActionLabel = undefined;
    primaryActionType = "view";
  }

  const dateTimeFormatted = gathering
    ? formatNorwegianDateTime(gathering.startsAt)
    : "Tidspunkt ikke satt";

  return {
    id: task.id,
    taskId: task.id,
    title: task.title,
    gatheringTitle: gathering?.title || "Samling",
    dateTimeFormatted,
    groupName: group?.name || "Gruppe",
    location: gathering?.location,
    status: task.status,
    statusLabel,
    badgeVariant,
    primaryActionLabel,
    primaryActionType,
    detailUrl: `/oppgave/${task.id}`,
    isAssignedToMe,
    assignedPersonName: assignedPerson?.name,
  };
}

// 8. Hook: useModuleConfig
export function useModuleConfig() {
  const { moduleConfig, setModuleStatus, toggleKalender, toggleMeldinger } = useFirebase();

  return {
    moduleConfig,
    kalender: moduleConfig.kalender,
    meldinger: moduleConfig.meldinger,
    isKalenderOn: moduleConfig.kalender === "on",
    isMeldingerOn: moduleConfig.meldinger === "on",
    setModuleStatus,
    toggleKalender,
    toggleMeldinger,
  };
}
