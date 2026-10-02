import React, { useState } from "react";
import { useCms } from "../../../context/CmsContext";
import { CmsStaffMember } from "../../../data/cmsData";
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  X,
} from "lucide-react";
import { ShowFeedback } from "../studio";

interface StaffTabProps {
  showFeedback: ShowFeedback;
}

export const StaffTab: React.FC<StaffTabProps> = ({ showFeedback }) => {
  const { staff, saveStaff, deleteStaff } = useCms();

  const [editingStaff, setEditingStaff] = useState<Partial<CmsStaffMember> | null>(null);
  const [isNewStaff, setIsNewStaff] = useState(false);

  const handleOpenEditStaff = (member: CmsStaffMember) => {
    setEditingStaff({ ...member });
    setIsNewStaff(false);
  };

  const handleOpenNewStaff = () => {
    setEditingStaff({
      name: "",
      role: "Medarbeider",
      email: "",
      phone: "",
      category: "stab",
      bio: "",
    });
    setIsNewStaff(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name) {
      showFeedback("Navn må fylles ut", "error");
      return;
    }
    if (!(await saveStaff(editingStaff))) return;
    setEditingStaff(null);
    showFeedback("Stabsmedlemmet ble lagret!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Lederskap & Stab</h2>
          <p className="text-xs text-slate-400">
            Administrer personer som presenteres under Om oss og Kontakt med tittel, bilde, telefon og e-post.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewStaff}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ny medarbeider</span>
        </button>
      </div>

      {/* Staff Editor Form */}
      {editingStaff && (
        <form onSubmit={handleSaveStaff} className="p-6 rounded-2xl bg-slate-800 border border-emerald-500/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{isNewStaff ? "Legg til medarbeider" : `Rediger: ${editingStaff.name}`}</span>
            </h3>
            <button type="button" onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Navn</label>
              <input
                type="text"
                value={editingStaff.name || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                placeholder="f.eks. Kari Nordmann"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Stilling / Rolle</label>
              <input
                type="text"
                value={editingStaff.role || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                placeholder="f.eks. Hovedpastor"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">E-post</label>
              <input
                type="email"
                value={editingStaff.email || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                placeholder="pastor@lillesandmisjonskirke.no"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Telefon</label>
              <input
                type="text"
                value={editingStaff.phone || ""}
                onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                placeholder="912 34 567"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Kort bio / beskrivelse</label>
            <textarea
              rows={2}
              value={editingStaff.bio || ""}
              onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingStaff(null)}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
            >
              Lagre til Firestore
            </button>
          </div>
        </form>
      )}

      {/* List of Staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                {member.role}
              </span>
              <h3 className="font-bold text-white text-base">{member.name}</h3>
              {member.bio && <p className="text-xs text-slate-400 line-clamp-2">{member.bio}</p>}
              <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                {member.phone && <div>Tlf: {member.phone}</div>}
                {member.email && <div>E-post: {member.email}</div>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => handleOpenEditStaff(member)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rediger</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette "${member.name}"?`)) {
                    if (await deleteStaff(member.id)) showFeedback("Medarbeider slettet");
                  }
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                title="Slett"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
