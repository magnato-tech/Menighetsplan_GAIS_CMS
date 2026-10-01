import React, { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMockData } from "../context/MockDataContext";
import { useCms } from "../context/CmsContext";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  Heart,
  Users,
  Compass,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Home,
  ArrowLeft,
  Settings,
  Info,
  Phone,
  Mail,
  Share2,
} from "lucide-react";

export const PublicWebsitePage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { gatherings, groups } = useMockData();
  const { pages, overrides, getPageBySlug } = useCms();

  const filterVisning = searchParams.get("visning") || "alle"; // 'alle' | 'gudstjenester'

  // Current subpage if any
  const activePage = slug ? getPageBySlug(slug) : null;

  // Recurring events derived from groups meetingSchedule
  const recurringEvents = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      schedule: string;
      category: string;
      description: string;
    }> = [
      {
        id: "rec-1",
        title: "Søndagsgudstjeneste & barnekirke",
        schedule: "Hver søndag kl. 11:00",
        category: "Gudstjeneste",
        description: "Felles gudstjeneste for hele storfamilien med Sprell Levende søndagsskole og kirkekaffe.",
      },
      {
        id: "rec-2",
        title: "Ungdomskveld & kafé",
        schedule: "Annenhver fredag kl. 19:00",
        category: "Ungdom",
        description: "Sosialt samvær, bordtennis, kiosk, lovsang og fellesskap for ungdom.",
      },
    ];

    groups.forEach((g) => {
      if (g.meetingSchedule && g.meetingSchedule.weekday) {
        list.push({
          id: `rec-group-${g.id}`,
          title: g.name,
          schedule: `${g.meetingSchedule.frequency === "hver uke" ? "Hver" : "Annenhver"} ${g.meetingSchedule.weekday.toLowerCase()} kl. ${g.meetingSchedule.time}`,
          category: g.category === "husgruppe" ? "Husfellesskap" : "Gruppe",
          description: g.category === "husgruppe"
            ? "Mindre fellesskap som møtes i hjemmene til bibelsamtale, bønn og kveldsmat."
            : `Faste samlinger for ${g.name}.`,
        });
      }
    });

    return list;
  }, [groups]);

  // Process gatherings
  const processedGatherings = useMemo(() => {
    return gatherings
      .filter((g) => {
        const override = overrides[g.id];
        // Hidden check
        if (override?.hidden) return false;
        // Public check
        if (g.isPublic === false) return false;
        return true;
      })
      .map((g) => {
        const override = overrides[g.id];
        const isFeatured = Boolean(override?.featured);
        const title = g.title || "Samling";
        const isWorship = Boolean(
          g.isGudstjeneste ||
          g.type === "arrangement" && title.toLowerCase().includes("gudstjeneste")
        );
        const isCancelled = Boolean(g.cancelled);

        const categories: string[] = [];
        if (isWorship) categories.push("Gudstjeneste");
        if (title.toLowerCase().includes("ungdom")) categories.push("Ungdom");
        if (title.toLowerCase().includes("barn") || title.toLowerCase().includes("familie")) categories.push("Barn & unge");
        if (title.toLowerCase().includes("kaffe") || title.toLowerCase().includes("lunsj") || title.toLowerCase().includes("måltid")) categories.push("Fellesskap");
        if (categories.length === 0) categories.push("Arrangement");

        return {
          ...g,
          isFeatured,
          isWorship,
          isCancelled,
          categories,
          startDate: new Date(g.startsAt),
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [gatherings, overrides]);

  // Next worship service
  const nextWorship = useMemo(() => {
    const now = new Date();
    return processedGatherings.find(
      (g) => g.isWorship && !g.isCancelled && g.startDate >= now
    ) || processedGatherings.find((g) => g.isWorship && !g.isCancelled);
  }, [processedGatherings]);

  // Featured gatherings (Overrides ?visning filter as agreed with PO)
  const featuredGatherings = useMemo(() => {
    return processedGatherings.filter((g) => g.isFeatured);
  }, [processedGatherings]);

  // This week (next 7 days)
  const thisWeekGatherings = useMemo(() => {
    const now = new Date();
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return processedGatherings.filter(
      (g) => g.startDate >= now && g.startDate <= sevenDaysAhead
    );
  }, [processedGatherings]);

  // Filtered upcoming list
  const filteredGatherings = useMemo(() => {
    return processedGatherings.filter((g) => {
      if (filterVisning === "gudstjenester") {
        return g.isWorship;
      }
      return true;
    });
  }, [processedGatherings, filterVisning]);

  // Group by month
  const monthlyGatherings = useMemo(() => {
    const groups: Record<string, typeof filteredGatherings> = {};
    filteredGatherings.forEach((g) => {
      const monthYear = g.startDate.toLocaleDateString("no-NO", {
        month: "long",
        year: "numeric",
      });
      const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      if (!groups[capitalized]) groups[capitalized] = [];
      groups[capitalized].push(g);
    });
    return groups;
  }, [filteredGatherings]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans">
      {/* Top Admin / Preview Banner */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Offentlig visning</span>
            <span className="text-stone-400 hidden sm:inline">
              – Kilde: Menighetsplan & menighetsplan_ClaudeCMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/cms"
              className="text-stone-300 hover:text-white flex items-center gap-1 font-medium underline underline-offset-2"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Rediger i CMS</span>
            </Link>
            <span className="text-stone-700">|</span>
            <Link
              to="/"
              className="text-stone-300 hover:text-white flex items-center gap-1 font-medium underline underline-offset-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tilbake til Menighetsplan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Church Header Navigation */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link to="/nettside" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm group-hover:scale-105 transition-transform">
              †
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                Lillesand Misjonskirke
              </h1>
              <p className="text-xs text-stone-500">
                lillesandmisjonskirke.no – Et åpent og varmt hjem for alle
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Link
              to="/nettside"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                !slug
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              Forside
            </Link>
            {pages
              .filter((p) => p.isPublished)
              .map((p) => {
                const isActive = slug === p.slug;
                return (
                  <Link
                    key={p.id}
                    to={`/nettside/${p.slug}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    }`}
                  >
                    {p.title}
                  </Link>
                );
              })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-12">
        {/* SUBPAGE VIEW (if slug is present) */}
        {activePage ? (
          <article className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-6">
            <div className="space-y-2 border-b border-stone-100 pb-6">
              <Link
                to="/nettside"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Tilbake til forsiden
              </Link>
              <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight pt-2">
                {activePage.title}
              </h2>
              {activePage.summary && (
                <p className="text-base text-stone-600 font-medium leading-relaxed">
                  {activePage.summary}
                </p>
              )}
            </div>

            {/* Markdown-style content rendering */}
            <div className="prose prose-stone max-w-none text-sm text-stone-700 leading-relaxed space-y-4">
              {activePage.content.split("\n\n").map((block, idx) => {
                if (block.startsWith("## ")) {
                  return (
                    <h3
                      key={idx}
                      className="text-lg font-bold text-stone-900 pt-4 pb-1 border-b border-stone-100"
                    >
                      {block.replace("## ", "")}
                    </h3>
                  );
                }
                if (block.startsWith("- ")) {
                  const items = block.split("\n").filter((l) => l.startsWith("- "));
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-1.5 pl-2">
                      {items.map((item, itemIdx) => {
                        const cleanText = item.replace("- ", "");
                        return (
                          <li key={itemIdx} className="text-stone-700">
                            {cleanText.includes("**") ? (
                              <span>
                                <strong>
                                  {cleanText.split("**")[1]}
                                </strong>
                                {cleanText.split("**")[2]}
                              </span>
                            ) : (
                              cleanText
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="whitespace-pre-line">
                    {block}
                  </p>
                );
              })}
            </div>

            {/* Special info boxes for contact page */}
            {activePage.slug === "kontakt" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-stone-100">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Besøk oss
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Kirkebakken 12, 5528 Haugesund<br />
                    Gudstjeneste hver søndag kl. 11:00
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                    <Heart className="w-4 h-4 text-indigo-600" />
                    Vipps kollekt
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Støtt menighetens arbeid på Vipps:<br />
                    <span className="font-mono font-bold text-sm">#12345</span>
                  </p>
                </div>
              </div>
            )}
          </article>
        ) : (
          /* FORSIDE (Landing page) */
          <>
            {/* HERO BANNER & NEXT WORSHIP SERVICE */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 sm:p-10 shadow-md">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Velkommen til kirken vår
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Et varmt fellesskap der det er rom for hele livet.
                </h2>
                <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                  Vi samles til gudstjenester, barne- og ungdomsarbeid, smågrupper og konserter. Du er alltid velkommen, akkurat slik du er.
                </p>
              </div>

              {/* NEXT WORSHIP HIGHLIGHT CARD */}
              {nextWorship && (
                <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Neste gudstjeneste
                    </span>
                    <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      Søndag
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {nextWorship.title}
                    </h3>
                    {nextWorship.theme && (
                      <p className="text-stone-300 text-xs italic mt-0.5">
                        Tema: «{nextWorship.theme}»
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-200 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      {nextWorship.startDate.toLocaleTimeString("no-NO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      {nextWorship.location || "Hovedsalen"}
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* FEATURED EVENTS SECTION (if any) */}
            {featuredGatherings.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="text-lg font-bold text-stone-900">
                    Fremhevede arrangementer
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredGatherings.map((gathering) => (
                    <div
                      key={gathering.id}
                      className="p-5 bg-gradient-to-br from-amber-50/80 to-white rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                            Fremhevet
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            {gathering.startDate.toLocaleDateString("no-NO", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-stone-900">
                          {gathering.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-stone-600 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {gathering.startDate.toLocaleTimeString("no-NO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {gathering.location || "Kirkesalen"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* THIS WEEK OVERVIEW (kommende 7 dager) */}
            {thisWeekGatherings.length > 0 && (
              <section className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base font-bold text-stone-900">
                      Denne uken
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500">
                    Kommende 7 dager ({thisWeekGatherings.length} samlinger)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {thisWeekGatherings.map((g) => (
                    <div
                      key={g.id}
                      className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                        g.isCancelled
                          ? "bg-red-50/50 border-red-200/60 line-through opacity-75"
                          : "bg-stone-50 hover:bg-stone-100/80 border-stone-200/70 transition-colors"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
                          <span>
                            {g.startDate.toLocaleDateString("no-NO", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span>
                            {g.startDate.toLocaleTimeString("no-NO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="font-bold text-stone-900 mt-1 text-xs">
                          {g.title}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {g.location || "Kirkesalen"}
                        </span>
                        {g.isCancelled && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                            Avlyst
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RECURRING ACTIVITIES & GROUPS (Faste møtepunkter og husfellesskap) */}
            {recurringEvents.length > 0 && (
              <section className="p-6 bg-amber-50/50 rounded-3xl border border-amber-200/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <h3 className="text-base font-bold text-stone-900">
                      Faste aktiviteter & fellesskap
                    </h3>
                  </div>
                  <span className="text-xs text-amber-800 font-medium">
                    Gjentagende møtepunkter
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {recurringEvents.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            {rec.category}
                          </span>
                          <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {rec.schedule}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 pt-1">
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MONTHLY CALENDAR / HVA SKJER */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                    Hva skjer i menigheten
                  </h3>
                  <p className="text-xs text-stone-500">
                    Oversikt over alle offentlige gudstjenester og arrangementer
                  </p>
                </div>

                {/* Filter ?visning=alle|gudstjenester */}
                <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSearchParams({ visning: "alle" })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterVisning === "alle"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Alle arrangementer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ visning: "gudstjenester" })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterVisning === "gudstjenester"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Kun gudstjenester
                  </button>
                </div>
              </div>

              {/* Month lists */}
              <div className="space-y-8">
                {Object.keys(monthlyGatherings).length === 0 ? (
                  <div className="p-8 text-center text-sm text-stone-500 bg-white rounded-2xl border border-stone-200">
                    Ingen arrangementer funnet med dette filteret.
                  </div>
                ) : (
                  Object.entries(monthlyGatherings).map(([monthName, list]) => {
                    const items = list as typeof filteredGatherings;
                    return (
                      <div key={monthName} className="space-y-3">
                        <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                          {monthName}
                        </h4>

                        <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden shadow-xs">
                          {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              item.isCancelled
                                ? "bg-red-50/30 opacity-75"
                                : "hover:bg-stone-50/80"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Date box */}
                              <div
                                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                                  item.isWorship
                                    ? "bg-amber-50 text-amber-900 border-amber-200"
                                    : "bg-stone-100 text-stone-800 border-stone-200"
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase">
                                  {item.startDate.toLocaleDateString("no-NO", {
                                    weekday: "short",
                                  })}
                                </span>
                                <span className="text-base font-extrabold leading-none">
                                  {item.startDate.getDate()}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5
                                    className={`text-sm font-bold ${
                                      item.isCancelled
                                        ? "line-through text-stone-500"
                                        : "text-stone-900"
                                    }`}
                                  >
                                    {item.title}
                                  </h5>

                                  {item.isCancelled && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                                      Avlyst
                                    </span>
                                  )}

                                  {item.categories.map((cat, catIdx) => (
                                    <span
                                      key={catIdx}
                                      className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                                    {item.startDate.toLocaleTimeString("no-NO", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                    {item.location || "Hovedsalen"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Public Church Footer */}
      <footer className="bg-stone-900 text-stone-300 py-10 border-t border-stone-800 text-xs">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Lillesand Misjonskirke</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Et varmt og inkluderende fellesskap for alle generasjoner.
            </p>
            <p className="text-stone-500 text-[11px] pt-2">
              lillesandmisjonskirke.no – Drevet av Menighetsplan & ClaudeCMS
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Kontakt og besøk</h4>
            <p className="text-stone-400 text-xs">
              Lillesand Misjonskirke, 4790 Lillesand<br />
              Telefon: 37 27 00 00<br />
              E-post: post@lillesandmisjonskirke.no
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm">Støtt arbeidet</h4>
            <p className="text-stone-400 text-xs">
              Vipps kollekt eller gave til menighetens arbeid:
            </p>
            <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 font-mono text-amber-300 font-bold">
              Vipps: #12345
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
