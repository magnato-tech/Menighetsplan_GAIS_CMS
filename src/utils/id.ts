const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 8;

/**
 * Returns `<prefix>-<timestamp>-<random>`.
 * The timestamp alone is not unique: documents created in the same millisecond
 * (cloning tasks in a loop) would share an id and overwrite each other in Firestore.
 */
export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SUFFIX_LENGTH));
  let suffix = "";
  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `${prefix}-${Date.now()}-${suffix}`;
}
