import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useAdminDashboard,
  useModuleConfig,
  formatNorwegianDateTime,
  parseIsoToDateAndTime,
  combineDateAndTimeToIso,
} from "../../hooks/useAppHooks";
import { useCms } from "../../context/CmsContext";
import { CmsPage, CmsNewsArticle, CmsSettings, CmsSermon, CmsStaffMember } from "../../data/cmsData";
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
  UserPlus,
  Play,
  Volume2,
  Tag,
  Compass,
  Target,
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

  const handleOpenNewPage = () => {
    setEditingPage({
      title: "",
      slug: "",
      summary: "",
      content: "## Ny seksjon\nSkriv artikkel eller infotekst her...\n\n- Punkt 1\n- Punkt 2",
      isPublished: true,
    });
    setIsNewPage(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editingPage.title || !editingPage.slug) {
      showFeedback("Tittel og URL-sti må fylles ut", "error");
      return;
    }
    await savePage(editingPage);
    setEditingPage(null);
    showFeedback("Siden ble lagret til Firestore!");
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
    await saveSermon(editingSermon);
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
    showFeedback("Nettside-innstillingene ble oppdatert i Firestore!");
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

  // Statistics for Dashboard
  const publicGatheringsCount = adminGatherings.filter((g) => g.isPublic !== false).length;
  const urgentTasksCount = adminTasks.filter((t) => t.status === "trenger_vikar").length;
  const unassignedTasksCount = adminTasks.filter((t) => !t.assignedPersonId).length;

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
              Gudstjenester & Planlegger
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
                <Calendar className="w-4 h-4" />
                <span>Gudstjenester</span>
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
                <ListTodo className="w-4 h-4" />
                <span>Oppgaver & Frivillige</span>
              </div>
              {urgentTasksCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 font-bold">
                  {urgentTasksCount} vikar
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
                  Rediger faste undersider som Om oss, Kontakt og Barn & Unge, eller opprett nye.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewPage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ny side</span>
              </button>
            </div>

            {/* Side Editor Modal / Panel */}
            {editingPage && (
              <form onSubmit={handleSavePage} className="p-6 rounded-2xl bg-slate-800 border border-indigo-500/80 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>{isNewPage ? "Opprett ny side" : `Rediger: ${editingPage.title}`}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tittel på siden</label>
                    <input
                      type="text"
                      value={editingPage.title || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                      placeholder="f.eks. Ungdomsarbeidet"
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
                        onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                        placeholder="ungdom"
                        className="w-full px-3 py-2 rounded-r-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
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
                    rows={8}
                    value={editingPage.content || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPage.isPublished !== false}
                      onChange={(e) => setEditingPage({ ...editingPage, isPublished: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Publiser denne siden på nettsiden</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPage(null)}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                    >
                      Lagre side til Firestore
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of Pages */}
            <div className="space-y-3">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{p.title}</h3>
                      <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded">
                        /{p.slug}
                      </span>
                      {p.isPublished ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                          Publisert
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">
                          Kladd
                        </span>
                      )}
                    </div>
                    {p.summary && <p className="text-xs text-slate-400 line-clamp-1">{p.summary}</p>}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      to={`/${p.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Forhåndsvis side"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEditPage(p)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Rediger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Er du sikker på at du vil slette siden "${p.title}"?`)) {
                          deletePage(p.id);
                          showFeedback("Siden ble slettet");
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                      title="Slett side"
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{s.title}</h3>
                      {s.series && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded">
                          {s.series}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                      <span>Taler: <strong className="text-slate-200">{s.speaker}</strong></span>
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
              {adminGatherings.map((g) => {
                const override = overrides[g.id];
                const isFeatured = Boolean(override?.featured);
                const isHidden = Boolean(override?.hidden);

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{g.title}</h3>
                        {isFeatured && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            Fremhevet
                          </span>
                        )}
                        {isHidden && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Skjult
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatNorwegianDateTime(g.startsAt)} · {g.location || "Misjonskirken"}
                        {g.theme && ` · Tema: ${g.theme}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleFeatureGathering(g.id)}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                          isFeatured
                            ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-slate-950" : ""}`} />
                        <span>{isFeatured ? "Fjern stjerne" : "Fremhev"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleHideGathering(g.id)}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                          isHidden
                            ? "bg-rose-600 text-white hover:bg-rose-500"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isHidden ? "Vis igjen" : "Skjul"}</span>
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
              {adminGatherings.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{g.title}</h3>
                      {g.isGudstjeneste && (
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded">
                          Gudstjeneste
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatNorwegianDateTime(g.startsAt)} · {g.location || "Hovedsalen"}
                      {g.theme && ` · Tema: ${g.theme}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/samling/${g.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>Oppgaver & Sanger</span>
                    </Link>
                  </div>
                </div>
              ))}
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

            <div className="space-y-3">
              {adminTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{task.title}</h3>
                      <StaffingBadge status={task.status as any} />
                    </div>
                    <p className="text-xs text-slate-400">
                      Tildelt: <strong className="text-slate-200">{task.assignedPersonName || "Ikke tildelt"}</strong> · Rolle: {task.role || "Frivillig"}
                    </p>
                  </div>

                  <Link
                    to={`/admin/oppgave/${task.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Rediger oppgave
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. PLANLEGGER: GRUPPER & HUSFELLESSKAP                    */}
        {/* ========================================================= */}
        {activeTab === "planlegger-grupper" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white">Grupper & Husfellesskap</h2>
              <p className="text-xs text-slate-400">
                Administrer husgrupper, lovsangsteam og tjenestegrupper i menigheten.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminGroups.map((g) => (
                <div
                  key={g.group.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">
                      {g.group.category || "Gruppe"}
                    </span>
                    <span className="text-xs text-slate-400">{g.memberCount} medlemmer</span>
                  </div>

                  <h3 className="font-bold text-white text-lg">{g.group.name}</h3>
                  <p className="text-xs text-slate-400">Leder: {g.leaderName || "Ikke satt"}</p>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <Link
                      to={`/admin/gruppe/${g.group.id}`}
                      className="font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      Administrer gruppe →
                    </Link>
                  </div>
                </div>
              ))}
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
              {adminPersons.map((person) => (
                <div
                  key={person.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{person.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-indigo-300">
                        {person.globalRole || "frivillig"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                      {person.phone && <span>Tlf: {person.phone}</span>}
                      {person.email && <span>E-post: {person.email}</span>}
                    </div>
                  </div>

                  <Link
                    to={`/admin/person/${person.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Rediger person
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
