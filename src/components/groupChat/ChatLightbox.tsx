import React from "react";
import { X } from "lucide-react";
import type { OpenedImage } from "./ChatMessageBubble";

interface Props {
  image: OpenedImage;
  onClose: () => void;
}

/** A picture from the chat shown large, closed by the button or a click outside it. */
export const ChatLightbox: React.FC<Props> = ({ image, onClose }) => (
  <div
    id="modal-chat-lightbox"
    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in"
    onClick={onClose}
  >
    <div className="relative max-w-2xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      <div className="w-full flex items-center justify-between text-white pb-3 px-1">
        <div>
          <span className="text-xs font-bold block">{image.senderName}</span>
          <span className="text-[10px] text-slate-400">{image.time}</span>
        </div>
        <button
          type="button"
          id="btn-close-lightbox"
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <img src={image.url} alt="Forstørret bilde" className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl" referrerPolicy="no-referrer" />
    </div>
  </div>
);
