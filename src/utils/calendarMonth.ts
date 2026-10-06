import type { Gathering } from "../types";

export interface CalendarMonthCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: Gathering[];
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Monday = 0 … Sunday = 6 */
function mondayBasedWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function buildMonthGrid(
  year: number,
  month: number,
  events: Gathering[],
  today: Date = new Date()
): CalendarMonthCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayBasedWeekday(firstOfMonth));

  const todayStart = startOfDay(today).getTime();
  const cells: CalendarMonthCell[] = [];

  for (let i = 0; i < 42; i++) {
    // Counted in calendar days. A day is 23 or 25 hours when the clocks change, so stepping
    // 24 hours at a time shows one date twice in October and skips one in March.
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const dayStart = date.getTime();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() - 1;
    const dayEvents = events.filter((g) => {
      const t = new Date(g.startsAt).getTime();
      return t >= dayStart && t <= dayEnd;
    });

    cells.push({
      date,
      inMonth: date.getMonth() === month,
      isToday: dayStart === todayStart,
      events: dayEvents,
    });
  }

  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("no-NO", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );
}
