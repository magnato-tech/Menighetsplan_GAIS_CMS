import React, { useState } from "react";
import { chartTicks, formatCount } from "../../../../utils/analyticsFormat";
import { countOf, formatTrafficDate, type TrafficColumn, type TrafficSummary } from "../../../../utils/siteTraffic";

interface TrafficChartProps {
  columns: TrafficColumn[];
  /** What one column covers. A week or four weeks is named by its first and last day. */
  unit: TrafficSummary["columnUnit"];
}

const PLOT_HEIGHT = 200;

const columnLabel = (column: TrafficColumn, unit: TrafficChartProps["unit"]): string =>
  unit === "dag" ? formatTrafficDate(column.from) : `${formatTrafficDate(column.from)}–${formatTrafficDate(column.to)}`;

const describeColumn = (column: TrafficColumn, unit: TrafficChartProps["unit"]): string =>
  `${columnLabel(column, unit)}: ${formatCount(column.visits)} besøk, ${countOf(column.views, "sidevisning", "sidevisninger")}`;

/**
 * One column per day, week or four weeks, as high as the visits it covers. A column with no
 * visits has no bar, only its empty slot, so a quiet day reads as quiet and not as missing.
 */
export const TrafficChart: React.FC<TrafficChartProps> = ({ columns, unit }) => {
  const [active, setActive] = useState<number | null>(null);

  const ticks = chartTicks(Math.max(0, ...columns.map((column) => column.visits)));
  const top = ticks[ticks.length - 1] || 1;
  const heightOf = (value: number) => (value / top) * PLOT_HEIGHT;

  // Fewer date labels on a narrow screen, so they never crowd or get cut off
  const labelEvery = Math.max(1, Math.ceil(columns.length / 12));
  const labelEveryNarrow = labelEvery * Math.ceil(Math.ceil(columns.length / 5) / labelEvery);

  const activeColumn = active !== null ? columns[active] : null;
  const activeShare = active !== null ? (active + 0.5) / columns.length : 0;
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
        </div>

        {/* Columns */}
        <div
          role="group"
          aria-label="Besøk over tid"
          className="relative flex items-end gap-px"
          style={{ height: PLOT_HEIGHT }}
          onMouseLeave={() => setActive(null)}
        >
          {columns.map((column, index) => (
            // A button, so the keyboard can reach every column and the tooltip follows the focus
            <button
              key={column.from}
              type="button"
              aria-label={describeColumn(column, unit)}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className={`relative flex-1 min-w-0 h-full flex flex-col justify-end items-center cursor-default rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                active === index ? "bg-[var(--studio-hover)]/60" : ""
              }`}
            >
              {column.visits > 0 && (
                <span className="block w-[min(24px,70%)] rounded-t-[4px] bg-[var(--viz-1)]" style={{ height: heightOf(column.visits) }} />
              )}
            </button>
          ))}
        </div>

        {/* Tooltip */}
        {activeColumn && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 top-0 px-3 py-2 rounded-xl bg-[var(--studio-panel-bg)] border border-[var(--studio-border)] shadow-lg text-[11px] text-[var(--studio-text)] whitespace-nowrap"
            style={{ left: `${activeShare * 100}%`, transform: `translate(${tooltipShift}, -8px)` }}
          >
            <div className="font-bold">{columnLabel(activeColumn, unit)}</div>
            <div className="mt-1 space-y-0.5 tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[var(--viz-1)]" aria-hidden="true" />
                {`Besøk ${formatCount(activeColumn.visits)}`}
              </div>
              <div>{`Sidevisninger ${formatCount(activeColumn.views)}`}</div>
            </div>
          </div>
        )}

        {/* X axis */}
        <div className="flex gap-px mt-1.5" aria-hidden="true">
          {columns.map((column, index) => (
            <span
              key={column.from}
              className={`flex-1 min-w-0 text-center text-[10px] text-[var(--studio-muted)] tabular-nums whitespace-nowrap overflow-visible ${
                index % labelEveryNarrow === 0 ? "" : "max-sm:invisible"
              }`}
            >
              {index % labelEvery === 0 ? column.label : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
