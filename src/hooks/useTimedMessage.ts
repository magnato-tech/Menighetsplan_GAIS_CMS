import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A message that clears itself after a while, for toasts and short confirmations.
 * Showing a new message restarts the clock, so an earlier message's timer cannot
 * cut the new one short, and nothing fires after the component is gone.
 *
 *   const [feedback, showFeedback] = useTimedMessage<string>();
 *   showFeedback("Lagret!");          // gone after 3.5 seconds
 *   showFeedback("Slettet.", 2500);   // or after a time of its own
 */
export function useTimedMessage<T>(
  defaultDurationMs = 3500
): [message: T | null, show: (message: T, durationMs?: number) => void, clear: () => void] {
  const [message, setMessage] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const show = useCallback(
    (next: T, durationMs: number = defaultDurationMs) => {
      clearTimeout(timer.current);
      setMessage(next);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [defaultDurationMs]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return [message, show, clear];
}
