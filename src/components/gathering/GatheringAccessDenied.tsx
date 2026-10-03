import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { UserQuickSwitcherBar } from "../UserSwitcher";
import { studioTabUrl } from "../../pages/admin/studio";

interface Props {
  /** Whether the gathering exists at all, for the wording */
  gatheringFound: boolean;
  canAdminister: boolean;
}

/** Shown instead of the gathering when it is missing or the person has no access to it. */
export const GatheringAccessDenied: React.FC<Props> = ({ gatheringFound, canAdminister }) => (
  <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
    <UserQuickSwitcherBar />
    <div className="p-8 text-center space-y-4">
      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-800">Arrangementet krever leder- eller admin-tilgang</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          {!gatheringFound
            ? "Arrangementet ble ikke funnet."
            : "Du har ikke tilgang til dette arrangementet med din nåværende rolle."}
        </p>
      </div>
      <div className="pt-2 flex flex-col gap-2">
        <Link
          to={canAdminister ? studioTabUrl("planlegger-samlinger") : "/leder?tab=samlinger"}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til {canAdminister ? "Samlinger" : "Samlingsoversikt"}
        </Link>
      </div>
    </div>
  </div>
);
