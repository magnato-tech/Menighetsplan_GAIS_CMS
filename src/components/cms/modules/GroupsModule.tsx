import React from "react";
import { Link } from "react-router-dom";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";
import {
  groupsFieldsFromPresentation,
  MODULE_PRESENTATION_DEFAULTS,
  ModulePresentationConfig,
} from "../../../utils/modulePresentation";
import { GroupsModuleFields } from "../../../utils/cmsBlocks";

export interface GroupsModuleProps {
  variant?: "banner" | "cards";
  presentation?: ModulePresentationConfig;
  /** @deprecated use presentation */
  fields?: GroupsModuleFields;
}

function BannerBackground({
  fields,
  children,
}: {
  fields: GroupsModuleFields;
  children: React.ReactNode;
}) {
  const image = fields.backgroundImage.trim();
  const color = fields.backgroundColor.trim();
  const useThemeGradient = !image && !color;

  return (
    <div className="rounded-3xl shadow-xl relative overflow-hidden text-white">
      {image && (
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: color ? `${color}cc` : "rgba(28, 25, 23, 0.72)",
            }}
          />
        </>
      )}
      <div
        className={`relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 ${
          useThemeGradient ? "bg-gradient-to-br from-primary-900 to-primary-800" : ""
        }`}
        style={!useThemeGradient && !image && color ? { backgroundColor: color } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export const GroupsModule: React.FC<GroupsModuleProps> = ({
  variant = "banner",
  presentation,
  fields,
}) => {
  const resolvedFields =
    fields ||
    groupsFieldsFromPresentation(presentation || MODULE_PRESENTATION_DEFAULTS["module-groups"]);
  if (variant === "cards") {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">{resolvedFields.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{resolvedFields.body}</p>
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

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
      <BannerBackground fields={resolvedFields}>
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>{resolvedFields.badge}</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            {resolvedFields.title}
          </h3>
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal">
            {resolvedFields.body}
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-200">
            {resolvedFields.highlights.map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent-300" />
                <span>{item}</span>
              </div>
            ))}
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
      </BannerBackground>
    </section>
  );
};
