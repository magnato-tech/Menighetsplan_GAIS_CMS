import React from "react";
import { Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseDataContext";
import { parseCmsContent } from "../../utils/cmsContent";
import { type PersonGridProfile, personGridMessage, selectPersonGrid } from "../../utils/personGrid";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Quote,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";

interface CmsContentRendererProps {
  content?: string;
  className?: string;
}


/**
 * Safely parses inline markdown tokens (bold, italics, links, code, mark)
 * Strips script tags and disallows unescaped active vectors.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Strip dangerous html tags
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Match links: [text](url)
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderSimpleStyles(sanitized.substring(lastIndex, match.index)));
    }
    const label = match[1];
    const url = match[2];
    const isExternal = url.startsWith("http://") || url.startsWith("https://");

    if (isExternal) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 underline underline-offset-2 font-medium inline-flex items-center gap-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline opacity-70" />
        </a>
      );
    } else {
      parts.push(
        <Link
          key={`link-${match.index}`}
          to={url}
          className="text-primary-600 hover:text-primary-800 underline underline-offset-2 font-medium"
        >
          {label}
        </Link>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < sanitized.length) {
    parts.push(renderSimpleStyles(sanitized.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Handles bold **text**, italic *text*, `code`, and highlighting
 */
function renderSimpleStyles(str: string): React.ReactNode {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-stone-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-xs font-mono text-stone-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const CmsContentRenderer: React.FC<CmsContentRendererProps> = ({
  content = "",
  className = "",
}) => {
  const blocks = parseCmsContent(content);

  return (
    <div className={`cms-prose-sandbox space-y-4 text-stone-800 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "spacer":
            return <div key={idx} className="h-3" />;

          case "heading": {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-6 mb-2"
                >
                  {renderInlineFormatting(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-6 mb-2 border-b border-stone-200/60 pb-2"
                >
                  {renderInlineFormatting(block.text)}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-lg font-bold text-stone-900 tracking-tight mt-4 mb-1"
              >
                {renderInlineFormatting(block.text)}
              </h3>
            );
          }

          case "paragraph":
            return (
              <p
                key={idx}
                className="text-stone-700 text-sm sm:text-base leading-relaxed my-1.5"
              >
                {renderInlineFormatting(block.text)}
              </p>
            );

          case "list":
            if (block.ordered) {
              return (
                <ol
                  key={idx}
                  className="list-decimal pl-5 space-y-1 text-sm sm:text-base text-stone-700 leading-relaxed my-2"
                >
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                  ))}
                </ol>
              );
            }
            return (
              <ul
                key={idx}
                className="list-disc pl-5 space-y-1 text-sm sm:text-base text-stone-700 leading-relaxed my-2"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                ))}
              </ul>
            );

          case "callout": {
            const styles = {
              info: {
                bg: "bg-sky-50/80 border-sky-200 text-sky-950",
                icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
                title: "Informasjon",
              },
              warning: {
                bg: "bg-amber-50/80 border-amber-200 text-amber-950",
                icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
                title: "Viktig merknad",
              },
              success: {
                bg: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
                title: "Kunngjøring",
              },
              primary: {
                bg: "bg-primary-50/70 border-primary-200 text-primary-950",
                icon: <Bookmark className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />,
                title: "Fremhevet",
              },
            }[block.variant];

            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border ${styles.bg} my-3 flex items-start gap-3.5 shadow-xs`}
              >
                {styles.icon}
                <div className="space-y-1 flex-1 text-sm leading-relaxed">
                  {(block.title || styles.title) && (
                    <div className="font-bold text-xs uppercase tracking-wider opacity-90">
                      {block.title || styles.title}
                    </div>
                  )}
                  <div className="whitespace-pre-line text-sm opacity-95">
                    {renderInlineFormatting(block.body)}
                  </div>
                </div>
              </div>
            );
          }

          case "media": {
            const isLeft = block.alignment === "left";
            return (
              <div
                key={idx}
                className={`my-6 flex flex-col md:flex-row items-center gap-6 p-5 sm:p-6 bg-stone-50 border border-stone-200/80 rounded-2xl shadow-xs ${
                  isLeft ? "" : "md:flex-row-reverse"
                }`}
              >
                {block.imageUrl && (
                  <div className="w-full md:w-5/12 h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shrink-0 bg-stone-200 border border-stone-300/80 shadow-2xs">
                    <img
                      src={block.imageUrl}
                      alt={block.title || "Illustrasjonsbilde"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2.5 text-stone-700">
                  {block.title && (
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                      {renderInlineFormatting(block.title)}
                    </h3>
                  )}
                  <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-stone-600">
                    {renderInlineFormatting(block.body)}
                  </div>
                </div>
              </div>
            );
          }

          case "grid":
            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4"
              >
                {block.cards.map((card, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="p-4 sm:p-5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 shadow-xs"
                  >
                    {card.title && (
                      <h4 className="font-bold text-stone-900 text-base">
                        {renderInlineFormatting(card.title)}
                      </h4>
                    )}
                    <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                      {renderInlineFormatting(card.body)}
                    </div>
                  </div>
                ))}
              </div>
            );

          case "quote":
            return (
              <div
                key={idx}
                className="relative my-4 pl-5 sm:pl-6 py-2 border-l-4 border-primary-600 bg-stone-50/60 rounded-r-xl"
              >
                <Quote className="w-6 h-6 text-primary-400/40 absolute -top-2 left-2 pointer-events-none" />
                <p className="text-stone-800 italic text-base sm:text-lg leading-relaxed font-serif">
                  «{renderInlineFormatting(block.text)}»
                </p>
                {block.author && (
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1.5">
                    — {block.author}
                  </p>
                )}
              </div>
            );

          case "cta": {
            const isExternal = block.url.startsWith("http://") || block.url.startsWith("https://");
            const btnClass =
              "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm hover:shadow-md transition-all my-2 bg-primary-600 hover:bg-primary-700 cursor-pointer";

            if (isExternal) {
              return (
                <div key={idx} className="my-3">
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnClass}
                  >
                    <span>{block.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              );
            }
            return (
              <div key={idx} className="my-3">
                <Link to={block.url} className={btnClass}>
                  <span>{block.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          }

          case "person-grid":
            return <PersonGridRenderer key={idx} filter={block.filter} />;

          default:
            return null;
        }
      })}
    </div>
  );
};

interface PersonCardProps {
  profile: PersonGridProfile;
}

const PersonCard: React.FC<PersonCardProps> = ({ profile }) => {
  const title = profile.title || profile.roleInGroup;
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {profile.avatarUrl ? (
          <div className="w-full h-52 sm:h-56 bg-stone-100 overflow-hidden relative">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-4xl font-black text-stone-400 select-none">
            {profile.name.charAt(0)}
          </div>
        )}

        <div className="p-5 space-y-2">
          <div>
            <h3 className="font-bold text-stone-900 text-lg leading-tight">{profile.name}</h3>
            {title && <p className="text-xs text-primary-700 font-semibold mt-0.5">{title}</p>}
          </div>

          {profile.bio && (
            <p className="text-xs text-stone-600 leading-relaxed pt-1 line-clamp-3">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {(profile.phone || profile.email) && (
        <div className="px-5 pb-5 pt-2 border-t border-stone-100/80 flex flex-col gap-1.5 text-xs text-stone-600">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-2 hover:text-stone-900 font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{profile.phone}</span>
            </a>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 hover:text-stone-900 font-medium truncate transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

interface PersonGridRendererProps {
  filter: string;
}

const PersonGridRenderer: React.FC<PersonGridRendererProps> = ({ filter }) => {
  const { allPersons, groups } = useFirebase();
  const result = selectPersonGrid(filter, allPersons, groups);

  if (result.kind !== "people") {
    return (
      <div className="p-4 rounded-xl bg-stone-100 text-stone-500 text-xs italic">
        {personGridMessage(result, filter)}
      
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 my-6">
      {result.profiles.map((p) => (
        <PersonCard key={p.id} profile={p} />
      ))}
    </div>
  );
};
