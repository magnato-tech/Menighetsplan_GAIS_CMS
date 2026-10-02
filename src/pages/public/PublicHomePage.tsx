import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseDataContext";
import { useCms } from "../../context/CmsContext";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ArrowRight,
  Heart,
  Users,
  Sparkles,
  BookOpen,
  Coffee,
  CheckCircle2,
  Headphones,
  Play,
  Volume2,
  Music2,
  ExternalLink,
} from "lucide-react";

function getSpotifyEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  const match = url.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  return null;
}

export const PublicHomePage: React.FC = () => {
  const { gatherings, groups } = useFirebase();
  const { settings, news, sermons, overrides } = useCms();
  const [isPlayingSermon, setIsPlayingSermon] = useState(false);

  // Find next upcoming worship service
  const nextWorship = useMemo(() => {
    const now = new Date().getTime();
    return gatherings
      .filter((g) => {
        if (g.isPublic === false) return false;
        if (overrides[g.id]?.hidden) return false;
        const startTime = new Date(g.startsAt).getTime();
        return startTime >= now - 4 * 60 * 60 * 1000; // include services currently happening
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  }, [gatherings, overrides]);

  // Upcoming public gatherings for "Hva skjer" preview
  const upcomingEvents = useMemo(() => {
    const now = new Date().getTime();
    return gatherings
      .filter((g) => {
        if (g.isPublic === false) return false;
        if (overrides[g.id]?.hidden) return false;
        return new Date(g.startsAt).getTime() >= now;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 4);
  }, [gatherings, overrides]);

  // Published news articles
  const publishedNews = useMemo(() => {
    return news.filter((n) => n.isPublished !== false).slice(0, 3);
  }, [news]);

  // Latest sermon
  const latestSermon = useMemo(() => {
    return sermons.length > 0 ? sermons[0] : null;
  }, [sermons]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("no-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
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
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-indigo-950 to-stone-900 text-white py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{settings.churchName}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {settings.welcomeHeadline || "Velkommen til menighetens fellesskap"}
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-300 leading-relaxed font-normal">
            {settings.welcomeSubtext ||
              "Et åpent hjem for alle generasjoner. Vi samles til gudstjeneste, bønn og nære fellesskap der tro og hverdag møtes."}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/hva-skjer"
              className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Se hva som skjer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/om-oss"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all"
            >
              Bli kjent med oss
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Neste Gudstjeneste (Live Highlight Card) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Neste Gudstjeneste</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {nextWorship ? nextWorship.title : "Søndagsgudstjeneste & kirkekaffe"}
              </h2>
              {nextWorship?.theme && (
                <p className="text-sm font-medium text-stone-600">
                  <span className="font-semibold text-stone-800">Tema:</span> {nextWorship.theme}
                  {nextWorship.bibleText && ` (${nextWorship.bibleText})`}
                </p>
              )}
            </div>

            {nextWorship && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold capitalize">{formatDate(nextWorship.startsAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Kl. {formatTime(nextWorship.startsAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{nextWorship.location || "Hovedsalen"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Sprell Levende Søndagsskole</h4>
                <p className="mt-0.5 text-stone-500">
                  Eget tilrettelagt opplegg for småbarn, barn og tweens under gudstjenesten.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Kirkekaffe & Drøs</h4>
                <p className="mt-0.5 text-stone-500">
                  Vi samles i kafeen etter gudstjenesten til kaffe, te, saft og en hyggelig prat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Rom for alle</h4>
                <p className="mt-0.5 text-stone-500">
                  Uansett bakgrunn er du hjertelig velkommen. Ingen forkunnskaper kreves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Kommende Arrangementer (Kommende uker) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Kalender</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Hva skjer i Lillesand Misjonskirke
            </h3>
          </div>
          <Link
            to="/hva-skjer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900 group"
          >
            <span>Se hele kalenderen</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingEvents.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  {formatDate(item.startsAt)}
                </div>
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
                  <span className="truncate">{item.location || "Misjonskirken"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Aktuelt & Nyheter */}
      <section className="bg-stone-100/70 py-16 px-4 sm:px-6 lg:px-8 border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Aktuelt</h2>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
                Nyheter og artikler
              </h3>
            </div>
            <Link
              to="/om-oss"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900 group"
            >
              <span>Les mer om arbeidet vårt</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publishedNews.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded font-semibold bg-stone-100 text-stone-700 uppercase tracking-wide text-[10px]">
                      {article.category}
                    </span>
                    <span className="text-stone-400">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-lg leading-snug">
                    {article.title}
                  </h4>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="p-6 pt-0 border-t border-stone-50 mt-2 flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-medium">
                    Av {article.author}
                  </span>
                  <Link
                    to={`/artikkel/${article.id}`}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <span>Les saken</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4B. Siste Tale & Forkynnelse (Benchmark: Fløymk / Lillesand) */}
      {latestSermon && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                  <Headphones className="w-3.5 h-3.5 text-amber-800" />
                  <span>Siste tale fra søndagen</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {latestSermon.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600">
                  Taler: <strong className="text-stone-800">{latestSermon.speaker}</strong>
                  {latestSermon.bibleText && ` · Bibel: ${latestSermon.bibleText}`}
                  {latestSermon.series && ` · Serie: ${latestSermon.series}`}
                </p>
                {latestSermon.summary && (
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {latestSermon.summary}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap md:flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPlayingSermon(!isPlayingSermon)}
                  className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isPlayingSermon ? "Pause / Lukk avspiller" : "Spill av tale direkte"}</span>
                </button>

                {latestSermon.spotifyUrl && (
                  <a
                    href={latestSermon.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Music2 className="w-4 h-4" />
                    <span>Hør i Spotify</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                  </a>
                )}

                <Link
                  to="/taler"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs text-center border border-stone-200 transition-all"
                >
                  Se hele prekenarkivet
                </Link>
              </div>
            </div>

            {/* Inline Direct Player */}
            {isPlayingSermon && (
              <div className="pt-4 border-t border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-950 font-semibold">
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-700 animate-pulse" />
                    <span>Spiller nå: {latestSermon.title} ({latestSermon.speaker})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlayingSermon(false)}
                    className="text-stone-500 hover:text-stone-900 font-medium"
                  >
                    Lukk
                  </button>
                </div>

                {latestSermon.audioUrl ? (
                  <audio controls autoPlay src={latestSermon.audioUrl} className="w-full h-11 rounded-xl" />
                ) : latestSermon.spotifyUrl && getSpotifyEmbedUrl(latestSermon.spotifyUrl) ? (
                  <iframe
                    src={getSpotifyEmbedUrl(latestSermon.spotifyUrl)!}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl shadow-xs"
                    title={`Spotify avspiller for ${latestSermon.title}`}
                  />
                ) : (
                  <p className="text-xs text-stone-500">Ingen direkte lydfil registrert for denne talen.</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Husfellesskap & Grupper CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl text-white p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
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
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Grupper for alle aldre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Annenhver uke</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
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

      {/* 6. Givertjeneste & Vipps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
          <Heart className="w-3.5 h-3.5" />
          <span>Givertjeneste & Støtte</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Støtt menighetens arbeid i Lillesand
        </h3>
        <p className="text-sm text-stone-600 max-w-xl mx-auto">
          Misjonskirkens arbeid drives utelukkende av frivillige gaver fra medlemmer og støttespillere. Din gave gjør barnekirke, ungdomsarbeid og diakonalt arbeid mulig.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <div className="px-6 py-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-4">
            <div className="text-left">
              <div className="text-xs text-stone-500 font-medium">Vipps til nummer</div>
              <div className="text-xl font-black text-amber-600">{settings.vippsNumber}</div>
            </div>
          </div>

          <div className="px-6 py-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center gap-4">
            <div className="text-left">
              <div className="text-xs text-stone-500 font-medium">Bankkonto for gaver</div>
              <div className="text-base font-mono font-bold text-stone-800">{settings.bankAccount}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
