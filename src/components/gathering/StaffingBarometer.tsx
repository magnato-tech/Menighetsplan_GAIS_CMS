import React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { StaffingSummary } from "../../utils/gatheringView";

interface Props {
  summary: StaffingSummary;
  /** The own group, shown with its share when the page is not the admin look */
  myGroup?: { name: string };
}

const TONE = {
  red: { box: "bg-red-50/80 border-red-200 text-red-900", pill: "bg-red-200/80 text-red-900" },
  green: { box: "bg-emerald-50/80 border-emerald-200 text-emerald-900", pill: "bg-emerald-200/80 text-emerald-900" },
  amber: { box: "bg-amber-50/80 border-amber-200 text-amber-900", pill: "bg-amber-200/80 text-amber-900" },
};

/** How well the gathering is staffed: red when something needs follow-up, green when all is covered. */
export const StaffingBarometer: React.FC<Props> = ({ summary, myGroup }) => {
  const { tone, headline, covered, total, myGroupCovered, myGroupTotal } = summary;
  const Icon = tone === "red" ? ShieldAlert : tone === "green" ? ShieldCheck : AlertTriangle;
  const iconColor = tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-600" : "text-amber-600";

  return (
    <div
      id="gathering-staffing-barometer"
      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${TONE[tone].box}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <span className="font-bold block truncate">{headline}</span>
          <span className="text-[11px] opacity-80 block truncate">
            Total dekning: {covered} av {total} oppgaver dekket
            {myGroup && ` • Min gruppe (${myGroup.name}): ${myGroupCovered}/${myGroupTotal}`}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 font-bold text-xs">
        <span className={`px-2 py-0.5 rounded-full ${TONE[tone].pill}`}>
          {covered}/{total}
        </span>
      </div>
    </div>
  );
};
