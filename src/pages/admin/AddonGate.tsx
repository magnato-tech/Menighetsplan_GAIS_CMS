import React from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import { isAddonOn } from "../../utils/addons";
import { addonOfTab, moduleName } from "./addons";
import { studioTabUrl, type StudioTab } from "./studio";
import { studioCard, studioPrimaryButton } from "./studioTheme";

interface AddonGateProps {
  tab: StudioTab;
  children: React.ReactNode;
}

/**
 * Lets a tab through unless it belongs to an add-on that is off. The menu does not lead to such
 * a tab, but an old link or a typed address can, and an add-on can be turned off by someone else
 * while the tab is open. The tab is then not drawn at all, so nothing in it reads or counts.
 */
export const AddonGate: React.FC<AddonGateProps> = ({ tab, children }) => {
  const { addons, addonsState } = useCms();
  const addon = addonOfTab(tab);
  if (!addon || isAddonOn(addons, addon.id)) return <>{children}</>;

  // Until the database has answered, off is only a guess. Saying "not turned on" would be wrong half the time.
  if (addonsState === "loading") return <p className="text-sm text-[var(--studio-muted)] p-2">Laster fane…</p>;

  const Icon = addon.icon;
  return (
    <div className={`${studioCard} max-w-xl mx-auto mt-8 p-8 text-center space-y-4`}>
      <span
        aria-hidden="true"
        className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--studio-row)] border border-[var(--studio-border)] text-[var(--studio-icon)]"
      >
        <Icon className="w-6 h-6" />
      </span>
      <h1 className="text-lg font-black text-[var(--studio-text)]">{addon.name} er ikke slått på</h1>
      <p className="text-xs text-[var(--studio-muted)]">
        {addon.name} er en modul dere slår på når dere trenger den. Da får den sin plass i menyen under {moduleName(addon.module)}.
      </p>
      <Link to={studioTabUrl("moduler")} className={`${studioPrimaryButton} inline-flex items-center px-4 py-2 text-xs`}>
        Åpne Moduler
      </Link>
    </div>
  );
};
