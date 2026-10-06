// The grid is laid out in the visitor's own time zone. Norway's is set here, before any date is
// made, so the days the clocks change are 25 and 23 hours long in this file wherever it runs.
process.env.TZ = "Europe/Oslo";

import { describe } from "vitest";
import { assert } from "./assert";
import { buildMonthGrid } from "../src/utils/calendarMonth";
import type { Gathering } from "../src/types";

describe("Månedsrutenettet når klokka stilles", () => {
  const today = new Date("2026-10-04T12:00:00.000Z");
  const event = (id: string, startsAt: string): Gathering => ({
    id,
    groupId: "g1",
    title: id,
    startsAt,
    visibility: "offentlig",
    type: "arrangement",
  });
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const oneDayApart = (cells: { date: Date }[]) =>
    cells.every((cell, i) => {
      if (i === 0) return true;
      const expected = new Date(cells[i - 1].date);
      expected.setDate(expected.getDate() + 1);
      return dayKey(cell.date) === dayKey(expected);
    });

  assert(new Date(2026, 9, 25).getTimezoneOffset() !== new Date(2026, 9, 26).getTimezoneOffset(), "Testen kjører i en tidssone der klokka stilles 25. oktober 2026");

  // October 2026: the clocks go back on the 25th, which is 25 hours long
  const serviceThatSunday = event("gudstjeneste", "2026-10-25T10:00:00.000Z"); // 11:00 in Norway
  const lateThatSunday = event("kveldsmøte", "2026-10-25T22:30:00.000Z"); // 23:30 in Norway
  const mondayAfter = event("menighetsmøte", "2026-10-26T16:00:00.000Z");
  const october = buildMonthGrid(2026, 9, [serviceThatSunday, lateThatSunday, mondayAfter], today);

  assert(new Set(october.map((cell) => dayKey(cell.date))).size === 42, "Oktober 2026: ingen dato står to ganger");
  assert(oneDayApart(october), "Oktober 2026: hver rute er dagen etter den forrige");
  assert(october.filter((cell) => cell.inMonth).length === 31, "Oktober 2026 har 31 dager i rutenettet");
  assert(
    october.filter((cell) => cell.events.some((e) => e.id === "gudstjeneste")).map((cell) => cell.date.getDate()).join() === "25",
    "Gudstjenesten 25. oktober står én gang, på den 25."
  );
  assert(
    october.find((cell) => cell.inMonth && cell.date.getDate() === 25)?.events.map((e) => e.id).join() === "gudstjeneste,kveldsmøte",
    "Det som skjer sent på den lange dagen, står på samme dag"
  );
  assert(
    october.find((cell) => cell.inMonth && cell.date.getDate() === 26)?.events.map((e) => e.id).join() === "menighetsmøte",
    "Mandagen etter får sitt eget arrangement"
  );
  assert(october.every((cell) => cell.date.getHours() === 0), "Hver rute begynner ved midnatt");

  // March 2027: the clocks go forward on the 28th, which is 23 hours long
  const march = buildMonthGrid(2027, 2, [event("påskefrokost", "2027-03-28T08:00:00.000Z"), event("mandagsbønn", "2027-03-29T17:00:00.000Z")], today);

  assert(new Set(march.map((cell) => dayKey(cell.date))).size === 42, "Mars 2027: ingen dato mangler eller står to ganger");
  assert(oneDayApart(march), "Mars 2027: hver rute er dagen etter den forrige");
  assert(march.filter((cell) => cell.inMonth).length === 31, "Mars 2027 har 31 dager i rutenettet");
  assert(
    march.find((cell) => cell.inMonth && cell.date.getDate() === 28)?.events[0]?.id === "påskefrokost" &&
      march.find((cell) => cell.inMonth && cell.date.getDate() === 29)?.events[0]?.id === "mandagsbønn",
    "Arrangementene rundt den korte dagen står på riktig dag"
  );
});
