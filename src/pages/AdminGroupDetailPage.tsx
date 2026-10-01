import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useAdminGroupDetail,
  GROUP_CATEGORIES,
  MEETING_FREQUENCIES,
  WEEKDAYS,
  formatNorwegianDateTime,
} from "../hooks/useAppHooks";
import { GroupCategory } from "../types";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  ArrowLeft,
  Users,
  UserCheck,
  UserCog,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Save,
  Tag,
  Repeat,
} from "lucide-react";

export const AdminGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const {
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    allPersons,
    groupGatherings,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  } = useAdminGroupDetail(groupId || "");

  // Form states
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<GroupCategory>("tjenestegruppe");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [selectedDeputyId, setSelectedDeputyId] = useState<string>("");
  const [weekday, setWeekday] = useState<string>("Søndag");
  const [time, setTime] = useState<string>("11:00");
  const [frequency, setFrequency] = useState<"hver uke" | "annenhver uke" | "hver måned">("hver uke");
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState<string>("");

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setCategory(group.category || "tjenestegruppe");
      setSelectedLeaderId(group.leaderIds[0] || "");
      setSelectedDeputyId(group.deputyLeaderIds?.[0] || "");
      if (group.meetingSchedule) {
        setWeekday(group.meetingSchedule.weekday);
        setTime(group.meetingSchedule.time);
        setFrequency(group.meetingSchedule.frequency);
      }
    }
  }, [group]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!group) return;

    if (!name.trim()) {
      showFeedback("Gruppenavn kan ikke være tomt.", "error");
      return;
    }

    const res = updateGroup(group.id, {
      name: name.trim(),
      category,
      leaderIds: selectedLeaderId ? [selectedLeaderId] : [],
      deputyLeaderIds: selectedDeputyId ? [selectedDeputyId] : [],
      meetingSchedule: {
        weekday,
        time,
        frequency,
      },
    });

    if (res.success) {
      showFeedback("Gruppeinformasjon og møteplan ble lagret!");
    } else {
      showFeedback(res.error || "Kunne ikke lagre gruppe.", "error");
    }
  };

  const handleAddMember = () => {
    if (!group || !selectedPersonToAdd) return;
    const res = addGroupMember(group.id, selectedPersonToAdd);
    if (res.success) {
      const addedPerson = allPersons.find((p) => p.id === selectedPersonToAdd);
      showFeedback(`${addedPerson?.name || "Personen"} ble lagt til som medlem i gruppen!`);
      setSelectedPersonToAdd("");
    } else {
      showFeedback(res.error || "Kunne ikke legge til medlem.", "error");
    }
  };

  const handleRemoveMember = (personId: string, memberName: string) => {
    if (!group) return;
    const res = removeGroupMember(group.id, personId);
    if (res.success) {
      showFeedback(`${memberName} ble fjernet fra gruppen.`);
    } else {
      showFeedback(res.error || "Kunne ikke fjerne medlem.", "error");
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
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til denne admin-siden.
            </p>
          </div>
          <Link
            to="/"
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
  if (!group) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fant ikke gruppen</h3>
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

  const currentCategoryLabel =
    GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label ||
    "Tjenestegruppe";

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
          Gruppeadministrasjon
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-group-feedback-toast"
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
        {/* Main Group Edit Card */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gruppe ID: {group.id}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-0.5">{group.name}</h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentCategoryLabel}
              </span>
            </div>

            {/* 1. Gruppenavn */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-edit-group-name"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                Gruppenavn:
              </label>
              <input
                type="text"
                id="input-edit-group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Lyd og bilde..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* 2. Gruppekategori */}
            <div className="space-y-1.5">
              <label
                htmlFor="select-edit-group-category"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Gruppekategori:
              </label>
              <select
                id="select-edit-group-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GroupCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
              >
                {GROUP_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Leder & 4. Nestleder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              {/* Leder */}
              <div className="space-y-1.5">
                <label
                  htmlFor="select-edit-group-leader"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Leder (Group.leaderIds):
                </label>
                <select
                  id="select-edit-group-leader"
                  value={selectedLeaderId}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                  {members.length === 0 && (
                    <option value="">Ingen medlemmer i gruppen</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400">
                  Styrer hvem som har lederadgang på /leder
                </p>
              </div>

              {/* Nestleder */}
              <div className="space-y-1.5">
                <label
                  htmlFor="select-edit-group-deputy"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <UserCog className="w-3.5 h-3.5 text-blue-600" />
                  Nestleder (Group.deputyLeaderIds):
                </label>
                <select
                  id="select-edit-group-deputy"
                  value={selectedDeputyId}
                  onChange={(e) => setSelectedDeputyId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Ingen nestleder valgt --</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Vises som nestleder for gruppen
                </p>
              </div>
            </div>

            {/* 5. Møteplan */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  Gruppens møteplan (normaltid)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Sprint 4.1</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Ukedag */}
                <div className="space-y-1">
                  <label
                    htmlFor="select-schedule-weekday"
                    className="text-[11px] font-semibold text-slate-600 block"
                  >
                    Ukedag:
                  </label>
                  <select
                    id="select-schedule-weekday"
                    value={weekday}
                    onChange={(e) => setWeekday(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Klokkeslett */}
                <div className="space-y-1">
                  <label
                    htmlFor="input-schedule-time"
                    className="text-[11px] font-semibold text-slate-600 block"
                  >
                    Klokkeslett:
                  </label>
                  <input
                    type="text"
                    id="input-schedule-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="19:00"
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Frekvens */}
                <div className="space-y-1">
                  <label
                    htmlFor="select-schedule-frequency"
                    className="text-[11px] font-semibold text-slate-600 block"
                  >
                    Frekvens:
                  </label>
                  <select
                    id="select-schedule-frequency"
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(
                        e.target.value as "hver uke" | "annenhver uke" | "hver måned"
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
                  >
                    {MEETING_FREQUENCIES.map((freq) => (
                      <option key={freq.id} value={freq.id}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Formatted Meeting Plan Preview */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Aktiv møteplan:
                  </span>
                  <p className="font-bold text-slate-800">
                    {weekday} kl. {time}, {frequency}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-save-group-detail"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Lagre endringer for gruppen
              </button>
            </div>
          </div>
        </form>

        {/* Medlemmer Section */}
        <section
          id="admin-group-members-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Medlemmer i gruppen ({members.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Group.memberIds</span>
          </div>

          <div className="space-y-2">
            {members.map((member) => {
              const isLeader = group.leaderIds.includes(member.id);
              const isDeputy = group.deputyLeaderIds?.includes(member.id);

              return (
                <div
                  key={member.id}
                  id={`group-member-row-${member.id}`}
                  className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <Link
                      to={`/admin/person/${member.id}`}
                      className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                    >
                      {member.name}
                    </Link>
                    <span className="text-[10px] text-slate-400 block font-mono">ID: {member.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLeader && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Leder
                      </span>
                    )}
                    {isDeputy && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Nestleder
                      </span>
                    )}
                    {!isLeader && !isDeputy && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Medlem
                      </span>
                    )}

                    {!isLeader && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="text-[10px] text-slate-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Fjern fra gruppe"
                      >
                        Fjern
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add member selector */}
          {availablePersonsToAdd.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <select
                id="select-add-group-member"
                value={selectedPersonToAdd}
                onChange={(e) => setSelectedPersonToAdd(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 cursor-pointer"
              >
                <option value="">-- Velg person å legge til --</option>
                {availablePersonsToAdd.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.phone || person.email || person.globalRole})
                  </option>
                ))}
              </select>
              <button
                type="button"
                id="btn-add-group-member"
                onClick={handleAddMember}
                disabled={!selectedPersonToAdd}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Legg til
              </button>
            </div>
          )}
        </section>

        {/* Konkrete kommende samlinger (Separate from meeting schedule) */}
        <section
          id="admin-group-gatherings-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Konkrete samlinger for gruppen ({groupGatherings.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Eksisterende Gathering</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dette er faktiske, planlagte samlinger knyttet til gruppen (uavhengig av den generelle møteplanen over).
          </p>

          {groupGatherings.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Ingen konkrete samlinger opprettet for denne gruppen ennå.
            </p>
          ) : (
            <div className="space-y-2">
              {groupGatherings.map(({ gathering, tasks: gTasks, staffing }) => (
                <div
                  key={gathering.id}
                  id={`group-gathering-card-${gathering.id}`}
                  className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{gathering.title}</h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatNorwegianDateTime(gathering.startsAt)}
                        </span>
                        {gathering.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {gathering.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        staffing.color === "red"
                          ? "bg-red-100 text-red-700"
                          : staffing.color === "yellow"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {staffing.badgeText} ({staffing.coveredCount}/{staffing.totalTasks})
                    </span>
                  </div>

                  {/* Task list preview */}
                  <div className="pt-1.5 border-t border-slate-200/60 text-[11px] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Tilknyttede oppgaver ({gTasks.length}):
                    </span>
                    {gTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between py-0.5">
                        <Link
                          to={`/admin/oppgave/${task.id}`}
                          className="text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              task.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700"
                                : task.status === "vacant"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {task.status === "confirmed"
                              ? "Dekket"
                              : task.status === "vacant"
                              ? "Trenger vikar"
                              : "Ledig"}
                          </span>
                          <Link
                            to={`/admin/oppgave/${task.id}`}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Kort →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
