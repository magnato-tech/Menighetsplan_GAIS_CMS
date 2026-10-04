import React from "react";
import { useCms } from "../../../context/CmsContext";
import { Heart } from "lucide-react";

export interface GivingModuleProps {
  variant?: "card" | "vipps";
}

export const GivingModule: React.FC<GivingModuleProps> = ({
  variant = "card",
}) => {
  const { settings } = useCms();

  if (variant === "vipps") {
    return (
      <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-10 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
            <Heart className="w-3 h-3" />
            <span>Vipps til menigheten</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-accent-700 font-mono">
            {settings.vippsNumber}
          </div>
          <p className="text-xs text-stone-500">
            Takk for din gave til arbeidet i {settings.churchName}!
          </p>
        </div>
      </section>
    );
  }

  // Standard "card" variant
  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 my-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
        <Heart className="w-3.5 h-3.5" />
        <span>Givertjeneste & Støtte</span>
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
        Støtt menighetens arbeid
      </h3>
      <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
        Arbeidet drives utelukkende av frivillige gaver fra medlemmer og støttespillere. Din gave gjør barnekirke, ungdomsarbeid og diakonalt arbeid mulig.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <div className="px-6 py-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-4 w-full sm:w-auto justify-center">
          <div className="text-left">
            <div className="text-xs text-stone-500 font-medium">Vipps til nummer</div>
            <div className="text-xl font-black text-accent-700">{settings.vippsNumber}</div>
          </div>
        </div>

        <div className="px-6 py-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-4 w-full sm:w-auto justify-center">
          <div className="text-left">
            <div className="text-xs text-stone-500 font-medium">Bankkonto for gaver</div>
            <div className="text-base font-mono font-bold text-stone-800">{settings.bankAccount}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
