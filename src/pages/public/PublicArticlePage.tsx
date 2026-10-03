import React from "react";
import { useParams, Link } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import {
  ArrowLeft,
  User,
} from "lucide-react";

export const PublicArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getNewsById, getNewsBySlug, settings } = useCms();

  // A draft is not there for a visitor, also when they have the address
  const found = id ? (getNewsById(id) || getNewsBySlug(id)) : undefined;
  const article = found && found.isPublished !== false ? found : undefined;

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

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-black text-stone-900">Artikkelen ble ikke funnet</h1>
        <p className="text-sm text-stone-600">
          Artikkelen kan ha blitt flyttet eller avpublisert.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til forsiden</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til forsiden</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-800">
            {article.category}
          </span>
          <span className="text-xs text-stone-400">·</span>
          <span className="text-xs text-stone-500 capitalize">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-stone-600 font-medium leading-relaxed">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-stone-400" />
            <span>Skrevet av <strong className="text-stone-800">{article.author}</strong></span>
          </div>
          <div className="text-stone-400">
            {settings.churchName}
          </div>
        </div>
      </header>

      {/* Article Body */}
      <article className="prose prose-stone prose-lg max-w-none text-stone-800 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base">
        {article.content}
      </article>

      {/* Share / Back footer */}
      <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/"
          className="text-xs font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Flere nyheter og hva som skjer</span>
        </Link>
        <Link
          to="/kontakt"
          className="text-xs font-bold text-stone-600 hover:text-stone-900"
        >
          Spørsmål? Kontakt oss
        </Link>
      </div>
    </div>
  );
};
