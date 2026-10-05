import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAdminAnalytics } from "../../../hooks/useAppHooks";
import {
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriodId,
  type CountedGathering,
} from "../../../utils/churchAnalytics";
import { ANALYTICS_MODULES, hiddenModuleCount, isModuleShown, type AnalyticsModuleId } from "../../../utils/analyticsModules";
import type { ShowFeedback, StudioTab } from "../studio";
import { studioSecondaryButton } from "../studioTheme";
import { KeyFigures } from "./analytics/KeyFigures";
import { AttendanceSection } from "./analytics/AttendanceSection";
import { StaffingPerGatheringSection } from "./analytics/StaffingPerGatheringSection";
import { MultiTaskSection } from "./analytics/MultiTaskSection";
import { MonthlyEngagementSection } from "./analytics/MonthlyEngagementSection";
import { PeopleEngagementSection } from "./analytics/PeopleEngagementSection";
import { VolunteerSection } from "./analytics/VolunteerSection";
import { GroupSection } from "./analytics/GroupSection";
import { RegisterAndWebsiteSection } from "./analytics/RegisterAndWebsiteSection";
import { CoverageSection } from "./analytics/CoverageSection";
import { HeadcountDialog } from "./analytics/HeadcountDialog";
import { CustomizeBoardDialog } from "./analytics/CustomizeBoardDialog";

interface AnalyticsTabProps {
  showFeedback: ShowFeedback;
  onTabChange: (tab: StudioTab) => void;
}

/** Analysebord: the life of the congregation in numbers, over a chosen period. */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ showFeedback, onTabChange }) => {
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>(DEFAULT_ANALYTICS_PERIOD);
  const [counting, setCounting] = useState<CountedGathering | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const { analytics, registerHeadcount, removeHeadcount, hiddenModules, setModuleHidden, showAllModules } =
    useAdminAnalytics(periodId);
  const { period } = analytics;

  const shown = (id: AnalyticsModuleId) => isModuleShown(hiddenModules, id);
  const hide = (id: AnalyticsModuleId) => () => {
    const result = setModuleHidden(id, true);
    const title = ANALYTICS_MODULES.find((m) => m.id === id)?.title ?? "Modulen";
    if (result.success) showFeedback(`«${title}» er skjult. Du får den tilbake under Tilpass bordet.`);
  };
  const hiddenCount = hiddenModuleCount(hiddenModules);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--studio-border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--studio-text)] tracking-tight">Analysebord</h1>
          <p className="text-xs sm:text-sm text-[var(--studio-muted)] mt-1 max-w-2xl">
            Menighetens liv i tall: oppmøte, frivillighet, grupper og nettside, sammenlignet med perioden før.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div
            role="group"
            aria-label="Periode"
            className="flex items-center gap-1 p-1 rounded-xl bg-[var(--studio-surface)] border border-[var(--studio-border)]"
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
          <button type="button" onClick={() => setCustomizing(true)} className={`${studioSecondaryButton} py-2 flex items-center gap-1.5`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Tilpass bordet
          </button>
        </div>
      </div>

      {shown("nokkeltall") && <KeyFigures analytics={analytics} />}
      {shown("oppmote") && (
        <AttendanceSection
          period={period}
          attendance={analytics.attendance}
          gatherings={analytics.gatherings}
          onRegister={setCounting}
          onHide={hide("oppmote")}
        />
      )}
      {shown("bemanning") && <StaffingPerGatheringSection period={period} staffing={analytics.fullStaffing} onHide={hide("bemanning")} />}
      {shown("flere-oppgaver") && <MultiTaskSection multiTasks={analytics.multiTasks} onHide={hide("flere-oppgaver")} />}
      {shown("per-maned") && <MonthlyEngagementSection engagement={analytics.engagement} onHide={hide("per-maned")} />}
      {shown("hver-enkelt") && <PeopleEngagementSection engagement={analytics.engagement} onHide={hide("hver-enkelt")} />}
      {shown("frivillighet") && <VolunteerSection period={period} volunteers={analytics.volunteers} onHide={hide("frivillighet")} />}
      {shown("grupper") && <GroupSection period={period} groups={analytics.groups} now={period.to} onHide={hide("grupper")} />}
      {(shown("personregister") || shown("nettside")) && (
        <RegisterAndWebsiteSection
          period={period}
          people={analytics.people}
          content={analytics.content}
          showRegister={shown("personregister")}
          showWebsite={shown("nettside")}
          onHideRegister={hide("personregister")}
          onHideWebsite={hide("nettside")}
        />
      )}
      {shown("datagrunnlag") && (
        <CoverageSection coverage={analytics.coverage} onOpenDatabase={() => onTabChange("database-admin")} onHide={hide("datagrunnlag")} />
      )}

      {hiddenCount > 0 && (
        <p className="text-xs text-[var(--studio-muted)] text-center">
          {hiddenCount} {hiddenCount === 1 ? "modul er skjult" : "moduler er skjult"}.{" "}
          <button type="button" onClick={() => setCustomizing(true)} className="font-bold text-[var(--studio-link)] hover:text-[var(--studio-link-hover)] cursor-pointer">
            Tilpass bordet
          </button>
        </p>
      )}

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
      {customizing && (
        <CustomizeBoardDialog
          hiddenModules={hiddenModules}
          onToggle={(id, hidden) => setModuleHidden(id, hidden)}
          onShowAll={() => showAllModules()}
          onClose={() => setCustomizing(false)}
        />
      )}
    </div>
  );
};
