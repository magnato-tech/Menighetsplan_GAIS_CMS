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
import {
  db,
  handleFirestoreError,
  OperationType,
  testConnection as verifyFirebaseConnection,
} from "../firebase";
import { Person, Group, Gathering, Task, Assignment, GroupMessage, GatheringAttendance } from "../types";
import { COLLECTIONS } from "../data/collections";

// ============================================================================
// Firestore Collections & Helpers
// ============================================================================

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
