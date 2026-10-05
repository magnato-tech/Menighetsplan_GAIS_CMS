import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange } from "lucide-react";
import { atLeastPerMonth, type EngagementSummary, type MonthBand } from "../../../../utils/churchAnalytics";
import { formatPercent } from "../../../../utils/analyticsFormat";
import { AnalyticsSection, MiniStat } from "./AnalyticsSection";

interface MonthlyEngagementSectionProps {
  engagement: EngagementSummary;
  onHide?: () => void;
}

const NAMES_SHOWN = 12;
const BUSY_FROM = 4;
const link = "font-semibold text-[var(--studio-link)] hover:text-[var(--studio-link-hover)]";

const scopeButton = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
    active ? "bg-indigo-600 text-white" : "text-[var(--studio-muted)] hover:text-[var(--studio-text)]"
  }`;

/** One bar per band. «0» is drawn in grey: it is the people who had none. */
const UNITS = {
  oppgaver: { one: "oppgave", many: "oppgaver" },
  aktiviteter: { one: "aktivitet", many: "aktiviteter" },
} as const;

const BandBars: React.FC<{ bands: MonthBand[]; unit: (typeof UNITS)[keyof typeof UNITS] }> = ({ bands, unit }) => {
  const most = Math.max(0.0001, ...bands.map((b) => b.share));
  return (
    <ul className="space-y-2" aria-label={`Andel av menigheten etter antall ${unit.many} i en vanlig måned`}>
      {bands.map((band) => (
        <li key={band.label} className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-xs">
          <span className="text-[var(--studio-muted)] tabular-nums">
            {band.label} {band.label === "1" ? unit.one : unit.many}
          </span>
          <span className="flex items-center gap-2 min-w-0">
            {band.share > 0 && (
              <span
                className={`h-3 rounded-r-[4px] shrink-0 ${band.label === "0" ? "bg-[var(--viz-missing)]" : "bg-[var(--viz-1)]"}`}
                style={{ width: `${(band.share / most) * 60}%` }}
                aria-hidden="true"
              />
            )}
            <span className="text-[var(--studio-text)] tabular-nums whitespace-nowrap">
              <strong>{formatPercent(band.share)}</strong>
              <span className="text-[var(--studio-muted)]"> · ca. {band.people.toLocaleString("nb-NO")} personer</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};

/** How many tasks, or activities, the congregation has in a typical month. */
export const MonthlyEngagementSection: React.FC<MonthlyEngagementSectionProps> = ({ engagement, onHide }) => {
  const [scope, setScope] = useState<"oppgaver" | "aktiviteter">("oppgaver");
  const bands = scope === "oppgaver" ? engagement.tasksPerMonth : engagement.activitiesPerMonth;
  const busy = bands ? atLeastPerMonth(bands, BUSY_FROM) : null;
  const withoutBoth = engagement.withoutTasksOrGroups ?? [];
  const unit = UNITS[scope];

  return (
    <AnalyticsSection
      id="analyse-per-maned"
      title="Oppgaver og aktiviteter per måned"
      description={`Hvor stor del av personregisteret som har 0, 1, 2 … 8 eller flere ${unit.many} i en vanlig måned (${engagement.monthDays} dager) i perioden. ${
        scope === "aktiviteter" ? "Aktiviteter er oppgaver og gruppesamlinger personen har svart «Kommer» på." : ""
      }`}
      icon={<CalendarRange className="w-5 h-5" />}
      onHide={onHide}
      actions={
        <div role="group" aria-label="Hva som telles" className="flex items-center gap-1 p-1 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)]">
          <button type="button" aria-pressed={scope === "oppgaver"} onClick={() => setScope("oppgaver")} className={scopeButton(scope === "oppgaver")}>
            Oppgaver
          </button>
          <button type="button" aria-pressed={scope === "aktiviteter"} onClick={() => setScope("aktiviteter")} className={scopeButton(scope === "aktiviteter")}>
            Aktiviteter
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MiniStat label="Ingen oppgave i perioden" value={engagement.withoutTasks === null ? "–" : String(engagement.withoutTasks)}>
          {engagement.withoutTasksShare === null ? "ingen oppgaver i perioden" : `${formatPercent(engagement.withoutTasksShare)} av personregisteret`}
        </MiniStat>
        <MiniStat
          label="Verken oppgave eller gruppe"
          value={engagement.withoutTasksOrGroups === null ? "–" : String(engagement.withoutTasksOrGroups.length)}
        >
          ingen gruppe og ingen oppgave i perioden
        </MiniStat>
        <MiniStat label={`${BUSY_FROM} eller flere ${unit.many} i måneden`} value={formatPercent(busy?.share ?? null)}>
          {busy === null ? "–" : `ca. ${busy.people.toLocaleString("nb-NO")} personer i en vanlig måned`}
        </MiniStat>
      </div>

      {bands === null ? (
        <p className="text-xs text-[var(--studio-muted)]">
          {scope === "oppgaver" ? "Ingen samlinger i perioden hadde oppgaver." : "Ingen oppgaver eller gruppesamlinger i perioden."}
        </p>
      ) : (
        <BandBars bands={bands} unit={unit} />
      )}

      {engagement.withoutTasksOrGroups && engagement.withoutTasksOrGroups.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-2">
          <h3 className="text-xs font-bold text-[var(--studio-text)]">Verken oppgave eller gruppe</h3>
          <p className="text-xs leading-relaxed">
            {withoutBoth.slice(0, NAMES_SHOWN).map((person, index) => (
              <React.Fragment key={person.id}>
                {index > 0 && ", "}
                <Link to={`/admin/person/${person.id}`} className={link}>
                  {person.name}
                </Link>
              </React.Fragment>
            ))}
            {withoutBoth.length > NAMES_SHOWN && (
              <span className="text-[var(--studio-muted)]"> og {withoutBoth.length - NAMES_SHOWN} til</span>
            )}
          </p>
        </div>
      )}
    </AnalyticsSection>
  );
};
