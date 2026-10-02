import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  CalendarX,
} from "lucide-react";
import { StudioData } from "../studio";

interface PersonsTabProps {
  studio: StudioData;
}

export const PersonsTab: React.FC<PersonsTabProps> = ({ studio }) => {
  const { adminPersons } = studio;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white">Personregister & Roller</h2>
        <p className="text-xs text-slate-400">
          Administrer roller, kontaktinfo og tilganger for medlemmer og ledere.
        </p>
      </div>

      <div className="space-y-3">
        {adminPersons.map((person) => {
          const isAdminRole = person.globalRole === "admin";
          const hasPoliceCert = Boolean(person.policeCertificateValidUntil);
          const unavailableCount = person.unavailablePeriods?.length || 0;

          return (
            <div
              key={person.id}
              className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white text-base">{person.name}</h3>
                  {isAdminRole ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
                      Administrator (Co-Admin)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-indigo-300">
                      Frivillig / Medlem
                    </span>
                  )}

                  {hasPoliceCert ? (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      Politiattest OK
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Shield className="w-3 h-3 text-slate-600" />
                      Ingen attest
                    </span>
                  )}

                  {unavailableCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <CalendarX className="w-3 h-3 text-amber-400" />
                      {unavailableCount} fraværsperiode(r)
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                  {person.phone && <span>Tlf: {person.phone}</span>}
                  {person.email && <span>E-post: {person.email}</span>}
                </div>
              </div>

              <Link
                to={`/admin/person/${person.id}`}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold shrink-0"
              >
                Rediger person & fravær
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
