import React from "react";
import { Eye, Layers, LogOut, Timer, Users } from "lucide-react";
import { describeChange, formatCount, formatPercent } from "../../../../utils/analyticsFormat";
import {
  describeDecimalChange,
  describeSecondsChange,
  formatPerVisit,
  formatSeconds,
  formatTrafficDate,
  type TrafficSummary,
} from "../../../../utils/siteTraffic";
import { KpiTile } from "../analytics/KpiTile";

/** The five key figures at the top of the board over visits. */
export const TrafficKeyFigures: React.FC<{ summary: TrafficSummary }> = ({ summary }) => {
  const { period, totals, previous, daysWithCounts, countingSince } = summary;
  const previousLabel = period.previousLabel;

  return (
    <section aria-labelledby="traffic-key-figures" className="space-y-3">
      <h2 id="traffic-key-figures" className="sr-only">
        Nøkkeltall
      </h2>
      {/* Five tiles with a figure as big as these need room, so they only go five across on a wide screen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <KpiTile
          label="Besøk"
          value={formatCount(totals.visits)}
          icon={<Users className="w-4 h-4" />}
          change={describeChange(totals.visits, previous?.visits ?? null)}
          previousLabel={previousLabel}
        />
        <KpiTile
          label="Sidevisninger"
          value={formatCount(totals.views)}
          icon={<Eye className="w-4 h-4" />}
          change={describeChange(totals.views, previous?.views ?? null)}
          previousLabel={previousLabel}
        />
        <KpiTile
          label="Sider per besøk"
          value={formatPerVisit(totals.pagesPerVisit)}
          icon={<Layers className="w-4 h-4" />}
          change={describeDecimalChange(totals.pagesPerVisit, previous?.pagesPerVisit ?? null)}
          previousLabel={previousLabel}
        />
        <KpiTile
          label="Tid per besøk"
          value={formatSeconds(totals.secondsPerVisit)}
          icon={<Timer className="w-4 h-4" />}
          change={describeSecondsChange(totals.secondsPerVisit, previous?.secondsPerVisit ?? null)}
          previousLabel={previousLabel}
        />
        <KpiTile
          label="Besøk med bare én side"
          value={formatPercent(totals.singlePageShare)}
          icon={<LogOut className="w-4 h-4" />}
          change={describeChange(totals.singlePageShare, previous?.singlePageShare ?? null, "rate")}
          previousLabel={previousLabel}
          // A visitor who leaves after one page is a visitor lost, so a fall in this share is the good news
          upIsGood={false}
        />
      </div>
      {/* The date already ends in a full stop, so the sentence needs none of its own */}
      {countingSince !== null && daysWithCounts < period.days && (
        <p className="text-[11px] text-[var(--studio-muted)]">
          {`Tall fra ${daysWithCounts} av ${period.days} dager. Tellingen startet ${formatTrafficDate(countingSince)}`}
        </p>
      )}
    </section>
  );
};
