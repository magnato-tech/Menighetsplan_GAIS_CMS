import React, { useState } from "react";
import { BarChart3, Gauge, HandHeart, UsersRound } from "lucide-react";
import { useAdminAnalytics } from "../../../hooks/useAppHooks";
import {
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriodId,
  type CountedGathering,
} from "../../../utils/churchAnalytics";
import { describeChange, formatCount, formatPercent } from "../../../utils/analyticsFormat";
import type { ShowFeedback, StudioTab } from "../studio";
import { KpiTile } from "./analytics/KpiTile";
import { AttendanceSection } from "./analytics/AttendanceSection";
import { VolunteerSection } from "./analytics/VolunteerSection";
import { GroupSection } from "./analytics/GroupSection";
import { RegisterAndWebsiteSection } from "./analytics/RegisterAndWebsiteSection";
import { CoverageSection } from "./analytics/CoverageSection";
import { HeadcountDialog } from "./analytics/HeadcountDialog";

interface AnalyticsTabProps {
  showFeedback: ShowFeedback;
  onTabChange: (tab: StudioTab) => void;
}

/** Analysebord: the life of the congregation in numbers, over a chosen period. */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ showFeedback, onTabChange }) => {
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>(DEFAULT_ANALYTICS_PERIOD);
  const [counting, setCounting] = useState<CountedGathering | null>(null);
  const { analytics, registerHeadcount, removeHeadcount } = useAdminAnalytics(periodId);
  const { period, attendance, volunteers, groups } = analytics;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--studio-border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--studio-text)] tracking-tight">Analysebord</h1>
          <p className="text-xs sm:text-sm text-[var(--studio-muted)] mt-1 max-w-2xl">
            Menighetens liv i tall: oppmøte, frivillighet, grupper og nettside, sammenlignet med perioden før.
          </p>
        </div>
        <div
          role="group"
          aria-label="Periode"
          className="flex items-center gap-1 p-1 rounded-xl bg-[var(--studio-surface)] border border-[var(--studio-border)] self-start lg:self-auto"
        >
          {ANALYTICS_PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={periodId === option.id}
              onClick={() => setPeriodId(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                periodId === option.id ? "bg-indigo-600 text-white shadow-sm" : "text-[var(--studio-muted)] hover:text-[var(--studio-text)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Snitt på gudstjeneste"
          value={formatCount(attendance.averageWorship)}
          icon={<BarChart3 className="w-4 h-4" />}
          change={describeChange(attendance.averageWorship, attendance.previousAverageWorship)}
          previousLabel={period.previousLabel}
        >
          <p>
            Talt på {attendance.worshipCounted} av {attendance.worship.length} gudstjenester
          </p>
          {attendance.averageWorshipChildren !== null && <p>Herav i snitt {attendance.averageWorshipChildren} barn</p>}
        </KpiTile>
        <KpiTile
          label="Aktive frivillige"
          value={String(volunteers.activeVolunteers)}
          icon={<HandHeart className="w-4 h-4" />}
          change={
            volunteers.previousFillRate !== null
              ? describeChange(volunteers.activeVolunteers, volunteers.previousActiveVolunteers)
              : null
          }
          previousLabel={period.previousLabel}
        >
          <p>{formatPercent(volunteers.shareOfRegister)} av personregisteret har stått på</p>
        </KpiTile>
        <KpiTile
          label="Bemanningsgrad"
          value={formatPercent(volunteers.fillRate)}
          icon={<Gauge className="w-4 h-4" />}
          change={describeChange(volunteers.fillRate, volunteers.previousFillRate, "rate")}
          previousLabel={period.previousLabel}
        >
          <p>
            {volunteers.slotsFilled} av {volunteers.slotsNeeded} plasser bekreftet
          </p>
        </KpiTile>
        <KpiTile label="Med i en gruppe" value={formatPercent(groups.belongingRate)} icon={<UsersRound className="w-4 h-4" />}>
          <p>
            {groups.personsInGroups} personer i minst én gruppe, {groups.withoutGroup.length} uten
          </p>
        </KpiTile>
      </div>

      <AttendanceSection period={period} attendance={attendance} gatherings={analytics.gatherings} onRegister={setCounting} />
      <VolunteerSection period={period} volunteers={volunteers} />
      <GroupSection period={period} groups={groups} now={period.to} />
      <RegisterAndWebsiteSection period={period} people={analytics.people} content={analytics.content} />
      <CoverageSection coverage={analytics.coverage} onOpenDatabase={() => onTabChange("database-admin")} />

      {counting && (
        <HeadcountDialog
          gathering={counting.gathering}
          existing={counting.headcount}
          onSave={registerHeadcount}
          onRemove={removeHeadcount}
          onClose={() => setCounting(null)}
          showFeedback={showFeedback}
        />
      )}
    </div>
  );
};
