import React from "react";
import { ExternalLink, Play } from "lucide-react";
import { parseMessageContent } from "../../utils/chatMessage";

interface Props {
  content: string;
  isCurrentUser: boolean;
}

/** The text of a message with clickable links, and a card under it for each YouTube video. */
export const RichMessageContent: React.FC<Props> = ({ content, isCurrentUser }) => {
  const { parts, videos } = parseMessageContent(content);

  return (
    <div className="space-y-2">
      <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
        {parts.map((part, i) =>
          part.isLink ? (
            <a
              key={i}
              href={part.text}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-0.5 underline font-medium break-all hover:opacity-80 transition-opacity ${
                isCurrentUser ? "text-emerald-100 hover:text-white" : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              <span>{part.text}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 ml-0.5" />
            </a>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </div>

      {videos.map((video, idx) => (
        <a
          key={idx}
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
            isCurrentUser
              ? "bg-emerald-800/40 border-emerald-500/50 hover:bg-emerald-800/60 text-white"
              : "bg-red-50/60 border-red-200/80 hover:bg-red-50 text-slate-800"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100/80 px-1.5 py-0.2 rounded">
                YouTube
              </span>
            </div>
            <p className="text-[11px] font-medium truncate mt-0.5 opacity-90">{video.url}</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </a>
      ))}
    </div>
  );
};
