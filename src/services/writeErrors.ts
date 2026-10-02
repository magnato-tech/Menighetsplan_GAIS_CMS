// Failed Firestore writes. Anything that writes reports here; WriteErrorBanner shows it.

export interface WriteError {
  /** What the user was trying to do, as it reads after "Kunne ikke": "lagre samlingen". */
  action: string;
  detail: string;
}

let current: WriteError | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function reportWriteError(action: string, error: unknown): void {
  console.error(`Kunne ikke ${action}:`, error);
  current = {
    action,
    detail: error instanceof Error ? error.message : String(error ?? "Ukjent feil"),
  };
  notify();
}

export function clearWriteError(): void {
  current = null;
  notify();
}

export function subscribeToWriteError(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getWriteError(): WriteError | null {
  return current;
}
