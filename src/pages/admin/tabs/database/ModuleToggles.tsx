import React from "react";
import { CalendarDays } from "lucide-react";

interface Props {
  moduleConfig: { kalender: "on" | "off"; meldinger: "on" | "off" };
  onToggleCalendar: () => void;
  onToggleMessages: () => void;
}

interface ModuleCardProps {
  title: string;
  description: string;
  isOn: boolean;
  onToggle: () => void;
  /** Tailwind classes for the badge and the button when the module is on */
  onBadge: string;
  onButton: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, isOn, onToggle, onBadge, onButton }) => (
  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 flex items-center justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-white text-sm">{title}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isOn ? onBadge : "bg-slate-800 text-slate-400"}`}>
          {isOn ? "PÅ" : "AV"}
        </span>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
    </div>

    <button
      type="button"
      onClick={onToggle}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
        isOn ? onButton : "bg-slate-800 hover:bg-slate-700 text-slate-300"
      }`}
    >
      {isOn ? "Slå av" : "Slå på"}
    </button>
  </div>
);

/** Switches for the calendar and message modules. */
export const ModuleToggles: React.FC<Props> = ({ moduleConfig, onToggleCalendar, onToggleMessages }) => (
  <section className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
    <div>
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-emerald-400" />
        <span>Valgfrie tilleggsmoduler</span>
      </h3>
      <p className="text-xs text-slate-400 mt-0.5">Aktiver eller deaktiver tilleggsfunksjoner for menighetsplanleggeren.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
      <ModuleCard
        title="Kalendermodul"
        description="Felles kalenderoversikt for menighetens gudstjenester og aktiviteter."
        isOn={moduleConfig.kalender === "on"}
        onToggle={onToggleCalendar}
        onBadge="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
        onButton="bg-emerald-600 hover:bg-emerald-500 text-white"
      />
      <ModuleCard
        title="Meldingsmodul"
        description="Intern meldingsflyt og kunngjøringer til frivillige team."
        isOn={moduleConfig.meldinger === "on"}
        onToggle={onToggleMessages}
        onBadge="bg-indigo-950/80 text-indigo-400 border border-indigo-800/80"
        onButton="bg-indigo-600 hover:bg-indigo-500 text-white"
      />
    </div>
  </section>
);
