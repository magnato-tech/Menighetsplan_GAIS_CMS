import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  formatNorwegianDateTime,
  AdminTaskItem,
} from "../../../hooks/useAppHooks";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Copy,
  MessageSquare,
  Send,
} from "lucide-react";
import { StudioData, ShowFeedback, countUrgentTasks } from "../studio";

interface TasksTabProps {
  studio: StudioData;
  showFeedback: ShowFeedback;
}

export const TasksTab: React.FC<TasksTabProps> = ({ studio, showFeedback }) => {
  const { allPersons, adminTasks, updateTask, assignTaskToPerson } = studio;
  const urgentTasksCount = countUrgentTasks(adminTasks);
  const unassignedTasksCount = adminTasks.filter(
    (item) => item.availableSpots > 0 || !item.isFullyCovered
  ).length;

  // Purr / Påminnelse (SMS/Messenger) Modal State
  const [reminderTaskItem, setReminderTaskItem] = useState<AdminTaskItem | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Tildel / Forespør Hurtigmodal State
  const [assigningTaskItem, setAssigningTaskItem] = useState<AdminTaskItem | null>(null);
  const [selectedPersonIdToAssign, setSelectedPersonIdToAssign] = useState("");
  const [assignMode, setAssignMode] = useState<"confirmed" | "pending">("confirmed");

  // Oppgavefilter
  const [taskFilter, setTaskFilter] = useState<"all" | "urgent" | "uncovered" | "covered">("all");

  const handleOpenReminderModal = (item: AdminTaskItem) => {
    setReminderTaskItem(item);
    setCopiedReminder(false);
    updateTask(item.task.id, { lastReminded: new Date().toISOString() });
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

  const handleExecuteAssign = () => {
    if (!assigningTaskItem || !selectedPersonIdToAssign) {
      showFeedback("Vennligst velg en person", "error");
      return;
    }
    const res = assignTaskToPerson(
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

  return (
    <>
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
    </>
  );
};
