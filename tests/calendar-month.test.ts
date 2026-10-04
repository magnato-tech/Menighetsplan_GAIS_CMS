import { describe } from "vitest";
import { assert } from "./assert";
import { buildMonthGrid, monthLabel } from "../src/utils/calendarMonth";
import type { Gathering } from "../src/types";

describe("Månedsrutenett for kalender", () => {
  const today = new Date("2026-10-04T12:00:00.000Z");
  const event = (day: number, title: string): Gathering => ({
    id: `evt-${day}`,
    groupId: "g1",
    title,
    startsAt: new Date(2026, 9, day, 11, 0, 0).toISOString(),
    visibility: "offentlig",
    type: "arrangement",
  });

  const grid = buildMonthGrid(2026, 9, [event(4, "Gudstjeneste"), event(7, "Møte")], today);

  assert(grid.length === 42, "Månedsrutenettet har seks uker");
  assert(grid.some((cell) => cell.isToday && cell.date.getDate() === 4), "I dag markeres");
  assert(
    grid.find((cell) => cell.date.getDate() === 4 && cell.inMonth)?.events[0]?.title === "Gudstjeneste",
    "Arrangementer plasseres på riktig dag"
  );
  assert(monthLabel(2026, 9).includes("2026"), "Månedstittel inkluderer år");
});
