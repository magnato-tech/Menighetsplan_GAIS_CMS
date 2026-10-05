import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardCheck } from "lucide-react";
import type { AnalyticsPeriod, FullStaffingSummary } from "../../../../utils/churchAnalytics";
import { describeChange, formatPercent } from "../../../../utils/analyticsFormat";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import { AnalyticsSection, MiniStat } from "./AnalyticsSection";

interface StaffingPerGatheringSectionProps {
  period: AnalyticsPeriod;
  staffing: FullStaffingSummary;
  onHide: () => void;
}

const SHOWN = 8;

/** How many gatherings had every slot filled, and which did not. */
export const StaffingPerGatheringSection: React.FC<StaffingPerGatheringSectionProps> = ({ period, staffing, onHide }) => {
  const change = describeChange(staffing.rate, staffing.previousRate, "rate");
  const total = staffing.gatherings.length;
  const missingSlots = staffing.notFull.reduce((sum, g) => sum + g.missing, 0);

  return (
    <AnalyticsSection
      id="analyse-bemanning"
      title="Bemanning per arrangement"
      description="Samlinger som er holdt i perioden og hadde oppgaver. Fullt bemannet betyr at alle plasser i alle oppgavene var bekreftet."
      icon={<ClipboardCheck className="w-5 h-5" />}
      onHide={onHide}
    >
      {total === 0 ? (
        <p className="text-xs text-[var(--studio-muted)]">Ingen samlinger i perioden hadde oppgaver.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="Fullt bemannet" value={`${staffing.full} av ${total}`}>
              {formatPercent(staffing.rate)}
              {change ? ` · ${change.text} fra ${period.previousLabel}` : ""}
            </MiniStat>
            <MiniStat
              label="Gudstjenester fullt bemannet"
              value={staffing.worship.withTasks > 0 ? `${staffing.worship.full} av ${staffing.worship.withTasks}` : "–"}
            >
              {staffing.worship.withTasks > 0 ? formatPercent(staffing.worship.rate) : "ingen gudstjenester med oppgaver"}
            </MiniStat>
            <MiniStat label="Ikke fullt bemannet" value={String(staffing.notFull.length)}>
              {missingSlots > 0 ? `${missingSlots} plasser manglet til sammen` : "ingen plasser manglet"}
            </MiniStat>
          </div>

          <div className="space-y-1.5" aria-hidden="true">
            <div className="h-2.5 rounded-full bg-[var(--viz-track)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--viz-1)]" style={{ width: `${(staffing.rate ?? 0) * 100}%` }} />
            </div>
            <p className="text-[11px] text-[var(--studio-muted)]">Andel av samlingene med oppgaver som var fullt bemannet</p>
          </div>

          {staffing.notFull.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[var(--studio-text)]">Ikke fullt bemannet</h3>
              <ul className="space-y-1.5">
                {staffing.notFull.slice(0, SHOWN).map((row) => (
                  <li key={row.gathering.id} className="flex items-center justify-between gap-3 text-xs">
                    <Link
                      to={`/admin/samling/${row.gathering.id}`}
                      className="min-w-0 truncate font-semibold text-[var(--studio-link)] hover:text-[var(--studio-link-hover)]"
                    >
                      {row.gathering.title}
                      <span className="font-normal text-[var(--studio-muted)]"> · {formatNorwegianDateTime(row.gathering.startsAt)}</span>
                    </Link>
                    <span className="flex items-center gap-1 shrink-0 text-[var(--studio-muted)] tabular-nums">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--studio-warn)]" aria-hidden="true" />
                      mangler {row.missing} av {row.needed}
                    </span>
                  </li>
                ))}
              </ul>
              {staffing.notFull.length > SHOWN && (
                <p className="text-[11px] text-[var(--studio-muted)]">Og {staffing.notFull.length - SHOWN} til.</p>
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsSection>
  );
};
