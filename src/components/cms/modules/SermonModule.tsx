import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { Headphones, Play, Music2, ExternalLink, Volume2 } from "lucide-react";

function getSpotifyEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  const match = url.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  return null;
}

export interface SermonModuleProps {
  variant?: "player" | "minimal";
}

export const SermonModule: React.FC<SermonModuleProps> = ({
  variant = "player",
}) => {
  const { sermons } = useCms();
  const [isPlayingSermon, setIsPlayingSermon] = useState(false);

  const latestSermon = useMemo(() => {
    return sermons.length > 0 ? sermons[0] : null;
  }, [sermons]);

  if (!latestSermon) {
    return null;
  }

  if (variant === "minimal") {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="bg-accent-50/80 border border-accent-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-200 text-accent-900 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-accent-800" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-800 block">
                Siste tale fra søndagen
              </span>
              <h4 className="font-bold text-stone-900 text-base">{latestSermon.title}</h4>
              <p className="text-xs text-stone-600">Taler: {latestSermon.speaker}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsPlayingSermon(!isPlayingSermon)}
              className="px-4 py-2 rounded-xl bg-accent-400 hover:bg-accent-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isPlayingSermon ? "Pause" : "Spill av"}</span>
            </button>
            <Link
              to="/taler"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200"
            >
              Arkiv
            </Link>
          </div>
        </div>

        {isPlayingSermon && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
            {latestSermon.audioUrl ? (
              <audio controls autoPlay src={latestSermon.audioUrl} className="w-full h-10" />
            ) : latestSermon.spotifyUrl && getSpotifyEmbedUrl(latestSermon.spotifyUrl) ? (
              <iframe
                src={getSpotifyEmbedUrl(latestSermon.spotifyUrl)!}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
                title={`Spotify avspiller for ${latestSermon.title}`}
              />
            ) : (
              <p className="text-xs text-stone-500">Ingen direkte lydfil registrert.</p>
            )}
          </div>
        )}
      </section>
    );
  }

  // Standard "player" variant
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
      <div className="bg-accent-50/70 border border-accent-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 text-accent-900 text-xs font-semibold">
              <Headphones className="w-3.5 h-3.5 text-accent-800" />
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
              className="px-5 py-3 rounded-xl bg-accent-400 hover:bg-accent-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
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
          <div className="pt-4 border-t border-accent-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-accent-950 font-semibold">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-accent-700 animate-pulse" />
                <span>Spiller nå: {latestSermon.title} ({latestSermon.speaker})</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPlayingSermon(false)}
                className="text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
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
  );
};
