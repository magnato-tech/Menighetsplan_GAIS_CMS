import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAdminTaskDetail,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  ArrowLeft,
  ListTodo,
  Calendar,
  MapPin,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  Users2,
  Hash,
} from "lucide-react";

export const AdminTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();

  const {
    isAdmin,
    currentUser,
    task,
    gathering,
    group,
    assignedPerson,
    allAssignedPersonsWithStatus,
    confirmedCount,
    isFullyCovered,
    missingCount,
    updateTaskInstruction,
    updateTaskNeededCount,
  } = useAdminTaskDetail(taskId || "");

  const [instruction, setInstruction] = useState<string>("");
  const [neededCountInput, setNeededCountInput] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      setInstruction(task.instruction || task.description || "");
      setNeededCountInput(task.neededCount !== undefined ? String(task.neededCount) : "");
    }
  }, [task]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveInstruction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task) return;

    setIsSaving(true);
    const res = updateTaskInstruction(instruction);
    setIsSaving(false);

    if (res.success) {
      showFeedback("Instruksen for rollen ble oppdatert!");
    } else {
      showFeedback(res.error || "Kunne ikke lagre instruksen.", "error");
    }
  };

  const handleSaveNeededCount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task) return;

    let parsedCount: number | undefined = undefined;
    if (neededCountInput.trim() !== "") {
      const num = parseInt(neededCountInput.trim(), 10);
      if (isNaN(num) || num < 0) {
        showFeedback("Behov må være et positivt heltall eller tomt.", "error");
        return;
      }
      parsedCount = num;
    }

    const res = updateTaskNeededCount(parsedCount);
    if (res.success) {
      showFeedback(
        parsedCount !== undefined
          ? `Bemanningsbehov satt til ${parsedCount} personer.`
          : "Bemanningsbehov ble tilbakestilt til 'ikke satt'."
      );
    } else {
      showFeedback(res.error || "Kunne ikke lagre bemanningsbehov.", "error");
    }
  };

  // Access denied screen if user is not admin
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
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til oppgavekortet i admin-flaten.
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
  if (!task) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fant ikke oppgaven</h3>
          <p className="text-xs text-slate-500">Oppgaven kan være slettet eller ID-en er ugyldig.</p>
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

  const categoryLabel = group
    ? GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label || "Tjenestegruppe"
    : "Tjenestegruppe";

  const formattedDate = gathering ? formatNorwegianDateTime(gathering.startsAt) : "Tidspunkt ikke oppgitt";

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Header */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin-from-task"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Oppgavekort
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-task-feedback-toast"
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
        {/* Main Task Overview Card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
          {/* Header & Status */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400">ID: {task.id}</span>
              <h1 className="text-base font-bold text-slate-800 leading-snug">{task.title}</h1>
            </div>

            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                isFullyCovered
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : task.status === "vacant"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {task.neededCount !== undefined
                ? isFullyCovered
                  ? "Fullt dekket"
                  : `Mangler: ${missingCount}`
                : task.status === "confirmed"
                ? "Dekket / Bekreftet"
                : task.status === "vacant"
                ? "Trenger vikar"
                : "Ledig oppgave"}
            </span>
          </div>

          {/* Samling Details */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Samling
            </span>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              {gathering ? (
                <Link
                  to={`/admin/samling/${gathering.id}`}
                  className="font-bold text-slate-800 hover:text-indigo-600 transition-colors flex items-center justify-between"
                >
                  <span>{gathering.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              ) : (
                <p className="font-bold text-slate-800">Ukjent samling</p>
              )}
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                <span>{formattedDate}</span>
              </div>
              {gathering?.location && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{gathering.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gruppe Details */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Gruppe
            </span>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                {group ? (
                  <Link
                    to={`/admin/gruppe/${group.id}`}
                    id="link-task-group"
                    className="font-bold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1"
                  >
                    {group.name}
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </Link>
                ) : (
                  <span className="font-bold text-slate-800">Ukjent gruppe</span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">ID: {task.groupId}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* Bemanningsbehov Section */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                Bemanningsbehov
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {task.neededCount !== undefined ? `${task.neededCount} personer` : "Behov ikke satt"}
              </span>
            </div>

            <form onSubmit={handleSaveNeededCount} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={neededCountInput}
                onChange={(e) => setNeededCountInput(e.target.value)}
                placeholder="F.eks. 2 (eller tomt for 'ikke satt')"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Oppdater behov
              </button>
            </form>
          </div>

          {/* Personstatus for oppgaven */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Users2 className="w-3.5 h-3.5 text-emerald-600" />
                Personstatus for oppgaven ({allAssignedPersonsWithStatus.length})
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {confirmedCount} bekreftet
              </span>
            </div>

            {allAssignedPersonsWithStatus.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 italic text-xs">
                Ingen personer er tilknyttet eller forespurt for denne oppgaven ennå.
              </div>
            ) : (
              <div className="space-y-2">
                {allAssignedPersonsWithStatus.map(({ person, assignment, statusLabel, response }) => (
                  <div
                    key={assignment.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      {person ? (
                        <Link
                          to={`/admin/person/${person.id}`}
                          className="font-bold text-slate-800 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                        >
                          {person.name}
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-800">Ukjent person</span>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        {person?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {person.phone}
                          </span>
                        )}
                        {person?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {person.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {response !== "confirmed" ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          response === "withdrawn"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : response === "declined"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {response === "withdrawn" ? "Forfall" : response === "declined" ? "Avslått" : "Forespurt"}
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 self-center" title="Akseptert" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Task Instruction Section */}
        <form onSubmit={handleSaveInstruction} className="space-y-3">
          <section
            id="admin-task-instruction-section"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Instruks for rollen
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">Task.instruction</span>
            </div>

            {/* Explanatory banner */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Rollebeskrivelse</p>
                <p className="text-[11px] text-amber-850 mt-0.5">
                  Instruksen beskriver hva personen som har rollen skal gjøre. Den tilhører oppgaven/rollen, og deles av alle som ser eller tildeles oppgaven.
                </p>
              </div>
            </div>

            {/* Textarea for editing instruction */}
            <div className="space-y-1.5">
              <label
                htmlFor="textarea-task-instruction"
                className="text-xs font-bold text-slate-700 block"
              >
                Rediger instruks:
              </label>
              <textarea
                id="textarea-task-instruction"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Skriv inn en detaljert instruks for hva personen som har denne rollen skal gjøre..."
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal text-slate-800 leading-relaxed resize-y"
              />
            </div>

            {/* Save Button */}
            <div className="pt-1">
              <button
                type="submit"
                id="btn-save-task-instruction"
                disabled={isSaving}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Lagrer..." : "Lagre instruks"}
              </button>
            </div>
          </section>
        </form>

        {/* Member View Link for comparison */}
        <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 text-center">
          <Link
            to={`/oppgave/${task.id}`}
            id="link-view-task-as-member"
            className="text-xs font-semibold text-slate-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Se oppgaven slik frivillige ser den (/oppgave/{task.id})
          </Link>
        </div>
      </div>
    </div>
  );
};
