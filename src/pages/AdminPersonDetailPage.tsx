import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAdminPersonDetail } from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { toPublicProfile, publicProfileFields } from "../utils/publicProfile";
import {
  Shield,
  Globe,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Users,
  UserCheck,
  UserCog,
  CheckCircle2,
  AlertTriangle,
  Save,
  CheckSquare,
  BadgeCheck,
  CalendarX,
  Plus,
  Trash2,
} from "lucide-react";

export const AdminPersonDetailPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();

  const {
    isAdmin,
    currentUser,
    person,
    personGroups,
    personTasks,
    updatePerson,
  } = useAdminPersonDetail(personId || "");

  // Form states
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [globalRole, setGlobalRole] = useState<"member" | "admin">("member");
  const [policeCert, setPoliceCert] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<{ from: string; to: string; reason?: string }[]>([]);
  const [newUnavailFrom, setNewUnavailFrom] = useState<string>("");
  const [newUnavailTo, setNewUnavailTo] = useState<string>("");
  const [newUnavailReason, setNewUnavailReason] = useState<string>("");
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [publicTitle, setPublicTitle] = useState<string>("");
  const [publicPhone, setPublicPhone] = useState<string>("");
  const [publicEmail, setPublicEmail] = useState<string>("");

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setPhone(person.phone || "");
      setEmail(person.email || "");
      setGlobalRole(person.globalRole || "member");
      setPoliceCert(person.policeCertificateValidUntil || "");
      setUnavailablePeriods(person.unavailablePeriods || []);
      setIsPublicProfile(toPublicProfile(person) !== null);
      setPublicTitle(person.publicTitle || "");
      setPublicPhone(person.publicPhone || "");
      setPublicEmail(person.publicEmail || "");
    }
  }, [person]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddUnavailablePeriod = () => {
    if (!newUnavailFrom || !newUnavailTo) {
      showFeedback("Både fra- og til-dato må oppgis for fravær.", "error");
      return;
    }
    const updated = [
      ...unavailablePeriods,
      {
        from: newUnavailFrom,
        to: newUnavailTo,
        reason: newUnavailReason.trim() || undefined,
      },
    ];
    setUnavailablePeriods(updated);
    setNewUnavailFrom("");
    setNewUnavailTo("");
    setNewUnavailReason("");
    showFeedback("Fraværsperiode lagt til!");
  };

  const handleRemoveUnavailablePeriod = (idx: number) => {
    setUnavailablePeriods(unavailablePeriods.filter((_, i) => i !== idx));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!person) return;

    if (!name.trim()) {
      showFeedback("Navn kan ikke være tomt.", "error");
      return;
    }

    const res = updatePerson(person.id, {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      globalRole,
      policeCertificateValidUntil: policeCert || undefined,
      unavailablePeriods,
      ...publicProfileFields(
        person,
        { isPublic: isPublicProfile, title: publicTitle, phone: publicPhone, email: publicEmail },
        currentUser.id
      ),
    });

    if (res.success) {
      showFeedback("Personopplysninger og tilganger ble lagret!");
    } else {
      showFeedback(res.error || "Kunne ikke lagre person.", "error");
    }
  };

  // Friendly access denied screen if user is not admin
  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Admin-tilgang kreves</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til personkort i admin-flaten.
            </p>
          </div>
          <Link
            to="/minside"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Min side
          </Link>
        </div>
      </div>
    );
  }

  // Not found
  if (!person) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fant ikke personen</h3>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Admin-oversikt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Header */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Personkort
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-person-feedback-toast"
          className={`mx-5 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Main Person Edit Card */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{person.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {person.id}</span>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  person.globalRole === "admin"
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {person.globalRole === "admin" ? "Global Admin" : "Medlem (member)"}
              </span>
            </div>

            {/* 1. Navn */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-edit-person-name"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Fullt navn:
              </label>
              <input
                type="text"
                id="input-edit-person-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Kari Nordmann..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* 2. Mobil */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-edit-person-phone"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                Mobilnummer:
              </label>
              <input
                type="tel"
                id="input-edit-person-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="F.eks. 912 34 567"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* 3. E-post */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-edit-person-email"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                E-postadresse:
              </label>
              <input
                type="email"
                id="input-edit-person-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="F.eks. kari@eksempel.no"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* 4. Global Rolle (Sikrer støtte for flere co-admins) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label
                htmlFor="select-edit-person-role"
                className="text-xs font-bold text-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Global systemrolle:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Muliggjør 2+ likestilte administratorer)
                </span>
              </label>
              <select
                id="select-edit-person-role"
                value={globalRole}
                onChange={(e) => setGlobalRole(e.target.value as "member" | "admin")}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              >
                <option value="member">Medlem / Frivillig (standard tilgang)</option>
                <option value="admin">Administrator (full tilgang til Admin Studio & CMS)</option>
              </select>
            </div>

            {/* 5. Politiattest for barne- og ungdomsarbeid */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label
                htmlFor="input-edit-person-police"
                className="text-xs font-bold text-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Politiattest (gyldig til dato):
                </span>
                {policeCert ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Registrert ({policeCert})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">Ikke registrert</span>
                )}
              </label>
              <input
                type="date"
                id="input-edit-person-police"
                value={policeCert}
                onChange={(e) => setPoliceCert(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              />
              <p className="text-[10px] text-slate-500">
                Påkrevd for frivillige som arbeider med mindreårige (søndagsskole og barneleir).
              </p>
            </div>

            {/* 6. Utilgjengelighetskalender ("Borte fra–til") */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CalendarX className="w-3.5 h-3.5 text-amber-600" />
                  Utilgjengelig / Bortreist:
                </span>
                <span className="text-[10px] text-slate-400">
                  {unavailablePeriods.length} perioder registrert
                </span>
              </div>

              {unavailablePeriods.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {unavailablePeriods.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg border border-slate-200/60"
                    >
                      <div>
                        <strong className="text-slate-800">
                          {p.from} til {p.to}
                        </strong>
                        {p.reason && <span className="text-slate-500 ml-1.5">({p.reason})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnavailablePeriod(idx)}
                        className="text-rose-500 hover:text-rose-700 text-[11px] p-1 cursor-pointer"
                        title="Fjern fraværsperiode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Period Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <input
                  type="date"
                  value={newUnavailFrom}
                  onChange={(e) => setNewUnavailFrom(e.target.value)}
                  placeholder="Fra dato"
                  className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="date"
                  value={newUnavailTo}
                  onChange={(e) => setNewUnavailTo(e.target.value)}
                  placeholder="Til dato"
                  className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newUnavailReason}
                    onChange={(e) => setNewUnavailReason(e.target.value)}
                    placeholder="Årsak (f.eks. Ferie)"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnavailablePeriod}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0 cursor-pointer"
                    title="Legg til fravær"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 7. Offentlig profil på nettsiden (krever samtykke) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  Offentlig profil på nettsiden:
                </span>
                {toPublicProfile(person) ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Vises offentlig
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">Vises ikke</span>
                )}
              </div>

              <label htmlFor="input-edit-person-public" className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="input-edit-person-public"
                  checked={isPublicProfile}
                  onChange={(e) => setIsPublicProfile(e.target.checked)}
                  className="w-4 h-4 mt-0.5 border border-slate-300 rounded-md cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-700">
                  Personen har samtykket til å stå med navn på den offentlige nettsiden
                </span>
              </label>

              {person.consentToPublishGivenAt && (
                <p className="text-[10px] text-slate-500">
                  Samtykke registrert {new Date(person.consentToPublishGivenAt).toLocaleDateString("no-NO")}.
                </p>
              )}

              {isPublicProfile && (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    id="input-edit-person-public-title"
                    aria-label="Tittel utad"
                    value={publicTitle}
                    onChange={(e) => setPublicTitle(e.target.value)}
                    placeholder="Tittel utad, f.eks. Hovedpastor"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    id="input-edit-person-public-phone"
                    aria-label="Telefon utad"
                    value={publicPhone}
                    onChange={(e) => setPublicPhone(e.target.value)}
                    placeholder="Telefon utad (valgfritt)"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    id="input-edit-person-public-email"
                    aria-label="E-post utad"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    placeholder="E-post utad (valgfritt)"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Bare navnet og disse feltene vises utad. Privat mobilnummer og e-postadresse publiseres aldri.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                type="submit"
                id="btn-save-person-detail"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Lagre alle personopplysninger & tilganger
              </button>
            </div>
          </div>
        </form>

        {/* Roles and Group Memberships */}
        <section
          id="person-groups-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Gruppetilhørighet ({personGroups.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Group.memberIds</span>
          </div>

          {personGroups.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Personen er ikke medlem av noen grupper ennå.
            </p>
          ) : (
            <div className="space-y-2">
              {personGroups.map((group) => {
                const isLeader = group.leaderIds.includes(person.id);
                const isDeputy = group.deputyLeaderIds?.includes(person.id);

                return (
                  <div
                    key={group.id}
                    className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <Link
                        to={`/admin/gruppe/${group.id}`}
                        className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {group.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {group.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLeader && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Leder
                        </span>
                      )}
                      {isDeputy && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <UserCog className="w-3 h-3" />
                          Nestleder
                        </span>
                      )}
                      {!isLeader && !isDeputy && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          Medlem
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Assigned Tasks Summary */}
        <section
          id="person-tasks-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Tildelte oppgaver ({personTasks.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Assignment</span>
          </div>

          {personTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              Ingen aktive oppgaver tildelt denne personen for øyeblikket.
            </p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {personTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2 bg-slate-50/70 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-700 font-medium">{task.title}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      task.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : task.status === "vacant"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {task.status === "confirmed" ? "Bekreftet" : task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
