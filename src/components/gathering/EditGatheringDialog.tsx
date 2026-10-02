import React, { useState } from "react";
import { parseIsoToDateAndTime, combineDateAndTimeToIso } from "../../utils/dates";
import { isPubliclyVisible, visibilityFields, visibilityAfterToggle } from "../../utils/visibility";
import { Gathering } from "../../types";
import {
  X,
  Edit3,
  Save,
} from "lucide-react";
import { GatheringDetail } from "./gatheringDetail";

interface EditGatheringDialogProps {
  detail: GatheringDetail;
  gathering: Gathering;
  showToast: (text: string) => void;
  onClose: () => void;
}

export const EditGatheringDialog: React.FC<EditGatheringDialogProps> = ({ detail, gathering, showToast, onClose }) => {
  const { updateGathering } = detail;

  // The form starts from the gathering as it is when the dialog opens
  const [editGatheringTitle, setEditGatheringTitle] = useState<string>(gathering.title);
  const [editGatheringDate, setEditGatheringDate] = useState<string>(() => parseIsoToDateAndTime(gathering.startsAt).date);
  const [editGatheringTime, setEditGatheringTime] = useState<string>(() => parseIsoToDateAndTime(gathering.startsAt).time);
  const [editGatheringEndTime, setEditGatheringEndTime] = useState<string>(() =>
    gathering.endsAt ? parseIsoToDateAndTime(gathering.endsAt).time : "12:00"
  );
  const [editGatheringLocation, setEditGatheringLocation] = useState<string>(gathering.location || "");
  const [editGatheringIsPublic, setEditGatheringIsPublic] = useState<boolean>(isPubliclyVisible(gathering));
  const [editGatheringIsGudstjeneste, setEditGatheringIsGudstjeneste] = useState<boolean>(gathering.isGudstjeneste || false);
  const [editGatheringCancelled, setEditGatheringCancelled] = useState<boolean>(gathering.cancelled || false);

  const handleSaveGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gathering) return;
    if (!editGatheringTitle.trim()) {
      showToast("Tittel kan ikke være tom.");
      return;
    }
    if (!editGatheringDate) {
      showToast("Dato må fylles ut.");
      return;
    }
    const startsAt = combineDateAndTimeToIso(editGatheringDate, editGatheringTime || "11:00");
    const endsAt = editGatheringEndTime
      ? combineDateAndTimeToIso(editGatheringDate, editGatheringEndTime)
      : undefined;
    const res = updateGathering(gathering.id, {
      title: editGatheringTitle.trim(),
      startsAt,
      endsAt,
      location: editGatheringLocation.trim() || undefined,
      // `visibility` is what the public site and API read; storing only `isPublic` changed nothing there
      ...visibilityFields(visibilityAfterToggle(gathering.visibility, editGatheringIsPublic)),
      isGudstjeneste: editGatheringIsGudstjeneste,
      cancelled: editGatheringCancelled,
    });
    if (res.success) {
      showToast("Arrangementet ble oppdatert!");
      onClose();
    } else {
      showToast(res.error || "Kunne ikke oppdatere arrangement.");
    }
  };

  return (
    <div
      id="modal-edit-gathering-detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-slate-200 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            Rediger arrangement
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveGathering} className="space-y-2.5 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
              Tittel <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              id="input-detail-edit-gathering-title"
              value={editGatheringTitle}
              onChange={(e) => setEditGatheringTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                Dato <span className="text-red-500">*</span>:
              </label>
              <input
                type="date"
                id="input-detail-edit-gathering-date"
                value={editGatheringDate}
                onChange={(e) => setEditGatheringDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                Starttid:
              </label>
              <input
                type="time"
                id="input-detail-edit-gathering-time"
                value={editGatheringTime}
                onChange={(e) => setEditGatheringTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
              Sluttid:
            </label>
            <input
              type="time"
              id="input-detail-edit-gathering-end-time"
              value={editGatheringEndTime}
              onChange={(e) => setEditGatheringEndTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
              Sted:
            </label>
            <input
              type="text"
              id="input-detail-edit-gathering-location"
              value={editGatheringLocation}
              onChange={(e) => setEditGatheringLocation(e.target.value)}
              placeholder="F.eks. Hovedsalen"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="input-detail-edit-gathering-is-public"
                checked={editGatheringIsPublic}
                onChange={(e) => setEditGatheringIsPublic(e.target.checked)}
                className="w-4 h-4 border border-slate-300 rounded-md cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Vis offentlig på nettside (isPublic)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="input-detail-edit-gathering-is-gudstjeneste"
                checked={editGatheringIsGudstjeneste}
                onChange={(e) => setEditGatheringIsGudstjeneste(e.target.checked)}
                className="w-4 h-4 border border-slate-300 rounded-md cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Er gudstjeneste (isGudstjeneste)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="input-detail-edit-gathering-cancelled"
                checked={editGatheringCancelled}
                onChange={(e) => setEditGatheringCancelled(e.target.checked)}
                className="w-4 h-4 border border-slate-300 rounded-md cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Avlyst (cancelled)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              id="btn-cancel-detail-edit-gathering"
              onClick={() => onClose()}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              id="btn-save-detail-edit-gathering"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Lagre endringer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
