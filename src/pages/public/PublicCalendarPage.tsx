import React, { useState, useMemo } from "react";
import { useFirebase } from "../../context/FirebaseDataContext";
import { useCms } from "../../context/CmsContext";
import { isWorshipService, locationOf, upcomingPublicGatherings } from "../../utils/gatherings";
import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";

export const PublicCalendarPage: React.FC = () => {
  const { gatherings } = useFirebase();
  const { settings } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>("alle");

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("no-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "";
    }
  };

  // Process & filter gatherings
  const processedEvents = useMemo(() => {
    // The calendar looks ahead, from the start of today, so a service earlier today is still listed
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return upcomingPublicGatherings(gatherings, startOfToday.getTime())
      .map((g) => {
        const title = g.title || "Samling";
        const isWorship = isWorshipService(g);
        const isCancelled = Boolean(g.cancelled);

        const categories: string[] = [];
        if (isWorship) categories.push("Gudstjeneste");
        if (title.toLowerCase().includes("ungdom")) categories.push("Ungdom");
        if (title.toLowerCase().includes("barn") || title.toLowerCase().includes("familie")) categories.push("Barn & familie");
        if (title.toLowerCase().includes("bønn")) categories.push("Bønnemøte");
        if (categories.length === 0) categories.push("Arrangement");

        return {
          ...g,
          isWorship,
          isCancelled,
          categories,
        };
      })
      .filter((item) => {
        if (selectedCategory === "alle") return true;
        if (selectedCategory === "gudstjeneste") return item.isWorship;
        if (selectedCategory === "ungdom") return item.categories.includes("Ungdom");
        if (selectedCategory === "barn") return item.categories.includes("Barn & familie");
        return true;
      });
  }, [gatherings, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Møtekalender</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Hva skjer i {settings.churchName}
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl">
          Her finner du datoer og klokkeslett for kommende søndagsgudstjenester, barnekirke, ungdomskvelder og faste samlinger.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
        <button
          type="button"
          onClick={() => setSelectedCategory("alle")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "alle"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Alle arrangementer ({processedEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("gudstjeneste")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "gudstjeneste"
              ? "bg-primary-700 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Gudstjenester
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("ungdom")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "ungdom"
              ? "bg-primary-700 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Ungdom
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("barn")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "barn"
              ? "bg-primary-700 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Barn & Familie
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {processedEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-700">Ingen kommende arrangementer i denne kategorien.</p>
            <p className="text-xs text-stone-500 mt-1">Velg en annen kategori eller kom tilbake senere.</p>
          </div>
        ) : (
          processedEvents.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.isCancelled
                  ? "border-red-200 bg-red-50/20 opacity-75"
                  : "border-stone-200/80 hover:border-primary-300 shadow-xs hover:shadow"
              }`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700 capitalize">
                    {formatDate(item.startsAt)}
                  </span>
                  {item.categories.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600"
                    >
                      {c}
                    </span>
                  ))}
                  {item.isCancelled && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Avlyst
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-stone-900 leading-snug">
                  {item.title}
                </h3>

                {item.theme && (
                  <p className="text-sm text-stone-600">
                    <span className="font-semibold text-stone-800">Tema:</span> {item.theme}
                    {item.bibleText && ` (${item.bibleText})`}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/60">
                  <Clock className="w-3.5 h-3.5 text-primary-600" />
                  <span>Kl. {formatTime(item.startsAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{locationOf(item)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
