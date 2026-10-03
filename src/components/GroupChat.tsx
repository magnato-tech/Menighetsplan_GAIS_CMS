import React, { useState } from "react";
import { Lock, X } from "lucide-react";
import { useGroupRoom } from "../hooks/useAppHooks";
import { GroupMessage } from "../types";
import { useTimedMessage } from "../hooks/useTimedMessage";
import { ChatHeader } from "./groupChat/ChatHeader";
import { ChatLightbox } from "./groupChat/ChatLightbox";
import { ChatMessageList } from "./groupChat/ChatMessageList";
import type { OpenedImage } from "./groupChat/ChatMessageBubble";
import { DeleteMessageDialog } from "./groupChat/DeleteMessageDialog";
import { MessageComposer } from "./groupChat/MessageComposer";

export const GroupChat: React.FC<{
  groupId?: string;
}> = ({ groupId }) => {
  const { group, isMember, messages, sendMessage, deleteMessage, notificationsEnabled, toggleNotifications, currentUser } =
    useGroupRoom(groupId);

  const [feedback, showFeedback, clearFeedback] = useTimedMessage<string>();
  const [lightboxImage, setLightboxImage] = useState<OpenedImage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<GroupMessage | null>(null);

  if (!group) {
    return <div className="p-6 text-center text-xs text-slate-400">Ingen gruppe funnet.</div>;
  }

  // Only group members have access to the confidential room
  if (!isMember) {
    return (
      <div id="chat-access-denied" className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-6 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Lukket internt rom</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
            Chatten i <strong>{group.name}</strong> er et konfidensielt rom forbeholdt gruppens medlemmer. Du må være
            registrert som medlem for å se innholdet.
          </p>
        </div>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (!messageToDelete) return;
    const res = deleteMessage(messageToDelete.id);
    setMessageToDelete(null);

    if (res.success) {
      showFeedback("Meldingen ble slettet.", 2500);
    } else if (res.error) {
      showFeedback(res.error);
    }
  };

  return (
    <div
      id={`group-chat-${group.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all"
    >
      <ChatHeader
        groupName={group.name}
        messageCount={messages.length}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => toggleNotifications()}
      />

      <ChatMessageList
        groupId={group.id}
        messages={messages}
        currentUserId={currentUser.id}
        onOpenImage={setLightboxImage}
        onDelete={setMessageToDelete}
      />

      {feedback && (
        <div className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={clearFeedback} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <MessageComposer
        groupName={group.name}
        onSend={(content, imageUrl) => sendMessage(content, imageUrl)}
        showFeedback={showFeedback}
      />

      {lightboxImage && <ChatLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
      {messageToDelete && (
        <DeleteMessageDialog onCancel={() => setMessageToDelete(null)} onConfirm={handleConfirmDelete} />
      )}
    </div>
  );
};
