import React from "react";
import { Bell, BellOff, Info } from "lucide-react";

interface Props {
  groupName: string;
  messageCount: number;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

/** The title of the room with the message count and the notification switch, and the note about who can read it. */
export const ChatHeader: React.FC<Props> = ({ groupName, messageCount, notificationsEnabled, onToggleNotifications }) => (
  <>
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-slate-800 truncate">Felles samtale</h3>
          <p className="text-[11px] text-slate-500 truncate">
            {groupName} • {messageCount} {messageCount === 1 ? "melding" : "meldinger"}
          </p>
        </div>
      </div>

      <button
        type="button"
        id="btn-toggle-notifications"
        onClick={onToggleNotifications}
        title={
          notificationsEnabled
            ? `Varsler er på for ${groupName}. Klikk for å slå av.`
            : `Varsler er av for ${groupName}. Klikk for å slå på.`
        }
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          notificationsEnabled
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100"
            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/70"
        }`}
      >
        {notificationsEnabled ? (
          <>
            <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px]">Varsler på</span>
          </>
        ) : (
          <>
            <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px]">Varsler av</span>
          </>
        )}
      </button>
    </div>

    <div className="px-4 py-2 bg-emerald-50/40 border-b border-emerald-100/50 flex items-center gap-2 text-[11px] text-slate-600">
      <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span className="truncate">Internt rom. Nye medlemmer ser kun meldinger publisert etter at de ble medlem.</span>
    </div>
  </>
);
