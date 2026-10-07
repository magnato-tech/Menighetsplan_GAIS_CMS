import React from "react";
import { MousePointerClick } from "lucide-react";
import { formatCount } from "../../../../utils/analyticsFormat";
import { countOf, type TrafficSummary } from "../../../../utils/siteTraffic";
import { AnalyticsSection, MiniStat } from "../analytics/AnalyticsSection";

const SHOWN = 5;

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** What visitors do beyond reading: presses on the contact details and the calendar, plus the news and sermons they open most. */
export const TrafficActionsSection: React.FC<{ summary: TrafficSummary }> = ({ summary }) => {
  // The period reads "forrige 4 uker" in a sentence and starts a line here
  const previousLabel = capitalized(summary.period.previousLabel);

  return (
    <AnalyticsSection
      id="traffic-actions"
      title="Fører besøket til noe?"
      description="Det besøkende gjør på nettsiden utover å lese."
      icon={<MousePointerClick className="w-5 h-5" />}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.actions.map((action) => (
          <MiniStat key={action.id} label={action.label} value={formatCount(action.count)}>
            {action.previous !== null && `${previousLabel}: ${formatCount(action.previous)}`}
          </MiniStat>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-2">
          <h3 className="text-xs font-bold text-[var(--studio-text)]">Mest leste nyheter</h3>
          {summary.news.length === 0 ? (
            <p className="text-xs text-[var(--studio-muted)]">Ingen nyheter er åpnet i perioden.</p>
          ) : (
            <ul className="space-y-1.5">
              {summary.news.slice(0, SHOWN).map((article) => (
                <li key={article.address} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 font-semibold text-[var(--studio-text)] break-words">{article.title}</span>
                  <span className="shrink-0 tabular-nums text-[var(--studio-muted)]">{countOf(article.views, "visning", "visninger")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-2">
          <h3 className="text-xs font-bold text-[var(--studio-text)]">Mest avspilte taler</h3>
          {summary.sermons.length === 0 ? (
            <p className="text-xs text-[var(--studio-muted)]">Ingen taler er spilt av i perioden.</p>
          ) : (
            <ul className="space-y-1.5">
              {summary.sermons.slice(0, SHOWN).map((sermon) => (
                <li key={sermon.id} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 font-semibold text-[var(--studio-text)] break-words">{sermon.title}</span>
                  <span className="shrink-0 tabular-nums text-[var(--studio-muted)]">{countOf(sermon.plays, "avspilling", "avspillinger")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AnalyticsSection>
  );
};
