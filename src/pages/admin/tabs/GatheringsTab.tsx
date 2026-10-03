import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  formatNorwegianDateTime,
  combineDateAndTimeToIso,
  parseIsoToDateAndTime,
  AdminGatheringItem,
} from "../../../hooks/useAppHooks";
import {
  Plus,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertTriangle,
  X,
  CalendarPlus,
} from "lucide-react";
import { StudioData, ShowFeedback } from "../studio";
import { visibilityOf } from "../../../utils/visibility";
import { DEFAULT_LOCATION, isWorshipService, locationOf } from "../../../utils/gatherings";

interface GatheringsTabProps {
  studio: StudioData;
  showFeedback: ShowFeedback;
}

export const GatheringsTab: React.FC<GatheringsTabProps> = ({ studio, showFeedback }) => {
  const { adminGatherings, adminGroups, createGathering, createTask } = studio;

  // "Lag neste arrangement" Modal State
  const [nextGatheringSource, setNextGatheringSource] = useState<AdminGatheringItem | null>(null);
  const [nextGatheringDate, setNextGatheringDate] = useState("");
  const [nextGatheringTime, setNextGatheringTime] = useState("11:00");
  const [nextGatheringLocation, setNextGatheringLocation] = useState("");

  const handleCreateNextGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextGatheringSource || !nextGatheringDate) {
      showFeedback("Vennligst oppgi dato for det nye arrangementet", "error");
      return;
    }
    // Stored as an exact moment. A bare "date + clock time" would be read in whatever
    // time zone the reader happens to be in, and the server is not in Norway.
    const isoDateTime = combineDateAndTimeToIso(nextGatheringDate, nextGatheringTime);
    const sourceG = nextGatheringSource.gathering;
    const res = createGathering({
      title: sourceG.title,
      groupId: sourceG.groupId,
      startsAt: isoDateTime,
      location: nextGatheringLocation.trim() || undefined,
      theme: sourceG.theme,
      type: sourceG.type,
      // An internal gathering stays internal when it is copied, also one from before `visibility` existed
      visibility: visibilityOf(sourceG),
      isGudstjeneste: isWorshipService(sourceG),
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

  // ==========================================
  // NY SAMLING FORM STATE (PLANLEGGER)
  // ==========================================
  const [newGatheringTitle, setNewGatheringTitle] = useState("");
  const [newGatheringDate, setNewGatheringDate] = useState("");
  const [newGatheringTime, setNewGatheringTime] = useState("11:00");
  const [newGatheringTheme, setNewGatheringTheme] = useState("");
  const [newGatheringGroupId, setNewGatheringGroupId] = useState("");
  const [newGatheringIsWorship, setNewGatheringIsWorship] = useState(true);
  // Every gathering has a responsible group. The first one is chosen until the admin picks another.
  const responsibleGroupId = newGatheringGroupId || adminGroups[0]?.group.id || "";

  const handleCreateGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatheringTitle || !newGatheringDate) {
      showFeedback("Tittel og dato må fylles ut", "error");
      return;
    }
    if (!responsibleGroupId) {
      showFeedback("Opprett en gruppe først. En samling må ha en ansvarlig gruppe.", "error");
      return;
    }

    const iso = combineDateAndTimeToIso(newGatheringDate, newGatheringTime);
    createGathering({
      title: newGatheringTitle,
      groupId: responsibleGroupId,
      startsAt: iso,
      type: "arrangement",
      theme: newGatheringTheme.trim() || undefined,
      isGudstjeneste: newGatheringIsWorship,
    });

    setNewGatheringTitle("");
    setNewGatheringDate("");
    setNewGatheringTheme("");
    showFeedback("Ny samling opprettet og synkronisert til kalenderen!");
  };

  return (
    <>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newGatheringTheme}
                onChange={(e) => setNewGatheringTheme(e.target.value)}
                placeholder="Valgfritt tema..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={responsibleGroupId}
                onChange={(e) => setNewGatheringGroupId(e.target.value)}
                aria-label="Ansvarlig gruppe"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                {adminGroups.length === 0 && <option value="">Ingen grupper finnes ennå</option>}
                {adminGroups.map(({ group }) => (
                  <option key={group.id} value={group.id}>
                    Ansvarlig gruppe: {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newGatheringIsWorship}
                onChange={(e) => setNewGatheringIsWorship(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
              />
              <span>Dette er en gudstjeneste</span>
            </label>
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
                    {isWorshipService(g) && (
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
                    {formatNorwegianDateTime(g.startsAt)} · {locationOf(g)}
                    {g.theme && ` · Tema: ${g.theme}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // The next one is suggested at the same time of day and place as this one
                      setNextGatheringSource(item);
                      setNextGatheringDate("");
                      setNextGatheringTime(parseIsoToDateAndTime(g.startsAt).time);
                      setNextGatheringLocation(g.location || "");
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
                Systemet oppretter et nytt arrangement og kopierer over alle {nextGatheringSource.tasks.length} oppgaver med antallet hver av dem trenger. Personlisten etterlates tom slik at frivillige kan tildeles eller inviteres på nytt.
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
                  placeholder={`Tomt felt betyr ${DEFAULT_LOCATION}`}
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
    </>
  );
};
