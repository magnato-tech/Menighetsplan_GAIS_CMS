import React, { useState } from "react";
import type { CountedGathering } from "../../../../utils/churchAnalytics";
import { chartTicks, formatDayMonth } from "../../../../utils/analyticsFormat";
import { formatNorwegianDateTime } from "../../../../utils/dates";

interface AttendanceChartProps {
  rows: CountedGathering[];
  /** Average of the counted rows, drawn as a reference line. */
  average: number | null;
  /** Opens the count of a gathering for registering or correcting it. */
  onSelect: (row: CountedGathering) => void;
}

const PLOT_HEIGHT = 200;

function describeRow(row: CountedGathering): string {
  const when = formatDayMonth(row.gathering.startsAt);
  if (!row.headcount) return `${row.gathering.title} ${when}: ikke registrert. Registrer oppmøtetall`;
  return `${row.gathering.title} ${when}: ${row.total} til stede (${row.headcount.adults} voksne, ${row.headcount.children} barn). Endre oppmøtetall`;
}

/** Legend for the two series and the marker for a gathering without a count. */
export const AttendanceLegend: React.FC = () => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--studio-muted)]">
    <li className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm bg-[var(--viz-1)]" aria-hidden="true" />
      Voksne
    </li>
    <li className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm bg-[var(--viz-2)]" aria-hidden="true" />
      Barn
    </li>
    <li className="flex items-center gap-1.5">
      <span className="w-2.5 h-1 rounded-sm bg-[var(--viz-missing)]" aria-hidden="true" />
      Ikke registrert
    </li>
  </ul>
);

/**
 * One column per gathering, adults at the bottom and children on top. A gathering
 * without a count gets a low grey marker instead of a column, so a gap in the
 * registering shows as a gap and never as a low attendance.
 */
export const AttendanceChart: React.FC<AttendanceChartProps> = ({ rows, average, onSelect }) => {
  const [active, setActive] = useState<number | null>(null);

  if (rows.length === 0) {
    return <p className="text-xs text-[var(--studio-muted)]">Ingen samlinger i perioden.</p>;
  }

  const ticks = chartTicks(Math.max(0, ...rows.map((row) => row.total ?? 0)));
  const top = ticks[ticks.length - 1] || 1;
  const heightOf = (value: number) => (value / top) * PLOT_HEIGHT;

  // Label sparingly: the highest column and the latest counted one
  const counted = rows.filter((row) => row.total !== undefined);
  const highest = counted.reduce<CountedGathering | null>((best, row) => (!best || (row.total ?? 0) > (best.total ?? 0) ? row : best), null);
  const latest = counted[counted.length - 1];
  const labelled = new Set([highest?.gathering.id, latest?.gathering.id]);
  // Fewer date labels on a narrow screen, so they never crowd or get cut off
  const labelEvery = Math.max(1, Math.ceil(rows.length / 12));
  const labelEveryNarrow = labelEvery * Math.ceil(Math.ceil(rows.length / 5) / labelEvery);

  const activeRow = active !== null ? rows[active] : null;
  const activeShare = active !== null ? (active + 0.5) / rows.length : 0;
  const tooltipShift = activeShare < 0.2 ? "0%" : activeShare > 0.8 ? "-100%" : "-50%";

  return (
    <div className="flex gap-2">
      {/* Y axis */}
      <div className="relative w-8 shrink-0 text-[10px] text-[var(--studio-muted)] tabular-nums" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: heightOf(tick) }}>
            {tick}
          </span>
        ))}
      </div>

      <div className="relative flex-1 min-w-0">
        {/* Grid */}
        <div className="absolute inset-x-0 top-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
          {ticks.map((tick) => (
            <div key={tick} className="absolute inset-x-0 h-px bg-[var(--viz-grid)]" style={{ bottom: heightOf(tick) }} />
          ))}
          {average !== null && (
            <div className="absolute inset-x-0 h-px bg-[var(--studio-muted)]" style={{ bottom: heightOf(average) }}>
              <span className="absolute right-0 -top-4 px-1 text-[10px] font-bold text-[var(--studio-muted)] bg-[var(--studio-surface)] rounded">
                Snitt {average}
              </span>
            </div>
          )}
        </div>

        {/* Columns */}
        <div
          role="group"
          aria-label="Oppmøte per samling"
          className="relative flex items-end gap-px"
          style={{ height: PLOT_HEIGHT }}
          onMouseLeave={() => setActive(null)}
        >
          {rows.map((row, index) => {
            const adults = row.headcount?.adults ?? 0;
            const children = row.headcount?.children ?? 0;
            return (
              <button
                key={row.gathering.id}
                type="button"
                aria-label={describeRow(row)}
                onClick={() => onSelect(row)}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className={`relative flex-1 min-w-0 h-full flex flex-col justify-end items-center cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active === index ? "bg-[var(--studio-hover)]/60" : ""
                }`}
              >
                {row.headcount ? (
                  <span className="w-[min(24px,70%)] flex flex-col gap-[2px]">
                    {labelled.has(row.gathering.id) && (
                      <span className="text-[10px] font-bold text-[var(--studio-text)] text-center tabular-nums">{row.total}</span>
                    )}
                    {children > 0 && (
                      <span className="block w-full rounded-t-[4px] bg-[var(--viz-2)]" style={{ height: heightOf(children) }} />
                    )}
                    {adults > 0 && (
                      <span
                        className={`block w-full bg-[var(--viz-1)] ${children > 0 ? "" : "rounded-t-[4px]"}`}
                        style={{ height: heightOf(adults) }}
                      />
                    )}
                  </span>
                ) : (
                  <span className="w-[min(24px,70%)] h-1 rounded-t-[4px] bg-[var(--viz-missing)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tooltip */}
        {activeRow && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 top-0 px-3 py-2 rounded-xl bg-[var(--studio-panel-bg)] border border-[var(--studio-border)] shadow-lg text-[11px] text-[var(--studio-text)] whitespace-nowrap"
            style={{ left: `${activeShare * 100}%`, transform: `translate(${tooltipShift}, -8px)` }}
          >
            <div className="font-bold">{activeRow.gathering.title}</div>
            <div className="text-[var(--studio-muted)]">{formatNorwegianDateTime(activeRow.gathering.startsAt)}</div>
            {activeRow.headcount ? (
              <div className="mt-1 space-y-0.5 tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[var(--viz-1)]" aria-hidden="true" /> Voksne {activeRow.headcount.adults}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[var(--viz-2)]" aria-hidden="true" /> Barn {activeRow.headcount.children}
                </div>
                <div className="font-bold">Totalt {activeRow.total}</div>
              </div>
            ) : (
              <div className="mt-1 text-[var(--studio-muted)]">Ikke registrert. Trykk for å registrere.</div>
            )}
          </div>
        )}

        {/* X axis */}
        <div className="flex gap-px mt-1.5" aria-hidden="true">
          {rows.map((row, index) => (
            <span
              key={row.gathering.id}
              className={`flex-1 min-w-0 text-center text-[10px] text-[var(--studio-muted)] tabular-nums whitespace-nowrap overflow-visible ${
                index % labelEveryNarrow === 0 ? "" : "max-sm:invisible"
              }`}
            >
              {index % labelEvery === 0 ? formatDayMonth(row.gathering.startsAt) : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
