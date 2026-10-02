import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFirebase } from "../../firebase-service";
import { useCms } from "../../context/CmsContext";
import {
  Users,
  Home,
  Heart,
  Clock,
  ChevronRight,
  Compass,
  Target,
  Sparkles,
  Smile,
  Shield,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { GroupCategory } from "../../types";

export const PublicGroupsPage: React.FC = () => {
  const { groups, allPersons } = useFirebase();
  const { settings } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>("alle");
  const [interestedGroupId, setInterestedGroupId] = useState<string | null>(null);
  const [interestSubmitted, setInterestSubmitted] = useState<string | null>(null);

  // Group categories configuration
  const categoryConfig: Record<
    string,
    { label: string; icon: React.ReactNode; color: string; description: string }
  > = {
    husgruppe: {
      label: "Husfellesskap",
      icon: <Home className="w-4 h-4 text-emerald-600" />,
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
      description: "Mindre fellesskap som samles i hjemmene til et enkelt måltid, bønn og samtaler.",
    },
    interessegruppe: {
      label: "Interessegrupper",
      icon: <Compass className="w-4 h-4 text-amber-600" />,
      color: "bg-amber-50 text-amber-900 border-amber-200",
      description: "Lavterskel grupper rundt felles hobbyer, friluft, turer, kor og sosiale treff.",
    },
    strategigruppe: {
      label: "Strategi & Vekstgrupper",
      icon: <Target className="w-4 h-4 text-purple-600" />,
      color: "bg-purple-50 text-purple-900 border-purple-200",
      description: "Vekstgrupper gjennom Menighetsskolen (Bønn, Kommunikasjon, Historie & identitet).",
    },
    tjenestegruppe: {
      label: "Tjenestegrupper",
      icon: <Heart className="w-4 h-4 text-indigo-600" />,
      color: "bg-indigo-50 text-indigo-900 border-indigo-200",
      description: "Frivillige team som bidrar i gudstjenester, lyd, kirkekaffe og barnekirke.",
    },
  };

  // Filter out internal leadership groups from public fellowship listing (they are shown on /lederskap)
  const publicGroups = useMemo(() => {
    return groups.filter((g) => g.category !== "ledergruppe");
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (selectedCategory === "alle") return publicGroups;
    return publicGroups.filter((g) => g.category === selectedCategory);
  }, [publicGroups, selectedCategory]);

  const handleInterestSubmit = (e: React.FormEvent, groupName: string) => {
    e.preventDefault();
    setInterestSubmitted(groupName);
    setTimeout(() => {
      setInterestedGroupId(null);
      setInterestSubmitted(null);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="space-y-3 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fellesskap & Grupper</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
          Bli med i et fellesskap i {settings.churchName}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl font-medium leading-relaxed">
          Vi har grupper for alle livsfaser og interesser: husfellesskap i hjemmene, vekstgrupper gjennom Menighetsskolen, tjenesteteam og sosiale interessegrupper.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("alle")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "alle"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Alle grupper ({publicGroups.length})
        </button>

        {Object.entries(categoryConfig).map(([key, config]) => {
          const count = publicGroups.filter((g) => g.category === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              <span>{config.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGroups.map((g) => {
          const cat = g.category || "tjenestegruppe";
          const config = categoryConfig[cat] || categoryConfig.tjenestegruppe;
          const leader = allPersons.find((p) => g.leaderIds?.includes(p.id));

          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${config.color}`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </span>

                  {g.meetingSchedule && (
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {g.meetingSchedule.frequency === "hver uke" ? "Hver" : "Annenhver"}{" "}
                      {g.meetingSchedule.weekday?.toLowerCase()} kl. {g.meetingSchedule.time}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-stone-900">{g.name}</h3>

                {g.description && (
                  <p className="text-xs text-stone-600 leading-relaxed">{g.description}</p>
                )}

                {/* Tags */}
                {g.tags && g.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {g.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md"
                      >
                        <Tag className="w-2.5 h-2.5 text-stone-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom footer with Leader & Interest button */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">
                  Leder: <strong className="text-stone-800">{leader?.name || "Menigheten"}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setInterestedGroupId(interestedGroupId === g.id ? null : g.id)}
                  className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>{interestedGroupId === g.id ? "Lukk skjema" : "Meld interesse"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Interest Form */}
              {interestedGroupId === g.id && (
                <form
                  onSubmit={(e) => handleInterestSubmit(e, g.name)}
                  className="mt-3 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs"
                >
                  {interestSubmitted === g.name ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Takk! Gruppelederen vil ta kontakt med deg.</span>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-stone-800">
                        Ønsker du å bli med i {g.name}?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Ditt navn"
                          className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 focus:outline-hidden"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Telefonnummer"
                          className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setInterestedGroupId(null)}
                          className="px-3 py-1 rounded-lg text-stone-600 hover:bg-stone-200"
                        >
                          Avbryt
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          Send henvendelse
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Callout for Menighetsskolen and Growth Groups */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl text-white p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/20 text-purple-200">
            Menighetsskolen
          </span>
          <h3 className="text-2xl font-black tracking-tight">
            Vekstgrupper for menighetens fremtid
          </h3>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed font-normal">
            Gjennom menighetsskolen arbeider vi målrettet med strategiske områder som bønn, kommunikasjon og menighetens historie. Vil du være med å forme veien videre?
          </p>
        </div>
        <Link
          to="/kontakt"
          className="px-5 py-3 rounded-xl bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs shrink-0 text-center transition-all shadow-sm"
        >
          Ta kontakt for å delta
        </Link>
      </div>
    </div>
  );
};
