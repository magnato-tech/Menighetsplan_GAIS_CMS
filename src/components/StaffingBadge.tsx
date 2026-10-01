import React from "react";
import { StaffingColor } from "../hooks/useAppHooks";

interface StaffingBadgeProps {
  color: StaffingColor;
  statusText: string;
  className?: string;
  showDot?: boolean;
}

export const StaffingBadge: React.FC<StaffingBadgeProps> = ({
  color,
  statusText,
  className = "",
  showDot = true,
}) => {
  const colorStyles = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-amber-50 text-amber-800 border-amber-200",
  }[color];

  const dotColors = {
    green: "bg-emerald-500",
    red: "bg-red-500",
    yellow: "bg-amber-500",
  }[color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${colorStyles} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{statusText}</span>
    </span>
  );
};
