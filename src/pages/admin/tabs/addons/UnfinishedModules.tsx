import React from "react";
import { useModuleConfig } from "../../../../hooks/useAppHooks";
import { studioCard } from "../../studioTheme";
import { AddonSwitch } from "./AddonSwitch";

/**
 * Kalender and Meldinger: two switches from before the add-ons, kept as they were. They are
 * remembered in this browser only (see FirebaseDataContext) and switch no content yet, and the
 * page says so rather than letting them pass for add-ons that work.
 */
export const UnfinishedModules: React.FC = () => {
  const { isKalenderOn, isMeldingerOn, setModuleStatus } = useModuleConfig();

  const rows = [
    {
      id: "kalender" as const,
      name: "Kalender",
      text: "Felles kalenderoversikt for menighetens gudstjenester og aktiviteter.",
      on: isKalenderOn,
    },
    {
      id: "meldinger" as const,
      name: "Meldinger",
      text: "Intern meldingsflyt og kunngjøringer til frivillige team.",
      on: isMeldingerOn,
    },
  ];

  return (
    <section aria-label="Moduler under arbeid" className="space-y-3">
      <h2 className="text-[11px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Under arbeid</h2>
      <div className={`${studioCard} p-4 space-y-3`}>
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="p-3 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--studio-text)]">{row.name}</p>
                <p className="text-[11px] text-[var(--studio-muted)] mt-0.5">{row.text}</p>
              </div>
              <AddonSwitch on={row.on} label={row.name} onChange={(on) => setModuleStatus(row.id, on ? "on" : "off")} />
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-[var(--studio-muted)]">
          Disse to er ikke ferdige. Bryterne gjelder bare denne nettleseren og styrer foreløpig ikke noe innhold.
        </p>
      </div>
    </section>
  );
};
