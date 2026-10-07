import React from "react";
import { Clock } from "lucide-react";
import { formatCount } from "../../../../utils/analyticsFormat";
import { WEEKDAY_LABELS, countOf, formatHourSpan, type TrafficSummary } from "../../../../utils/siteTraffic";
import { AnalyticsSection } from "../analytics/AnalyticsSection";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** Only every third hour is named on screen, so 24 columns fit; screen readers get every one. */
const LABELLED_EVERY = 3;

// A cell with a few page views must never look emptier than one with none. In both themes the
// grey of an empty cell lies close to a very pale blue, so the lightest tint is kept well clear of it.
const LIGHTEST_TINT = 0.3;

const tintOf = (value: number, max: number): React.CSSProperties =>
  value > 0 && max > 0
    ? { backgroundColor: "var(--viz-1)", opacity: LIGHTEST_TINT + (1 - LIGHTEST_TINT) * (value / max) }
    : { backgroundColor: "var(--viz-grid)" };

/** When the page views come: a weekday-by-hour grid, the busiest moment in words, and the total per weekday. */
export const TrafficRhythmSection: React.FC<{ summary: TrafficSummary }> = ({ summary }) => {
  const { busiest, rhythm, weekdays } = summary;
  const max = Math.max(0, ...rhythm.flat());

  return (
    <AnalyticsSection
      id="traffic-rhythm"
      title="Når kommer besøkene?"
      description="Sidevisninger fordelt på ukedag og klokkeslett, norsk tid."
      icon={<Clock className="w-5 h-5" />}
    >
      {busiest && (
        <p className="text-xs text-[var(--studio-text)]">
          {`Flest sidevisninger: ${busiest.weekday.toLowerCase()} ${formatHourSpan(busiest.hour)} (${formatCount(busiest.views)}).`}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] table-fixed border-separate border-spacing-0.5">
          <caption className="sr-only">Sidevisninger per ukedag og time</caption>
          {/* The weekday column holds its longest name; the 24 hours share the rest evenly */}
          <colgroup>
            <col className="w-16" />
            {HOURS.map((hour) => (
              <col key={hour} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <td />
              {HOURS.map((hour) => (
                <th key={hour} scope="col" className="pb-0.5 text-center font-normal text-[10px] text-[var(--studio-muted)] tabular-nums">
                  <span className={hour % LABELLED_EVERY === 0 ? undefined : "sr-only"}>{hour}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAY_LABELS.map((weekday, weekdayIndex) => (
              <tr key={weekday}>
                <th scope="row" className="pr-2 text-left font-bold text-[11px] text-[var(--studio-muted)] whitespace-nowrap">
                  {weekday}
                </th>
                {HOURS.map((hour) => {
                  const value = rhythm[weekdayIndex]?.[hour] ?? 0;
                  const description = `${weekday} ${formatHourSpan(hour)}: ${countOf(value, "sidevisning", "sidevisninger")}`;
                  return (
                    <td key={hour} className="p-0">
                      {/* The square is for the eye and the tooltip; the text beside it is what a screen reader reads */}
                      <div title={description} aria-hidden="true" className="h-5 rounded-[3px]" style={tintOf(value, max)} />
                      <span className="sr-only">{description}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {weekdays.map((day) => (
          <li key={day.label} className="px-3 py-2 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)]">
            <span className="block text-[11px] font-bold text-[var(--studio-muted)]">{day.label}</span>
            <span className="block text-sm font-black tabular-nums text-[var(--studio-text)]">{formatCount(day.views)}</span>
          </li>
        ))}
      </ul>
    </AnalyticsSection>
  );
};
