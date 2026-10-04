import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFirebase } from "../../../context/FirebaseDataContext";
import { useCms } from "../../../context/CmsContext";
import { locationOf, upcomingPublicGatherings } from "../../../utils/gatherings";
import { Clock, MapPin, ChevronRight } from "lucide-react";

export interface CalendarModuleProps {
  variant?: "grid" | "list";
  limit?: number;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  variant = "grid",
  limit = 4,
}) => {
  const { gatherings } = useFirebase();
  const { settings } = useCms();

  const upcomingEvents = useMemo(
    () => upcomingPublicGatherings(gatherings, Date.now()).slice(0, limit),
    [gatherings, limit]
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("no-NO", {
        weekday: "short",
        day: "numeric",
        month: "short",
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

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 my-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">Kalender</h2>
          <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Hva skjer i {settings.churchName}
          </h3>
        </div>
        <Link
          to="/hva-skjer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-900 group"
        >
          <span>Se hele kalenderen</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
          Ingen kommende arrangementer registrert i kalenderen for øyeblikket.
        </div>
      ) : variant === "list" ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
          {upcomingEvents.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-200/80 text-primary-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-primary-700">
                    {new Intl.DateTimeFormat("no-NO", { month: "short" }).format(new Date(item.startsAt))}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {new Date(item.startsAt).getDate()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 text-base">{item.title}</h4>
                    {item.cancelled && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                        Avlyst
                      </span>
                    )}
                  </div>
                  {item.theme && (
                    <p className="text-xs text-stone-500 line-clamp-1">{item.theme}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-600 sm:text-right">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Kl. {formatTime(item.startsAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{locationOf(item)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingEvents.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                  {formatDate(item.startsAt)}
                </div>
                {item.cancelled && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                    Avlyst
                  </span>
                )}
                <h4 className="font-bold text-stone-900 text-base leading-snug">
                  {item.title}
                </h4>
                {item.theme && (
                  <p className="text-xs text-stone-500 line-clamp-2">
                    {item.theme}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Kl. {formatTime(item.startsAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{locationOf(item)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
