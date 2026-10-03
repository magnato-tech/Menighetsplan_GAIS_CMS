import React, { useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import type { GroupMessage } from "../../types";
import { ChatMessageBubble, type OpenedImage } from "./ChatMessageBubble";

interface Props {
  groupId: string;
  messages: GroupMessage[];
  currentUserId: string;
  onOpenImage: (image: OpenedImage) => void;
  onDelete: (message: GroupMessage) => void;
}

/** The messages of the room, scrolled to the newest. Only this box scrolls, never the page. */
export const ChatMessageList: React.FC<Props> = ({ groupId, messages, currentUserId, onOpenImage, onDelete }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) container.current.scrollTop = container.current.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={container}
      id={`chat-messages-container-${groupId}`}
      className="p-4 space-y-3.5 max-h-[420px] min-h-[220px] overflow-y-auto bg-gradient-to-b from-slate-50/30 to-white"
    >
      {messages.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Smile className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Ingen meldinger ennå</p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Vær den første til å skrive en hilsen eller dele et bilde med gruppen!
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderPersonId === currentUserId}
            onOpenImage={onOpenImage}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};
