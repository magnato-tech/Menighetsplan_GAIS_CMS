import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useAdminDashboard,
  useModuleConfig,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
  parseIsoToDateAndTime,
  combineDateAndTimeToIso,
} from "../hooks/useAppHooks";
import { GroupCategory, MeetingSchedule } from "../types";
import { StaffingBadge } from "../components/StaffingBadge";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  Users,
  FolderKanban,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Calendar,
  MessageSquare,
  ChevronRight,
  Repeat,
  Tag,
  UserCheck,
  UserCog,
  UserPlus,
  Plus,
  Building2,
  Phone,
  Mail,
  Sliders,
  Settings,
} from "lucide-react";

export const AdminPage: React.FC = () => {
  const {
    isAdmin,
    currentUser,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    createGroup,
    addPerson,
    createGathering,
    updateGathering,
  } = useAdminDashboard();

  const { kalender, meldinger, toggleKalender, toggleMeldinger } = useModuleConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = ["grupper", "personer", "arrangementer", "oppgaver", "innstillinger"] as const;
  type AdminTab = typeof validTabs[number];

  const rawTab = searchParams.get("tab");
  const normalizedTab = rawTab === "samlinger" ? "arrangementer" : (rawTab as AdminTab);
  const initialTab = normalizedTab || "grupper";
  const [activeTab, setActiveTab] = useState<AdminTab>(
    validTabs.includes(initialTab) ? initialTab : "grupper"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const norm = tabParam === "samlinger" ? "arrangementer" : (tabParam as AdminTab);
    if (norm && validTabs.includes(norm)) {
      setActiveTab(norm);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Group Category Filter state: 'all' | 'husgruppe' | 'tjenestegruppe'
  const [groupCategoryFilter, setGroupCategoryFilter] = useState<"all" | "husgruppe" | "tjenestegruppe">("all");

  const husGroupsCount = useMemo(
    () => adminGroups.filter((g) => g.group.category === "husgruppe").length,
    [adminGroups]
  );
  const tjenesteGroupsCount = useMemo(
    () => adminGroups.filter((g) => (g.group.category || "tjenestegruppe") === "tjenestegruppe").length,
    [adminGroups]
  );

  const filteredAdminGroups = useMemo(() => {
    if (groupCategoryFilter === "all") return adminGroups;
    return adminGroups.filter((g) => (g.group.category || "tjenestegruppe") === groupCategoryFilter);
  }, [adminGroups, groupCategoryFilter]);

  // New Group Form States
  const [showAddGroupForm, setShowAddGroupForm] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>("tjenestegruppe");
  const [newGroupLeaderId, setNewGroupLeaderId] = useState<string>("");
  const [newGroupDeputyLeaderId, setNewGroupDeputyLeaderId] = useState<string>("");
  const [newGroupWeekday, setNewGroupWeekday] = useState<string>("Tirsdag");
  const [newGroupTime, setNewGroupTime] = useState<string>("19:00");
  const [newGroupFrequency, setNewGroupFrequency] = useState<"hver uke" | "annenhver uke" | "hver måned">("annenhver uke");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      showFeedback("Gruppenavn må fylles ut.", "error");
      return;
    }

    const leaderIds = newGroupLeaderId ? [newGroupLeaderId] : [];
    const deputyLeaderIds = newGroupDeputyLeaderId ? [newGroupDeputyLeaderId] : [];

    const meetingSchedule: MeetingSchedule | undefined =
      newGroupCategory === "husgruppe"
        ? {
            weekday: newGroupWeekday,
            time: newGroupTime,
            frequency: newGroupFrequency,
          }
        : undefined;

    const res = createGroup({
      name: trimmed,
      category: newGroupCategory,
      leaderIds,
      deputyLeaderIds,
      meetingSchedule,
    });

    if (res.success && res.group) {
      showFeedback(`Gruppen «${res.group.name}» ble opprettet!`);
      setNewGroupName("");
      setNewGroupCategory("tjenestegruppe");
      setNewGroupLeaderId("");
      setNewGroupDeputyLeaderId("");
      setShowAddGroupForm(false);
    } else {
      showFeedback(res.error || "Kunne ikke opprette gruppe.", "error");
    }
  };

  // New Person Form States
  const [showAddPersonForm, setShowAddPersonForm] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>("");
  const [newPersonPhone, setNewPersonPhone] = useState<string>("");
  const [newPersonEmail, setNewPersonEmail] = useState<string>("");

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleStartEditGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditNameInput(currentName);
  };

  const handleSaveGroupName = (groupId: string) => {
    const res = updateGroupName(groupId, editNameInput);
    if (res.success) {
      showFeedback(`Gruppenavnet ble oppdatert til «${editNameInput.trim()}»!`);
      setEditingGroupId(null);
    } else {
      showFeedback(res.error || "Kunne ikke oppdatere gruppenavn", "error");
    }
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditNameInput("");
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      showFeedback("Navn må fylles ut.", "error");
      return;
    }

    const res = addPerson({
      name: newPersonName.trim(),
      phone: newPersonPhone.trim() || undefined,
      email: newPersonEmail.trim() || undefined,
    });

    if (res.success && res.person) {
      showFeedback(`${res.person.name} ble opprettet og lagt til i personlisten!`);
      setNewPersonName("");
      setNewPersonPhone("");
      setNewPersonEmail("");
      setShowAddPersonForm(false);
    } else {
      showFeedback(res.error || "Kunne ikke opprette person.", "error");
    }
  };

  // New Gathering Form State
  const [showAddGatheringForm, setShowAddGatheringForm] = useState<boolean>(false);
  const [newGatheringTitle, setNewGatheringTitle] = useState<string>("");
  const [newGatheringDate, setNewGatheringDate] = useState<string>("");
  const [newGatheringTime, setNewGatheringTime] = useState<string>("11:00");
  const [newGatheringLocation, setNewGatheringLocation] = useState<string>("Hovedsalen og kafeen");
  const [newGatheringGroupId, setNewGatheringGroupId] = useState<string>("");

  // Edit Gathering Modal State (for list view)
  const [editingGathering, setEditingGathering] = useState<{
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
  } | null>(null);

  const handleCreateGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatheringTitle.trim()) {
      showFeedback("Vennligst oppgi en tittel for arrangementet.", "error");
      return;
    }
    if (!newGatheringDate) {
      showFeedback("Vennligst oppgi en dato for arrangementet.", "error");
      return;
    }

    const startsAt = combineDateAndTimeToIso(newGatheringDate, newGatheringTime || "11:00");
    const serviceGroups = adminGroups.filter((g) => g.group.category !== "husgruppe");
    const targetGroupId =
      newGatheringGroupId ||
      serviceGroups[0]?.group.id ||
      adminGroups[0]?.group.id ||
      "group-felles";

    const res = createGathering({
      title: newGatheringTitle.trim(),
      startsAt,
      location: newGatheringLocation.trim() || undefined,
      groupId: targetGroupId,
      type: "arrangement",
    });

    if (res.success && res.gathering) {
      showFeedback(`«${res.gathering.title}» ble opprettet!`);
      setShowAddGatheringForm(false);
      setNewGatheringTitle("");
      setNewGatheringDate("");
      setNewGatheringTime("11:00");
      setNewGatheringLocation("Hovedsalen og kafeen");
    } else {
      showFeedback(res.error || "Kunne ikke opprette arrangement.", "error");
    }
  };

  const handleSaveGatheringEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGathering) return;
    if (!editingGathering.title.trim()) {
      showFeedback("Tittel kan ikke være tom.", "error");
      return;
    }
    if (!editingGathering.date) {
      showFeedback("Dato må fylles ut.", "error");
      return;
    }

    const startsAt = combineDateAndTimeToIso(editingGathering.date, editingGathering.time || "11:00");
    const res = updateGathering(editingGathering.id, {
      title: editingGathering.title.trim(),
      startsAt,
      location: editingGathering.location.trim() || undefined,
    });

    if (res.success) {
      showFeedback(`Endringene for «${editingGathering.title}» ble lagret!`);
      setEditingGathering(null);
    } else {
      showFeedback(res.error || "Kunne ikke oppdatere arrangement.", "error");
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
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til administrasjonsflaten. Bytt til en bruker med admin-rolle i toppen (f.eks. Kari Nordmann) for å teste.
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

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Admin Subheader */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Admin-oversikt</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/admin/settings"
            id="link-admin-settings-top"
            className="text-[11px] font-semibold text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Innstillinger
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            Global Admin ({currentUser.name.split(" ")[0]})
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-feedback-toast"
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

      <div className="p-5 space-y-4">
        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            id="tab-grupper"
            onClick={() => handleTabChange("grupper")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "grupper"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Grupper ({adminGroups.length})
          </button>
          <button
            type="button"
            id="tab-personer"
            onClick={() => handleTabChange("personer")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "personer"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Personer ({adminPersons.length})
          </button>
          <button
            type="button"
            id="tab-arrangementer"
            onClick={() => handleTabChange("arrangementer")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "arrangementer"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Arrangementer ({adminGatherings.length})
          </button>
          <button
            type="button"
            id="tab-oppgaver"
            onClick={() => handleTabChange("oppgaver")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "oppgaver"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Oppgaver ({adminTasks.length})
          </button>
          <button
            type="button"
            id="tab-innstillinger"
            onClick={() => handleTabChange("innstillinger")}
            className={`py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "innstillinger"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Innstillinger
          </button>
        </div>

        {/* TAB 1: GRUPPER & GRUPPEADMINISTRASJON */}
        {activeTab === "grupper" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Grupper & administrasjon
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {filteredAdminGroups.length} av {adminGroups.length} grupper
                </span>
              </div>
              <button
                type="button"
                id="btn-toggle-add-group"
                onClick={() => setShowAddGroupForm((prev) => !prev)}
                className="w-7 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                title="Ny gruppe"
                aria-label="Ny gruppe"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Skjema for ny gruppe */}
            {showAddGroupForm && (
              <form
                onSubmit={handleCreateGroup}
                id="form-add-group"
                className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3 shadow-xs animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    Opprett ny gruppe
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddGroupForm(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label
                      htmlFor="input-new-group-name"
                      className="text-[11px] font-bold text-slate-700 block mb-0.5"
                    >
                      Gruppenavn <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      id="input-new-group-name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="F.eks. Lyd og bilde, Kaféteam, Husgruppe Sentrum..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="select-new-group-category"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Gruppetype:
                      </label>
                      <select
                        id="select-new-group-category"
                        value={newGroupCategory}
                        onChange={(e) => setNewGroupCategory(e.target.value as GroupCategory)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      >
                        <option value="tjenestegruppe">Tjenestegruppe</option>
                        <option value="husgruppe">Husfellesskap</option>
                        <option value="strategigruppe">Strategigruppe</option>
                        <option value="ledergruppe">Ledergruppe</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="select-new-group-leader"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Gruppeleder:
                      </label>
                      <select
                        id="select-new-group-leader"
                        value={newGroupLeaderId}
                        onChange={(e) => setNewGroupLeaderId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      >
                        <option value="">-- Velg gruppeleder (valgfritt) --</option>
                        {adminPersons.map(({ person }) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="select-new-group-deputy"
                      className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                    >
                      Nestleder:
                    </label>
                    <select
                      id="select-new-group-deputy"
                      value={newGroupDeputyLeaderId}
                      onChange={(e) => setNewGroupDeputyLeaderId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    >
                      <option value="">-- Velg nestleder (valgfritt) --</option>
                      {adminPersons
                        .filter(({ person }) => person.id !== newGroupLeaderId)
                        .map(({ person }) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {newGroupCategory === "husgruppe" && (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-emerald-900 block">
                        Møtetidspunkt for husfellesskap (valgfritt):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-emerald-800 block mb-0.5">
                            Ukedag:
                          </label>
                          <select
                            value={newGroupWeekday}
                            onChange={(e) => setNewGroupWeekday(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs"
                          >
                            {["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"].map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-emerald-800 block mb-0.5">
                            Klokkeslett:
                          </label>
                          <input
                            type="time"
                            value={newGroupTime}
                            onChange={(e) => setNewGroupTime(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-emerald-800 block mb-0.5">
                            Frekvens:
                          </label>
                          <select
                            value={newGroupFrequency}
                            onChange={(e) => setNewGroupFrequency(e.target.value as any)}
                            className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs"
                          >
                            <option value="annenhver uke">Annenhver uke</option>
                            <option value="hver uke">Hver uke</option>
                            <option value="hver måned">Hver måned</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-100">
                    <button
                      type="button"
                      onClick={() => setShowAddGroupForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-new-group"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Opprett gruppe
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Kategori-filter for admin: Alle | Husfellesskap | Tjenestegrupper */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                id="btn-admin-filter-group-all"
                onClick={() => setGroupCategoryFilter("all")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "all"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Alle</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                  {adminGroups.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-admin-filter-group-husgruppe"
                onClick={() => setGroupCategoryFilter("husgruppe")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "husgruppe"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Husfellesskap</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {husGroupsCount}
                </span>
              </button>

              <button
                type="button"
                id="btn-admin-filter-group-tjenestegruppe"
                onClick={() => setGroupCategoryFilter("tjenestegruppe")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "tjenestegruppe"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tjenestegrupper</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                  {tjenesteGroupsCount}
                </span>
              </button>
            </div>

            {filteredAdminGroups.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Ingen grupper matcher valgt kategori.
              </div>
            ) : (
              filteredAdminGroups.map(({ group, leaders, deputyLeaders, members, tasksCount }) => {
              const categoryLabel =
                GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label ||
                "Tjenestegruppe";

              return (
                <div
                  key={group.id}
                  id={`admin-group-card-${group.id}`}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 shadow-xs transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    {editingGroupId === group.id ? (
                      <div className="flex-1 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Nytt gruppenavn:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            id={`input-group-name-${group.id}`}
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                            placeholder="Gruppenavn..."
                            autoFocus
                          />
                          <button
                            type="button"
                            id={`btn-save-group-${group.id}`}
                            onClick={() => handleSaveGroupName(group.id)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Lagre
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditGroup}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/admin/gruppe/${group.id}`}
                              id={`link-group-title-${group.id}`}
                              className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                            >
                              {group.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {categoryLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {group.id}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            id={`btn-edit-group-${group.id}`}
                            onClick={() => handleStartEditGroup(group.id, group.name)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Hurtigendre navn"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <Link
                            to={`/admin/gruppe/${group.id}`}
                            id={`btn-open-group-${group.id}`}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Åpne kort
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Leader and Deputy */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Leder:
                      </span>
                      <p className="font-semibold text-slate-700 mt-0.5 truncate">
                        {leaders.length > 0
                          ? leaders.map((l) => l.name).join(", ")
                          : "Ingen leder"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCog className="w-3 h-3 text-blue-600" />
                        Nestleder:
                      </span>
                      <p className="font-semibold text-slate-700 mt-0.5 truncate">
                        {deputyLeaders && deputyLeaders.length > 0
                          ? deputyLeaders.map((d) => d.name).join(", ")
                          : "Ingen"}
                      </p>
                    </div>
                  </div>

                  {/* Meeting schedule & members */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-indigo-500" />
                        Møteplan:
                      </span>
                      <p className="text-slate-700 font-medium mt-0.5 truncate">
                        {group.meetingSchedule
                          ? `${group.meetingSchedule.weekday} ${group.meetingSchedule.time}, ${group.meetingSchedule.frequency}`
                          : "Ikke angitt"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        Medlemmer ({members.length}):
                      </span>
                      <p className="text-slate-600 mt-0.5 truncate">
                        {members.map((m) => m.name.split(" ")[0]).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        )}

        {/* TAB 2: PERSONER & PERSONKORT */}
        {activeTab === "personer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Personer ({adminPersons.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Medlemmer og frivillige
                </span>
              </div>
              <button
                type="button"
                id="btn-toggle-add-person"
                onClick={() => setShowAddPersonForm((prev) => !prev)}
                className="w-7 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                title="Ny person"
                aria-label="Ny person"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Person Form */}
            {showAddPersonForm && (
              <form
                onSubmit={handleCreatePerson}
                id="form-add-person"
                className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3 shadow-xs animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-700" />
                    Registrer ny person
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">
                    globalRole: member
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label
                      htmlFor="input-new-person-name"
                      className="text-[11px] font-bold text-slate-700 block mb-0.5"
                    >
                      Navn <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      id="input-new-person-name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="F.eks. Jonas Lie"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="input-new-person-phone"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Mobil:
                      </label>
                      <input
                        type="tel"
                        id="input-new-person-phone"
                        value={newPersonPhone}
                        onChange={(e) => setNewPersonPhone(e.target.value)}
                        placeholder="999 88 777"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="input-new-person-email"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        E-post:
                      </label>
                      <input
                        type="email"
                        id="input-new-person-email"
                        value={newPersonEmail}
                        onChange={(e) => setNewPersonEmail(e.target.value)}
                        placeholder="jonas@eksempel.no"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPersonForm(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-add-person"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lagre person
                  </button>
                </div>
              </form>
            )}

            {/* List of Persons */}
            {adminPersons.map(({ person, groups: pGroups, leaderInGroups, deputyInGroups }) => (
              <div
                key={person.id}
                id={`admin-person-card-${person.id}`}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs transition-all hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/admin/person/${person.id}`}
                        id={`link-person-name-${person.id}`}
                        className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {person.name}
                      </Link>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          person.globalRole === "admin"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {person.globalRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {person.id}</span>
                  </div>

                  <Link
                    to={`/admin/person/${person.id}`}
                    id={`btn-open-person-${person.id}`}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    Åpne personkort
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Contact info: Mobil and E-post */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 truncate">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.phone || "Ingen mobil"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.email || "Ingen e-post"}</span>
                  </div>
                </div>

                {/* Group memberships & roles */}
                <div className="pt-1.5 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500">Grupper ({pGroups.length}):</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]">
                      {pGroups.length > 0
                        ? pGroups.map((g) => g.name).join(", ")
                        : "Ingen grupper"}
                    </span>
                  </div>
                  {leaderInGroups.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Leder for:
                      </span>
                      <span className="font-bold text-emerald-800 text-right">
                        {leaderInGroups.map((g) => g.name).join(", ")}
                      </span>
                    </div>
                  )}
                  {deputyInGroups && deputyInGroups.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-blue-700 font-medium flex items-center gap-1">
                        <UserCog className="w-3 h-3" />
                        Nestleder for:
                      </span>
                      <span className="font-bold text-blue-800 text-right">
                        {deputyInGroups.map((g) => g.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ARRANGEMENTER & BEMANNINGSSTATUS */}
        {activeTab === "arrangementer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Arrangementer & bemanningsstatus ({adminGatherings.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Åpne og administrative arrangementer
                </span>
              </div>
              <button
                type="button"
                id="btn-toggle-add-gathering"
                onClick={() => setShowAddGatheringForm((prev) => !prev)}
                className="w-7 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                title="Nytt arrangement"
                aria-label="Nytt arrangement"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showAddGatheringForm ? "rotate-45" : ""}`} />
              </button>
            </div>

            {/* Add Gathering Form */}
            {showAddGatheringForm && (
              <form
                onSubmit={handleCreateGathering}
                id="form-add-gathering"
                className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3 shadow-xs animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                    Opprett nytt arrangement
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">
                    Type: arrangement
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label
                      htmlFor="input-new-gathering-title"
                      className="text-[11px] font-bold text-slate-700 block mb-0.5"
                    >
                      Tittel <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      id="input-new-gathering-title"
                      value={newGatheringTitle}
                      onChange={(e) => setNewGatheringTitle(e.target.value)}
                      placeholder="F.eks. Høsttakkefest & fellesmiddag"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="input-new-gathering-date"
                        className="text-[11px] font-bold text-slate-700 block mb-0.5"
                      >
                        Dato <span className="text-red-500">*</span>:
                      </label>
                      <input
                        type="date"
                        id="input-new-gathering-date"
                        value={newGatheringDate}
                        onChange={(e) => setNewGatheringDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="input-new-gathering-time"
                        className="text-[11px] font-bold text-slate-700 block mb-0.5"
                      >
                        Tid:
                      </label>
                      <input
                        type="time"
                        id="input-new-gathering-time"
                        value={newGatheringTime}
                        onChange={(e) => setNewGatheringTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="input-new-gathering-location"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Sted:
                      </label>
                      <input
                        type="text"
                        id="input-new-gathering-location"
                        value={newGatheringLocation}
                        onChange={(e) => setNewGatheringLocation(e.target.value)}
                        placeholder="F.eks. Hovedsalen og kafeen"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="input-new-gathering-group"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Ansvarlig gruppe:
                      </label>
                      <select
                        id="input-new-gathering-group"
                        value={newGatheringGroupId}
                        onChange={(e) => setNewGatheringGroupId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      >
                        {adminGroups
                          .filter((g) => g.group.category !== "husgruppe")
                          .map(({ group }) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-100/60">
                  <button
                    type="button"
                    onClick={() => setShowAddGatheringForm(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-add-gathering"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Opprett arrangement
                  </button>
                </div>
              </form>
            )}

            {adminGatherings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Ingen arrangementer funnet.
              </div>
            ) : (
              adminGatherings.map(({ gathering, group, tasks: gTasks, tasksWithStaffing, totalTasks, coveredTasksCount, missingStaffingCount, staffing }) => (
                <div
                  key={gathering.id}
                  id={`admin-gathering-card-${gathering.id}`}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/admin/samling/${gathering.id}`}
                        id={`link-gathering-title-${gathering.id}`}
                        className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors block"
                      >
                        {gathering.title}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {formatNorwegianDateTime(gathering.startsAt)} • {group?.name || "Ukjent gruppe"}
                        {gathering.location && ` • ${gathering.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StaffingBadge color={staffing.color} statusText={staffing.badgeText} />
                      <button
                        type="button"
                        id={`btn-edit-gathering-${gathering.id}`}
                        onClick={() => {
                          const { date, time } = parseIsoToDateAndTime(gathering.startsAt);
                          setEditingGathering({
                            id: gathering.id,
                            title: gathering.title,
                            date,
                            time,
                            location: gathering.location || "",
                          });
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Rediger arrangement"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        Rediger
                      </button>
                      <Link
                        to={`/admin/samling/${gathering.id}`}
                        id={`btn-open-gathering-${gathering.id}`}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Åpne
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Oppgaver ({gTasks.length}):
                    </span>
                    <div className="space-y-1">
                      {tasksWithStaffing?.map(({ task: t, taskStaffing }) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <Link
                            to={`/admin/oppgave/${t.id}`}
                            className="text-slate-700 hover:text-indigo-600 font-medium transition-colors truncate max-w-[200px]"
                          >
                            {t.title}
                          </Link>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <StaffingBadge color={taskStaffing.color} statusText={taskStaffing.statusText} />
                            <Link
                              to={`/admin/oppgave/${t.id}`}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              Kort →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: OPPGAVER & TILDELINGER */}
        {activeTab === "oppgaver" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Alle oppgaver i mock-state
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Klikk på en oppgave for oppgavekort
              </span>
            </div>

            {adminTasks.map(({ task, gathering, group, assignedPerson, assignedPersonsList, isFullyCovered, missingCount, taskStaffing }) => (
              <div
                key={task.id}
                id={`admin-task-card-${task.id}`}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs transition-all hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/oppgave/${task.id}`}
                      id={`link-task-title-${task.id}`}
                      className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors block truncate"
                    >
                      {task.title}
                    </Link>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {group && (
                        <Link
                          to={`/admin/gruppe/${group.id}`}
                          className="hover:text-indigo-600 transition-colors font-medium text-slate-600"
                        >
                          {group.name}
                        </Link>
                      )}
                      {group && gathering && <span>•</span>}
                      {gathering && (
                        <Link
                          to={`/admin/samling/${gathering.id}`}
                          className="hover:text-indigo-600 transition-colors text-slate-500"
                        >
                          {gathering.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StaffingBadge color={taskStaffing.color} statusText={taskStaffing.statusText} />
                    <Link
                      to={`/admin/oppgave/${task.id}`}
                      id={`btn-open-task-${task.id}`}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Åpne kort
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Behov: {taskStaffing.neededCount} pers. ({taskStaffing.confirmedCount}/{taskStaffing.neededCount} bekreftet)
                  </span>
                  <span className="font-semibold text-slate-700">
                    {assignedPerson ? (
                      <Link
                        to={`/admin/person/${assignedPerson.id}`}
                        id={`link-task-person-${task.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {assignedPerson.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">Ingen bekreftet</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: INNSTILLINGER (VALGFRIE MODULER) */}
        {activeTab === "innstillinger" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Innstillinger & valgfrie moduler
              </h3>
              <Link
                to="/admin/settings"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                Gå til /admin/settings
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
              <p className="text-xs text-slate-600 leading-relaxed">
                Herfra kan admin styre om valgfrie tilleggsmoduler (Kalender og Meldinger) skal være aktivert i grensesnittet.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Kalender:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kalender === "on" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {kalender.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Meldinger:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meldinger === "on" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
                      {meldinger.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin/settings"
                id="btn-open-full-settings"
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Åpne innstillingssiden (/admin/settings)
              </Link>
            </div>
          </div>
        )}

      {/* Edit Gathering Modal */}
      {editingGathering && (
        <div
          id="modal-admin-edit-gathering"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Rediger arrangement
              </div>
              <button
                type="button"
                onClick={() => setEditingGathering(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGatheringEdit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  Tittel <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  id="input-edit-gathering-title"
                  value={editingGathering.title}
                  onChange={(e) =>
                    setEditingGathering({ ...editingGathering, title: e.target.value })
                  }
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
                    id="input-edit-gathering-date"
                    value={editingGathering.date}
                    onChange={(e) =>
                      setEditingGathering({ ...editingGathering, date: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                    Tid:
                  </label>
                  <input
                    type="time"
                    id="input-edit-gathering-time"
                    value={editingGathering.time}
                    onChange={(e) =>
                      setEditingGathering({ ...editingGathering, time: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  Sted:
                </label>
                <input
                  type="text"
                  id="input-edit-gathering-location"
                  value={editingGathering.location}
                  onChange={(e) =>
                    setEditingGathering({ ...editingGathering, location: e.target.value })
                  }
                  placeholder="F.eks. Hovedsalen"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-edit-gathering"
                  onClick={() => setEditingGathering(null)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-gathering"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lagre endringer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
