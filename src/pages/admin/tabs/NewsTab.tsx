import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { CmsNewsArticle } from "../../../data/cmsData";
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Newspaper,
} from "lucide-react";
import { StudioData, ShowFeedback } from "../studio";

interface NewsTabProps {
  studio: StudioData;
  showFeedback: ShowFeedback;
  /** Set when another tab asks for this one to open with a new, empty editor. */
  createRequested: boolean;
  onCreateHandled: () => void;
}

export const NewsTab: React.FC<NewsTabProps> = ({ studio, showFeedback, createRequested, onCreateHandled }) => {
  const { currentUser } = studio;
  const { news, saveNews, deleteNews } = useCms();

  const [editingNews, setEditingNews] = useState<Partial<CmsNewsArticle> | null>(null);
  const [isNewNews, setIsNewNews] = useState(false);

  const handleOpenEditNews = (article: CmsNewsArticle) => {
    setEditingNews({ ...article });
    setIsNewNews(false);
  };

  const handleOpenNewNews = () => {
    setEditingNews({
      title: "",
      slug: "",
      summary: "",
      content: "Skriv artikkelteksten her...\n\nFlere avsnitt kan legges til med linjeskift.",
      category: "aktuelt",
      author: currentUser.name || "Menigheten",
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });
    setIsNewNews(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editingNews.title) {
      showFeedback("Artikkelen må ha en tittel", "error");
      return;
    }
    if (!(await saveNews(editingNews))) return;
    setEditingNews(null);
    showFeedback("Nyhetsartikkelen ble lagret og publisert!");
  };

  useEffect(() => {
    if (createRequested) {
      handleOpenNewNews();
      onCreateHandled();
    }
  }, [createRequested]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Aktuelt & Nyhetsartikler</h2>
          <p className="text-xs text-slate-400">
            Publiser nyheter, rapporter fra leir og oppdateringer for menighetens forside.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewNews}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ny artikkel</span>
        </button>
      </div>

      {/* News Editor Modal / Panel */}
      {editingNews && (
        <form onSubmit={handleSaveNews} className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-400" />
              <span>{isNewNews ? "Skriv ny artikkel" : `Rediger artikkel: ${editingNews.title}`}</span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingNews(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tittel</label>
              <input
                type="text"
                value={editingNews.title || ""}
                onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                placeholder="f.eks. Flott oppstart for høstens søndagsskole"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Kategori</label>
                <select
                  value={editingNews.category || "aktuelt"}
                  onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                >
                  <option value="aktuelt">Aktuelt</option>
                  <option value="gudstjeneste">Gudstjeneste</option>
                  <option value="ungdom">Ungdom</option>
                  <option value="misjon">Misjon</option>
                  <option value="familie">Familie</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Forfatter</label>
                <input
                  type="text"
                  value={editingNews.author || ""}
                  onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Ingress / Sammendrag</label>
            <textarea
              rows={2}
              value={editingNews.summary || ""}
              onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
              placeholder="En kort innledning som fanger oppmerksomheten..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Artikkeltekst</label>
            <textarea
              rows={7}
              value={editingNews.content || ""}
              onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingNews.isPublished !== false}
                onChange={(e) => setEditingNews({ ...editingNews, isPublished: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Publiser artikkelen direkte på nettsiden</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingNews(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
              >
                Lagre artikkel til Firestore
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List of News */}
      <div className="space-y-3">
        {news.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <h3 className="font-bold text-white text-base">{item.title}</h3>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{item.summary}</p>
              <div className="text-[11px] text-slate-400">
                Av {item.author} · {new Date(item.publishedAt).toLocaleDateString("no-NO")}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Link
                to={`/artikkel/${item.id}`}
                target="_blank"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                title="Les artikkel"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => handleOpenEditNews(item)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rediger</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette artikkelen "${item.title}"?`)) {
                    if (await deleteNews(item.id)) showFeedback("Artikkelen ble slettet");
                  }
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                title="Slett artikkel"
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
