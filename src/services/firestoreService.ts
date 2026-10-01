import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  Person,
  Group,
  Gathering,
  Task,
  Assignment,
  GroupMessage,
  GatheringAttendance,
} from "../types";
import {
  initialPersons,
  initialGroups,
  initialGatherings,
  initialTasks,
  initialAssignments,
  initialGroupMessages,
  initialGatheringAttendances,
} from "../data/mockData";

// Helper to remove undefined values recursively as Firestore rejects them
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

// Collection references
export const COLLECTIONS = {
  PERSONS: "persons",
  GROUPS: "groups",
  GATHERINGS: "gatherings",
  TASKS: "tasks",
  ASSIGNMENTS: "assignments",
  GROUP_MESSAGES: "groupMessages",
  GATHERING_ATTENDANCES: "gatheringAttendances",
} as const;

// Seed initial data if Firestore is empty
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const personsSnap = await getDocs(collection(db, COLLECTIONS.PERSONS));
    if (!personsSnap.empty) {
      console.log("Firestore already contains data, skipping initial seed.");
      return false;
    }

    console.log("Seeding Firestore with initial church domain data...");

    // Seed Persons
    for (const person of initialPersons) {
      await setDoc(doc(db, COLLECTIONS.PERSONS, person.id), sanitizeForFirestore(person));
    }

    // Seed Groups
    for (const group of initialGroups) {
      await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitizeForFirestore(group));
    }

    // Seed Gatherings
    for (const gathering of initialGatherings) {
      await setDoc(doc(db, COLLECTIONS.GATHERINGS, gathering.id), sanitizeForFirestore(gathering));
    }

    // Seed Tasks
    for (const task of initialTasks) {
      await setDoc(doc(db, COLLECTIONS.TASKS, task.id), sanitizeForFirestore(task));
    }

    // Seed Assignments
    for (const assignment of initialAssignments) {
      await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), sanitizeForFirestore(assignment));
    }

    // Seed Group Messages
    for (const message of initialGroupMessages) {
      await setDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, message.id), sanitizeForFirestore(message));
    }

    // Seed Gathering Attendances
    for (const attendance of initialGatheringAttendances) {
      await setDoc(doc(db, COLLECTIONS.GATHERING_ATTENDANCES, attendance.id), sanitizeForFirestore(attendance));
    }

    console.log("Firestore seeding completed successfully.");
    return true;
  } catch (error) {
    console.error("Error during Firestore seeding:", error);
    handleFirestoreError(error, OperationType.WRITE, "seedFirestore");
    return false;
  }
}

// Force re-seeding of mock data
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

// -------------------------------------------------------------
// Real-time Listeners
// -------------------------------------------------------------

export function subscribeToPersons(callback: (persons: Person[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.PERSONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.PERSONS);
    }
  );
}

export function subscribeToGroups(callback: (groups: Group[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GROUPS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.GROUPS);
    }
  );
}

export function subscribeToGatherings(callback: (gatherings: Gathering[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GATHERINGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Gathering));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.GATHERINGS);
    }
  );
}

export function subscribeToTasks(callback: (tasks: Task[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.TASKS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.TASKS);
    }
  );
}

export function subscribeToAssignments(callback: (assignments: Assignment[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.ASSIGNMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ASSIGNMENTS);
    }
  );
}

export function subscribeToGroupMessages(callback: (messages: GroupMessage[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GROUP_MESSAGES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMessage));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.GROUP_MESSAGES);
    }
  );
}

export function subscribeToAttendances(callback: (attendances: GatheringAttendance[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.GATHERING_ATTENDANCES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GatheringAttendance));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.GATHERING_ATTENDANCES);
    }
  );
}

// -------------------------------------------------------------
// Mutation Operations
// -------------------------------------------------------------

export async function savePersonToFirestore(person: Person): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.PERSONS, person.id), sanitizeForFirestore(person));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.PERSONS}/${person.id}`);
  }
}

export async function updatePersonInFirestore(personId: string, updates: Partial<Person>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PERSONS, personId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.PERSONS}/${personId}`);
  }
}

export async function saveGroupToFirestore(group: Group): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitizeForFirestore(group));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.GROUPS}/${group.id}`);
  }
}

export async function updateGroupInFirestore(groupId: string, updates: Partial<Group>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.GROUPS}/${groupId}`);
  }
}

export async function saveGatheringToFirestore(gathering: Gathering): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GATHERINGS, gathering.id), sanitizeForFirestore(gathering));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.GATHERINGS}/${gathering.id}`);
  }
}

export async function updateGatheringInFirestore(gatheringId: string, updates: Partial<Gathering>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GATHERINGS, gatheringId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.GATHERINGS}/${gatheringId}`);
  }
}

export async function deleteGatheringFromFirestore(gatheringId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GATHERINGS, gatheringId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.GATHERINGS}/${gatheringId}`);
  }
}

export async function saveTaskToFirestore(task: Task): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.TASKS, task.id), sanitizeForFirestore(task));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.TASKS}/${task.id}`);
  }
}

export async function updateTaskInFirestore(taskId: string, updates: Partial<Task>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.TASKS}/${taskId}`);
  }
}

export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.TASKS}/${taskId}`);
  }
}

export async function saveAssignmentToFirestore(assignment: Assignment): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), sanitizeForFirestore(assignment));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.ASSIGNMENTS}/${assignment.id}`);
  }
}

export async function updateAssignmentInFirestore(assignmentId: string, updates: Partial<Assignment>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ASSIGNMENTS}/${assignmentId}`);
  }
}

export async function deleteAssignmentFromFirestore(assignmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ASSIGNMENTS}/${assignmentId}`);
  }
}

export async function saveGroupMessageToFirestore(message: GroupMessage): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, message.id), sanitizeForFirestore(message));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.GROUP_MESSAGES}/${message.id}`);
  }
}

export async function deleteGroupMessageFromFirestore(messageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GROUP_MESSAGES, messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.GROUP_MESSAGES}/${messageId}`);
  }
}

export async function saveAttendanceToFirestore(attendance: GatheringAttendance): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GATHERING_ATTENDANCES, attendance.id), sanitizeForFirestore(attendance));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.GATHERING_ATTENDANCES}/${attendance.id}`);
  }
}
