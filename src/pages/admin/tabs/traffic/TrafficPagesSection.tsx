import React, { useState } from "react";
import { FileText, FileX, LogIn, Unlink } from "lucide-react";
import { formatCount, formatPercent } from "../../../../utils/analyticsFormat";
import { formatSeconds, type TrafficSummary } from "../../../../utils/siteTraffic";
import { studioBadge, studioSecondaryButton } from "../../studioTheme";
import { AnalyticsSection } from "../analytics/AnalyticsSection";

const PAGES_SHOWN = 10;
const ENTRY_PAGES_SHOWN = 5;
const MISSING_SHOWN = 10;

const addressText = "font-mono text-[10px] text-[var(--studio-muted)] break-all";
const emptyNote = "text-xs text-[var(--studio-muted)]";

/** The pages of the website seen from the visits: what is read, what is not, where visits start, and the addresses that lead nowhere. */
export const TrafficPagesSection: React.FC<{ summary: TrafficSummary }> = ({ summary }) => {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? summary.pages : summary.pages.slice(0, PAGES_SHOWN);

  return (
    <div className="space-y-6">
      <AnalyticsSection
        id="traffic-pages"
        title="Mest besøkte sider"
        description="Sidene som er åpnet i perioden, de mest åpnede først."
        icon={<FileText className="w-5 h-5" />}
      >
        {summary.pages.length === 0 ? (
          <p className={emptyNote}>Ingen besøk er telt i perioden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table aria-labelledby="traffic-pages" className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] text-[var(--studio-muted)] border-b border-[var(--studio-border)]">
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Side
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold text-right">
                    Visninger
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold text-right">
                    Andel
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold text-right">
                    Tid per visning
                  </th>
                  <th scope="col" className="py-2 font-bold text-right">
                    Startet her
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.address} className="border-b border-[var(--studio-border)] last:border-0 align-top">
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-[var(--studio-text)]">{row.title}</span>
                        {!row.exists && <span className={studioBadge}>Finnes ikke lenger</span>}
                      </div>
                      {/* A page that is gone is named by its address, so the address is not written twice */}
                      {row.title !== row.address && <div className={addressText}>{row.address}</div>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatCount(row.views)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatPercent(row.share)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">{formatSeconds(row.secondsPerView)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCount(row.entries)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {summary.pages.length > PAGES_SHOWN && (
          <button type="button" onClick={() => setShowAll(!showAll)} className={studioSecondaryButton}>
            {showAll ? "Vis bare de ti første" : `Vis alle ${summary.pages.length} sidene`}
          </button>
        )}
      </AnalyticsSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsSection
          id="traffic-never"
          title="Sider som aldri åpnes"
          description="Publiserte sider ingen har åpnet i perioden. Kanskje de er vanskelige å finne, eller ikke trengs."
          icon={<FileX className="w-5 h-5" />}
        >
          {summary.neverOpened.length === 0 ? (
            <p className={emptyNote}>Alle publiserte sider er åpnet i perioden.</p>
          ) : (
            <ul className="space-y-2">
              {summary.neverOpened.map((page) => (
                <li key={page.address} className="text-xs">
                  <span className="block font-semibold text-[var(--studio-text)]">{page.title}</span>
                  <span className={`block ${addressText}`}>{page.address}</span>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsSection>

        <AnalyticsSection
          id="traffic-entries"
          title="Hvor besøkene starter"
          description="Siden et besøk begynner på. Den bør si hvem dere er og vise veien videre."
          icon={<LogIn className="w-5 h-5" />}
        >
          {summary.entryPages.length === 0 ? (
            <p className={emptyNote}>Ingen besøk er telt i perioden.</p>
          ) : (
            <ul className="space-y-2">
              {summary.entryPages.slice(0, ENTRY_PAGES_SHOWN).map((page) => (
                <li key={page.address} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 font-semibold text-[var(--studio-text)] break-words">{page.title}</span>
                  <span className="shrink-0 tabular-nums text-[var(--studio-muted)]">
                    <span className="font-bold text-[var(--studio-text)]">{formatCount(page.entries)}</span> · {formatPercent(page.share)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsSection>

        <AnalyticsSection
          id="traffic-missing"
          title="Adresser som ikke finnes"
          description="Adresser noen har prøvd å åpne, men som ikke har noen side. Ofte gamle lenker fra søk eller andre nettsteder."
          icon={<Unlink className="w-5 h-5" />}
        >
          {summary.missing.length === 0 ? (
            <p className={emptyNote}>Ingen har havnet på en adresse som ikke finnes.</p>
          ) : (
            <ul className="space-y-2">
              {summary.missing.slice(0, MISSING_SHOWN).map((row) => (
                <li key={row.address} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 font-mono text-[var(--studio-text)] break-all">{row.address}</span>
                  <span className="shrink-0 tabular-nums text-[var(--studio-muted)]">{`${formatCount(row.hits)} forsøk`}</span>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsSection>
      </div>
    </div>
  );
};
