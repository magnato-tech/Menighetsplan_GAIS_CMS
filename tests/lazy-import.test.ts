import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isChunkLoadError,
  tryAutoReloadForStaleChunk,
  clearChunkReloadAttempt,
} from "../src/utils/lazyImport";

function mockSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe("lazyImport", () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    vi.stubGlobal("sessionStorage", mockSessionStorage());
    vi.stubGlobal("window", { location: { reload } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("gjenkjenner typiske chunk-feilmeldinger", () => {
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module: /assets/foo.js"))
    ).toBe(true);
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed"))).toBe(true);
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
  });

  test("tryAutoReloadForStaleChunk laster bare én gang per session", () => {
    expect(tryAutoReloadForStaleChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(tryAutoReloadForStaleChunk()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("clearChunkReloadAttempt nullstiller flagget", () => {
    tryAutoReloadForStaleChunk();
    clearChunkReloadAttempt();
    expect(tryAutoReloadForStaleChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
