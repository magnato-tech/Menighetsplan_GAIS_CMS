import React, { useState } from "react";
import { MEETING_FREQUENCIES, WEEKDAYS } from "../../data/groupOptions";
import { MeetingSchedule, Group } from "../../types";
import { LeaderGroupDetail } from "./leaderGroupDetail";
import {
  Clock,
} from "lucide-react";

interface GroupScheduleCardProps {
  detail: LeaderGroupDetail;
  group: Group;
  showToast: (text: string) => void;
}

export const GroupScheduleCard: React.FC<GroupScheduleCardProps> = ({ detail, group, showToast }) => {
  const { hasLeaderAccess, updateGroup } = detail;

  // Editing state for meeting schedule
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleWeekday, setScheduleWeekday] = useState(group?.meetingSchedule?.weekday || "Søndag");
  const [scheduleTime, setScheduleTime] = useState(group?.meetingSchedule?.time || "10:00");
  const [scheduleFrequency, setScheduleFrequency] = useState<MeetingSchedule["frequency"]>(
    group?.meetingSchedule?.frequency || "hver uke"
  );

  // Handle Schedule Save
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateGroup(group.id, {
      meetingSchedule: {
        weekday: scheduleWeekday,
        time: scheduleTime,
        frequency: scheduleFrequency,
      },
    });

    if (res.success) {
      setIsEditingSchedule(false);
      showToast("Møteplan ble oppdatert!");
    }
  };

  return (
    <section
      id="section-group-schedule"
      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fast møteplan</span>
        </h2>
        {!isEditingSchedule && hasLeaderAccess && (
          <button
            type="button"
            id="btn-edit-schedule"
            onClick={() => {
              setScheduleWeekday(group.meetingSchedule?.weekday || "Søndag");
              setScheduleTime(group.meetingSchedule?.time || "10:00");
              setScheduleFrequency(group.meetingSchedule?.frequency || "hver uke");
              setIsEditingSchedule(true);
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            Endre møteplan
          </button>
        )}
      </div>

      {isEditingSchedule ? (
        <form onSubmit={handleSaveSchedule} className="space-y-3 pt-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Ukedag
              </label>
              <select
                id="select-schedule-weekday"
                value={scheduleWeekday}
                onChange={(e) => setScheduleWeekday(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tidspunkt
              </label>
              <input
                type="time"
                id="input-schedule-time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Frekvens
              </label>
              <select
                id="select-schedule-frequency"
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value as MeetingSchedule["frequency"])}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
              >
                {MEETING_FREQUENCIES.map((freq) => (
                  <option key={freq.id} value={freq.id}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              id="btn-save-schedule"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Lagre møteplan
            </button>
            <button
              type="button"
              onClick={() => setIsEditingSchedule(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Avbryt
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
          {group.meetingSchedule ? (
            <div className="flex items-center justify-between">
              <span>
                {group.meetingSchedule.weekday}er kl. {group.meetingSchedule.time}
              </span>
              <span className="text-slate-500 font-normal">
                ({group.meetingSchedule.frequency})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Ingen fast møteplan angitt.</span>
          )}
        </div>
      )}
    </section>
  );
};
