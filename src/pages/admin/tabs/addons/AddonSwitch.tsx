import React from "react";

interface AddonSwitchProps {
  on: boolean;
  /** What is switched, for whoever cannot see the card around the switch. */
  label: string;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}

/** A switch that is either on or off. The state is told by position and colour, and to a screen reader by role. */
export const AddonSwitch: React.FC<AddonSwitchProps> = ({ on, label, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--studio-surface)] disabled:opacity-60 disabled:cursor-wait ${
      on ? "bg-emerald-600 border-emerald-600" : "bg-[var(--studio-row)] border-[var(--studio-muted)]"
    }`}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 rounded-full shadow-sm transition-transform ${
        on ? "translate-x-6 bg-white" : "translate-x-1 bg-[var(--studio-muted)]"
      }`}
    />
  </button>
);
