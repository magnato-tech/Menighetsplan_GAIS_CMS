import type { Gathering } from "../types";

export interface CalendarMonthCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: Gathering[];
}

const MS_DAY = 24 * 60 * 60 * 1000;

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
    const date = new Date(gridStart.getTime() + i * MS_DAY);
    const dayStart = startOfDay(date).getTime();
    const dayEnd = dayStart + MS_DAY - 1;
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
