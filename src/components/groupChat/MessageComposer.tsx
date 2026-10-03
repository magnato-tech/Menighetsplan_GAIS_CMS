import React, { useRef, useState } from "react";
import { Camera, Send, X } from "lucide-react";
import { isPictureTooLarge } from "../../utils/chatMessage";

interface Props {
  groupName: string;
  /** Sends the message. The text and picture are cleared only when it worked. */
  onSend: (content: string, imageUrl?: string) => { success: boolean; error?: string };
  showFeedback: (message: string) => void;
}

/** Ready-made pictures for trying the chat out, shown under the text field. */
const QUICK_PICTURES = [
  { label: "🍕 Fellesskap / Mat", url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
  { label: "📖 Bibel & Kaffe", url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80" },
  { label: "☕ Kaffekos", url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80" },
];

/** The text field, the picture button and the send button at the bottom of the room. */
export const MessageComposer: React.FC<Props> = ({ groupName, onSend, showFeedback }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPictureTooLarge(file.size)) {
      showFeedback("Bildet er for stort. Maks størrelse er 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);

    // Reset the field so the same file can be chosen again
    e.target.value = "";
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && !image) return;

    const res = onSend(trimmed, image || undefined);
    if (res.success) {
      setContent("");
      setImage(null);
    } else if (res.error) {
      showFeedback(res.error);
    }
  };

  const canSend = Boolean(content.trim() || image);

  return (
    <>
      {image && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
            <img src={image} alt="Forhåndsvisning" className="w-full h-full object-cover" />
            <button
              type="button"
              id="btn-remove-selected-image"
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-slate-600 flex-1 min-w-0">
            <span className="font-bold block text-slate-800">Bilde vedlagt</span>
            <span className="text-[11px] text-slate-500">Bildet sendes sammen med meldingen.</span>
          </div>
        </div>
      )}

      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <input ref={fileInput} type="file" accept="image/*" id="chat-file-input" className="hidden" onChange={handleFileChange} />

        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-attach-image"
              onClick={() => fileInput.current?.click()}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Velg bilde eller ta bilde med kamera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              id="input-chat-message"
              rows={1}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Skriv en melding til ${groupName}...`}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 focus:bg-white focus:outline-emerald-600 text-slate-900 resize-none min-h-[40px] max-h-24 leading-normal"
            />
          </div>

          <button
            type="button"
            id="btn-send-chat-message"
            disabled={!canSend}
            onClick={handleSend}
            className="p-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed shrink-0"
            title="Send melding"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none text-[11px] text-slate-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Hurtigbilde:</span>
          {QUICK_PICTURES.map((picture) => (
            <button
              key={picture.label}
              type="button"
              onClick={() => setImage(picture.url)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors shrink-0"
            >
              {picture.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
