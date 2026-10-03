import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { CmsSermon, formatYoutubeNoCookieUrl } from "../../../data/cmsData";
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Headphones,
  Play,
} from "lucide-react";
import { StudioData, ShowFeedback } from "../studio";

interface SermonsTabProps {
  studio: StudioData;
  showFeedback: ShowFeedback;
}

export const SermonsTab: React.FC<SermonsTabProps> = ({ studio, showFeedback }) => {
  const { currentUser } = studio;
  const { sermons, saveSermon, deleteSermon } = useCms();

  const [editingSermon, setEditingSermon] = useState<Partial<CmsSermon> | null>(null);
  const [isNewSermon, setIsNewSermon] = useState(false);

  const handleOpenEditSermon = (sermon: CmsSermon) => {
    setEditingSermon({ ...sermon });
    setIsNewSermon(false);
  };

  const handleOpenNewSermon = () => {
    setEditingSermon({
      title: "",
      speaker: currentUser.name || "Pastor Kari Nordmann",
      date: new Date().toISOString(),
      bibleText: "",
      series: "",
      audioUrl: "",
      videoUrl: "",
      summary: "",
    });
    setIsNewSermon(true);
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSermon || !editingSermon.title) {
      showFeedback("Talen må ha en tittel", "error");
      return;
    }
    const cleanVideoUrl = formatYoutubeNoCookieUrl(editingSermon.videoUrl || "");
    const saved = await saveSermon({
      ...editingSermon,
      videoUrl: cleanVideoUrl,
    });
    if (!saved) return;
    setEditingSermon(null);
    showFeedback("Talen ble lagret og publisert til prekenarkivet!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Taler & Prekenarkiv</h2>
          <p className="text-xs text-slate-400">
            Last opp eller lenk opptak fra søndagens gudstjenester med taler, bibeltekst og serie.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewSermon}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Legg til tale</span>
        </button>
      </div>

      {/* Sermon Editor Form */}
      {editingSermon && (
        <form onSubmit={handleSaveSermon} className="p-6 rounded-2xl bg-slate-800 border border-amber-500/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>{isNewSermon ? "Legg til ny tale" : `Rediger tale: ${editingSermon.title}`}</span>
            </h3>
            <button type="button" onClick={() => setEditingSermon(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tittel på talen</label>
              <input
                type="text"
                value={editingSermon.title || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, title: e.target.value })}
                placeholder="f.eks. Guds rike er kommet nær"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Taler</label>
              <input
                type="text"
                value={editingSermon.speaker || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, speaker: e.target.value })}
                placeholder="f.eks. Pastor Kari Nordmann"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Bibeltekst</label>
              <input
                type="text"
                value={editingSermon.bibleText || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, bibleText: e.target.value })}
                placeholder="f.eks. Markus 1,14–15"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Taleserie (valgfritt)</label>
              <input
                type="text"
                value={editingSermon.series || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, series: e.target.value })}
                placeholder="f.eks. Vandring gjennom Markus"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Spotify-lenke (Episode eller Podkast)</label>
              <input
                type="url"
                value={editingSermon.spotifyUrl || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, spotifyUrl: e.target.value })}
                placeholder="https://open.spotify.com/episode/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Lydfil (MP3)</label>
              <input
                type="url"
                value={editingSermon.audioUrl || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, audioUrl: e.target.value })}
                placeholder="https://.../tale.mp3"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Videoadresse (YouTube/Vimeo)</label>
              <input
                type="url"
                value={editingSermon.videoUrl || ""}
                onChange={(e) => setEditingSermon({ ...editingSermon, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Kort sammendrag av talen</label>
            <textarea
              rows={3}
              value={editingSermon.summary || ""}
              onChange={(e) => setEditingSermon({ ...editingSermon, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingSermon(null)}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
            >
              Lagre tale
            </button>
          </div>
        </form>
      )}

      {/* List of Sermons */}
      <div className="space-y-3">
        {sermons.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-base">{s.title}</h3>
                {s.series && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded">
                    {s.series}
                  </span>
                )}
                {s.videoUrl && (
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Play className="w-3 h-3 text-indigo-400" />
                    Video (nocookie)
                  </span>
                )}
                {s.audioUrl && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Headphones className="w-3 h-3 text-amber-400" />
                    Lyd
                  </span>
                )}
                {!s.videoUrl && !s.audioUrl && (
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                    Kun notat
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                <span>Taler: <strong className="text-slate-200">{s.speaker || s.guestSpeakerName || "Ikke oppgitt"}</strong></span>
                {s.bibleText && <span>Bibel: {s.bibleText}</span>}
                <span>Dato: {new Date(s.date).toLocaleDateString("no-NO")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Link
                to="/taler"
                target="_blank"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                title="Hør i arkiv"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => handleOpenEditSermon(s)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rediger</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette talen "${s.title}"?`)) {
                    if (await deleteSermon(s.id)) showFeedback("Talen ble slettet");
                  }
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                title="Slett tale"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
