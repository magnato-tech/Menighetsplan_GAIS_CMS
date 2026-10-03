import React from "react";
import { Trash2, ZoomIn } from "lucide-react";
import type { GroupMessage } from "../../types";
import { formatChatMessageTime } from "../../utils/dates";
import { RichMessageContent } from "./RichMessageContent";

export interface OpenedImage {
  url: string;
  senderName: string;
  time: string;
}

interface Props {
  message: GroupMessage;
  isMe: boolean;
  onOpenImage: (image: OpenedImage) => void;
  onDelete: (message: GroupMessage) => void;
}

/** One message: who and when, the picture and text in a bubble, and a delete button on your own. */
export const ChatMessageBubble: React.FC<Props> = ({ message: msg, isMe, onOpenImage, onDelete }) => (
  <div id={`chat-msg-${msg.id}`} className={`flex flex-col group transition-all ${isMe ? "items-end" : "items-start"}`}>
    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
      <span className={`font-bold ${isMe ? "text-emerald-800" : "text-slate-800"}`}>{isMe ? "Deg" : msg.senderName}</span>
      <span>•</span>
      <span>{formatChatMessageTime(msg.createdAt)}</span>
    </div>

    <div className="relative max-w-[85%] group/bubble flex items-start gap-1.5">
      {isMe && (
        <button
          type="button"
          id={`btn-delete-msg-${msg.id}`}
          onClick={() => onDelete(msg)}
          className="opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer self-center"
          title="Slett melding"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div
        className={`p-3.5 rounded-2xl space-y-2 shadow-2xs ${
          isMe ? "bg-emerald-700 text-white rounded-tr-xs" : "bg-slate-100 text-slate-900 rounded-tl-xs"
        }`}
      >
        {msg.imageUrl && (
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group/img max-w-sm"
            onClick={() =>
              onOpenImage({ url: msg.imageUrl!, senderName: msg.senderName, time: formatChatMessageTime(msg.createdAt) })
            }
          >
            <img
              src={msg.imageUrl}
              alt="Vedlagt bilde"
              className="w-full max-h-56 object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-6 h-6 drop-shadow-md" />
            </div>
          </div>
        )}

        {msg.content && <RichMessageContent content={msg.content} isCurrentUser={isMe} />}
      </div>
    </div>
  </div>
);
