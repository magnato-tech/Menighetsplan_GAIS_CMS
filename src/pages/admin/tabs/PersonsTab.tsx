import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  CalendarX,
  Database,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { StudioData, ShowFeedback } from "../studio";
import { populateWithMockData } from "../../../services/databaseAdmin";

interface PersonsTabProps {
  studio: StudioData;
  showFeedback?: ShowFeedback;
}

export const PersonsTab: React.FC<PersonsTabProps> = ({ studio, showFeedback }) => {
  const { adminPersons } = studio;
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPopulating, setIsPopulating] = useState<boolean>(false);

  const handlePopulateTestData = async () => {
    if (isPopulating) return;
    setIsPopulating(true);
    try {
      const result = await populateWithMockData();
      if (result.failures.length > 0) {
        showFeedback?.(`Fylling fullført med noen feil: ${result.failures[0].message}`, "error");
      } else {
        showFeedback?.("Databasen er nå fylt med 32 personer for stab, lederskap, pastorer og grupper!");
      }
    } catch (err) {
      showFeedback?.(err instanceof Error ? err.message : "Kunne ikke fylle testdata", "error");
    } finally {
      setIsPopulating(false);
    }
  };

  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) return adminPersons;
    const term = searchTerm.toLowerCase().trim();
    return adminPersons.filter(({ person }) => {
      return (
        person.name.toLowerCase().includes(term) ||
        (person.email && person.email.toLowerCase().includes(term)) ||
        (person.phone && person.phone.includes(term)) ||
        (person.staffRole && person.staffRole.toLowerCase().includes(term)) ||
        (person.publicTitle && person.publicTitle.toLowerCase().includes(term))
      );
    });
  }, [adminPersons, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Personregister</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {adminPersons.length} personer
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administrer kontaktinfo, tilganger og fravær for medlemmer og ledere.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePopulateTestData}
          disabled={isPopulating}
          className="px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
          title="Fyller databasen i Firebase med 32 personer (pastorer, lederskap, stab, frivillige og medlemmer)"
        >
          {isPopulating ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Database className="w-4 h-4 text-indigo-300" />
          )}
          <span>{isPopulating ? "Fyller testdata..." : "Populer testdata (32 personer)"}</span>
        </button>
      </div>

      {adminPersons.length < 5 && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Få et fyldig testmiljø med 32 personer</p>
              <p className="text-slate-300">
                Fyll automatisk inn et komplett register med pastorer, menighetsråd, lovsangsteam, teknikere, barnekirkeledere og medlemmer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePopulateTestData}
            disabled={isPopulating}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0 shadow-sm cursor-pointer"
          >
            {isPopulating ? "Fyller data..." : "Fyll inn 32 personer nå"}
          </button>
        </div>
      )}

      {/* Søk / Filtrer */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Søk etter navn, rolle, stilling eller kontaktinfo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
        />
      </div>

      <div className="space-y-3">
        {filteredPersons.map(({ person }) => {
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
