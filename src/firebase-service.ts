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
  orderBy,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, testConnection as verifyFirebaseConnection } from "./firebase";
import {
  Person,
  Group,
  Gathering,
  GatheringVisibility,
  Task,
  Assignment,
  GroupMessage,
  GatheringAttendance,
  GroupCategory,
  MeetingSchedule,
} from "./types";
import {
  initialPersons,
  initialGroups,
  initialGatherings,
  initialTasks,
  initialAssignments,
  initialGroupMessages,
  initialGatheringAttendances,
} from "./data/mockData";

// ============================================================================
// Firestore Collections & Helpers
// ============================================================================

export const COLLECTIONS = {
  PERSONS: "persons",
  GROUPS: "groups",
  GATHERINGS: "gatherings",
  TASKS: "tasks",
  ASSIGNMENTS: "assignments",
  GROUP_MESSAGES: "groupMessages",
  GATHERING_ATTENDANCES: "gatheringAttendances",
} as const;

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
// Connection and Seeding Functions
// ============================================================================

/**
 * Tests connection to Firestore database.
 */
export async function testConnection(): Promise<boolean> {
  return await verifyFirebaseConnection();
}

/**
 * Seeds Firestore with initial church domain data if the database is empty.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const personsSnap = await getDocs(collection(db, COLLECTIONS.PERSONS));
    if (!personsSnap.empty) {
      return false;
    }

    await forceSeedFirestore();
    return true;
  } catch (error) {
    console.error("Error during initial Firestore seed check:", error);
    return false;
  }
}

/**
 * Force-replaces or updates all mock items into Firestore.
 */
export async function forceSeedFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;
    for (const person of initialPersons) {
      await setDoc(doc(db, COLLECTIONS.PERSONS, person.id), sanitizeForFirestore(person));
      count++;
    }
    for (const group of initialGroups) {
      await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitizeForFirestore(group));
      count++;
    }
    for (const gathering of initialGatherings) {
      await setDoc(doc(db, COLLECTIONS.GATHERINGS, gathering.id), sanitizeForFirestore(gathering));
      count++;
    }
    for (const task of initialTasks) {
      await setDoc(doc(db, COLLECTIONS.TASKS, task.id), sanitizeForFirestore(task));
      count++;
    }
    for (const assignment of initialAssignments) {
      await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), sanitizeForFirestore(assignment));
      count++;
    }
    for (const message of initialGroupMessages) {
      await setDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, message.id), sanitizeForFirestore(message));
      count++;
    }
    for (const attendance of initialGatheringAttendances) {
      await setDoc(doc(db, COLLECTIONS.GATHERING_ATTENDANCES, attendance.id), sanitizeForFirestore(attendance));
      count++;
    }
    return { success: true, count };
  } catch (error) {
    console.error("Force seed failed:", error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Inspect document counts in Firestore.
 */
export async function getFirestoreStats(): Promise<{
  connected: boolean;
  counts: Record<string, number>;
}> {
  try {
    const [pSnap, gSnap, gaSnap, tSnap, aSnap, mSnap, attSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.PERSONS)),
      getDocs(collection(db, COLLECTIONS.GROUPS)),
      getDocs(collection(db, COLLECTIONS.GATHERINGS)),
      getDocs(collection(db, COLLECTIONS.TASKS)),
      getDocs(collection(db, COLLECTIONS.ASSIGNMENTS)),
      getDocs(collection(db, COLLECTIONS.GROUP_MESSAGES)),
      getDocs(collection(db, COLLECTIONS.GATHERING_ATTENDANCES)),
    ]);

    return {
      connected: true,
      counts: {
        persons: pSnap.size,
        groups: gSnap.size,
        gatherings: gaSnap.size,
        tasks: tSnap.size,
        assignments: aSnap.size,
        messages: mSnap.size,
        attendances: attSnap.size,
      },
    };
  } catch (error) {
    console.error("Failed to get Firestore stats:", error);
    return {
      connected: false,
      counts: {
        persons: 0,
        groups: 0,
        gatherings: 0,
        tasks: 0,
        assignments: 0,
        messages: 0,
        attendances: 0,
      },
    };
  }
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
// Direct One-time Queries (CRUD)
// ============================================================================

export async function fetchPersons(): Promise<Person[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.PERSONS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
}

export async function fetchGroups(): Promise<Group[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.GROUPS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
}

export async function fetchGatherings(): Promise<Gathering[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.GATHERINGS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Gathering));
}

export async function fetchTasks(): Promise<Task[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.TASKS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

export async function fetchGroupMessages(groupId?: string): Promise<GroupMessage[]> {
  if (groupId) {
    const q = query(collection(db, COLLECTIONS.GROUP_MESSAGES), where("groupId", "==", groupId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMessage));
  }
  const snap = await getDocs(collection(db, COLLECTIONS.GROUP_MESSAGES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMessage));
}

export async function fetchAttendances(gatheringId?: string): Promise<GatheringAttendance[]> {
  if (gatheringId) {
    const q = query(collection(db, COLLECTIONS.GATHERING_ATTENDANCES), where("gatheringId", "==", gatheringId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GatheringAttendance));
  }
  const snap = await getDocs(collection(db, COLLECTIONS.GATHERING_ATTENDANCES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GatheringAttendance));
}

// Single item getters
export async function getPersonById(id: string): Promise<Person | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.PERSONS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Person) : null;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.GROUPS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null;
}

export async function getGatheringById(id: string): Promise<Gathering | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.GATHERINGS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Gathering) : null;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.TASKS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null;
}

// ============================================================================
// High-Level Domain Mutations (Persisted in Firestore)
// ============================================================================

// Persons
export async function createPerson(data: {
  name: string;
  phone?: string;
  email?: string;
  globalRole?: "member" | "admin";
}): Promise<{ success: boolean; person?: Person; error?: string }> {
  try {
    const id = `person-${Date.now()}`;
    const newPerson: Person = {
      id,
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      globalRole: data.globalRole || "member",
    };
    await setDoc(doc(db, COLLECTIONS.PERSONS, id), sanitizeForFirestore(newPerson));
    return { success: true, person: newPerson };
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
export async function createGroup(data: {
  name: string;
  description?: string;
  category?: GroupCategory;
  tags?: string[];
  isPublic?: boolean;
  leaderIds?: string[];
  deputyLeaderIds?: string[];
  memberIds?: string[];
  meetingSchedule?: MeetingSchedule;
}): Promise<{ success: boolean; group?: Group; error?: string }> {
  try {
    const id = `group-${Date.now()}`;
    const newGroup: Group = {
      id,
      name: data.name.trim(),
      description: data.description?.trim(),
      category: data.category || "tjenestegruppe",
      tags: data.tags || [],
      isPublic: data.isPublic !== false,
      leaderIds: data.leaderIds || [],
      deputyLeaderIds: data.deputyLeaderIds || [],
      memberIds: data.memberIds || [],
      meetingSchedule: data.meetingSchedule,
    };
    await setDoc(doc(db, COLLECTIONS.GROUPS, id), sanitizeForFirestore(newGroup));
    return { success: true, group: newGroup };
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
export async function createGathering(data: {
  groupId?: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  type?: "arrangement" | "gruppesamling";
  theme?: string;
  bibleText?: string;
  hostPersonId?: string;
  visibility?: GatheringVisibility;
  isPublic?: boolean;
  isGudstjeneste?: boolean;
  cancelled?: boolean;
  sendInvitationImmediately?: boolean;
}): Promise<{ success: boolean; gathering?: Gathering; error?: string }> {
  try {
    const id = `gathering-${Date.now()}`;
    const newGathering: Gathering = {
      id,
      groupId: data.groupId || "group-lyd",
      title: data.title.trim(),
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      location: data.location,
      type: data.type || "arrangement",
      theme: data.theme,
      bibleText: data.bibleText,
      hostPersonId: data.hostPersonId,
      invitationSent: !!data.sendInvitationImmediately,
      invitationSentAt: data.sendInvitationImmediately ? new Date().toISOString() : undefined,
      visibility: data.visibility || (data.type === "gruppesamling" ? "intern" : "offentlig"),
      isPublic: data.visibility ? data.visibility !== "intern" : data.type !== "gruppesamling",
      isGudstjeneste: data.isGudstjeneste ?? (data.type === "arrangement"),
      cancelled: data.cancelled ?? false,
    };
    await setDoc(doc(db, COLLECTIONS.GATHERINGS, id), sanitizeForFirestore(newGathering));
    return { success: true, gathering: newGathering };
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
export async function createTask(data: {
  gatheringId: string;
  groupId: string;
  title: string;
  description?: string;
  instruction?: string;
  status?: Task["status"];
  neededCount?: number;
}): Promise<{ success: boolean; task?: Task; error?: string }> {
  try {
    const id = `task-${Date.now()}`;
    const newTask: Task = {
      id,
      gatheringId: data.gatheringId,
      groupId: data.groupId,
      title: data.title.trim(),
      description: data.description,
      instruction: data.instruction,
      status: data.status || "open",
      neededCount: data.neededCount || 1,
    };
    await setDoc(doc(db, COLLECTIONS.TASKS, id), sanitizeForFirestore(newTask));
    return { success: true, task: newTask };
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
export async function assignTaskToPerson(
  taskId: string,
  personId: string,
  responseStatus: "confirmed" | "pending" = "pending"
): Promise<{ success: boolean; error?: string }> {
  try {
    const assignmentId = `assign-${taskId}-${personId}-${Date.now()}`;
    const assignment: Assignment = {
      id: assignmentId,
      taskId,
      personId,
      response: responseStatus,
    };
    await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), sanitizeForFirestore(assignment));
    await updateDoc(
      doc(db, COLLECTIONS.TASKS, taskId),
      sanitizeForFirestore({ status: responseStatus === "confirmed" ? "confirmed" : "assigned" })
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
export async function sendGroupMessage(
  groupId: string,
  senderPersonId: string,
  senderName: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; message?: GroupMessage; error?: string }> {
  try {
    const id = `msg-${Date.now()}`;
    const newMsg: GroupMessage = {
      id,
      groupId,
      senderPersonId,
      senderName,
      content: content.trim(),
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, id), sanitizeForFirestore(newMsg));
    return { success: true, message: newMsg };
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
  createGathering: (data: {
    groupId?: string;
    title: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    type?: "arrangement" | "gruppesamling";
    theme?: string;
    bibleText?: string;
    hostPersonId?: string;
    visibility?: GatheringVisibility;
    isPublic?: boolean;
    isGudstjeneste?: boolean;
    cancelled?: boolean;
    sendInvitationImmediately?: boolean;
  }) => { success: boolean; gathering?: Gathering; error?: string };
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
  createGroup: (data: {
    name: string;
    description?: string;
    category?: GroupCategory;
    tags?: string[];
    isPublic?: boolean;
    leaderIds?: string[];
    deputyLeaderIds?: string[];
    memberIds?: string[];
    meetingSchedule?: MeetingSchedule;
  }) => { success: boolean; group?: Group; error?: string };
  addPerson: (data: { name: string; phone?: string; email?: string }) => { success: boolean; person?: Person; error?: string };
  updatePerson: (personId: string, updates: Partial<Person>) => { success: boolean; error?: string };
  addGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  removeGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  createTask: (data: {
    gatheringId: string;
    groupId: string;
    title: string;
    description?: string;
    instruction?: string;
    status?: Task["status"];
    neededCount?: number;
  }) => { success: boolean; task?: Task; error?: string };
  deleteTask: (taskId: string) => { success: boolean; error?: string };
  updateTask: (taskId: string, updates: Partial<Task>) => { success: boolean; error?: string };
  updateTaskInstruction: (taskId: string, instruction: string) => { success: boolean; error?: string };
  updateTaskNeededCount: (taskId: string, neededCount: number | undefined) => { success: boolean; error?: string };
  sendGroupMessage: (groupId: string, content: string, imageUrl?: string) => { success: boolean; message?: GroupMessage; error?: string };
  deleteGroupMessage: (messageId: string, personId?: string) => { success: boolean; error?: string };
  toggleGroupNotifications: (groupId: string, personId?: string, forceState?: boolean) => { success: boolean; enabled: boolean };
  respondToGathering: (gatheringId: string, personId: string, status: "attending" | "declined") => Promise<{ success: boolean; error?: string }>;
  reseedDatabase: () => Promise<{ success: boolean; count: number; error?: string }>;
}

export const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

export const FirebaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [gatherings, setGatherings] = useState<Gathering[]>(initialGatherings);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(initialGroupMessages);
  const [attendances, setAttendances] = useState<GatheringAttendance[]>(initialGatheringAttendances);
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

  // Check connection and seed if empty on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const connected = await testConnection();
        if (isMounted) setIsFirestoreConnected(connected);
        if (connected) {
          await seedFirestoreIfEmpty();
        }
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
    const unsubPersons = subscribePersons((items) => {
      if (items.length > 0) setPersons(items);
    });
    const unsubGroups = subscribeGroups((items) => {
      if (items.length > 0) setGroups(items);
    });
    const unsubGatherings = subscribeGatherings((items) => {
      if (items.length > 0) setGatherings(items);
    });
    const unsubTasks = subscribeTasks((items) => {
      if (items.length > 0) setTasks(items);
    });
    const unsubAssignments = subscribeAssignments((items) => {
      if (items.length > 0) setAssignments(items);
    });
    const unsubMessages = subscribeGroupMessages((items) => {
      if (items.length > 0) setGroupMessages(items);
    });
    const unsubAttendances = subscribeAttendances((items) => {
      if (items.length > 0) setAttendances(items);
    });

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

  const handleCreateGathering = useCallback(
    (data: {
      groupId?: string;
      title: string;
      startsAt: string;
      endsAt?: string;
      location?: string;
      type?: "arrangement" | "gruppesamling";
      theme?: string;
      bibleText?: string;
      hostPersonId?: string;
      visibility?: GatheringVisibility;
      isPublic?: boolean;
      isGudstjeneste?: boolean;
      cancelled?: boolean;
      sendInvitationImmediately?: boolean;
    }) => {
      const id = `gathering-${Date.now()}`;
      const newGathering: Gathering = {
        id,
        groupId: data.groupId || groups[0]?.id || "group-lyd",
        title: data.title.trim(),
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        location: data.location || "Menighetssalen",
        type: data.type || "arrangement",
        theme: data.theme,
        bibleText: data.bibleText,
        hostPersonId: data.hostPersonId,
        invitationSent: !!data.sendInvitationImmediately,
        invitationSentAt: data.sendInvitationImmediately ? new Date().toISOString() : undefined,
        visibility: data.visibility || (data.type === "gruppesamling" ? "intern" : "offentlig"),
        isPublic: data.visibility ? data.visibility !== "intern" : (data.isPublic ?? (data.type !== "gruppesamling")),
        isGudstjeneste: data.isGudstjeneste ?? (data.type === "arrangement"),
        cancelled: data.cancelled ?? false,
      };
      setGatherings((prev) => [...prev, newGathering]);
      createGathering(data).catch(console.error);
      return { success: true, gathering: newGathering };
    },
    [groups]
  );

  const handleUpdateGathering = useCallback((gatheringId: string, updates: Partial<Gathering>) => {
    setGatherings((prev) => prev.map((g) => (g.id === gatheringId ? { ...g, ...updates } : g)));
    updateGathering(gatheringId, updates).catch(console.error);
    return { success: true };
  }, []);

  const handleDeleteGathering = useCallback((gatheringId: string) => {
    setGatherings((prev) => prev.filter((g) => g.id !== gatheringId));
    deleteGathering(gatheringId).catch(console.error);
    return { success: true };
  }, []);

  const handleSendGatheringInvitation = useCallback((gatheringId: string) => {
    setGatherings((prev) =>
      prev.map((g) =>
        g.id === gatheringId ? { ...g, invitationSent: true, invitationSentAt: new Date().toISOString() } : g
      )
    );
    sendGatheringInvitation(gatheringId).catch(console.error);
    return { success: true };
  }, []);

  const handleAssignTaskToPerson = useCallback(
    async (taskId: string, personId: string, responseStatus: "confirmed" | "pending" = "pending") => {
      const newAssignment: Assignment = {
        id: `assign-${taskId}-${personId}-${Date.now()}`,
        taskId,
        personId,
        response: responseStatus,
      };
      setAssignments((prev) => [...prev, newAssignment]);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: responseStatus === "confirmed" ? "confirmed" : "assigned" } : t))
      );
      return await assignTaskToPerson(taskId, personId, responseStatus);
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
      updateAssignmentStatus(assignmentId, response).catch(console.error);
      return { success: true };
    },
    []
  );

  const handleRemoveAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    removeAssignment(assignmentId).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, status: Task["status"]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    updateTaskStatus(taskId, status).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateGroupName = useCallback((groupId: string, newName: string) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name: newName.trim() } : g)));
    updateGroupName(groupId, newName).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)));
    updateGroup(groupId, updates).catch(console.error);
    return { success: true };
  }, []);

  const handleCreateGroup = useCallback(
    (data: {
      name: string;
      description?: string;
      category?: GroupCategory;
      tags?: string[];
      isPublic?: boolean;
      leaderIds?: string[];
      deputyLeaderIds?: string[];
      memberIds?: string[];
      meetingSchedule?: MeetingSchedule;
    }) => {
      const id = `group-${Date.now()}`;
      const newGroup: Group = {
        id,
        name: data.name.trim(),
        description: data.description?.trim(),
        category: data.category || "tjenestegruppe",
        tags: data.tags || [],
        isPublic: data.isPublic !== false,
        leaderIds: data.leaderIds || [],
        deputyLeaderIds: data.deputyLeaderIds || [],
        memberIds: data.memberIds || [],
        meetingSchedule: data.meetingSchedule,
      };
      setGroups((prev) => [...prev, newGroup]);
      createGroup(data).catch(console.error);
      return { success: true, group: newGroup };
    },
    []
  );

  const handleAddPerson = useCallback((data: { name: string; phone?: string; email?: string }) => {
    const id = `person-${Date.now()}`;
    const newPerson: Person = {
      id,
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      globalRole: "member",
    };
    setPersons((prev) => [...prev, newPerson]);
    createPerson(data).catch(console.error);
    return { success: true, person: newPerson };
  }, []);

  const handleUpdatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, ...updates } : p)));
    updatePerson(personId, updates).catch(console.error);
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
    addGroupMember(groupId, personId).catch(console.error);
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
    removeGroupMember(groupId, personId).catch(console.error);
    return { success: true };
  }, []);

  const handleCreateTask = useCallback(
    (data: {
      gatheringId: string;
      groupId: string;
      title: string;
      description?: string;
      instruction?: string;
      status?: Task["status"];
      neededCount?: number;
    }) => {
      const id = `task-${Date.now()}`;
      const newTask: Task = {
        id,
        gatheringId: data.gatheringId,
        groupId: data.groupId,
        title: data.title.trim(),
        description: data.description,
        instruction: data.instruction,
        status: data.status || "open",
        neededCount: data.neededCount || 1,
      };
      setTasks((prev) => [...prev, newTask]);
      createTask(data).catch(console.error);
      return { success: true, task: newTask };
    },
    []
  );

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deleteTask(taskId).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    updateTask(taskId, updates).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateTaskInstruction = useCallback((taskId: string, instruction: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, instruction } : t)));
    updateTaskInstruction(taskId, instruction).catch(console.error);
    return { success: true };
  }, []);

  const handleUpdateTaskNeededCount = useCallback((taskId: string, neededCount: number | undefined) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, neededCount } : t)));
    updateTaskNeededCount(taskId, neededCount).catch(console.error);
    return { success: true };
  }, []);

  const handleSendGroupMessage = useCallback(
    (groupId: string, content: string, imageUrl?: string) => {
      const id = `msg-${Date.now()}`;
      const newMsg: GroupMessage = {
        id,
        groupId,
        senderPersonId: currentUser.id,
        senderName: currentUser.name,
        content: content.trim(),
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      setGroupMessages((prev) => [...prev, newMsg]);
      sendGroupMessage(groupId, currentUser.id, currentUser.name, content, imageUrl).catch(console.error);
      return { success: true, message: newMsg };
    },
    [currentUser]
  );

  const handleDeleteGroupMessage = useCallback((messageId: string, _personId?: string) => {
    setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));
    deleteGroupMessage(messageId).catch(console.error);
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

      updateGroup(groupId, {
        notificationPreferences: {
          ...(grp?.notificationPreferences || {}),
          [personId]: next,
        },
      }).catch(console.error);

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

  const handleReseedDatabase = useCallback(async () => {
    const result = await forceSeedFirestore();
    return result;
  }, []);

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
      reseedDatabase: handleReseedDatabase,
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
      handleReseedDatabase,
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
