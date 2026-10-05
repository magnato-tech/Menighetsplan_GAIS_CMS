const CHUNK_RELOAD_KEY = "menighetsplan_chunk_reload_attempted";

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

/** Whether a failed dynamic import is likely a stale chunk after a new deploy. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/** Reload once per session for route-level stale chunks. Returns true if reload was started. */
export function tryAutoReloadForStaleChunk(): boolean {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** Clears the one-shot reload flag after a successful full page load. */
export function clearChunkReloadAttempt(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // ignore
  }
}

/** Prefetch a lazy module; failures are ignored (hover must not reload the page). */
export function prefetchModule(loader: () => Promise<unknown>): void {
  void loader().catch(() => {});
}
