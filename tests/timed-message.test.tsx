// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useTimedMessage } from "../src/hooks/useTimedMessage";

describe("Meldinger som forsvinner av seg selv", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const mount = () => renderHook(() => useTimedMessage<string>());
  const pass = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

  test("En melding vises og forsvinner etter 3,5 sekunder", () => {
    const { result } = mount();
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]("Lagret!"));
    expect(result.current[0]).toBe("Lagret!");

    pass(3499);
    expect(result.current[0]).toBe("Lagret!");
    pass(1);
    expect(result.current[0]).toBeNull();
  });

  test("En ny melding blir ikke klippet av tidsuret til den forrige", () => {
    const { result } = mount();
    act(() => result.current[1]("Første"));
    pass(3000);
    act(() => result.current[1]("Andre"));

    // The first message's timer would have fired here
    pass(1000);
    expect(result.current[0]).toBe("Andre");
    pass(2500);
    expect(result.current[0]).toBeNull();
  });

  test("En melding kan ha sin egen varighet, og kan lukkes med en gang", () => {
    const { result } = mount();
    act(() => result.current[1]("Kort", 1000));
    pass(1000);
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]("Lukkes av brukeren"));
    act(() => result.current[2]());
    expect(result.current[0]).toBeNull();
  });

  test("Ingenting skjer etter at komponenten er borte", () => {
    const { result, unmount } = mount();
    act(() => result.current[1]("På vei ut"));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
