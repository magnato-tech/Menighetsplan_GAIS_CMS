import { useEffect, useState } from "react";
import { subscribeOperatingMode, type OperatingMode } from "../services/operatingMode";

/**
 * The mode the app is in, followed live. Null until the database has answered: a screen must
 * not offer to delete on the guess that the app is in demo.
 */
export function useOperatingMode(): OperatingMode | null {
  const [mode, setMode] = useState<OperatingMode | null>(null);
  useEffect(
    () =>
      subscribeOperatingMode(setMode, (error) => {
        console.error("Driftsmodus kunne ikke leses:", error);
        setMode(null);
      }),
    []
  );
  return mode;
}
