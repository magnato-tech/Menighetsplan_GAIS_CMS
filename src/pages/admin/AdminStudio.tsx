import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useAdminDashboard,
  useModuleConfig,
  formatNorwegianDateTime,
  parseIsoToDateAndTime,
  combineDateAndTimeToIso,
  AdminGatheringItem,
  AdminTaskItem,
} from "../../hooks/useAppHooks";
import { useCms } from "../../context/CmsContext";
import {
  CmsPage,
  CmsNewsArticle,
  CmsSettings,
  CmsSermon,
  CmsStaffMember,
  formatYoutubeNoCookieUrl,
} from "../../data/cmsData";
import { UserQuickSwitcherBar } from "../../components/UserSwitcher";
import { StaffingBadge } from "../../components/StaffingBadge";
import {
  Globe,
  Settings,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Star,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Shield,
  Users,
  FolderKanban,
  ListTodo,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Home,
  Menu,
  X,
  LayoutDashboard,
  Heart,
  Newspaper,
  Sliders,
  ChevronRight,
  Database,
  Save,
  Headphones,
  User,
  UserPlus,
  Play,
  Volume2,
  FolderTree,
  Folder,
  CornerDownRight,
  Layers,
  Tag,
  Compass,
  Target,
  Award,
  Copy,
  CheckSquare,
  CalendarX,
  CalendarPlus,
  Search,
  MessageSquare,
  Send,
} from "lucide-react";
import { GroupCategory } from "../../types";

type StudioTab =
  | "dashboard"
  | "cms-sider"
  | "cms-nyheter"
  | "cms-taler"
  | "cms-stab"
  | "cms-innstillinger"
  | "cms-overstyringer"
  | "planlegger-samlinger"
  | "planlegger-oppgaver"
  | "planlegger-grupper"
  | "planlegger-personer";

export const AdminStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Admin Dashboard Hooks (Menighetsplan data)
  const {
    isAdmin,
    currentUser,
    allPersons,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    createGroup,
    addPerson,
    createGathering,
    updateGathering,
    createTask,
    updateTask,
    assignTaskToPerson,
    tasks,
  } = useAdminDashboard();

  // CMS Hooks
  const {
    pages,
    news,
    sermons,
    staff,
    settings,
    overrides,
    isFirestoreSyncing,
    savePage,
    deletePage,
    saveNews,
    deleteNews,
    saveSermon,
    deleteSermon,
    saveStaff,
    deleteStaff,
    saveSettings,
    toggleFeatureGathering,
    toggleHideGathering,
    resetCmsToDefaults,
  } = useCms();

  // Tab State
  const tabParam = (searchParams.get("tab") as StudioTab) || "dashboard";
  const [activeTab, setActiveTab] = useState<StudioTab>(tabParam);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab") as StudioTab;
    if (t) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = (tab: StudioTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSidebarOpen(false);
  };

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ==========================================
  // CMS SIDER STATE & HANDLERS
  // ==========================================
  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);

  const handleOpenEditPage = (page: CmsPage) => {
    setEditingPage({ ...page });
    setIsNewPage(false);
  };

  const handleOpenNewPage = (parentId?: string | null) => {
    const siblings = pages.filter((p) => (parentId ? p.parentId === parentId : !p.parentId));
    const nextOrder = siblings.length + 1;

    setEditingPage({
      title: "",
      slug: "",
      summary: "",
      content: "## Ny seksjon\nSkriv artikkel eller infotekst her...\n\n- Punkt 1\n- Punkt 2",
      isPublished: true,
      inNavMenu: true,
      parentId: parentId || null,
      navOrder: nextOrder,
    });
    setIsNewPage(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editingPage.title) {
      showFeedback("Siden må ha en tittel", "error");
      return;
    }
    const cleanSlug = (editingPage.slug || editingPage.title.toLowerCase().replace(/\s+/g, "-"))
      .toLowerCase()
      .replace(/^\//, "")
      .trim();

    await savePage({
      ...editingPage,
      slug: cleanSlug,
      navOrder: Number(editingPage.navOrder) || 1,
      inNavMenu: editingPage.inNavMenu !== false,
      isPublished: editingPage.isPublished !== false,
      parentId: editingPage.parentId || null,
      linkUrl: editingPage.linkUrl?.trim() || undefined,
    });
    setEditingPage(null);
    showFeedback("Siden ble lagret og menystrukturen ble oppdatert!");
  };

  // Hierarchical groupings of CMS pages for visual tree representation
  const hierarchicalPages = useMemo(() => {
    const topLevel = pages
      .filter((p) => !p.parentId)
      .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

    return topLevel.map((parent) => {
      const children = pages
        .filter((p) => p.parentId === parent.id)
        .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));
      return {
        parent,
        children,
      };
    });
  }, [pages]);

  const orphanPages = useMemo(() => {
    const topIds = new Set(pages.filter((p) => !p.parentId).map((p) => p.id));
    return pages.filter((p) => p.parentId && !topIds.has(p.parentId));
  }, [pages]);

  const availableParentPages = useMemo(() => {
    return pages.filter((p) => !p.parentId && p.id !== editingPage?.id);
  }, [pages, editingPage?.id]);

  // Delete Page Confirmation Modal State
  const [deleteConfirmPageId, setDeleteConfirmPageId] = useState<string | null>(null);

  // "Lag neste arrangement" Modal State
  const [nextGatheringSource, setNextGatheringSource] = useState<AdminGatheringItem | null>(null);
  const [nextGatheringDate, setNextGatheringDate] = useState("");
  const [nextGatheringTime, setNextGatheringTime] = useState("11:00");
  const [nextGatheringLocation, setNextGatheringLocation] = useState("Misjonskirken");

  // Purr / Påminnelse (SMS/Messenger) Modal State
  const [reminderTaskItem, setReminderTaskItem] = useState<AdminTaskItem | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Tildel / Forespør Hurtigmodal State
  const [assigningTaskItem, setAssigningTaskItem] = useState<AdminTaskItem | null>(null);
  const [selectedPersonIdToAssign, setSelectedPersonIdToAssign] = useState("");
  const [assignMode, setAssignMode] = useState<"confirmed" | "pending">("confirmed");

  // Oppgavefilter
  const [taskFilter, setTaskFilter] = useState<"all" | "urgent" | "uncovered" | "covered">("all");

  const handleCreateNextGathering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextGatheringSource || !nextGatheringDate) {
      showFeedback("Vennligst oppgi dato for det nye arrangementet", "error");
      return;
    }
    const isoDateTime = `${nextGatheringDate}T${nextGatheringTime || "11:00"}:00`;
    const sourceG = nextGatheringSource.gathering;
    const res = createGathering({
      title: sourceG.title,
      groupId: sourceG.groupId,
      startsAt: isoDateTime,
      location: nextGatheringLocation || sourceG.location,
      theme: sourceG.theme,
      type: sourceG.type,
      visibility: sourceG.visibility || "offentlig",
      isPublic: sourceG.visibility !== "intern",
      isGudstjeneste: sourceG.isGudstjeneste,
    });
    if (!res.success || !res.gathering) {
      showFeedback("Kunne ikke opprette arrangementet", "error");
      return;
    }
    const newGatheringId = res.gathering.id;
    // Clone tasks with neededCount, but clean/empty assignments!
    for (const t of nextGatheringSource.tasks) {
      createTask({
        gatheringId: newGatheringId,
        groupId: t.groupId,
        title: t.title,
        description: t.description,
        instruction: t.instruction,
        status: "open",
        neededCount: t.neededCount || 1,
      });
    }
    setNextGatheringSource(null);
    showFeedback(`Nytt arrangement opprettet for ${nextGatheringDate} med ${nextGatheringSource.tasks.length} oppgaver klonet!`);
  };

  const handleOpenReminderModal = async (item: AdminTaskItem) => {
    setReminderTaskItem(item);
    setCopiedReminder(false);
    if (updateTask) {
      await updateTask(item.task.id, { lastReminded: new Date().toISOString() });
    }
  };

  const reminderText = useMemo(() => {
    if (!reminderTaskItem) return "";
    const gTitle = reminderTaskItem.gathering?.title || "samlingen";
    const gTime = reminderTaskItem.gathering ? formatNorwegianDateTime(reminderTaskItem.gathering.startsAt) : "søndag";
    return `Hei! Vennlig påminnelse om din oppgave som ${reminderTaskItem.task.title} under ${gTitle} (${gTime}). Kan du bekrefte om du kommer? Svar gjerne her eller i menighetsappen. Takk for at du tjener i fellesskapet!`;
  }, [reminderTaskItem]);

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    setCopiedReminder(true);
    showFeedback("Purretekst kopiert til utklippstavlen!");
  };

  const handleExecuteAssign = async () => {
    if (!assigningTaskItem || !selectedPersonIdToAssign) {
      showFeedback("Vennligst velg en person", "error");
      return;
    }
    const res = await assignTaskToPerson(
      assigningTaskItem.task.id,
      selectedPersonIdToAssign,
      assignMode
    );
    if (res.success) {
      showFeedback(
        assignMode === "confirmed"
          ? "Personen ble tildelt og bekreftet!"
          : "Forespørsel ble sendt (status: venter på svar)!"
      );
      setAssigningTaskItem(null);
      setSelectedPersonIdToAssign("");
    } else {
      showFeedback(res.error || "Kunne ikke fullføre handlingen", "error");
    }
  };

  const handleSetGatheringVisibility = async (gatheringId: string, visibility: "intern" | "offentlig" | "fremhevet") => {
    await updateGathering(gatheringId, {
      visibility,
      isPublic: visibility !== "intern",
    });
    if (visibility === "fremhevet") {
      if (!overrides[gatheringId]?.featured) toggleFeatureGathering(gatheringId);
    } else if (visibility === "intern") {
      if (!overrides[gatheringId]?.hidden) toggleHideGathering(gatheringId);
    }
    showFeedback(`Synlighet oppdatert til: ${visibility === "fremhevet" ? "Fremhevet på forsiden" : visibility === "offentlig" ? "Offentlig kalender" : "Kun intern"}`);
  };

  // ==========================================
  // CMS NYHETER STATE & HANDLERS
  // ==========================================
  const [editingNews, setEditingNews] = useState<Partial<CmsNewsArticle> | null>(null);
  const [isNewNews, setIsNewNews] = useState(false);

  const handleOpenEditNews = (article: CmsNewsArticle) => {
    setEditingNews({ ...article });
    setIsNewNews(false);
  };

  const handleOpenNewNews = () => {
    setEditingNews({
      title: "",
      slug: "",
      summary: "",
      content: "Skriv artikkelteksten her...\n\nFlere avsnitt kan legges til med linjeskift.",
      category: "aktuelt",
      author: currentUser.name || "Menigheten",
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });
    setIsNewNews(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editingNews.title) {
      showFeedback("Artikkelen må ha en tittel", "error");
      return;
    }
    await saveNews(editingNews);
    setEditingNews(null);
    showFeedback("Nyhetsartikkelen ble lagret og publisert!");
  };

  // ==========================================
  // CMS TALER STATE & HANDLERS
  // ==========================================
  const [editingSermon, setEditingSermon] = useState<Partial<CmsSermon> | null>(null);
  const [isNewSermon, setIsNewSermon] = useState(false);

  const handleOpenEditSermon = (sermon: CmsSermon) => {
    setEditingSermon({ ...sermon });
    setIsNewSermon(false);
  };

  const handleOpenNewSermon = () => {
    setEditingSermon({
      title: "",
      speaker: currentUser.name || "Pastor Kari Nordmann",
      date: new Date().toISOString(),
      bibleText: "",
      series: "",
      audioUrl: "",
      videoUrl: "",
      summary: "",
    });
    setIsNewSermon(true);
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSermon || !editingSermon.title) {
      showFeedback("Talen må ha en tittel", "error");
      return;
    }
    const cleanVideoUrl = formatYoutubeNoCookieUrl(editingSermon.videoUrl || "");
    await saveSermon({
      ...editingSermon,
      videoUrl: cleanVideoUrl,
    });
    setEditingSermon(null);
    showFeedback("Talen ble lagret og publisert til prekenarkivet!");
  };

  // ==========================================
  // CMS STAB & LEDERSKAP STATE & HANDLERS
  // ==========================================
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
    await saveStaff(editingStaff);
    setEditingStaff(null);
    showFeedback("Stabsmedlemmet ble lagret!");
  };

  // ==========================================
  // CMS INNSTILLINGER STATE
  // ==========================================
  const [settingsForm, setSettingsForm] = useState<CmsSettings>({ ...settings });

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settingsForm);
  };

  // ==========================================
  // KLONING AV OPPGAVER TIL NESTE SAMLING (MALER)
  // ==========================================
  const handleCloneTasksToNextGathering = (sourceGatheringId: string) => {
    const sourceGathering = adminGatherings.find((g) => g.id === sourceGatheringId);
    if (!sourceGathering) return;

    const sourceTasks = tasks.filter((t) => t.gatheringId === sourceGatheringId);
    if (sourceTasks.length === 0) {
      showFeedback("Denne samlingen har ingen oppgaver å kopiere.", "error");
      return;
    }

    const otherGatherings = adminGatherings
      .filter(
        (g) =>
          g.id !== sourceGatheringId &&
          new Date(g.startsAt).getTime() >= new Date(sourceGathering.startsAt).getTime()
      )
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    const targetGathering = otherGatherings[0];
    if (!targetGathering) {
      showFeedback("Fant ingen fremtidig samling å kopiere oppgaver til.", "error");
      return;
    }

    let count = 0;
    for (const st of sourceTasks) {
      createTask({
        gatheringId: targetGathering.id,
        groupId: st.groupId,
        title: st.title,
        description: st.description,
        instruction: st.instruction,
        neededCount: st.neededCount,
      });
      count++;
    }

    showFeedback(`Kopierte ${count} oppgaver til "${targetGathering.title}" (${formatNorwegianDateTime(targetGathering.startsAt)})!`);
  };

  // ==========================================
  // NY SAMLING FORM STATE (PLANLEGGER)
  // ==========================================
  const [newGatheringTitle, setNewGatheringTitle] = useState("");
  const [newGatheringDate, setNewGatheringDate] = useState("");
  const [newGatheringTime, setNewGatheringTime] = useState("11:00");
  const [newGatheringType, setNewGatheringType] = useState<"gudstjeneste" | "møte" | "annet">("gudstjeneste");
  const [newGatheringTheme, setNewGatheringTheme] = useState("");

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatheringTitle || !newGatheringDate) {
      showFeedback("Tittel og dato må fylles ut", "error");
      return;
    }

    const iso = combineDateAndTimeToIso(newGatheringDate, newGatheringTime);
    createGathering({
      title: newGatheringTitle,
      startsAt: iso,
      location: "Hovedsalen",
      type: "arrangement",
      theme: newGatheringTheme,
    });

    setNewGatheringTitle("");
    setNewGatheringDate("");
    setNewGatheringTheme("");
    showFeedback("Ny samling opprettet og synkronisert til kalenderen!");
  };

  // ==========================================
  // NY GRUPPE FORM STATE (PLANLEGGER)
  // ==========================================
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>("tjenestegruppe");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupTags, setNewGroupTags] = useState("");
  const [newGroupLeaderId, setNewGroupLeaderId] = useState("");
  const [groupFilterCategory, setGroupFilterCategory] = useState<string>("alle");

  const handleCreateNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showFeedback("Gruppen må ha et navn", "error");
      return;
    }
    const tagsArray = newGroupTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await createGroup({
      name: newGroupName.trim(),
      category: newGroupCategory,
      description: newGroupDescription.trim() || undefined,
      tags: tagsArray,
      leaderIds: newGroupLeaderId ? [newGroupLeaderId] : [],
      memberIds: newGroupLeaderId ? [newGroupLeaderId] : [],
    });

    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupTags("");
    setNewGroupLeaderId("");
    setIsCreatingGroup(false);
    showFeedback(`Gruppen "${newGroupName}" ble opprettet!`);
  };

  // Statistics for Dashboard
  const publicGatheringsCount = adminGatherings.filter(
    (item) => item.gathering.visibility !== "intern"
  ).length;
  const urgentTasksCount = adminTasks.filter(
    (item) => item.taskStaffing.hasForfall || item.taskStaffing.color === "red" || item.task.status === "vacant"
  ).length;
  const unassignedTasksCount = adminTasks.filter(
    (item) => item.availableSpots > 0 || !item.isFullyCovered
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="font-black text-sm text-white">Menighetsplan Admin Studio</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION (FULLSKJERMS ARBEIDSFLATE)            */}
      {/* ========================================================= */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Header Brand */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">Admin & CMS Studio</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Sanntid</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Fullskjerms administrasjon for {settings.churchName}
            </p>
          </div>

          {/* Nav Section: Dashboard */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleTabChange("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Oversikt & Dashboard</span>
            </button>

            {/* Quick Context Navigation */}
            <div className="pt-2 pb-1 space-y-1.5 border-t border-slate-800/80">
              <Link
                to="/minside"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gå til Min Side</span>
                </div>
                <span className="text-[10px] text-slate-400">Min profil</span>
              </Link>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Åpne offentlig nettside</span>
                </div>
                <span className="text-[10px] text-slate-400">Forside ↗</span>
              </Link>
            </div>
          </div>

          {/* Nav Section: Nettside & CMS */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
              Nettside & CMS
            </div>

            <button
              type="button"
              onClick={() => handleTabChange("cms-sider")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-sider"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Sider & Innhold</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {pages.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cms-nyheter")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-nyheter"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4" />
                <span>Aktuelt & Nyheter</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {news.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cms-taler")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-taler"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-amber-300" />
                <span>Taler & Prekener</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {sermons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cms-stab")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-stab"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Lederskap & Stab</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {staff.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cms-innstillinger")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-innstillinger"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Nettside-innstillinger</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cms-overstyringer")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "cms-overstyringer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Forside-overstyring</span>
            </button>
          </div>

          {/* Nav Section: Menighetsplanlegger */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
              Arrangementer & Bemanning
            </div>

            <button
              type="button"
              onClick={() => handleTabChange("planlegger-samlinger")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-samlinger"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Arrangementer</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminGatherings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("planlegger-oppgaver")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-oppgaver"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 text-amber-400" />
                <span>Trenger oppfølging</span>
              </div>
              {urgentTasksCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 border border-red-700 text-red-300 font-bold">
                  {urgentTasksCount} ubesatt
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {adminTasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("planlegger-grupper")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-grupper"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4" />
                <span>Grupper & Husfellesskap</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminGroups.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("planlegger-personer")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "planlegger-personer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Personer & Roller</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {adminPersons.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer / Quick Switchers */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2 text-xs">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Åpne offentlig nettside</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/minside"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Gå til Min Side</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Database & innstillinger</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Innlogget som:</span>
            <strong className="text-white truncate max-w-[120px]">{currentUser.name}</strong>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT                                    */}
      {/* ========================================================= */}
      <main className="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:p-8">
        {/* ========================================================= */}
        {/* 1. DASHBOARD                                              */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Velkommen til Admin Studio
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Komplett administrasjon av {settings.churchName}: offentlig nettside, gudstjenestelister og frivillige på felles Firestore-database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Se nettsiden live</span>
                </Link>
                <Link
                  to="/minside"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                  <span>Min Side</span>
                </Link>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                onClick={() => handleTabChange("planlegger-samlinger")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gudstjenester</span>
                  <Calendar className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-white">{adminGatherings.length}</div>
                <p className="text-[11px] text-slate-400">{publicGatheringsCount} offentlig i kalenderen</p>
              </div>

              <div
                onClick={() => handleTabChange("planlegger-oppgaver")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oppgaver</span>
                  <ListTodo className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">{adminTasks.length}</div>
                <p className="text-[11px] text-slate-400">
                  {urgentTasksCount > 0 ? (
                    <span className="text-red-400 font-bold">{urgentTasksCount} trenger vikar!</span>
                  ) : (
                    "Alle vakter besatt"
                  )}
                </p>
              </div>

              <div
                onClick={() => handleTabChange("cms-taler")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taler & Prekener</span>
                  <Headphones className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-3xl font-black text-white">{sermons.length}</div>
                <p className="text-[11px] text-slate-400">Opptak tilgjengelig for menigheten</p>
              </div>

              <div
                onClick={() => handleTabChange("cms-sider")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CMS Sider</span>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">{pages.length}</div>
                <p className="text-[11px] text-slate-400">Publiserte sider på nettsiden</p>
              </div>

              <div
                onClick={() => handleTabChange("cms-nyheter")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nyheter & Aktuelt</span>
                  <Newspaper className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-3xl font-black text-white">{news.length}</div>
                <p className="text-[11px] text-slate-400">Artikler for medlemmer & offentlighet</p>
              </div>

              <div
                onClick={() => handleTabChange("cms-stab")}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lederskap & Stab</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-white">{staff.length}</div>
                <p className="text-[11px] text-slate-400">Registrerte ledere og ansatte</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hurtighandlinger Nettside CMS */}
              <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Hurtighandlinger: Nettside & CMS</span>
                </div>
                <div className="space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange("cms-nyheter");
                      handleOpenNewNews();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Skriv en ny aktuelt-sak eller nyhet</span>
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange("cms-sider");
                      handleOpenNewPage();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Opprett en ny underside på nettsiden</span>
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("cms-innstillinger")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Oppdater Vipps, kontonummer eller kontaktinfo</span>
                    <Sliders className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Hurtighandlinger Menighetsplanlegger */}
              <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Hurtighandlinger: Planlegger</span>
                </div>
                <div className="space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleTabChange("planlegger-samlinger")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Opprett ny gudstjeneste eller samling</span>
                    <Plus className="w-4 h-4 text-amber-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("planlegger-oppgaver")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Sjekk vikarstatus og ubesatte oppgaver</span>
                    <ListTodo className="w-4 h-4 text-rose-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("planlegger-personer")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-white font-semibold transition-colors text-left"
                  >
                    <span>Administrer medlemmer, ledere og frivillige</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. CMS SIDER                                              */}
        {/* ========================================================= */}
        {activeTab === "cms-sider" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Sider & Innhold på nettsiden</h2>
                <p className="text-xs text-slate-400">
                  Administrer nettsidens hierarkiske menystruktur, hovedfaner og underfaner (dropdowns).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewPage(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ny hovedfane</span>
              </button>
            </div>

            {/* Tree Overview Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
                  <FolderTree className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white text-sm">📁 Hovedmeny (Offentlig nettsted)</h3>
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                      {hierarchicalPages.length} hovedfaner
                    </span>
                    <span className="text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded">
                      {pages.filter((p) => p.parentId).length} underfaner
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trestrukturen speiles direkte i den offentlige menyen med automatisk dropdown for underfaner.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Link
                  to="/"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Åpne nettside</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleOpenNewPage(null)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Legg til fane</span>
                </button>
              </div>
            </div>

            {/* Side Editor Modal / Panel */}
            {editingPage && (
              <form onSubmit={handleSavePage} className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>
                      {isNewPage
                        ? editingPage.parentId
                          ? "Opprett ny underfane"
                          : "Opprett ny hovedfane"
                        : `Rediger side: ${editingPage.title}`}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tittel på siden / fanen</label>
                    <input
                      type="text"
                      value={editingPage.title || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                      placeholder="f.eks. Gospelkoret eller Utleie for kurs"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">URL-adresse (slug)</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-slate-950 border border-r-0 border-slate-700 rounded-l-xl text-slate-400">
                        /
                      </span>
                      <input
                        type="text"
                        value={editingPage.slug || ""}
                        onChange={(e) =>
                          setEditingPage({
                            ...editingPage,
                            slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        placeholder="gospelkoret"
                        className="w-full px-3 py-2 rounded-r-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Hierarkisk menyplassering & Rekkefølge */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Menyplassering (Nivå i hierarkiet)</span>
                    </label>
                    <select
                      value={editingPage.parentId || ""}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          parentId: e.target.value ? e.target.value : null,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 text-xs"
                    >
                      <option value="">📁 Hovedfane på toppmenyen (Toppnivå 1)</option>
                      <optgroup label="Eller plasser som underfane (dropdown) under:">
                        {availableParentPages.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            ↳ Underfane under: {parent.title}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Hovedfaner vises i navigasjonslinjen. Underfaner legges automatisk i nedtrekksmenyen.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Menyrekkefølge</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={editingPage.navOrder ?? 1}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          navOrder: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400">1 = først fra venstre / øverst i nedtrekk.</p>
                  </div>
                </div>

                {/* Valgfri snarvei til eksisterende rute */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">
                    Valgfri snarvei / tilpasset URL (f.eks. for eksisterende moduler)
                  </label>
                  <input
                    type="text"
                    value={editingPage.linkUrl || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, linkUrl: e.target.value })}
                    placeholder="f.eks. /hva-skjer for kalender, eller /fellesskap (la stå tom for å bruke standard innhold)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Hvis dette feltet fylles ut, leder menylenken direkte til denne ruten i stedet for artikkelvisning.
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Kort sammendrag (ingress)</label>
                  <input
                    type="text"
                    value={editingPage.summary || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, summary: e.target.value })}
                    placeholder="Kort beskrivelse som vises øverst og i søkemotorer..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">
                    Innhold (Støtter Markdown med ## Overskrift, - Punktliste)
                  </label>
                  <textarea
                    rows={7}
                    value={editingPage.content || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Publiserings- og Menyinnstillinger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPage.isPublished !== false}
                      onChange={(e) => setEditingPage({ ...editingPage, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold block text-white">Publiser på nettsiden</span>
                      <span className="text-[11px] text-slate-400">Synlig for alle besøkende (ikke kladd).</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPage.inNavMenu !== false}
                      onChange={(e) => setEditingPage({ ...editingPage, inNavMenu: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold block text-white">Vis i offentlig meny</span>
                      <span className="text-[11px] text-slate-400">
                        Vises i topplinjen/dropdown (av = kun via direkte lenke).
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Lagre side til Firestore
                  </button>
                </div>
              </form>
            )}

            {/* Hierarchical Tree of Pages */}
            <div className="space-y-4">
              {hierarchicalPages.map((item) => {
                const parent = item.parent;
                const hasChildren = item.children.length > 0;
                const targetUrl = parent.linkUrl || (parent.slug ? `/${parent.slug}` : "/");

                return (
                  <div
                    key={parent.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xs hover:border-slate-600 transition-all space-y-3"
                  >
                    {/* Top Level Main Tab Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0"
                            title="Menyrekkefølge"
                          >
                            #{parent.navOrder ?? 1}
                          </span>
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          <h3 className="font-bold text-white text-base truncate">{parent.title}</h3>
                          <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded">
                            {targetUrl}
                          </span>

                          {parent.isPublished ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                              Publisert
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                              Kladd
                            </span>
                          )}

                          {parent.inNavMenu !== false ? (
                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                              I toppmeny
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-stone-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                              Skjult fra meny
                            </span>
                          )}

                          {hasChildren && (
                            <span className="text-[10px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                              {item.children.length} underfane{item.children.length > 1 ? "r" : ""}
                            </span>
                          )}
                        </div>

                        {parent.summary && (
                          <p className="text-xs text-slate-400 line-clamp-1 pl-8">{parent.summary}</p>
                        )}
                      </div>

                      {/* Main Tab Actions */}
                      <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenNewPage(parent.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Opprett ny underfane som legger seg under denne fanen"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Underfane</span>
                        </button>
                        <Link
                          to={targetUrl}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Forhåndsvis side"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPage(parent)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Rediger</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPageId(parent.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                          title="Slett fane"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-tabs Tree (Rendered hierarchically underneath) */}
                    {hasChildren && (
                      <div className="ml-3 sm:ml-6 pl-3 sm:pl-6 border-l-2 border-indigo-500/30 space-y-2 pt-1 pb-1">
                        {item.children.map((child, cIdx) => (
                          <div
                            key={child.id}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative before:absolute before:-left-3 sm:before:-left-6 before:top-1/2 before:w-3 sm:before:w-6 before:h-0.5 before:bg-indigo-500/30"
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                  #{child.navOrder ?? cIdx + 1}
                                </span>
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <h4 className="font-semibold text-white text-sm truncate">{child.title}</h4>
                                <span className="text-[11px] font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded">
                                  /{child.slug}
                                </span>

                                {child.isPublished ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 py-0.5 rounded">
                                    Publisert
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-900 px-1.5 py-0.5 rounded">
                                    Kladd
                                  </span>
                                )}

                                {child.inNavMenu !== false ? (
                                  <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded">
                                    I meny
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-stone-400 bg-slate-950 px-1.5 py-0.5 rounded">
                                    Skjult
                                  </span>
                                )}
                              </div>
                              {child.summary && (
                                <p className="text-xs text-slate-400 line-clamp-1 pl-6">{child.summary}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
                              <Link
                                to={child.linkUrl || `/${child.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Forhåndsvis underside"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPage(child)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Rediger</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmPageId(child.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                                title="Slett underside"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Orphan Pages if any */}
              {orphanPages.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-3 mt-6">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Frittstående sider uten tilordnet overordnet fane</span>
                  </h3>
                  <div className="space-y-2">
                    {orphanPages.map((op) => (
                      <div
                        key={op.id}
                        className="p-3 rounded-xl bg-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-white">{op.title}</span>
                          <span className="font-mono text-indigo-400">/{op.slug}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPage(op)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold"
                        >
                          Tilordne overordnet fane
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slettebekreftelse Modal for Sider */}
            {deleteConfirmPageId && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <span>Slette side permanent?</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Er du sikker på at du vil slette denne siden fra nettsiden? Denne handlingen kan ikke angres.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPageId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePage(deleteConfirmPageId);
                        setDeleteConfirmPageId(null);
                        showFeedback("Siden ble slettet");
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Ja, slett permanent
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. CMS NYHETER & AKTUELT                                  */}
        {/* ========================================================= */}
        {activeTab === "cms-nyheter" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Aktuelt & Nyhetsartikler</h2>
                <p className="text-xs text-slate-400">
                  Publiser nyheter, rapporter fra leir og oppdateringer for menighetens forside.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewNews}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ny artikkel</span>
              </button>
            </div>

            {/* News Editor Modal / Panel */}
            {editingNews && (
              <form onSubmit={handleSaveNews} className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-indigo-400" />
                    <span>{isNewNews ? "Skriv ny artikkel" : `Rediger artikkel: ${editingNews.title}`}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingNews(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tittel</label>
                    <input
                      type="text"
                      value={editingNews.title || ""}
                      onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                      placeholder="f.eks. Flott oppstart for høstens søndagsskole"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300">Kategori</label>
                      <select
                        value={editingNews.category || "aktuelt"}
                        onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                      >
                        <option value="aktuelt">Aktuelt</option>
                        <option value="gudstjeneste">Gudstjeneste</option>
                        <option value="ungdom">Ungdom</option>
                        <option value="misjon">Misjon</option>
                        <option value="familie">Familie</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300">Forfatter</label>
                      <input
                        type="text"
                        value={editingNews.author || ""}
                        onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Ingress / Sammendrag</label>
                  <textarea
                    rows={2}
                    value={editingNews.summary || ""}
                    onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                    placeholder="En kort innledning som fanger oppmerksomheten..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Artikkeltekst</label>
                  <textarea
                    rows={7}
                    value={editingNews.content || ""}
                    onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingNews.isPublished !== false}
                      onChange={(e) => setEditingNews({ ...editingNews, isPublished: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Publiser artikkelen direkte på nettsiden</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNews(null)}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                    >
                      Lagre artikkel til Firestore
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of News */}
            <div className="space-y-3">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-white text-base">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{item.summary}</p>
                    <div className="text-[11px] text-slate-400">
                      Av {item.author} · {new Date(item.publishedAt).toLocaleDateString("no-NO")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      to={`/artikkel/${item.id}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Les artikkel"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEditNews(item)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Rediger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Vil du slette artikkelen "${item.title}"?`)) {
                          deleteNews(item.id);
                          showFeedback("Artikkelen ble slettet");
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                      title="Slett artikkel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3B. CMS TALER & PREKENER                                  */}
        {/* ========================================================= */}
        {activeTab === "cms-taler" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Taler & Prekenarkiv</h2>
                <p className="text-xs text-slate-400">
                  Last opp eller lenk opptak fra søndagens gudstjenester med taler, bibeltekst og serie.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewSermon}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Legg til tale</span>
              </button>
            </div>

            {/* Sermon Editor Form */}
            {editingSermon && (
              <form onSubmit={handleSaveSermon} className="p-6 rounded-2xl bg-slate-800 border border-amber-500/80 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span>{isNewSermon ? "Legg til ny tale" : `Rediger tale: ${editingSermon.title}`}</span>
                  </h3>
                  <button type="button" onClick={() => setEditingSermon(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tittel på talen</label>
                    <input
                      type="text"
                      value={editingSermon.title || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, title: e.target.value })}
                      placeholder="f.eks. Guds rike er kommet nær"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Taler</label>
                    <input
                      type="text"
                      value={editingSermon.speaker || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, speaker: e.target.value })}
                      placeholder="f.eks. Pastor Kari Nordmann"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Bibeltekst</label>
                    <input
                      type="text"
                      value={editingSermon.bibleText || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, bibleText: e.target.value })}
                      placeholder="f.eks. Markus 1,14–15"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Taleserie (valgfritt)</label>
                    <input
                      type="text"
                      value={editingSermon.series || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, series: e.target.value })}
                      placeholder="f.eks. Vandring gjennom Markus"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Spotify-lenke (Episode eller Podkast)</label>
                    <input
                      type="url"
                      value={editingSermon.spotifyUrl || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, spotifyUrl: e.target.value })}
                      placeholder="https://open.spotify.com/episode/..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Lydfil (MP3)</label>
                    <input
                      type="url"
                      value={editingSermon.audioUrl || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, audioUrl: e.target.value })}
                      placeholder="https://.../tale.mp3"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-slate-300">Video-URL (YouTube/Vimeo)</label>
                    <input
                      type="url"
                      value={editingSermon.videoUrl || ""}
                      onChange={(e) => setEditingSermon({ ...editingSermon, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Kort sammendrag av talen</label>
                  <textarea
                    rows={3}
                    value={editingSermon.summary || ""}
                    onChange={(e) => setEditingSermon({ ...editingSermon, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSermon(null)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                  >
                    Lagre tale til Firestore
                  </button>
                </div>
              </form>
            )}

            {/* List of Sermons */}
            <div className="space-y-3">
              {sermons.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white text-base">{s.title}</h3>
                      {s.series && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded">
                          {s.series}
                        </span>
                      )}
                      {s.videoUrl && (
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Play className="w-3 h-3 text-indigo-400" />
                          Video (nocookie)
                        </span>
                      )}
                      {s.audioUrl && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Headphones className="w-3 h-3 text-amber-400" />
                          Lyd
                        </span>
                      )}
                      {!s.videoUrl && !s.audioUrl && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          Kun notat
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                      <span>Taler: <strong className="text-slate-200">{s.speaker || s.guestSpeakerName || "Ikke oppgitt"}</strong></span>
                      {s.bibleText && <span>Bibel: {s.bibleText}</span>}
                      <span>Dato: {new Date(s.date).toLocaleDateString("no-NO")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      to="/taler"
                      target="_blank"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Hør i arkiv"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSermon(s)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Rediger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Vil du slette talen "${s.title}"?`)) {
                          deleteSermon(s.id);
                          showFeedback("Talen ble slettet");
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                      title="Slett tale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3C. CMS LEDERSKAP & STAB                                  */}
        {/* ========================================================= */}
        {activeTab === "cms-stab" && (
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
                      onClick={() => {
                        if (confirm(`Vil du slette "${member.name}"?`)) {
                          deleteStaff(member.id);
                          showFeedback("Medarbeider slettet");
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
        )}

        {/* ========================================================= */}
        {/* 4. CMS NETTSIDE-INNSTILLINGER                              */}
        {/* ========================================================= */}
        {activeTab === "cms-innstillinger" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white">Nettside-innstillinger</h2>
              <p className="text-xs text-slate-400">
                Oppdater menighetens faste informasjon, Vipps-nummer, bankkonto, adresse og sosiale medier på felles Firestore.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Menighet & Merkevare */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Menighet & Merkevare</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Menighetens offisielle navn</label>
                    <input
                      type="text"
                      value={settingsForm.churchName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, churchName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Plattformnavn</label>
                    <input
                      type="text"
                      value={settingsForm.appName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Slagord / Visjon</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Hovedoverskrift på forsiden (Hero)</label>
                  <input
                    type="text"
                    value={settingsForm.welcomeHeadline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, welcomeHeadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-300">Ingresstekst på forsiden</label>
                  <textarea
                    rows={2}
                    value={settingsForm.welcomeSubtext}
                    onChange={(e) => setSettingsForm({ ...settingsForm, welcomeSubtext: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Gaver & Vipps */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Givertjeneste & Vipps</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Vipps-nummer</label>
                    <input
                      type="text"
                      value={settingsForm.vippsNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, vippsNumber: e.target.value })}
                      placeholder="#12345"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Bankkontonummer</label>
                    <input
                      type="text"
                      value={settingsForm.bankAccount}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                      placeholder="1503.xx.xxxxx"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Organisasjonsnummer</label>
                    <input
                      type="text"
                      value={settingsForm.orgNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, orgNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Kontaktinformasjon & Adresse */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Adresse & Kontakt</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Besøksadresse</label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Telefon</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">E-post</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Kontortid</label>
                    <input
                      type="text"
                      value={settingsForm.officeHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, officeHours: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lagre alle innstillinger til Firestore</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. CMS FORSIDE-OVERSTYRINGER                              */}
        {/* ========================================================= */}
        {activeTab === "cms-overstyringer" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white">Forside-overstyring for arrangementer</h2>
              <p className="text-xs text-slate-400">
                Stjernemerk gudstjenester for å fremheve dem på forsiden, eller skjul spesifikke hendelser fra den offentlige kalenderen.
              </p>
            </div>

            <div className="space-y-3">
              {adminGatherings.map((item) => {
                const g = item.gathering;
                const visibility = g.visibility || (overrides[g.id]?.featured ? "fremhevet" : overrides[g.id]?.hidden ? "intern" : "offentlig");
                const isFeatured = visibility === "fremhevet";
                const isHidden = visibility === "intern";
                const isPublic = visibility === "offentlig";

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base">{g.title}</h3>
                        {isFeatured && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            Fremhevet på forsiden
                          </span>
                        )}
                        {isPublic && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Globe className="w-3 h-3 text-emerald-400" />
                            Offentlig i kalender
                          </span>
                        )}
                        {isHidden && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Kun intern (skjult på nett)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatNorwegianDateTime(g.startsAt)} · {g.location || "Misjonskirken"}
                        {g.theme && ` · Tema: ${g.theme}`}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetGatheringVisibility(g.id, "fremhevet")}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isFeatured
                            ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                        }`}
                        title="Lås til toppen av forsiden"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-slate-950" : ""}`} />
                        <span>Fremhev</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetGatheringVisibility(g.id, "offentlig")}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isPublic
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                        }`}
                        title="Vises i offentlig kalender"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Offentlig</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetGatheringVisibility(g.id, "intern")}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isHidden
                            ? "bg-rose-600 text-white font-bold shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                        }`}
                        title="Skjul fra offentlig visning (kun intern planlegger)"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Kun intern</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. PLANLEGGER: GUDSTJENESTER & SAMLINGER                  */}
        {/* ========================================================= */}
        {activeTab === "planlegger-samlinger" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Gudstjenester & Møter</h2>
                <p className="text-xs text-slate-400">
                  Full oversikt over menighetens samlinger fra Firestore. Opprett nye og administrer oppgaver.
                </p>
              </div>
            </div>

            {/* Quick Create Gathering Form */}
            <form onSubmit={handleCreateGathering} className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Opprett ny samling</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newGatheringTitle}
                    onChange={(e) => setNewGatheringTitle(e.target.value)}
                    placeholder="Tittel, f.eks. Søndagsgudstjeneste & dåp"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={newGatheringDate}
                    onChange={(e) => setNewGatheringDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={newGatheringTime}
                    onChange={(e) => setNewGatheringTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  value={newGatheringTheme}
                  onChange={(e) => setNewGatheringTheme(e.target.value)}
                  placeholder="Valgfritt tema for gudstjenesten..."
                  className="w-full sm:max-w-md px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Legg til i planleggeren
                </button>
              </div>
            </form>

            {/* Gatherings List */}
            <div className="space-y-3">
              {adminGatherings.map((item) => {
                const g = item.gathering;
                const staffing = item.staffing;

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base">{g.title}</h3>
                        {g.isGudstjeneste && (
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded">
                            Gudstjeneste
                          </span>
                        )}

                        {/* Staffing Status with SVG icon (WCAG AA) */}
                        {staffing.color === "green" && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Dekket ({item.coveredTasksCount}/{item.totalTasks})
                          </span>
                        )}
                        {staffing.color === "yellow" && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Venter på svar
                          </span>
                        )}
                        {staffing.color === "red" && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            Mangler {item.missingStaffingCount} frivillige
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatNorwegianDateTime(g.startsAt)} · {g.location || "Hovedsalen"}
                        {g.theme && ` · Tema: ${g.theme}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNextGatheringSource(item);
                          setNextGatheringDate("");
                          setNextGatheringTime("11:00");
                          setNextGatheringLocation(g.location || "Misjonskirken");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="Opprett neste arrangement og klon oppgaver med tom personliste"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Lag neste arrangement</span>
                      </button>

                      <Link
                        to={`/admin/samling/${g.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <ListTodo className="w-3.5 h-3.5" />
                        <span>Oppgaver & Kjøreplan</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. PLANLEGGER: OPPGAVER & FRIVILLIGE                      */}
        {/* ========================================================= */}
        {activeTab === "planlegger-oppgaver" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white">Oppgaver & Frivilligoversikt</h2>
              <p className="text-xs text-slate-400">
                Se status for alle tildelte oppgaver, vikar-varsler og bekreftelser for menighetens samlinger.
              </p>
            </div>

            {/* Filter Chips for Oppgaver */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTaskFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Alle oppgaver ({adminTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("urgent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  taskFilter === "urgent" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Trenger oppfølging / Vikar ({urgentTasksCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("uncovered")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === "uncovered" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Venter på svar / Ubesatt ({unassignedTasksCount})
              </button>
            </div>

            <div className="space-y-3">
              {adminTasks
                .filter((item) => {
                  if (taskFilter === "urgent") return item.taskStaffing.hasForfall || item.taskStaffing.color === "red" || item.task.status === "vacant";
                  if (taskFilter === "uncovered") return item.availableSpots > 0 || !item.isFullyCovered;
                  return true;
                })
                .map((item) => {
                  const task = item.task;
                  const g = item.gathering;
                  const staffing = item.taskStaffing;
                  const isAcute = g && (new Date(g.startsAt).getTime() - Date.now()) < 48 * 3600 * 1000 && (staffing.hasForfall || item.missingCount > 0);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAcute
                          ? "bg-rose-950/30 border-rose-600/80 shadow-md"
                          : staffing.color === "red"
                          ? "bg-slate-800/90 border-rose-900/60"
                          : staffing.color === "yellow"
                          ? "bg-slate-800/80 border-amber-900/60"
                          : "bg-slate-800/80 border-slate-700/80"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-base">{task.title}</h3>

                            {isAcute && (
                              <span className="text-[10px] font-black text-rose-300 bg-rose-950 border border-rose-600 px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                AKUTT FORFALL (&lt; 48t)
                              </span>
                            )}

                            {/* Staffing Status with SVG icon (WCAG AA) */}
                            {staffing.color === "green" && (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Dekket ({item.confirmedCount}/{item.neededCount})
                              </span>
                            )}
                            {staffing.color === "yellow" && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Venter ({item.confirmedCount}/{item.neededCount} bekreftet, {item.pendingCount} venter)
                              </span>
                            )}
                            {staffing.color === "red" && !isAcute && (
                              <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                Mangler {item.missingCount} ({item.confirmedCount}/{item.neededCount} bekreftet)
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                              {item.availableSpots} ledig(e) plass(er)
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">
                            Arrangement: <strong className="text-white">{g?.title || "Uten tilknyttet samling"}</strong>
                            {g?.startsAt && ` · ${formatNorwegianDateTime(g.startsAt)}`}
                          </p>

                          {/* Assigned persons list */}
                          <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-400 font-semibold text-[11px]">Tildelt:</span>
                            {item.assignedPersonsList.length === 0 ? (
                              <span className="text-slate-500 italic text-[11px]">Ingen personer tildelt ennå</span>
                            ) : (
                              item.assignedPersonsList.map((ap) => (
                                <span
                                  key={ap.assignment.id}
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs ${
                                    ap.response === "confirmed"
                                      ? "bg-emerald-950/70 border-emerald-800 text-emerald-300 font-bold"
                                      : ap.response === "withdrawn"
                                      ? "bg-rose-950/80 border-rose-800 text-rose-300 font-bold"
                                      : "bg-amber-950/70 border-amber-800 text-amber-300"
                                  }`}
                                >
                                  <span>{ap.person?.name || "Ukjent person"}</span>
                                  <span className="text-[10px] opacity-80 font-normal">({ap.statusLabel})</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                          {item.availableSpots > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setAssigningTaskItem(item);
                                  setSelectedPersonIdToAssign("");
                                  setAssignMode("confirmed");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                title="Sett status direkte til Bekreftet (muntlig avtalt)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tildel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setAssigningTaskItem(item);
                                  setSelectedPersonIdToAssign("");
                                  setAssignMode("pending");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                title="Send forespørsel (setter status til Venter på svar)"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Forespør</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenReminderModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                            title="Purr / generer SMS- og Messenger-tekst"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Purr</span>
                          </button>

                          <Link
                            to={`/admin/oppgave/${task.id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium"
                          >
                            Rediger
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. PLANLEGGER: GRUPPER & HUSFELLESSKAP                    */}
        {/* ========================================================= */}
        {activeTab === "planlegger-grupper" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Grupper & Fellesskap</h2>
                <p className="text-xs text-slate-400">
                  Administrer ledergrupper (stab/styre), strategigrupper (vekstgrupper), tjenestegrupper, husgrupper og interessegrupper.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingGroup ? "Lukk skjema" : "Opprett ny gruppe"}</span>
              </button>
            </div>

            {/* Create Group Form */}
            {isCreatingGroup && (
              <form onSubmit={handleCreateNewGroup} className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Opprett ny gruppe</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Gruppenavn</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="f.eks. Turgruppe & Friluft eller Vekstgruppe Bønn"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Kategori</label>
                    <select
                      value={newGroupCategory}
                      onChange={(e) => setNewGroupCategory(e.target.value as GroupCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="ledergruppe">Ledergruppe (Stabsgruppe, lederskapsgruppe, gruppeledere)</option>
                      <option value="strategigruppe">Strategigruppe (Vekstgrupper Bønn, Kommunikasjon, Historie)</option>
                      <option value="tjenestegruppe">Tjenestegruppe (Lyd, kirkekaffe, søndagsskole)</option>
                      <option value="husgruppe">Husgruppe (Husfellesskap i hjemmene)</option>
                      <option value="interessegruppe">Interessegruppe (Turgruppe, kor, hobby, senior)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tagger (kommaseparert)</label>
                    <input
                      type="text"
                      value={newGroupTags}
                      onChange={(e) => setNewGroupTags(e.target.value)}
                      placeholder="f.eks. vekstgruppe, menighetsskole, bønn"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Leder</label>
                    <select
                      value={newGroupLeaderId}
                      onChange={(e) => setNewGroupLeaderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="">Velg leder (valgfritt)...</option>
                      {adminPersons.map((p) => (
                        <option key={p.person.id} value={p.person.id}>
                          {p.person.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-300">Beskrivelse</label>
                    <textarea
                      rows={2}
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Kort beskrivelse av formålet med gruppen..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
                  >
                    Opprett gruppe
                  </button>
                </div>
              </form>
            )}

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "alle", label: `Alle (${adminGroups.length})` },
                { key: "ledergruppe", label: `Ledergrupper (${adminGroups.filter((g) => g.group.category === "ledergruppe").length})` },
                { key: "strategigruppe", label: `Strategigrupper (${adminGroups.filter((g) => g.group.category === "strategigruppe").length})` },
                { key: "tjenestegruppe", label: `Tjenestegrupper (${adminGroups.filter((g) => g.group.category === "tjenestegruppe").length})` },
                { key: "husgruppe", label: `Husgrupper (${adminGroups.filter((g) => g.group.category === "husgruppe").length})` },
                { key: "interessegruppe", label: `Interessegrupper (${adminGroups.filter((g) => g.group.category === "interessegruppe").length})` },
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setGroupFilterCategory(chip.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    groupFilterCategory === chip.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminGroups
                .filter((g) => {
                  if (groupFilterCategory === "alle") return true;
                  return g.group.category === groupFilterCategory;
                })
                .map((g) => {
                  const cat = g.group.category || "tjenestegruppe";
                  const catBadgeColor =
                    cat === "ledergruppe"
                      ? "text-indigo-300 bg-indigo-950/80 border-indigo-800"
                      : cat === "strategigruppe"
                      ? "text-purple-300 bg-purple-950/80 border-purple-800"
                      : cat === "husgruppe"
                      ? "text-emerald-300 bg-emerald-950/80 border-emerald-800"
                      : cat === "interessegruppe"
                      ? "text-amber-300 bg-amber-950/80 border-amber-800"
                      : "text-slate-300 bg-slate-900 border-slate-700";

                  return (
                    <div
                      key={g.group.id}
                      className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${catBadgeColor}`}
                          >
                            {cat}
                          </span>
                          <span className="text-xs text-slate-400">{g.members.length} medlemmer</span>
                        </div>

                        <h3 className="font-bold text-white text-lg">{g.group.name}</h3>

                        {g.group.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {g.group.description}
                          </p>
                        )}

                        {/* Tags */}
                        {g.group.tags && g.group.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {g.group.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300"
                              >
                                <Tag className="w-2.5 h-2.5 text-slate-500" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-slate-400 pt-1">
                          Leder:{" "}
                          <strong className="text-slate-200">
                            {g.leaders.length > 0 ? g.leaders.map((l) => l.name).join(", ") : "Ikke satt"}
                          </strong>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <Link
                          to={`/admin/gruppe/${g.group.id}`}
                          className="font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          Administrer gruppe →
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 9. PLANLEGGER: PERSONER & ROLLER                          */}
        {/* ========================================================= */}
        {activeTab === "planlegger-personer" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white">Personregister & Roller</h2>
              <p className="text-xs text-slate-400">
                Administrer roller, kontaktinfo og tilganger for medlemmer og ledere.
              </p>
            </div>

            <div className="space-y-3">
              {adminPersons.map((person) => {
                const isAdminRole = person.globalRole === "admin";
                const hasPoliceCert = Boolean(person.policeCertificateValidUntil);
                const unavailableCount = person.unavailablePeriods?.length || 0;

                return (
                  <div
                    key={person.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base">{person.name}</h3>
                        {isAdminRole ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
                            Administrator (Co-Admin)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-indigo-300">
                            Frivillig / Medlem
                          </span>
                        )}

                        {hasPoliceCert ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-400" />
                            Politiattest OK
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-600" />
                            Ingen attest
                          </span>
                        )}

                        {unavailableCount > 0 && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <CalendarX className="w-3 h-3 text-amber-400" />
                            {unavailableCount} fraværsperiode(r)
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                        {person.phone && <span>Tlf: {person.phone}</span>}
                        {person.email && <span>E-post: {person.email}</span>}
                      </div>
                    </div>

                    <Link
                      to={`/admin/person/${person.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold shrink-0"
                    >
                      Rediger person & fravær
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: LAG NESTE ARRANGEMENT (KLON OPPGAVER)            */}
        {/* ========================================================= */}
        {nextGatheringSource && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Lag neste arrangement</h3>
                    <p className="text-[11px] text-slate-400">Kloner oppgaver og bemanningsbehov</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNextGatheringSource(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-white">
                  Kilde: {nextGatheringSource.gathering.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Systemet oppretter et nytt arrangement og kopierer over alle {nextGatheringSource.tasks.length} oppgaver med definert antall som trengs (neededCount). Personlisten etterlates tom slik at frivillige kan tildeles eller inviteres på nytt.
                </p>
              </div>

              <form onSubmit={handleCreateNextGathering} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Dato for nytt arrangement *</label>
                    <input
                      type="date"
                      value={nextGatheringDate}
                      onChange={(e) => setNextGatheringDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Klokkeslett *</label>
                    <input
                      type="time"
                      value={nextGatheringTime}
                      onChange={(e) => setNextGatheringTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Lokasjon</label>
                  <input
                    type="text"
                    value={nextGatheringLocation}
                    onChange={(e) => setNextGatheringLocation(e.target.value)}
                    placeholder="f.eks. Misjonskirken eller Hovedsalen"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNextGatheringSource(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Opprett & klon {nextGatheringSource.tasks.length} oppgaver</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: TILDEL ELLER FORESPØR FRIVILLIG                  */}
        {/* ========================================================= */}
        {assigningTaskItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      assignMode === "confirmed"
                        ? "bg-emerald-950/80 border border-emerald-700/80 text-emerald-400"
                        : "bg-amber-950/80 border border-amber-700/80 text-amber-400"
                    }`}
                  >
                    {assignMode === "confirmed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {assignMode === "confirmed" ? "Tildel oppgave (Bekreftet)" : "Forespør frivillig (Venter på svar)"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {assigningTaskItem.task.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningTaskItem(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle switch between Tildel vs Forespør */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAssignMode("confirmed")}
                  className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assignMode === "confirmed"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tildel direkte</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode("pending")}
                  className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assignMode === "pending"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Forespør</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  {assignMode === "confirmed"
                    ? "Setter status umiddelbart til Bekreftet. Brukes når du allerede har avtalt vakten muntlig med personen."
                    : "Setter status til Venter på svar og sender en forespørsel til personen."}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Ledige plasser på oppgaven: {assigningTaskItem.availableSpots} av {assigningTaskItem.neededCount}
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-300">Velg person fra medlemsregisteret</label>
                <select
                  value={selectedPersonIdToAssign}
                  onChange={(e) => setSelectedPersonIdToAssign(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 text-xs cursor-pointer"
                >
                  <option value="">-- Velg person --</option>
                  {allPersons.map((p) => {
                    const isAlreadyAssigned = assigningTaskItem.assignedPersonsList.some(
                      (ap) => ap.person?.id === p.id
                    );
                    const isUnavailable = p.unavailablePeriods && p.unavailablePeriods.length > 0;
                    return (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={isAlreadyAssigned}
                      >
                        {p.name} {isAlreadyAssigned ? "(Allerede på oppgaven)" : ""} {isUnavailable ? "⚠️ Fravær registrert" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssigningTaskItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAssign}
                  disabled={!selectedPersonIdToAssign}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all ${
                    !selectedPersonIdToAssign
                      ? "opacity-50 cursor-not-allowed bg-slate-700"
                      : assignMode === "confirmed"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {assignMode === "confirmed" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fullfør tildeling</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send forespørsel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: PURR / SEND PÅMINNELSE (SMS/MESSENGER)           */}
        {/* ========================================================= */}
        {reminderTaskItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Purr / Send påminnelse</h3>
                    <p className="text-[11px] text-slate-400">
                      Oppgave: {reminderTaskItem.task.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderTaskItem(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-300">
                  Ferdigformatert melding (klar til sending via SMS, Messenger eller Spond)
                </label>
                <textarea
                  readOnly
                  rows={4}
                  value={reminderText}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden leading-relaxed select-all font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Når du åpner purringen loggføres tidsstempel (lastReminded) i databasen, slik at lederteamet ser når frivillig sist ble kontaktet.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReminderTaskItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Lukk
                </button>
                <button
                  type="button"
                  onClick={handleCopyReminder}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copiedReminder ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Kopiert til utklippstavle!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier tekst</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
