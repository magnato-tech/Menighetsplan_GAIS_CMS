import React from "react";
import { Link } from "react-router-dom";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";

export interface GroupsModuleProps {
  variant?: "banner" | "cards";
}

export const GroupsModule: React.FC<GroupsModuleProps> = ({
  variant = "banner",
}) => {
  if (variant === "cards") {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Bli med i et husfellesskap</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                I husfellesskapene våre samles vi i hjemmene til et enkelt måltid, bønn og gode samtaler om tro og hverdag.
              </p>
            </div>
            <Link
              to="/fellesskap"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 hover:text-primary-900"
            >
              <span>Finn en gruppe som passer deg</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-accent-800" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Lurer du på noe?</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ta kontakt med en av gruppelederne eller pastoren for en uforpliktende prat om tilbudet.
              </p>
            </div>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-950"
            >
              <span>Snakk med en leder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Standard "banner" variant
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-3xl text-white p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Nære fellesskap</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Bli med i et husfellesskap
          </h3>
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal">
            Tro og liv deles best sammen med andre. I husfellesskapene våre samles vi i hjemmene til et enkelt måltid, bønn og gode samtaler om hverdagen.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-300" />
              <span>Grupper for alle aldre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-300" />
              <span>Annenhver uke</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-300" />
              <span>Uforpliktende å prøve</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
          <Link
            to="/fellesskap"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm text-center shadow transition-all"
          >
            Finn en gruppe
          </Link>
          <Link
            to="/kontakt"
            className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm text-center border border-white/20 transition-all"
          >
            Snakk med en leder
          </Link>
        </div>
      </div>
    </section>
  );
};
