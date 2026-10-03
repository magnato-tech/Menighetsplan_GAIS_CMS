import React from "react";
import { Clock, Repeat } from "lucide-react";
import { MEETING_FREQUENCIES, WEEKDAYS } from "../../hooks/useAppHooks";
import type { MeetingSchedule } from "../../types";
import type { GroupFormValues } from "../../utils/groupForm";
import type { SetGroupField } from "./useGroupForm";

interface Props {
  form: GroupFormValues;
  set: SetGroupField;
}

const fieldClass =
  "w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800";
const labelClass = "text-[11px] font-semibold text-slate-600 block";

/** Whether the group meets at a fixed time, and when. */
export const GroupScheduleFields: React.FC<Props> = ({ form, set }) => (
  <div className="pt-2 border-t border-slate-100 space-y-3">
    <label
      htmlFor="input-edit-group-has-schedule"
      className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
    >
      <input
        type="checkbox"
        id="input-edit-group-has-schedule"
        checked={form.hasSchedule}
        onChange={(e) => set("hasSchedule", e.target.checked)}
        className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
      />
      <Repeat className="w-3.5 h-3.5 text-indigo-600" />
      Gruppen har fast møtetid
    </label>

    {form.hasSchedule && (
      <>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label htmlFor="select-schedule-weekday" className={labelClass}>
              Ukedag:
            </label>
            <select
              id="select-schedule-weekday"
              value={form.weekday}
              onChange={(e) => set("weekday", e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="input-schedule-time" className={labelClass}>
              Klokkeslett:
            </label>
            <input
              type="text"
              id="input-schedule-time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              placeholder="19:00"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="select-schedule-frequency" className={labelClass}>
              Frekvens:
            </label>
            <select
              id="select-schedule-frequency"
              value={form.frequency}
              onChange={(e) => set("frequency", e.target.value as MeetingSchedule["frequency"])}
              className={`${fieldClass} cursor-pointer`}
            >
              {MEETING_FREQUENCIES.map((freq) => (
                <option key={freq.id} value={freq.id}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Aktiv møteplan:</span>
            <p className="font-bold text-slate-800">
              {form.weekday} kl. {form.time}, {form.frequency}
            </p>
          </div>
        </div>
      </>
    )}
  </div>
);
