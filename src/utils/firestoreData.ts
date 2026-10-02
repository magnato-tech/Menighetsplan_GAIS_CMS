import { deleteField } from "firebase/firestore";

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

/**
 * Prepares a partial update of an existing document.
 * A field explicitly set to `undefined` is cleared. Dropping it, as sanitizeForFirestore
 * does, leaves the old value in place: an emptied phone number would come straight back.
 */
export function forUpdate(updates: object): Record<string, unknown> {
  const prepared: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    prepared[key] = value === undefined ? deleteField() : sanitizeForFirestore(value);
  }
  return prepared;
}
