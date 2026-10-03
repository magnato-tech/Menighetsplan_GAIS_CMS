import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  /** A main tab, or a sub-page (a little smaller, with its own wording) */
  level: "top" | "sub";
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
}

const LOOK = {
  top: {
    disabled: "text-slate-600 cursor-not-allowed",
    enabled: "text-slate-400 hover:text-indigo-300 hover:bg-slate-700 cursor-pointer",
    icon: "w-3.5 h-3.5",
    upTitle: "Flytt opp i menyen",
    downTitle: "Flytt ned i menyen",
    upLabel: "Flytt opp",
    downLabel: "Flytt ned",
  },
  sub: {
    disabled: "text-slate-700 cursor-not-allowed",
    enabled: "text-slate-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer",
    icon: "w-3 h-3",
    upTitle: "Flytt underfane opp",
    downTitle: "Flytt underfane ned",
    upLabel: "Flytt underfane opp",
    downLabel: "Flytt underfane ned",
  },
};

/** Arrows that move a page one place up or down, for keyboard and touch where dragging is awkward. */
export const MoveStepButtons: React.FC<Props> = ({ level, isFirst, isLast, onMove }) => {
  const look = LOOK[level];
  return (
    <div className="flex flex-col gap-0.5 shrink-0">
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onMove("up")}
        className={`p-0.5 rounded transition-colors ${isFirst ? look.disabled : look.enabled}`}
        title={look.upTitle}
        aria-label={look.upLabel}
      >
        <ChevronUp className={look.icon} />
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onMove("down")}
        className={`p-0.5 rounded transition-colors ${isLast ? look.disabled : look.enabled}`}
        title={look.downTitle}
        aria-label={look.downLabel}
      >
        <ChevronDown className={look.icon} />
      </button>
    </div>
  );
};
