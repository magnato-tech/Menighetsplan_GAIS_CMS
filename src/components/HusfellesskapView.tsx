import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useHusfellesskap, formatNorwegianDateTime } from "../hooks/useAppHooks";
import { HusfellesskapChat } from "./HusfellesskapChat";
import { Gathering } from "../types";
import {
  Calendar,
  MapPin,
  BookOpen,
  Check,
  X,
  Users,
  MessageSquare,
  UserCheck,
  Clock,
  Send,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  UserX,
  Sparkles,
  Home,
  Layers,
} from "lucide-react";

export const HusfellesskapView: React.FC<{
  groupId?: string;
  defaultTab?: "meeting" | "chat" | "members";
  compact?: boolean;
}> = ({ groupId, defaultTab = "meeting", compact = false }) => {
  const {
    group,
    isMember,
    isLeader,
    isDeputyLeader,
    leaders,
    deputyLeaders,
    members,
    allGroupMeetings,
    nextMeeting,
    activeMeeting,
    selectedMeetingId,
    setSelectedMeetingId,
    hostPerson,
    attendingMembers,
    declinedMembers,
    unrespondedMembers,
    currentUserAttendance,
    respond,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    sendInvitation,
    messages,
    currentUser,
    allPersons,
  } = useHusfellesskap(groupId);

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as "meeting" | "chat" | "members" | null;
  const [activeTab, setActiveTab] = useState<"meeting" | "chat" | "members">(urlTab || defaultTab);

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Modal / Accordion state for creating and editing meetings
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states for meeting creation
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("19:30");
  const [formLocation, setFormLocation] = useState("");
  const [formHostId, setFormHostId] = useState("");
  const [formTheme, setFormTheme] = useState("");
  const [formBibleText, setFormBibleText] = useState("");
  const [formSendImmediately, setFormSendImmediately] = useState(true);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  if (!group) {
    return null;
  }

  const isAttending = currentUserAttendance?.status === "attending";
  const isDeclined = currentUserAttendance?.status === "declined";
  const hasResponded = !!currentUserAttendance;

  const handleRespond = async (status: "attending" | "declined") => {
    if (!activeMeeting) return;
    setSubmitting(true);
    const res = await respond(status, activeMeeting.id);
    setSubmitting(false);
    if (res.success) {
      showToast(status === "attending" ? "Du er registrert som KOMMER!" : "Du er registrert som KOMMER IKKE.");
    } else {
      showToast(res.error || "Kunne ikke registrere svar.", "info");
    }
  };

  const handleSendInvitation = async () => {
    if (!activeMeeting) return;
    setSubmitting(true);
    const res = await sendInvitation(activeMeeting.id);
    setSubmitting(false);
    if (res.success) {
      showToast("Møteinnkalling er sendt ut til alle gruppemedlemmer!");
    } else {
      showToast(res.error || "Kunne ikke sende innkalling.", "info");
    }
  };

  const handleOpenCreateModal = () => {
    setFormTitle(`Husfellesskap`);
    // Default to next week same time
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime("19:30");
    setFormLocation("");
    setFormHostId(members[0]?.id || "");
    setFormTheme("");
    setFormBibleText("");
    setFormSendImmediately(true);
    setShowCreateModal(true);
  };

  const handleSaveNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formTitle) {
      showToast("Vennligst fyll ut dato og tittel.", "info");
      return;
    }
    const startsAt = new Date(`${formDate}T${formTime || "19:30"}:00`).toISOString();
    let computedLocation = formLocation;
    if (!computedLocation && formHostId) {
      const host = allPersons.find((p) => p.id === formHostId);
      if (host) computedLocation = `Hos ${host.name}`;
    }

    const res = await createMeeting({
      title: formTitle,
      startsAt,
      location: computedLocation,
      hostPersonId: formHostId || undefined,
      theme: formTheme || undefined,
      bibleText: formBibleText || undefined,
      sendInvitationImmediately: formSendImmediately,
    });

    if (res.success) {
      setShowCreateModal(false);
      showToast(
        formSendImmediately
          ? "Nytt møte opprettet og innkalling sendt!"
          : "Nytt møte opprettet som utkast."
      );
    } else {
      showToast(res.error || "Kunne ikke opprette møte", "info");
    }
  };

  const handleOpenEditModal = () => {
    if (!activeMeeting) return;
    setFormTitle(activeMeeting.title || "Husfellesskap");
    const d = new Date(activeMeeting.startsAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime(`${hh}:${min}`);
    setFormLocation(activeMeeting.location || "");
    setFormHostId(activeMeeting.hostPersonId || "");
    setFormTheme(activeMeeting.theme || "");
    setFormBibleText(activeMeeting.bibleText || "");
    setShowEditModal(true);
  };

  const handleSaveEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeeting) return;
    const startsAt = new Date(`${formDate}T${formTime || "19:30"}:00`).toISOString();
    let computedLocation = formLocation;
    if (!computedLocation && formHostId) {
      const host = allPersons.find((p) => p.id === formHostId);
      if (host) computedLocation = `Hos ${host.name}`;
    }

    const res = await updateMeeting(activeMeeting.id, {
      title: formTitle,
      startsAt,
      location: computedLocation,
      hostPersonId: formHostId || undefined,
      theme: formTheme || undefined,
      bibleText: formBibleText || undefined,
    });

    if (res.success) {
      setShowEditModal(false);
      showToast("Møteinformasjonen ble oppdatert!");
    } else {
      showToast(res.error || "Kunne ikke oppdatere møtet.", "info");
    }
  };

  const handleDeleteMeeting = async () => {
    if (!activeMeeting) return;
    if (window.confirm("Er du sikker på at du vil slette dette møtet?")) {
      const res = await deleteMeeting(activeMeeting.id);
      if (res.success) {
        setShowEditModal(false);
        showToast("Møtet ble slettet.");
      }
    }
  };

  const totalMembersCount = members.length;
  const answeredCount = attendingMembers.length + declinedMembers.length;

  return (
    <div
      id={`husfellesskap-view-${group.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* Group Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3 text-emerald-700" />
              Husfellesskap
            </span>
            {(isLeader || isDeputyLeader) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                {isLeader ? "Du er leder" : "Du er nestleder"}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-800">{group.name}</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {leaders.length > 0 && `Leder: ${leaders.map((l) => l.name).join(", ")}`}
            {deputyLeaders.length > 0 && ` • Nestleder: ${deputyLeaders.map((d) => d.name).join(", ")}`}
          </p>
        </div>

        {/* Quick leader action: create meeting */}
        {(isLeader || isDeputyLeader) && (
          <button
            type="button"
            id="btn-create-meeting-header"
            onClick={handleOpenCreateModal}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ny samling</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation: Samling, Gruppechat, Medlemmer */}
      <div className="px-4 pt-3 pb-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5">
        <button
          type="button"
          id="tab-btn-samling"
          onClick={() => setActiveTab("meeting")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "meeting"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Samling & Innkalling</span>
        </button>

        <button
          type="button"
          id="tab-btn-chat"
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === "chat"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>Gruppechat</span>
          {messages.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              {messages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-btn-medlemmer"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "members"
              ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Medlemmer ({members.length})</span>
        </button>
      </div>

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          role="status"
          className={`mx-5 mt-4 p-3 rounded-2xl border transition-all text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-950 border-emerald-300"
              : "bg-amber-50 text-amber-950 border-amber-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Content 1: Samling & Oppmøte */}
      {activeTab === "meeting" && (
        <div id="section-husfellesskap-meeting" className="p-5 space-y-5">
          {/* Multi-meeting selector dropdown if group has multiple meetings */}
          {allGroupMeetings.length > 1 && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                Velg samling:
              </span>
              <select
                id="select-active-meeting"
                value={activeMeeting?.id || ""}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="font-bold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-emerald-600 cursor-pointer"
              >
                {allGroupMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({new Date(m.startsAt).toLocaleDateString("no-NO", { day: "numeric", month: "short" })})
                    {m.invitationSent ? " • Sendt" : " • Utkast"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeMeeting ? (
            <>
              {/* Meeting Status & Meta Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Neste samling
                    </span>
                    {/* Invitation sent status badge */}
                    {activeMeeting.invitationSent ? (
                      <span
                        id={`badge-invitation-sent-${activeMeeting.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.8 rounded-full border border-emerald-200"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Innkalling sendt</span>
                      </span>
                    ) : (
                      <span
                        id={`badge-invitation-draft-${activeMeeting.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.8 rounded-full border border-amber-200"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        <span>Utkast • Ikke sendt ennå</span>
                      </span>
                    )}
                  </div>

                  {/* Leader Controls: Edit / Send */}
                  {(isLeader || isDeputyLeader) && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id="btn-edit-meeting"
                        onClick={handleOpenEditModal}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        title="Rediger møteinformasjon"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Endre møte</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Meeting Card (Tittel, Dato, Tid, Sted, Vert) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeMeeting.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{formatNorwegianDateTime(activeMeeting.startsAt)}</span>
                    </div>

                    {activeMeeting.location && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{activeMeeting.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Vert info */}
                  {hostPerson && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Vert: <strong className="text-slate-800">{hostPerson.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Tema & Bibeltekst */}
                {(activeMeeting.theme || activeMeeting.bibleText) && (
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 space-y-2">
                    {activeMeeting.theme && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/80 block">
                          Tema for samlingen
                        </span>
                        <p className="text-xs font-bold text-slate-900">{activeMeeting.theme}</p>
                      </div>
                    )}
                    {activeMeeting.bibleText && (
                      <div className="space-y-0.5 pt-1.5 border-t border-emerald-100/60 flex items-start gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/80 block">
                            Bibeltekst
                          </span>
                          <p className="text-xs font-medium text-slate-800">{activeMeeting.bibleText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GRUPPELEDER-FLYTKORT: SEND INNKALLING */}
              {(isLeader || isDeputyLeader) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Lederhandling: Møteinnkalling</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-300">
                      {activeMeeting.invitationSent ? "Innkalling er aktiv" : "Klar til utsending"}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-100 leading-relaxed">
                    {activeMeeting.invitationSent
                      ? "Innkallingen er sendt til gruppen. Medlemmenes svar oppdateres fortløpende nedenfor."
                      : "Møtet er opprettet som et utkast. Trykk på knappen under for å sende innkalling til alle medlemmene."}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-send-invitation"
                      disabled={submitting}
                      onClick={handleSendInvitation}
                      className="px-4 py-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {activeMeeting.invitationSent ? "Send innkalling på nytt" : "SEND INNKALLING"}
                      </span>
                    </button>

                    <button
                      type="button"
                      id="btn-quick-edit-meeting"
                      onClick={handleOpenEditModal}
                      className="px-3 py-2.5 bg-emerald-950/60 hover:bg-emerald-950/90 text-emerald-100 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Endre detaljer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MEDLEMMETS DELTAKELSERESPONS (Gruppeleder er også medlem!) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Ditt svar ({currentUser.name})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isAttending
                        ? "Du har svart: KOMMER"
                        : isDeclined
                        ? "Du har svart: KOMMER IKKE"
                        : "Du har ikke registrert svar ennå"}
                    </span>
                  </div>

                  {currentUserAttendance && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAttending
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isAttending ? "Kommer" : "Kommer ikke"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id={`btn-attending-${activeMeeting.id}`}
                    disabled={submitting}
                    onClick={() => handleRespond("attending")}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                      isAttending
                        ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600 ring-offset-1"
                        : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200"
                    }`}
                  >
                    <Check className={`w-4 h-4 ${isAttending ? "text-white" : "text-emerald-600"}`} />
                    <span>KOMMER</span>
                  </button>

                  <button
                    type="button"
                    id={`btn-declined-${activeMeeting.id}`}
                    disabled={submitting}
                    onClick={() => handleRespond("declined")}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                      isDeclined
                        ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-600 ring-offset-1"
                        : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200"
                    }`}
                  >
                    <X className={`w-4 h-4 ${isDeclined ? "text-white" : "text-amber-600"}`} />
                    <span>KOMMER IKKE</span>
                  </button>
                </div>
              </div>

              {/* AGGREGERT DELTAKELSE & STATUSOVERSIKT */}
              <div
                id="section-aggregated-attendance"
                className="space-y-3.5 pt-2 border-t border-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Deltakelse & Svarstatus
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {answeredCount} av {totalMembersCount} medlemmer har svart
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                    Totalt {totalMembersCount} medlemmer
                  </span>
                </div>

                {/* 1. Kommer */}
                <div id="box-attending-members" className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kommer ({attendingMembers.length})</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {attendingMembers.length} {attendingMembers.length === 1 ? "person" : "personer"}
                    </span>
                  </div>

                  {attendingMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {attendingMembers.map((member) => (
                        <span
                          key={member.id}
                          id={`attending-member-${member.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {member.name}
                          {member.id === currentUser.id && " (deg)"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Ingen har svart at de kommer ennå.</p>
                  )}
                </div>

                {/* 2. Kommer ikke */}
                <div id="box-declined-members" className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kommer ikke ({declinedMembers.length})</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {declinedMembers.length} {declinedMembers.length === 1 ? "person" : "personer"}
                    </span>
                  </div>

                  {declinedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {declinedMembers.map((member) => (
                        <span
                          key={member.id}
                          id={`declined-member-${member.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="line-through text-slate-500">{member.name}</span>
                          {member.id === currentUser.id && " (deg)"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Ingen har meldt forfall.</p>
                  )}
                </div>

                {/* 3. Ikke svart */}
                <div id="box-unresponded-members" className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ikke svart ({unrespondedMembers.length})</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      {unrespondedMembers.length} {unrespondedMembers.length === 1 ? "person" : "personer"}
                    </span>
                  </div>

                  {unrespondedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {unrespondedMembers.map((member) => (
                        <span
                          key={member.id}
                          id={`unresponded-member-${member.id}`}
                          className="inline-flex items-center text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs"
                        >
                          {member.name}
                          {member.id === currentUser.id && " (deg)"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold">
                      Alle medlemmene har svart på innkallingen!
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-100">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700">Ingen samlinger planlagt</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Det er for øyeblikket ingen planlagte husfellesskapssamlinger.
                </p>
              </div>
              {(isLeader || isDeputyLeader) && (
                <button
                  type="button"
                  id="btn-create-first-meeting"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Opprett neste samling</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Gruppechat */}
      {activeTab === "chat" && (
        <div id="section-husfellesskap-chat" className="p-3">
          <HusfellesskapChat groupId={group.id} />
        </div>
      )}

      {/* Tab Content 3: Medlemmer */}
      {activeTab === "members" && (
        <div id="section-husfellesskap-members" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Gruppens medlemmer ({members.length})
            </span>
          </div>

          <div className="space-y-2">
            {members.map((member) => {
              const isGroupLeader = group.leaderIds.includes(member.id);
              const isGroupDeputy = group.deputyLeaderIds?.includes(member.id);

              return (
                <div
                  key={member.id}
                  id={`hus-member-row-${member.id}`}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{member.name}</span>
                        {isGroupLeader && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Leder
                          </span>
                        )}
                        {isGroupDeputy && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                            Nestleder
                          </span>
                        )}
                        {member.id === currentUser.id && (
                          <span className="text-[10px] font-medium text-slate-400">(deg)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {member.phone || member.email || "Ingen kontaktinfo"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Opprett ny samling */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Opprett neste husfellesskap</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveNewMeeting} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tittel / Samlingsnavn *
                </label>
                <input
                  type="text"
                  id="input-create-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="f.eks. Husfellesskap hos Kari"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dato *
                  </label>
                  <input
                    type="date"
                    id="input-create-date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Klokkeslett *
                  </label>
                  <input
                    type="time"
                    id="input-create-time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Vert (hos hvem)
                  </label>
                  <select
                    id="select-create-host"
                    value={formHostId}
                    onChange={(e) => setFormHostId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Velg vert blant medlemmene...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sted / Adresse
                  </label>
                  <input
                    type="text"
                    id="input-create-location"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="f.eks. Storgata 10"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tema for samlingen
                </label>
                <input
                  type="text"
                  id="input-create-theme"
                  value={formTheme}
                  onChange={(e) => setFormTheme(e.target.value)}
                  placeholder="f.eks. Nåde og tilgivelse i hverdagen"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bibeltekst
                </label>
                <input
                  type="text"
                  id="input-create-bible-text"
                  value={formBibleText}
                  onChange={(e) => setFormBibleText(e.target.value)}
                  placeholder="f.eks. Kolosserne 3, 12-17"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              {/* Checkbox for sending invitation immediately */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="check-send-immediately"
                  checked={formSendImmediately}
                  onChange={(e) => setFormSendImmediately(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="check-send-immediately"
                  className="text-xs text-emerald-950 font-medium cursor-pointer"
                >
                  <span className="font-bold block">Send innkalling med en gang</span>
                  Medlemmene vil umiddelbart kunne svare KOMMER / KOMMER IKKE.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-meeting"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Opprett samling</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Endre eksisterende samling */}
      {showEditModal && activeMeeting && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>Endre samling</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditMeeting} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tittel *
                </label>
                <input
                  type="text"
                  id="input-edit-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dato *
                  </label>
                  <input
                    type="date"
                    id="input-edit-date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Klokkeslett *
                  </label>
                  <input
                    type="time"
                    id="input-edit-time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Vert (hos hvem)
                  </label>
                  <select
                    id="select-edit-host"
                    value={formHostId}
                    onChange={(e) => setFormHostId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Velg vert blant medlemmene...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sted / Adresse
                  </label>
                  <input
                    type="text"
                    id="input-edit-location"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tema for samlingen
                </label>
                <input
                  type="text"
                  id="input-edit-theme"
                  value={formTheme}
                  onChange={(e) => setFormTheme(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bibeltekst
                </label>
                <input
                  type="text"
                  id="input-edit-bible-text"
                  value={formBibleText}
                  onChange={(e) => setFormBibleText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-delete-meeting"
                  onClick={handleDeleteMeeting}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Slett møte</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-edit-meeting"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lagre endringer</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
