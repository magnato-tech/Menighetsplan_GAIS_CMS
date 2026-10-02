import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, testConnection as verifyFirebaseConnection } from "./firebase";
import {
  Person,
  Group,
  Gathering,
  Task,
  Assignment,
  GroupMessage,
  GatheringAttendance,
} from "./types";
import { initialPersons } from "./data/mockData";
import { COLLECTIONS } from "./data/collections";
import {
  NewPersonInput,
  NewGroupInput,
  NewGatheringInput,
  NewTaskInput,
  buildPerson,
  buildGroup,
  buildGathering,
  buildTask,
  buildAssignment,
  buildGroupMessage,
} from "./data/newDocuments";
import { reportWriteError } from "./services/writeErrors";

// ============================================================================
// Firestore Collections & Helpers
// ============================================================================

export { COLLECTIONS };

/**
 * Sanitizes object to remove undefined values since Firestore rejects them.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ============================================================================
// Connection
// ============================================================================

/**
 * Tests connection to Firestore database.
 */
export async function testConnection(): Promise<boolean> {
  return await verifyFirebaseConnection();
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

export function subscribePersons(callback: (persons: Person[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.PERSONS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PERSONS)
  );
}

export function subscribeGroups(callback: (groups: Group[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GROUPS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.GROUPS)
  );
}

export function subscribeGatherings(callback: (gatherings: Gathering[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GATHERINGS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Gathering));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.GATHERINGS)
  );
}

export function subscribeTasks(callback: (tasks: Task[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.TASKS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.TASKS)
  );
}

export function subscribeAssignments(callback: (assignments: Assignment[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.ASSIGNMENTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.ASSIGNMENTS)
  );
}

export function subscribeGroupMessages(callback: (messages: GroupMessage[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GROUP_MESSAGES);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMessage));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.GROUP_MESSAGES)
  );
}

export function subscribeAttendances(callback: (attendances: GatheringAttendance[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GATHERING_ATTENDANCES);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GatheringAttendance));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.GATHERING_ATTENDANCES)
  );
}

// ============================================================================
// High-Level Domain Mutations (Persisted in Firestore)
// ============================================================================

// New documents arrive fully built (see data/newDocuments.ts), id included.

// Persons
export async function createPerson(person: Person): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.PERSONS, person.id), sanitizeForFirestore(person));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updatePerson(
  personId: string,
  updates: Partial<Person>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PERSONS, personId), sanitizeForFirestore(updates));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function deletePerson(personId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PERSONS, personId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Groups
export async function createGroup(group: Group): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitizeForFirestore(group));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Group>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), sanitizeForFirestore(updates));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateGroupName(groupId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  return updateGroup(groupId, { name: newName.trim() });
}

export async function addGroupMember(groupId: string, personId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const groupSnap = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
    if (!groupSnap.exists()) return { success: false, error: "Gruppe ble ikke funnet" };
    const group = groupSnap.data() as Group;
    const memberIds = Array.from(new Set([...(group.memberIds || []), personId]));
    const memberJoinedAt = {
      ...(group.memberJoinedAt || {}),
      [personId]: new Date().toISOString(),
    };
    await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), sanitizeForFirestore({ memberIds, memberJoinedAt }));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function removeGroupMember(
  groupId: string,
  personId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const groupSnap = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
    if (!groupSnap.exists()) return { success: false, error: "Gruppe ble ikke funnet" };
    const group = groupSnap.data() as Group;
    const memberIds = (group.memberIds || []).filter((id) => id !== personId);
    const leaderIds = (group.leaderIds || []).filter((id) => id !== personId);
    const deputyLeaderIds = (group.deputyLeaderIds || []).filter((id) => id !== personId);
    await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), sanitizeForFirestore({ memberIds, leaderIds, deputyLeaderIds }));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GROUPS, groupId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Gatherings
export async function createGathering(gathering: Gathering): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.GATHERINGS, gathering.id), sanitizeForFirestore(gathering));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateGathering(
  gatheringId: string,
  updates: Partial<Gathering>
): Promise<{ success: boolean; gathering?: Gathering; error?: string }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GATHERINGS, gatheringId), sanitizeForFirestore(updates));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function deleteGathering(gatheringId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GATHERINGS, gatheringId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function sendGatheringInvitation(gatheringId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(
      doc(db, COLLECTIONS.GATHERINGS, gatheringId),
      sanitizeForFirestore({
        invitationSent: true,
        invitationSentAt: new Date().toISOString(),
      })
    );
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Tasks
export async function createTask(task: Task): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.TASKS, task.id), sanitizeForFirestore(task));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), sanitizeForFirestore(updates));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: Task["status"]
): Promise<{ success: boolean; error?: string }> {
  return updateTask(taskId, { status });
}

export async function updateTaskInstruction(
  taskId: string,
  instruction: string
): Promise<{ success: boolean; error?: string }> {
  return updateTask(taskId, { instruction });
}

export async function updateTaskNeededCount(
  taskId: string,
  neededCount: number | undefined
): Promise<{ success: boolean; error?: string }> {
  return updateTask(taskId, { neededCount });
}

// Assignments
export async function assignTaskToPerson(assignment: Assignment): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), sanitizeForFirestore(assignment));
    await updateDoc(
      doc(db, COLLECTIONS.TASKS, assignment.taskId),
      sanitizeForFirestore({ status: assignment.response === "confirmed" ? "confirmed" : "assigned" })
    );
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  response: "confirmed" | "pending" | "declined" | "withdrawn"
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), sanitizeForFirestore({ response }));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function removeAssignment(assignmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function reportAbsence(
  taskId: string,
  personId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const aSnap = await getDocs(
      query(collection(db, COLLECTIONS.ASSIGNMENTS), where("taskId", "==", taskId), where("personId", "==", personId))
    );
    for (const d of aSnap.docs) {
      await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, d.id), { response: "declined" });
    }
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), { status: "vacant" });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Group Messages
export async function sendGroupMessage(message: GroupMessage): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, message.id), sanitizeForFirestore(message));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function deleteGroupMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, messageId));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Attendance
export async function respondToGathering(
  gatheringId: string,
  personId: string,
  status: "attending" | "declined"
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = `att-${gatheringId}-${personId}`;
    const att: GatheringAttendance = {
      id,
      gatheringId,
      personId,
      status,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.GATHERING_ATTENDANCES, id), sanitizeForFirestore(att));
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// ============================================================================
// React Context & Provider to replace MockDataProvider seamlessly
// ============================================================================

export interface ModuleConfig {
  kalender: "on" | "off";
  meldinger: "on" | "off";
}

export interface FirebaseDataContextType {
  // State
  isFirestoreConnected: boolean;
  currentUser: Person;
  allPersons: Person[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  groups: Group[];
  gatherings: Gathering[];
  tasks: Task[];
  assignments: Assignment[];
  groupMessages: GroupMessage[];
  attendances: GatheringAttendance[];

  // Module configuration
  moduleConfig: ModuleConfig;
  setModuleStatus: (moduleName: keyof ModuleConfig, status: "on" | "off") => void;
  toggleKalender: () => void;
  toggleMeldinger: () => void;

  // Data Adapter functions
  getTasksForPerson: (personId: string) => Task[];
  getOpenTasksForGroups: (groupIds: string[]) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getGatheringById: (gatheringId: string) => Gathering | undefined;
  getGroupById: (groupId: string) => Group | undefined;
  getPersonById: (personId: string) => Person | undefined;
  getAssignmentForTask: (taskId: string) => Assignment | undefined;
  getAllAssignmentsForTask: (taskId: string) => Assignment[];
  getUserGroups: (personId: string) => Group[];
  isPersonInGroup: (personId: string, groupId: string) => boolean;
  getGroupMessages: (groupId: string, personId?: string) => GroupMessage[];
  getGatheringAttendances: (gatheringId: string) => GatheringAttendance[];
  getPersonAttendance: (gatheringId: string, personId: string) => GatheringAttendance | undefined;
  getUpcomingGatheringForGroup: (groupId: string) => Gathering | undefined;
  getGatheringsForGroup: (groupId: string) => Gathering[];
  getGroupNotificationsEnabled: (groupId: string, personId?: string) => boolean;

  // Actions
  createGathering: (data: NewGatheringInput) => { success: boolean; gathering?: Gathering; error?: string };
  updateGathering: (gatheringId: string, updates: Partial<Gathering>) => { success: boolean; gathering?: Gathering; error?: string };
  deleteGathering: (gatheringId: string) => { success: boolean; error?: string };
  sendGatheringInvitation: (gatheringId: string) => { success: boolean; error?: string };
  assignTaskToPerson: (taskId: string, personId: string, responseStatus?: "confirmed" | "pending") => Promise<{ success: boolean; error?: string }>;
  reportAbsence: (taskId: string, personId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateAssignmentStatus: (assignmentId: string, response: "confirmed" | "pending" | "declined" | "withdrawn") => { success: boolean; error?: string };
  removeAssignment: (assignmentId: string) => { success: boolean; error?: string };
  updateTaskStatus: (taskId: string, status: Task["status"]) => { success: boolean; error?: string };
  updateGroupName: (groupId: string, newName: string) => { success: boolean; error?: string };
  updateGroup: (groupId: string, updates: Partial<Group>) => { success: boolean; error?: string };
  createGroup: (data: NewGroupInput) => { success: boolean; group?: Group; error?: string };
  addPerson: (data: NewPersonInput) => { success: boolean; person?: Person; error?: string };
  updatePerson: (personId: string, updates: Partial<Person>) => { success: boolean; error?: string };
  addGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  removeGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  createTask: (data: NewTaskInput) => { success: boolean; task?: Task; error?: string };
  deleteTask: (taskId: string) => { success: boolean; error?: string };
  updateTask: (taskId: string, updates: Partial<Task>) => { success: boolean; error?: string };
  updateTaskInstruction: (taskId: string, instruction: string) => { success: boolean; error?: string };
  updateTaskNeededCount: (taskId: string, neededCount: number | undefined) => { success: boolean; error?: string };
  sendGroupMessage: (groupId: string, content: string, imageUrl?: string) => { success: boolean; message?: GroupMessage; error?: string };
  deleteGroupMessage: (messageId: string, personId?: string) => { success: boolean; error?: string };
  toggleGroupNotifications: (groupId: string, personId?: string, forceState?: boolean) => { success: boolean; enabled: boolean };
  respondToGathering: (gatheringId: string, personId: string, status: "attending" | "declined") => Promise<{ success: boolean; error?: string }>;
}

export const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

/**
 * Lets a write finish in the background while the UI moves on.
 * A failed write is shown to the user; the snapshot listeners then restore the saved state.
 */
function persist(write: Promise<{ success: boolean; error?: string }>, action: string): void {
  write.then(
    (result) => {
      if (!result.success) reportWriteError(action, result.error);
    },
    (error) => reportWriteError(action, error)
  );
}

export const FirebaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firestore is the only source of data: everything is empty until the first snapshot arrives
  const [persons, setPersons] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [attendances, setAttendances] = useState<GatheringAttendance[]>([]);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>("person-1");

  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(() => {
    try {
      const saved = localStorage.getItem("menighetsplan_modules");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { kalender: "on", meldinger: "on" };
  });

  // Check connection on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const connected = await testConnection();
        if (isMounted) setIsFirestoreConnected(connected);
      } catch (err) {
        console.warn("Firestore connection check:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen in real-time to Firestore collections
  useEffect(() => {
    const unsubPersons = subscribePersons(setPersons);
    const unsubGroups = subscribeGroups(setGroups);
    const unsubGatherings = subscribeGatherings(setGatherings);
    const unsubTasks = subscribeTasks(setTasks);
    const unsubAssignments = subscribeAssignments(setAssignments);
    const unsubMessages = subscribeGroupMessages(setGroupMessages);
    const unsubAttendances = subscribeAttendances(setAttendances);

    return () => {
      unsubPersons();
      unsubGroups();
      unsubGatherings();
      unsubTasks();
      unsubAssignments();
      unsubMessages();
      unsubAttendances();
    };
  }, []);

  // Until real sign-in exists, the mock admin stands in when the database has no persons,
  // so the admin pages stay reachable on an empty database.
  const currentUser = useMemo(() => {
    return persons.find((p) => p.id === currentUserId) || persons[0] || initialPersons[0];
  }, [persons, currentUserId]);

  const setModuleStatus = useCallback((moduleName: keyof ModuleConfig, status: "on" | "off") => {
    setModuleConfig((prev) => {
      const next = { ...prev, [moduleName]: status };
      try {
        localStorage.setItem("menighetsplan_modules", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleKalender = useCallback(() => {
    setModuleStatus("kalender", moduleConfig.kalender === "on" ? "off" : "on");
  }, [moduleConfig.kalender, setModuleStatus]);

  const toggleMeldinger = useCallback(() => {
    setModuleStatus("meldinger", moduleConfig.meldinger === "on" ? "off" : "on");
  }, [moduleConfig.meldinger, setModuleStatus]);

  // Adapter queries
  const getTasksForPerson = useCallback(
    (personId: string): Task[] => {
      const userAssignments = assignments.filter((a) => a.personId === personId);
      const userTaskIds = userAssignments.map((a) => a.taskId);
      return tasks.filter((t) => userTaskIds.includes(t.id));
    },
    [assignments, tasks]
  );

  const getOpenTasksForGroups = useCallback(
    (groupIds: string[]): Task[] => {
      return tasks.filter((t) => groupIds.includes(t.groupId) && (t.status === "open" || t.status === "vacant"));
    },
    [tasks]
  );

  const getTaskById = useCallback((taskId: string) => tasks.find((t) => t.id === taskId), [tasks]);
  const getGatheringById = useCallback((id: string) => gatherings.find((g) => g.id === id), [gatherings]);
  const getGroupById = useCallback((id: string) => groups.find((g) => g.id === id), [groups]);
  const getPersonById = useCallback((id: string) => persons.find((p) => p.id === id), [persons]);

  const getAssignmentForTask = useCallback(
    (taskId: string) => assignments.find((a) => a.taskId === taskId),
    [assignments]
  );

  const getAllAssignmentsForTask = useCallback(
    (taskId: string) => assignments.filter((a) => a.taskId === taskId),
    [assignments]
  );

  const getUserGroups = useCallback(
    (personId: string): Group[] => {
      return groups.filter(
        (g) =>
          g.memberIds.includes(personId) ||
          g.leaderIds.includes(personId) ||
          (g.deputyLeaderIds && g.deputyLeaderIds.includes(personId))
      );
    },
    [groups]
  );

  const isPersonInGroup = useCallback(
    (personId: string, groupId: string): boolean => {
      const g = groups.find((grp) => grp.id === groupId);
      if (!g) return false;
      return (
        g.memberIds.includes(personId) ||
        g.leaderIds.includes(personId) ||
        (g.deputyLeaderIds && g.deputyLeaderIds.includes(personId)) ||
        false
      );
    },
    [groups]
  );

  const getGroupMessages = useCallback(
    (groupId: string, _personId?: string) => {
      return groupMessages
        .filter((m) => m.groupId === groupId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [groupMessages]
  );

  const getGatheringAttendances = useCallback(
    (gatheringId: string) => attendances.filter((a) => a.gatheringId === gatheringId),
    [attendances]
  );

  const getPersonAttendance = useCallback(
    (gatheringId: string, personId: string) =>
      attendances.find((a) => a.gatheringId === gatheringId && a.personId === personId),
    [attendances]
  );

  const getUpcomingGatheringForGroup = useCallback(
    (groupId: string): Gathering | undefined => {
      const now = new Date();
      return gatherings
        .filter((g) => g.groupId === groupId && !g.cancelled && new Date(g.startsAt) >= now)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
    },
    [gatherings]
  );

  const getGatheringsForGroup = useCallback(
    (groupId: string): Gathering[] => {
      return gatherings
        .filter((g) => g.groupId === groupId)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    [gatherings]
  );

  const getGroupNotificationsEnabled = useCallback(
    (groupId: string, personId: string = currentUserId): boolean => {
      const grp = groups.find((g) => g.id === groupId);
      if (!grp || !grp.notificationPreferences) return true;
      return grp.notificationPreferences[personId] !== false;
    },
    [groups, currentUserId]
  );

  const handleCreateGathering = useCallback((data: NewGatheringInput) => {
    const newGathering = buildGathering(data);
    setGatherings((prev) => [...prev, newGathering]);
    persist(createGathering(newGathering), "lagre samlingen");
    return { success: true, gathering: newGathering };
  }, []);

  const handleUpdateGathering = useCallback((gatheringId: string, updates: Partial<Gathering>) => {
    setGatherings((prev) => prev.map((g) => (g.id === gatheringId ? { ...g, ...updates } : g)));
    persist(updateGathering(gatheringId, updates), "lagre endringene i samlingen");
    return { success: true };
  }, []);

  const handleDeleteGathering = useCallback((gatheringId: string) => {
    setGatherings((prev) => prev.filter((g) => g.id !== gatheringId));
    persist(deleteGathering(gatheringId), "slette samlingen");
    return { success: true };
  }, []);

  const handleSendGatheringInvitation = useCallback((gatheringId: string) => {
    setGatherings((prev) =>
      prev.map((g) =>
        g.id === gatheringId ? { ...g, invitationSent: true, invitationSentAt: new Date().toISOString() } : g
      )
    );
    persist(sendGatheringInvitation(gatheringId), "registrere at invitasjonen er sendt");
    return { success: true };
  }, []);

  const handleAssignTaskToPerson = useCallback(
    async (taskId: string, personId: string, responseStatus: "confirmed" | "pending" = "pending") => {
      const newAssignment = buildAssignment(taskId, personId, responseStatus);
      setAssignments((prev) => [...prev, newAssignment]);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: responseStatus === "confirmed" ? "confirmed" : "assigned" } : t))
      );
      return await assignTaskToPerson(newAssignment);
    },
    []
  );

  const handleReportAbsence = useCallback(async (taskId: string, personId: string, reason?: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.taskId === taskId && a.personId === personId ? { ...a, response: "declined" } : a))
    );
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "vacant" } : t)));
    return await reportAbsence(taskId, personId, reason);
  }, []);

  const handleUpdateAssignmentStatus = useCallback(
    (assignmentId: string, response: "confirmed" | "pending" | "declined" | "withdrawn") => {
      setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, response } : a)));
      persist(updateAssignmentStatus(assignmentId, response), "lagre svaret på oppgaven");
      return { success: true };
    },
    []
  );

  const handleRemoveAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    persist(removeAssignment(assignmentId), "fjerne tildelingen");
    return { success: true };
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, status: Task["status"]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    persist(updateTaskStatus(taskId, status), "lagre status på oppgaven");
    return { success: true };
  }, []);

  const handleUpdateGroupName = useCallback((groupId: string, newName: string) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name: newName.trim() } : g)));
    persist(updateGroupName(groupId, newName), "lagre gruppenavnet");
    return { success: true };
  }, []);

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)));
    persist(updateGroup(groupId, updates), "lagre endringene i gruppen");
    return { success: true };
  }, []);

  const handleCreateGroup = useCallback((data: NewGroupInput) => {
    const newGroup = buildGroup(data);
    setGroups((prev) => [...prev, newGroup]);
    persist(createGroup(newGroup), "lagre gruppen");
    return { success: true, group: newGroup };
  }, []);

  const handleAddPerson = useCallback((data: NewPersonInput) => {
    const newPerson = buildPerson(data);
    setPersons((prev) => [...prev, newPerson]);
    persist(createPerson(newPerson), "lagre personen");
    return { success: true, person: newPerson };
  }, []);

  const handleUpdatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, ...updates } : p)));
    persist(updatePerson(personId, updates), "lagre endringene i personen");
    return { success: true };
  }, []);

  const handleAddGroupMember = useCallback((groupId: string, personId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberIds: Array.from(new Set([...g.memberIds, personId])),
              memberJoinedAt: { ...(g.memberJoinedAt || {}), [personId]: new Date().toISOString() },
            }
          : g
      )
    );
    persist(addGroupMember(groupId, personId), "legge til medlemmet i gruppen");
    return { success: true };
  }, []);

  const handleRemoveGroupMember = useCallback((groupId: string, personId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberIds: g.memberIds.filter((id) => id !== personId),
              leaderIds: g.leaderIds.filter((id) => id !== personId),
              deputyLeaderIds: g.deputyLeaderIds ? g.deputyLeaderIds.filter((id) => id !== personId) : [],
            }
          : g
      )
    );
    persist(removeGroupMember(groupId, personId), "fjerne medlemmet fra gruppen");
    return { success: true };
  }, []);

  const handleCreateTask = useCallback((data: NewTaskInput) => {
    const newTask = buildTask(data);
    setTasks((prev) => [...prev, newTask]);
    persist(createTask(newTask), "lagre oppgaven");
    return { success: true, task: newTask };
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    persist(deleteTask(taskId), "slette oppgaven");
    return { success: true };
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    persist(updateTask(taskId, updates), "lagre endringene i oppgaven");
    return { success: true };
  }, []);

  const handleUpdateTaskInstruction = useCallback((taskId: string, instruction: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, instruction } : t)));
    persist(updateTaskInstruction(taskId, instruction), "lagre instruksen");
    return { success: true };
  }, []);

  const handleUpdateTaskNeededCount = useCallback((taskId: string, neededCount: number | undefined) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, neededCount } : t)));
    persist(updateTaskNeededCount(taskId, neededCount), "lagre bemanningsbehovet");
    return { success: true };
  }, []);

  const handleSendGroupMessage = useCallback(
    (groupId: string, content: string, imageUrl?: string) => {
      const newMsg = buildGroupMessage(groupId, currentUser, content, imageUrl);
      setGroupMessages((prev) => [...prev, newMsg]);
      persist(sendGroupMessage(newMsg), "sende meldingen");
      return { success: true, message: newMsg };
    },
    [currentUser]
  );

  const handleDeleteGroupMessage = useCallback((messageId: string, _personId?: string) => {
    setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));
    persist(deleteGroupMessage(messageId), "slette meldingen");
    return { success: true };
  }, []);

  const handleToggleGroupNotifications = useCallback(
    (groupId: string, personId: string = currentUserId, forceState?: boolean) => {
      const grp = groups.find((g) => g.id === groupId);
      const current = grp?.notificationPreferences?.[personId] !== false;
      const next = forceState !== undefined ? forceState : !current;

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                notificationPreferences: {
                  ...(g.notificationPreferences || {}),
                  [personId]: next,
                },
              }
            : g
        )
      );

      persist(
        updateGroup(groupId, {
          notificationPreferences: {
            ...(grp?.notificationPreferences || {}),
            [personId]: next,
          },
        }),
        "lagre varslingsvalget"
      );

      return { success: true, enabled: next };
    },
    [groups, currentUserId]
  );

  const handleRespondToGathering = useCallback(
    async (gatheringId: string, personId: string, status: "attending" | "declined") => {
      const id = `att-${gatheringId}-${personId}`;
      const att: GatheringAttendance = {
        id,
        gatheringId,
        personId,
        status,
        updatedAt: new Date().toISOString(),
      };
      setAttendances((prev) => {
        const filtered = prev.filter((a) => !(a.gatheringId === gatheringId && a.personId === personId));
        return [...filtered, att];
      });
      return await respondToGathering(gatheringId, personId, status);
    },
    []
  );

  const contextValue: FirebaseDataContextType = useMemo(
    () => ({
      isFirestoreConnected,
      currentUser,
      allPersons: persons,
      currentUserId,
      setCurrentUserId,
      groups,
      gatherings,
      tasks,
      assignments,
      groupMessages,
      attendances,
      moduleConfig,
      setModuleStatus,
      toggleKalender,
      toggleMeldinger,
      getTasksForPerson,
      getOpenTasksForGroups,
      getTaskById,
      getGatheringById,
      getGroupById,
      getPersonById,
      getAssignmentForTask,
      getAllAssignmentsForTask,
      getUserGroups,
      isPersonInGroup,
      getGroupMessages,
      getGatheringAttendances,
      getPersonAttendance,
      getUpcomingGatheringForGroup,
      getGatheringsForGroup,
      getGroupNotificationsEnabled,
      createGathering: handleCreateGathering,
      updateGathering: handleUpdateGathering,
      deleteGathering: handleDeleteGathering,
      sendGatheringInvitation: handleSendGatheringInvitation,
      assignTaskToPerson: handleAssignTaskToPerson,
      reportAbsence: handleReportAbsence,
      updateAssignmentStatus: handleUpdateAssignmentStatus,
      removeAssignment: handleRemoveAssignment,
      updateTaskStatus: handleUpdateTaskStatus,
      updateGroupName: handleUpdateGroupName,
      updateGroup: handleUpdateGroup,
      createGroup: handleCreateGroup,
      addPerson: handleAddPerson,
      updatePerson: handleUpdatePerson,
      addGroupMember: handleAddGroupMember,
      removeGroupMember: handleRemoveGroupMember,
      createTask: handleCreateTask,
      deleteTask: handleDeleteTask,
      updateTask: handleUpdateTask,
      updateTaskInstruction: handleUpdateTaskInstruction,
      updateTaskNeededCount: handleUpdateTaskNeededCount,
      sendGroupMessage: handleSendGroupMessage,
      deleteGroupMessage: handleDeleteGroupMessage,
      toggleGroupNotifications: handleToggleGroupNotifications,
      respondToGathering: handleRespondToGathering,
    }),
    [
      isFirestoreConnected,
      currentUser,
      persons,
      currentUserId,
      groups,
      gatherings,
      tasks,
      assignments,
      groupMessages,
      attendances,
      moduleConfig,
      setModuleStatus,
      toggleKalender,
      toggleMeldinger,
      getTasksForPerson,
      getOpenTasksForGroups,
      getTaskById,
      getGatheringById,
      getGroupById,
      getPersonById,
      getAssignmentForTask,
      getAllAssignmentsForTask,
      getUserGroups,
      isPersonInGroup,
      getGroupMessages,
      getGatheringAttendances,
      getPersonAttendance,
      getUpcomingGatheringForGroup,
      getGatheringsForGroup,
      getGroupNotificationsEnabled,
      handleCreateGathering,
      handleUpdateGathering,
      handleDeleteGathering,
      handleSendGatheringInvitation,
      handleAssignTaskToPerson,
      handleReportAbsence,
      handleUpdateAssignmentStatus,
      handleRemoveAssignment,
      handleUpdateTaskStatus,
      handleUpdateGroupName,
      handleUpdateGroup,
      handleCreateGroup,
      handleAddPerson,
      handleUpdatePerson,
      handleAddGroupMember,
      handleRemoveGroupMember,
      handleCreateTask,
      handleDeleteTask,
      handleUpdateTask,
      handleUpdateTaskInstruction,
      handleUpdateTaskNeededCount,
      handleSendGroupMessage,
      handleDeleteGroupMessage,
      handleToggleGroupNotifications,
      handleRespondToGathering,
    ]
  );

  return React.createElement(FirebaseDataContext.Provider, { value: contextValue }, children);
};

export const useFirebase = (): FirebaseDataContextType => {
  const context = useContext(FirebaseDataContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseDataProvider");
  }
  return context;
};

// Aliases for compatibility when replacing MockDataProvider
export { FirebaseDataProvider as MockDataProvider };
export { useFirebase as useMockData };
