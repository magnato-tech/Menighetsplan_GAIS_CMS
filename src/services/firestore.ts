import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  FieldPath,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Assignment } from "../types";
import { COLLECTIONS } from "../data/collections";
import { sanitizeForFirestore, forUpdate } from "../utils/firestoreData";

type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ============================================================================
// Reading
// ============================================================================

/**
 * Calls back with the whole collection, now and after every change.
 * A local write shows up at once, before the server has answered; if the server
 * then rejects it, the listener is called again with what is actually stored.
 */
export function subscribeCollection<T extends { id: string }>(
  name: CollectionName,
  onChange: (items: T[]) => void
): () => void {
  return onSnapshot(
    collection(db, name),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T))),
    (error) => handleFirestoreError(error, OperationType.GET, name)
  );
}

// ============================================================================
// Writing
// ============================================================================

// Each function returns the promise of the write and leaves it to the caller to report
// a failure. New documents arrive fully built (see data/newDocuments.ts), id included.

export function createDocument<T extends { id: string }>(name: CollectionName, document: T): Promise<void> {
  return setDoc(doc(db, name, document.id), sanitizeForFirestore(document));
}

/** A field given as `undefined` is removed from the stored document. */
export function updateDocument(name: CollectionName, id: string, updates: object): Promise<void> {
  return updateDoc(doc(db, name, id), forUpdate(updates));
}

export function deleteDocument(name: CollectionName, id: string): Promise<void> {
  return deleteDoc(doc(db, name, id));
}

// The writes below change lists and maps inside a document, or several documents at once.
// None of them reads before it writes, so two changes made at the same time cannot
// overwrite each other.

export function addGroupMember(groupId: string, personId: string): Promise<void> {
  return updateDoc(
    doc(db, COLLECTIONS.GROUPS, groupId),
    "memberIds",
    arrayUnion(personId),
    new FieldPath("memberJoinedAt", personId),
    new Date().toISOString()
  );
}

/** Leaving a group also ends any leader role in it. */
export function removeGroupMember(groupId: string, personId: string): Promise<void> {
  return updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), {
    memberIds: arrayRemove(personId),
    leaderIds: arrayRemove(personId),
    deputyLeaderIds: arrayRemove(personId),
  });
}

export function setGroupNotifications(groupId: string, personId: string, enabled: boolean): Promise<void> {
  return updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), new FieldPath("notificationPreferences", personId), enabled);
}

/** Stores the assignment and the task's new status together, so neither exists without the other. */
export function assignTask(assignment: Assignment): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), sanitizeForFirestore(assignment));
  batch.update(doc(db, COLLECTIONS.TASKS, assignment.taskId), {
    status: assignment.response === "confirmed" ? "confirmed" : "assigned",
  });
  return batch.commit();
}

/** Marks the given assignments as withdrawn from and the task as vacant, in one write. */
export function withdrawFromTask(taskId: string, assignmentIds: string[], reason?: string): Promise<void> {
  const batch = writeBatch(db);
  for (const assignmentId of assignmentIds) {
    batch.update(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), {
      response: "declined",
      ...(reason ? { withdrawalReason: reason } : {}),
    });
  }
  batch.update(doc(db, COLLECTIONS.TASKS, taskId), { status: "vacant" });
  return batch.commit();
}
