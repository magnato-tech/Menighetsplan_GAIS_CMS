import React, { useState } from "react";
import { AlertTriangle, BarChart3, Download, Plus, Star, Table } from "lucide-react";
import type { AnalyticsPeriod, AttendanceSummary, CountedGathering, GatheringSummary } from "../../../../utils/churchAnalytics";
import { headcountCsv } from "../../../../utils/churchAnalytics";
import { formatNorwegianDateTime } from "../../../../utils/dates";
import { AnalyticsSection } from "./AnalyticsSection";
import { AttendanceChart, AttendanceLegend } from "./AttendanceChart";
import { studioSecondaryButton } from "../../studioTheme";

interface AttendanceSectionProps {
  period: AnalyticsPeriod;
  attendance: AttendanceSummary;
  gatherings: GatheringSummary;
  onRegister: (row: CountedGathering) => void;
  onHide: () => void;
}

type Scope = "gudstjenester" | "alle";

/** Offers the counted gatherings as a spreadsheet file. */
function downloadCsv(rows: CountedGathering[], period: AnalyticsPeriod) {
  // The byte order mark makes spreadsheet programs read æ, ø and å correctly
  const blob = new Blob(["﻿" + headcountCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oppmote-${period.label.toLowerCase().replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const scopeButton = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
    active ? "bg-indigo-600 text-white" : "text-[var(--studio-muted)] hover:text-[var(--studio-text)]"
  }`;

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({ period, attendance, gatherings, onRegister, onHide }) => {
  const [scope, setScope] = useState<Scope>("gudstjenester");
  const [view, setView] = useState<"diagram" | "tabell">("diagram");
  const rows = scope === "gudstjenester" ? attendance.worship : attendance.gatherings;
  const scopeAverage = scope === "gudstjenester" ? attendance.averageWorship : attendance.averageAll;

  return (
    <AnalyticsSection
      id="analyse-oppmote"
      title="Oppmøte"
      description="Hvor mange som var til stede, slik det er talt og registrert etter hver samling. Trykk på en søyle for å registrere eller rette et tall."
      icon={<BarChart3 className="w-5 h-5" />}
      onHide={onHide}
      actions={
        <>
          <div role="group" aria-label="Hvilke samlinger" className="flex items-center gap-1 p-1 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)]">
            <button type="button" aria-pressed={scope === "gudstjenester"} onClick={() => setScope("gudstjenester")} className={scopeButton(scope === "gudstjenester")}>
              Gudstjenester
            </button>
            <button type="button" aria-pressed={scope === "alle"} onClick={() => setScope("alle")} className={scopeButton(scope === "alle")}>
              Alle arrangementer
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView(view === "diagram" ? "tabell" : "diagram")}
            className={`${studioSecondaryButton} flex items-center gap-1.5`}
          >
            {view === "diagram" ? <Table className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
            {view === "diagram" ? "Vis som tabell" : "Vis som diagram"}
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(attendance.gatherings, period)}
            disabled={attendance.gatherings.length === 0}
            className={`${studioSecondaryButton} flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-3.5 h-3.5" />
            Last ned CSV
          </button>
        </>
      }
    >
      <p className="text-xs text-[var(--studio-muted)]">
        {period.label}: {gatherings.held} samlinger holdt ({gatherings.worship} gudstjenester, {gatherings.otherEvents} andre
        arrangementer, {gatherings.groupMeetings} gruppesamlinger)
        {gatherings.cancelled > 0 ? ` · ${gatherings.cancelled} avlyst` : ""} · {gatherings.upcoming} planlagt de neste fire ukene.
      </p>

      {view === "diagram" ? (
        <div className="space-y-3">
          <AttendanceLegend />
          <AttendanceChart rows={rows} average={scopeAverage} onSelect={onRegister} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">Oppmøte per samling</caption>
            <thead>
              <tr className="text-left text-[11px] text-[var(--studio-muted)] border-b border-[var(--studio-border)]">
                <th className="py-2 pr-3 font-bold">Dato</th>
                <th className="py-2 pr-3 font-bold">Samling</th>
                <th className="py-2 pr-3 font-bold text-right">Voksne</th>
                <th className="py-2 pr-3 font-bold text-right">Barn</th>
                <th className="py-2 pr-3 font-bold text-right">Totalt</th>
                <th className="py-2 font-bold sr-only">Handling</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-[var(--studio-muted)]">
                    Ingen samlinger i perioden.
                  </td>
                </tr>
              )}
              {[...rows].reverse().map((row) => (
                <tr key={row.gathering.id} className="border-b border-[var(--studio-border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--studio-muted)] whitespace-nowrap">{formatNorwegianDateTime(row.gathering.startsAt)}</td>
                  <td className="py-2 pr-3 text-[var(--studio-text)] font-semibold">{row.gathering.title}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.headcount?.adults ?? "–"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.headcount?.children ?? "–"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-bold">{row.total ?? "Ikke registrert"}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => onRegister(row)} className="text-[11px] font-bold text-[var(--studio-link)] hover:text-[var(--studio-link-hover)] cursor-pointer">
                      {row.headcount ? "Endre" : "Registrer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {attendance.missing.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--studio-text)]">
            <AlertTriangle className="w-4 h-4 text-[var(--studio-warn)]" aria-hidden="true" />
            <span>
              Mangler oppmøtetall: {attendance.missing.length} {attendance.missing.length === 1 ? "samling" : "samlinger"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {attendance.missing.slice(0, 6).map((row) => (
              <li key={row.gathering.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-[var(--studio-text)]">{row.gathering.title}</span>
                  <span className="text-[var(--studio-muted)]"> · {formatNorwegianDateTime(row.gathering.startsAt)}</span>
                </span>
                <button type="button" onClick={() => onRegister(row)} className={`${studioSecondaryButton} flex items-center gap-1 shrink-0`}>
                  <Plus className="w-3.5 h-3.5" /> Registrer
                </button>
              </li>
            ))}
          </ul>
          {attendance.missing.length > 6 && (
            <p className="text-[11px] text-[var(--studio-muted)]">
              Og {attendance.missing.length - 6} til. Velg Alle arrangementer og Vis som tabell for å se alle.
            </p>
          )}
        </div>
      )}

      {attendance.highestWorship && (
        <p className="text-[11px] text-[var(--studio-muted)] flex items-center gap-1.5">
          <Star className="w-3 h-3" aria-hidden="true" />
          Best besøkt: {attendance.highestWorship.gathering.title}, {formatNorwegianDateTime(attendance.highestWorship.gathering.startsAt)}, med{" "}
          {attendance.highestWorship.total} til stede. Totalt talt i perioden: {attendance.totalCounted}.
        </p>
      )}
    </AnalyticsSection>
  );
};
