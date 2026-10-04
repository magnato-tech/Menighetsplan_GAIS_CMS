import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { ChevronRight, ArrowRight } from "lucide-react";

export interface NewsModuleProps {
  variant?: "grid" | "compact";
  limit?: number;
}

export const NewsModule: React.FC<NewsModuleProps> = ({
  variant = "grid",
  limit = 3,
}) => {
  const { news } = useCms();

  const publishedNews = useMemo(() => {
    return news.filter((n) => n.isPublished !== false).slice(0, limit);
  }, [news, limit]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("no-NO", {
        day: "numeric",
        month: "long",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="w-full bg-stone-100/70 py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-200/60 my-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">Aktuelt</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Nyheter og artikler
            </h3>
          </div>
          <Link
            to="/om-oss"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-900 group"
          >
            <span>Les mer om arbeidet vårt</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {publishedNews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Ingen nyhetsartikler publisert for øyeblikket.
          </div>
        ) : variant === "compact" ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
            {publishedNews.map((article) => (
              <div
                key={article.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-primary-800 uppercase tracking-wide text-[10px]">
                      {article.category}
                    </span>
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-400">{formatDate(article.publishedAt)}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-base leading-snug">
                    {article.title}
                  </h4>
                </div>
                <Link
                  to={`/artikkel/${article.id}`}
                  className="text-xs font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1 self-start sm:self-auto shrink-0"
                >
                  <span>Les saken</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
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
                    className="text-xs font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1"
                  >
                    <span>Les saken</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
