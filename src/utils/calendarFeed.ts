import type { Gathering } from "../types";
import { isOpenCommunityGathering, locationOf } from "./gatherings";

const DEFAULT_DURATION_MS = 90 * 60 * 1000;
const FEED_PAST_MS = 30 * 24 * 60 * 60 * 1000;
const FEED_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;

function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcalUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const startOf = (g: Pick<Gathering, "startsAt">) => new Date(g.startsAt).getTime();

/**
 * Gatherings for the public iCal feed: open community events in the subscription window.
 * Same inclusion rule as the calendar module (`isOpenCommunityGathering`).
 */
export function gatheringsForCalendarFeed<T extends Gathering>(
  gatherings: T[],
  now: Date = new Date()
): T[] {
  const from = now.getTime() - FEED_PAST_MS;
  const to = now.getTime() + FEED_FUTURE_MS;
  return gatherings
    .filter((g) => isOpenCommunityGathering(g) && startOf(g) >= from && startOf(g) <= to)
    .sort((a, b) => startOf(a) - startOf(b));
}

export interface IcalendarOptions {
  calendarName?: string;
  now?: Date;
}

/** Build an iCalendar document for open community gatherings. */
export function toIcalendar(gatherings: Gathering[], options: IcalendarOptions = {}): string {
  const now = options.now || new Date();
  const events = gatheringsForCalendarFeed(gatherings, now);
  const calendarName = escapeIcal(options.calendarName || "Menighetsplan");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Menighetsplan//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
  ];

  for (const g of events) {
    const start = new Date(g.startsAt);
    const end = g.endsAt ? new Date(g.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
    const descriptionParts = [g.theme, g.bibleText].filter(Boolean).join(" — ");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${g.id}@menighetsplan`);
    lines.push(`DTSTAMP:${formatIcalUtc(now)}`);
    lines.push(`DTSTART:${formatIcalUtc(start)}`);
    lines.push(`DTEND:${formatIcalUtc(end)}`);
    lines.push(`SUMMARY:${escapeIcal(g.title || "Samling")}`);
    lines.push(`LOCATION:${escapeIcal(locationOf(g))}`);
    if (descriptionParts) {
      lines.push(`DESCRIPTION:${escapeIcal(descriptionParts)}`);
    }
    if (g.cancelled) {
      lines.push("STATUS:CANCELLED");
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
