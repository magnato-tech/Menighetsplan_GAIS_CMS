import React from "react";
import type { HelpArticle } from "./articles";

interface HelpArticleViewProps {
  article: HelpArticle;
}

export function helpArticleImageSrc(articleId: string): string {
  return `/help/hjelp-${articleId}.png`;
}

function HelpArticleImage({ article }: { article: HelpArticle }) {
  return (
    <figure
      className="rounded-xl border border-[var(--studio-border)] overflow-hidden bg-[var(--studio-bg)] shadow-sm"
      aria-label={`Illustrasjon for ${article.title}`}
    >
      <img
        src={helpArticleImageSrc(article.id)}
        alt={`Skjermbilde: ${article.title}`}
        className="w-full h-auto block"
        loading="lazy"
      />
    </figure>
  );
}

function FormalSection({ article }: { article: HelpArticle }) {
  return (
    <section className="space-y-1">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Formål</h3>
      <p className="text-sm text-[var(--studio-text)] leading-relaxed">{article.formal}</p>
    </section>
  );
}

function HvorSection({ article }: { article: HelpArticle }) {
  return (
    <section className="space-y-1">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Hvor</h3>
      <p className="text-sm text-[var(--studio-text)] leading-relaxed">{article.hvor}</p>
    </section>
  );
}

function StegSection({ article }: { article: HelpArticle }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Steg for steg</h3>
      <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[var(--studio-text)] leading-relaxed">
        {article.steg.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

function KnapperSection({ article }: { article: HelpArticle }) {
  return (
    <section className="space-y-1">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Knapper og felt</h3>
      <p className="text-sm text-[var(--studio-text)] leading-relaxed">{article.knapper}</p>
    </section>
  );
}

function EtterLagringSection({ article }: { article: HelpArticle }) {
  return (
    <section className="space-y-1">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--studio-muted)]">Etter lagring</h3>
      <p className="text-sm text-[var(--studio-text)] leading-relaxed">{article.etterLagring}</p>
    </section>
  );
}

export const HelpArticleView: React.FC<HelpArticleViewProps> = ({ article }) => {
  if (article.layout === "tall") {
    return (
      <article id={article.id} className="scroll-mt-6 space-y-5">
        <h2 className="text-xl font-black text-[var(--studio-text)] tracking-tight">{article.title}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_42%] gap-5 items-start">
          <div className="space-y-5 order-2 lg:order-1">
            <FormalSection article={article} />
            <HvorSection article={article} />
            <StegSection article={article} />
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-4">
            <HelpArticleImage article={article} />
          </div>
        </div>

        <KnapperSection article={article} />
        <EtterLagringSection article={article} />
      </article>
    );
  }

  return (
    <article id={article.id} className="scroll-mt-6 space-y-5">
      <h2 className="text-xl font-black text-[var(--studio-text)] tracking-tight">{article.title}</h2>

      <div className="space-y-5">
        <FormalSection article={article} />
        <HvorSection article={article} />
      </div>

      <HelpArticleImage article={article} />

      <StegSection article={article} />
      <KnapperSection article={article} />
      <EtterLagringSection article={article} />
    </article>
  );
};
