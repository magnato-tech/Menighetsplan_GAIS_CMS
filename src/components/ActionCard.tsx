import React from "react";
import { Link } from "react-router-dom";
import { BadgeVariant } from "../types";

export interface ActionCardProps {
  id?: string;
  title: string;
  subtitle: string;
  dateTime: string;
  groupName: string;
  location?: string;
  statusLabel: string;
  statusVariant?: BadgeVariant;
  primaryButtonText?: string;
  onPrimaryClick?: (e: React.MouseEvent) => void;
  secondaryButtonText?: string;
  onSecondaryClick?: (e: React.MouseEvent) => void;
  detailUrl?: string;
  isMine?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  id,
  title,
  subtitle,
  dateTime,
  groupName,
  location,
  statusLabel,
  statusVariant = "neutral",
  primaryButtonText,
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick,
  detailUrl,
  isMine = false,
}) => {
  // Map badge variant to vibrant palette
  const getBadgeStyle = (variant: BadgeVariant | string = "neutral") => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-600";
      case "urgent":
        return "bg-red-50 text-red-600";
      case "warning":
        return "bg-amber-50 text-amber-600";
      case "info":
        return "bg-emerald-50 text-emerald-700";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  const isUrgent = statusVariant === "urgent";

  return (
    <div
      id={id}
      className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all duration-200 ${
        isUrgent
          ? "ring-2 ring-emerald-400 ring-offset-2"
          : isMine
          ? "border-emerald-100"
          : ""
      }`}
    >
      {/* Top row: Date/Time + Group and Status badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-semibold mb-1 italic tracking-tight ${
              isMine ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {dateTime} {location ? `• ${location}` : ""}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {subtitle} • <span className="text-slate-400 font-normal">{groupName}</span>
          </p>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${getBadgeStyle(
            statusVariant
          )}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Buttons / Actions */}
      <div className="mt-4 pt-1 space-y-2">
        {primaryButtonText && onPrimaryClick && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPrimaryClick(e);
            }}
            className={`w-full font-bold rounded-xl transition-all cursor-pointer active:scale-98 ${
              statusVariant === "success"
                ? "py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs shadow-xs"
                : isUrgent
                ? "py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow-md shadow-emerald-200"
                : "py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm shadow-sm shadow-emerald-100"
            }`}
          >
            {primaryButtonText}
          </button>
        )}

        {detailUrl && (
          <Link
            to={detailUrl}
            className="w-full py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center text-center block"
          >
            Se detaljer
          </Link>
        )}
      </div>
    </div>
  );
};
