import { useMemo, useCallback } from "react";
import { useFirebase } from "../context/FirebaseDataContext";
import { Task, Person, Group, Gathering, Assignment } from "../types";
import { validateGathering } from "../utils/validation";
import { StaffingColor, TaskStaffingStatus, calculateTaskStaffingStatus, StaffingStatusResult, getStaffingStatus } from "../utils/staffing";

export interface AdminGatheringItem {
  gathering: Gathering;
  group?: Group;
  tasks: Task[];
  tasksWithStaffing: Array<{ task: Task; taskStaffing: TaskStaffingStatus }>;
  totalTasks: number;
  coveredTasksCount: number;
  missingStaffingCount: number;
  staffing: StaffingStatusResult;
}

export interface AdminTaskItem {
  task: Task;
  gathering?: Gathering;
  group?: Group;
  assignment?: Assignment;
  assignedPerson?: Person | null;
  assignedPersonsList: Array<{
    assignment: Assignment;
    person?: Person;
    statusLabel: string;
    response: Assignment["response"];
  }>;
  neededCount: number;
  confirmedCount: number;
  pendingCount: number;
  availableSpots: number;
  isFullyCovered: boolean;
  missingCount: number;
  taskStaffing: TaskStaffingStatus;
}

// 9. Hook: useAdminDashboard
export function useAdminDashboard() {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    updateGroupName,
    updateGroup,
    createGroup,
    addPerson,
    updatePerson,
    getGroupById,
    getGatheringById,
    getPersonById,
    getAssignmentForTask,
    createGathering,
    updateGathering,
    deleteGathering,
    createTask,
    updateTask,
    assignTaskToPerson,
  } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";

  const adminPersons = useMemo(() => {
    return allPersons.map((person) => {
      const personGroups = groups.filter((g) => g.memberIds.includes(person.id));
      const leaderInGroups = groups.filter((g) => g.leaderIds.includes(person.id));
      const deputyInGroups = groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
      return {
        person,
        groups: personGroups,
        leaderInGroups,
        deputyInGroups,
      };
    });
  }, [allPersons, groups]);

  const adminGroups = useMemo(() => {
    return groups.map((group) => {
      const leaders = allPersons.filter((p) => group.leaderIds.includes(p.id));
      const deputyLeaders = allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
      const members = allPersons.filter((p) => group.memberIds.includes(p.id));
      const groupTasks = tasks.filter((t) => t.groupId === group.id);
      return {
        group,
        leaders,
        deputyLeaders,
        members,
        tasksCount: groupTasks.length,
      };
    });
  }, [groups, allPersons, tasks]);

  const adminGatherings = useMemo<AdminGatheringItem[]>(() => {
    return gatherings
      .filter((gathering) => {
        const group = getGroupById(gathering.groupId);
        // Exclude Husfellesskap from Admin -> Arrangementer list
        return group?.category !== "husgruppe";
      })
      .map((gathering) => {
        validateGathering(gathering);
        const group = getGroupById(gathering.groupId);
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks, assignments);

        // Detailed counts for admin gathering overview
        const totalTasks = gatheringTasks.length;
        let coveredTasksCount = 0;
        let missingStaffingCount = 0;

        const tasksWithStaffing = gatheringTasks.map((task) => {
          const taskAssignments = assignments.filter((a) => a.taskId === task.id);
          const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);
          if (taskStaffing.isFullyCovered) {
            coveredTasksCount++;
          } else {
            missingStaffingCount += taskStaffing.missingCount;
          }
          return {
            task,
            taskStaffing,
          };
        });

        return {
          gathering,
          group,
          tasks: gatheringTasks,
          tasksWithStaffing,
          totalTasks,
          coveredTasksCount,
          missingStaffingCount,
          staffing,
        };
      });
  }, [gatherings, tasks, assignments, getGroupById]);

  const adminTasks = useMemo<AdminTaskItem[]>(() => {
    return tasks.map((task) => {
      const gathering = getGatheringById(task.gatheringId);
      const group = getGroupById(task.groupId);
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const primaryAssignment = getAssignmentForTask(task.id);
      const assignedPerson = primaryAssignment ? getPersonById(primaryAssignment.personId) : null;
      
      const assignedPersonsList = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const taskStaffing = calculateTaskStaffingStatus(task, taskAssignments);
      const neededCount = task.neededCount !== undefined ? task.neededCount : 1;
      const confirmedCount = taskStaffing.confirmedCount;
      const pendingCount = taskStaffing.pendingCount;
      // Formula: Ledige plasser = Behov - Bekreftet - Venter
      const availableSpots = Math.max(0, neededCount - confirmedCount - pendingCount);

      return {
        task,
        gathering,
        group,
        assignment: primaryAssignment,
        assignedPerson,
        assignedPersonsList,
        neededCount,
        confirmedCount,
        pendingCount,
        availableSpots,
        isFullyCovered: taskStaffing.isFullyCovered,
        missingCount: taskStaffing.missingCount,
        taskStaffing,
      };
    });
  }, [tasks, assignments, getGatheringById, getGroupById, getAssignmentForTask, getPersonById]);

  return {
    isAdmin,
    currentUser,
    allPersons,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    updateGroup,
    createGroup,
    addPerson,
    updatePerson,
    createGathering,
    updateGathering,
    deleteGathering,
    createTask,
    updateTask,
    assignTaskToPerson,
    tasks,
  };
}

// 10. Hook: useAdminGatheringDetail
export function useAdminGatheringDetail(gatheringId: string) {
  const {
    currentUser,
    gatherings,
    groups,
    tasks,
    assignments,
    allPersons,
    getGatheringById,
    getGroupById,
    getPersonById,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    updateGathering,
  } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";
  const gathering = useMemo(() => {
    if (!gatheringId) return null;
    return getGatheringById(gatheringId) || null;
  }, [gatheringId, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!gathering) return null;
    return getGroupById(gathering.groupId) || null;
  }, [gathering, getGroupById, groups]);

  const tasksWithDetails = useMemo(() => {
    if (!gathering) return [];
    const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);

    return gatheringTasks.map((task) => {
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const assignedPersons = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const confirmedPersonsCount = taskAssignments.filter((a) => a.response === "confirmed").length;
      const neededCount = task.neededCount;
      const isFullyCovered =
        neededCount !== undefined ? confirmedPersonsCount >= neededCount : task.status === "confirmed";
      const missingCount =
        neededCount !== undefined
          ? Math.max(0, neededCount - confirmedPersonsCount)
          : task.status === "confirmed"
          ? 0
          : 1;

      let staffingStatusLabel = "Behov ikke satt";
      if (neededCount !== undefined) {
        if (isFullyCovered) {
          staffingStatusLabel = "Fullt dekket";
        } else {
          staffingStatusLabel = `Mangler: ${missingCount}`;
        }
      } else {
        staffingStatusLabel = task.status === "confirmed" ? "Fullt dekket" : "Mangler bemanning";
      }

      return {
        task,
        neededCount,
        assignedPersons,
        confirmedPersonsCount,
        isFullyCovered,
        missingCount,
        staffingStatusLabel,
      };
    });
  }, [gathering, tasks, assignments, getPersonById]);

  return {
    isAdmin,
    currentUser,
    gathering,
    group,
    allGroups: groups,
    allPersons,
    tasksWithDetails,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
    reportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
    createTask,
    deleteTask,
    updateGathering,
  };
}

// 11. Hook: useAdminGroupDetail
export function useAdminGroupDetail(groupId: string) {
  const {
    currentUser,
    allPersons,
    gatherings,
    tasks,
    assignments,
    getGroupById,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";
  const group = getGroupById(groupId);

  const leaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.leaderIds.includes(p.id));
  }, [group, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
  }, [group, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const availablePersonsToAdd = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => !group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const groupGatherings = useMemo(() => {
    if (!group) return [];
    return gatherings
      .filter((g) => g.groupId === group.id)
      .map((gathering) => {
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks, assignments);
        return {
          gathering,
          tasks: gatheringTasks,
          staffing,
        };
      });
  }, [group, gatherings, tasks, assignments]);

  return {
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    allPersons,
    groupGatherings,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  };
}

// 12. Hook: useAdminPersonDetail
export function useAdminPersonDetail(personId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    tasks,
    assignments,
    getPersonById,
    updatePerson,
  } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";
  const person = getPersonById(personId);

  const personGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.memberIds.includes(person.id));
  }, [person, groups]);

  const leaderInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.leaderIds.includes(person.id));
  }, [person, groups]);

  const deputyInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
  }, [person, groups]);

  const personAssignments = useMemo(() => {
    if (!person) return [];
    return assignments.filter((a) => a.personId === person.id && a.response !== "withdrawn");
  }, [person, assignments]);

  const personTasks = useMemo(() => {
    if (!person) return [];
    const taskIds = personAssignments.map((a) => a.taskId);
    return tasks.filter((t) => taskIds.includes(t.id));
  }, [person, personAssignments, tasks]);

  return {
    isAdmin,
    currentUser,
    person,
    personGroups,
    leaderInGroups,
    deputyInGroups,
    personTasks,
    allPersons,
    updatePerson,
  };
}

// 13. Hook: useAdminTaskDetail
export function useAdminTaskDetail(taskId: string) {
  const {
    currentUser,
    tasks,
    gatherings,
    groups,
    assignments,
    allPersons,
    getTaskById,
    getGatheringById,
    getGroupById,
    getAssignmentForTask,
    getAllAssignmentsForTask,
    getPersonById,
    updateTask,
    updateTaskInstruction,
    updateTaskNeededCount,
  } = useFirebase();

  const isAdmin = currentUser.globalRole === "admin";
  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById, groups]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById, allPersons]);

  const allAssignedPersonsWithStatus = useMemo(() => {
    if (!task) return [];
    const taskAssignments = getAllAssignmentsForTask(task.id);
    return taskAssignments.map((a) => {
      const person = getPersonById(a.personId);
      let statusLabel = "Forespurt";
      if (a.response === "confirmed") statusLabel = "Akseptert";
      if (a.response === "withdrawn") statusLabel = "Forfall";
      if (a.response === "declined") statusLabel = "Avslått";

      return {
        assignment: a,
        person,
        statusLabel,
        response: a.response,
      };
    });
  }, [task, getAllAssignmentsForTask, getPersonById]);

  const confirmedCount = useMemo(() => {
    return allAssignedPersonsWithStatus.filter((p) => p.response === "confirmed").length;
  }, [allAssignedPersonsWithStatus]);

  const isFullyCovered = useMemo(() => {
    if (!task) return false;
    if (task.neededCount !== undefined) {
      return confirmedCount >= task.neededCount;
    }
    return task.status === "confirmed";
  }, [task, confirmedCount]);

  const missingCount = useMemo(() => {
    if (!task) return 0;
    if (task.neededCount !== undefined) {
      return Math.max(0, task.neededCount - confirmedCount);
    }
    return task.status === "confirmed" ? 0 : 1;
  }, [task, confirmedCount]);

  const taskStaffing = useMemo(() => {
    if (!task) {
      return {
        color: "green" as StaffingColor,
        statusText: "Dekket",
        confirmedCount: 0,
        neededCount: 0,
        missingCount: 0,
        pendingCount: 0,
        hasForfall: false,
        isFullyCovered: true,
      };
    }
    const taskAssigns = getAllAssignmentsForTask(task.id);
    return calculateTaskStaffingStatus(task, taskAssigns);
  }, [task, getAllAssignmentsForTask, assignments]);

  const handleUpdateInstruction = useCallback(
    (instruction: string) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskInstruction(task.id, instruction);
    },
    [task, updateTaskInstruction]
  );

  const handleUpdateNeededCount = useCallback(
    (neededCount: number | undefined) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskNeededCount(task.id, neededCount);
    },
    [task, updateTaskNeededCount]
  );

  return {
    isAdmin,
    currentUser,
    task,
    gathering,
    group,
    assignment,
    assignedPerson,
    allAssignedPersonsWithStatus,
    confirmedCount,
    isFullyCovered,
    missingCount,
    taskStaffing,
    updateTask,
    updateTaskInstruction: handleUpdateInstruction,
    updateTaskNeededCount: handleUpdateNeededCount,
  };
}
