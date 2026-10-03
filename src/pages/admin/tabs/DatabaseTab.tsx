import React, { useState } from "react";
import { useFirebase } from "../../../context/FirebaseDataContext";
import { useCms } from "../../../context/CmsContext";
import {
  populateCustomMockData,
  clearPlannerTestData,
  deleteAllData,
  type DatabaseAdminResult,
} from "../../../services/databaseAdmin";
import { ShowFeedback, StudioData } from "../studio";
import { DatabaseTestdataTab } from "../../../components/admin/DatabaseTestdataTab";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Users,
  FolderKanban,
  Calendar,
  ListTodo,
  FileText,
  Radio,
  Sliders,
  Check,
  CalendarDays,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface DatabaseTabProps {
  studio?: StudioData;
  showFeedback: ShowFeedback;
}

interface PresetPackage {
  id: string;
  name: string;
  description: string;
  persons: number;
  groups: number;
  gatherings: number;
  tasks: number;
  tag: string;
}

const PRESET_PACKAGES: PresetPackage[] = [
  {
    id: "compact",
    name: "Kompakt testsett",
    description: "Hovedpastor, daglig leder, menighetsråd og kjerneaktiviteter.",
    persons: 8,
    groups: 3,
    gatherings: 4,
    tasks: 6,
    tag: "8 personer",
  },
  {
    id: "medium",
    name: "Mellomstor menighet",
    description: "Pastorer, rådsmedlemmer, stabsdiakon, lovsangsteam og barnekirke.",
    persons: 16,
    groups: 6,
    gatherings: 10,
    tasks: 14,
    tag: "16 personer",
  },
  {
    id: "full",
    name: "Fullskala menighet",
    description: "Komplett menighetsregister: 32 personer, 12 grupper, samlinger og oppgaver.",
    persons: 32,
    groups: 12,
    gatherings: 19,
    tasks: 21,
    tag: "32 personer (Maks)",
  },
];

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ showFeedback }) => {
  const {
    isFirestoreConnected,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    moduleConfig,
    toggleKalender,
    toggleMeldinger,
  } = useFirebase();

  const { pages, news, sermons, staff } = useCms();

  // Custom counts state
  const [personCount, setPersonCount] = useState<number>(32);
  const [groupCount, setGroupCount] = useState<number>(12);
  const [gatheringCount, setGatheringCount] = useState<number>(19);
  const [taskCount, setTaskCount] = useState<number>(21);
  const [activePreset, setActivePreset] = useState<string>("full");

  // Checkbox for clearing planner records before population
  const [clearBeforePopulate, setClearBeforePopulate] = useState<boolean>(true);
  const [generatorMode, setGeneratorMode] = useState<"standard" | "advanced">("standard");

  // Operation state
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<boolean>(false);
  const [confirmClearPlannerDialog, setConfirmClearPlannerDialog] = useState<boolean>(false);
  const [apiTestResponse, setApiTestResponse] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);

  const applyPreset = (preset: PresetPackage) => {
    setActivePreset(preset.id);
    setPersonCount(preset.persons);
    setGroupCount(preset.groups);
    setGatheringCount(preset.gatherings);
    setTaskCount(preset.tasks);
  };

  const handleCustomChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value);
    setActivePreset("custom");
  };

  const handlePopulate = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const result: DatabaseAdminResult = await populateCustomMockData(
        {
          personCount,
          groupCount,
          gatheringCount,
          taskCount,
        },
        { clearPlannerFirst: clearBeforePopulate }
      );

      if (result.failures.length > 0) {
        showFeedback(`Fylling fullført med noen feil: ${result.failures[0].message}`, "error");
      } else {
        const clearedNote = clearBeforePopulate ? "Tidligere testdata ble ryddet. " : "";
        showFeedback(
          `${clearedNote}Databasen er nå fylt med ${personCount} personer, ${groupCount} grupper, ${gatheringCount} samlinger og ${taskCount} oppgaver!`
        );
      }
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "En feil oppstod under fylling av Firestore.", "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleQuickPopulate32 = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      setPersonCount(32);
      setGroupCount(12);
      setGatheringCount(19);
      setTaskCount(21);
      setActivePreset("full");

      const result: DatabaseAdminResult = await populateCustomMockData(
        {
          personCount: 32,
          groupCount: 12,
          gatheringCount: 19,
          taskCount: 21,
        },
        { clearPlannerFirst: clearBeforePopulate }
      );

      if (result.failures.length > 0) {
        showFeedback(`Fylling fullført med feil: ${result.failures[0].message}`, "error");
      } else {
        showFeedback("Databasen er nå fullstendig populert med alle 32 medlemmer, roller og grupper!");
      }
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Kunne ikke fylle med 32 personer.", "error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleClearPlannerOnly = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const result = await clearPlannerTestData();
      if (result.failures.length > 0) {
        showFeedback(`Kunne ikke tømme alle samlinger: ${result.failures[0].message}`, "error");
      } else {
        showFeedback("Testpersoner, grupper og planlegger-data er nå tømt. CMS-sider og nyheter ble bevart.");
      }
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Kunne ikke tømme testdata.", "error");
    } finally {
      setIsWorking(false);
      setConfirmClearPlannerDialog(false);
    }
  };

  const handleDeleteAll = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const result = await deleteAllData();
      if (result.failures.length > 0) {
        showFeedback(`Sletting fullført med noen feil: ${result.failures[0].message}`, "error");
      } else {
        showFeedback("Alle data i databasen er nå slettet.");
      }
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Kunne ikke slette database.", "error");
    } finally {
      setIsWorking(false);
      setConfirmDeleteDialog(false);
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestResponse(null);
    try {
      const res = await fetch("/api/public/gatherings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApiTestResponse(`Suksess: Mottok ${data.gatherings?.length ?? 0} offentlige samlinger fra API.`);
      showFeedback("API-endepunktet svarer som forventet!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "API-feil";
      setApiTestResponse(`Feil: ${msg}`);
      showFeedback(`Kunne ikke nå API-endepunkt: ${msg}`, "error");
    } finally {
      setIsTestingApi(false);
    }
  };

  const totalDocuments =
    allPersons.length +
    groups.length +
    gatherings.length +
    tasks.length +
    assignments.length +
    pages.length +
    news.length +
    sermons.length +
    staff.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            <span>Database og Testdata</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Administrer Firestore-databasen, fyll inn testdata for menigheten med egne glidebrytere eller ferdige pakker, styr moduler og
            overvåk sanntidsstatus.
          </p>
        </div>

        {/* Live Firestore Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0 self-start sm:self-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              isFirestoreConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="text-xs font-semibold text-slate-200">
            {isFirestoreConnected ? "Firestore tilkoblet" : "Kobler til Firestore..."}
          </span>
        </div>
      </div>

      {/* Seksjon 1: Live Status og Tellere */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gjeldende innhold i databasen ({totalDocuments} dokumenter)
          </h3>
          <span className="text-[11px] text-slate-400">Sanntidssynkronisert med Firestore</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{allPersons.length}</div>
              <div className="text-[11px] text-slate-400">Personer</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{groups.length}</div>
              <div className="text-[11px] text-slate-400">Grupper</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{gatherings.length}</div>
              <div className="text-[11px] text-slate-400">Samlinger</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/80 text-sky-400 shrink-0">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{tasks.length}</div>
              <div className="text-[11px] text-slate-400">Oppgaver</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{assignments.length}</div>
              <div className="text-[11px] text-slate-400">Tildelinger</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-950/80 text-rose-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">
                {pages.length + news.length + sermons.length + staff.length}
              </div>
              <div className="text-[11px] text-slate-400">CMS & Innhold</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seksjon 2: Populeringsvelger */}
      <section className="space-y-4">
        {/* Modus-velger */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setGeneratorMode("standard")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              generatorMode === "standard"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            Hurtiggenerator (Datatyper & slider 1-100)
          </button>
          <button
            type="button"
            onClick={() => setGeneratorMode("advanced")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              generatorMode === "advanced"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            Avansert planlegger-oppsett (Pakker & detaljglidere)
          </button>
        </div>

        {generatorMode === "standard" ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <DatabaseTestdataTab showFeedback={showFeedback} />
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generer og populer testdata</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Velg en ferdig pakke eller finjuster glidebryterne for nøyaktig antall personer, grupper, samlinger og oppgaver.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-indigo-300 font-semibold bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-1 rounded-lg">
                  Maks oppsett: 32 personer / 12 grupper
                </span>
              </div>
            </div>

        {/* 1. Pakkevelgere */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Velg en forhåndsdefinert pakke:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_PACKAGES.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                      : "bg-slate-900/60 border-slate-700 hover:border-slate-600 hover:bg-slate-900"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{preset.name}</span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {preset.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span>{preset.persons} personer</span>
                    <span>{preset.groups} grupper</span>
                    <span>{preset.gatherings} samlinger</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Glidebrytere for finjustering */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Finjuster antall elementer for populering</span>
            </span>
            {activePreset === "custom" && (
              <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                Egendefinert oppsett
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Personer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Personer:</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">{personCount} av 32</span>
              </div>
              <input
                type="range"
                min={4}
                max={32}
                value={personCount}
                onChange={(e) => handleCustomChange(setPersonCount, Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>4 (Minimum)</span>
                <span>16</span>
                <span>32 (Maks)</span>
              </div>
            </div>

            {/* Grupper */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Grupper & Husfellesskap:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{groupCount} av 12</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={groupCount}
                onChange={(e) => handleCustomChange(setGroupCount, Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 (Kjerne)</span>
                <span>6</span>
                <span>12 (Maks)</span>
              </div>
            </div>

            {/* Samlinger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Samlinger & Gudstjenester:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{gatheringCount} av 19</span>
              </div>
              <input
                type="range"
                min={2}
                max={19}
                value={gatheringCount}
                onChange={(e) => handleCustomChange(setGatheringCount, Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2</span>
                <span>10</span>
                <span>19 (Maks)</span>
              </div>
            </div>

            {/* Oppgaver */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Bemanningsoppgaver:</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{taskCount} av 21</span>
              </div>
              <input
                type="range"
                min={2}
                max={21}
                value={taskCount}
                onChange={(e) => handleCustomChange(setTaskCount, Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2</span>
                <span>11</span>
                <span>21 (Maks)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamisk oppsummering av hva som inkluderes */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hva inkluderes med {personCount} personer og {groupCount} grupper:</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {personCount >= 32
              ? "Alle 3 pastorer (Hovedpastor, Ungdomspastor, Barne- og familiepastor), hele menighetsrådet (7 personer), hele staben (diakon, musikk, teknikk), samtlige frivillige teamledere og 4 husfellesskap (Sentrum, Havna, Borkedalen, Ung Voksen)."
              : personCount >= 16
              ? "Pastorer, rådsmedlemmer, stabsmedlemmer (diakoni, musikk), frivillige teamledere (kaffe, lovsang, lyd) og husfellesskap."
              : personCount >= 8
              ? "Hovedpastor, daglig leder, menighetsrådsleder, ungdomspastor, barne- og familiepastor og sentrale nøkkelpersoner."
              : "Hovedpastor Kari Nordmann, daglig leder Ola Hansen, barneleder Ingrid Berg og menighetsrådsleder Jonas Lie."}
          </p>
        </div>

        {/* 3. Avkrysningsboks for selektiv tømming før populering */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-start gap-3">
          <input
            id="clear-before-populate-checkbox"
            type="checkbox"
            checked={clearBeforePopulate}
            onChange={(e) => setClearBeforePopulate(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer accent-indigo-600"
          />
          <label htmlFor="clear-before-populate-checkbox" className="text-xs space-y-0.5 cursor-pointer">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>Tøm eksisterende testpersoner og planleggerdata før fylling</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
                Standard / Anbefalt
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fjerner tidligere testpersoner, grupper, samlinger og oppgaver i planleggeren før nye data legges inn, slik at databasen forblir ren og fri for duplikater.
              <span className="text-emerald-300 font-medium ml-1">
                CMS-sider, artikler, taler og nettstedsinnstillinger bevares trygt intakt.
              </span>
            </p>
          </label>
        </div>

        {/* Hovedhandlinger for populering */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {clearBeforePopulate ? (
              <span className="text-amber-300/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Tømmer eksisterende planleggerdata før fylling
              </span>
            ) : (
              <span className="text-slate-400">
                Overskriver eksisterende dokumenter med samme ID (uten sletting)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hurtigknapp: 32 personer fullskala */}
            <button
              type="button"
              onClick={handleQuickPopulate32}
              disabled={isWorking}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/70 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Populer 32 testpersoner</span>
            </button>

            {/* Hovedknapp med valgte glidebryter-verdier */}
            <button
              type="button"
              onClick={handlePopulate}
              disabled={isWorking}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              {isWorking ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <RefreshCw className="w-4 h-4 text-white" />
              )}
              <span>
                {isWorking
                  ? "Skriver til Firestore..."
                  : `Populer databasen (${personCount} personer, ${groupCount} grupper)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    )}
  </section>

      {/* Seksjon 3: Valgfrie Tilleggsmoduler (Kalender & Meldinger) */}
      <section className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span>Valgfrie tilleggsmoduler</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Aktiver eller deaktiver tilleggsfunksjoner for menighetsplanleggeren.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Kalendermodul */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Kalendermodul</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    moduleConfig.kalender === "on"
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {moduleConfig.kalender === "on" ? "PÅ" : "AV"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Felles kalenderoversikt for menighetens gudstjenester og aktiviteter.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleKalender}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                moduleConfig.kalender === "on"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {moduleConfig.kalender === "on" ? "Slå av" : "Slå på"}
            </button>
          </div>

          {/* Meldingsmodul */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Meldingsmodul</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    moduleConfig.meldinger === "on"
                      ? "bg-indigo-950/80 text-indigo-400 border border-indigo-800/80"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {moduleConfig.meldinger === "on" ? "PÅ" : "AV"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Intern meldingsflyt og kunngjøringer til frivillige team.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleMeldinger}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                moduleConfig.meldinger === "on"
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {moduleConfig.meldinger === "on" ? "Slå av" : "Slå på"}
            </button>
          </div>
        </div>
      </section>

      {/* Seksjon 4: Offentlig API-endepunkt & Integrasjon */}
      <section className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span>Offentlig Nettside & CMS-integrasjon</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Nettside-CMS-et henter offentlige samlinger og gudstjenester direkte fra Menighetsplan.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-300">GET /api/public/gatherings</span>
              <span className="text-[10px] text-slate-400">JSON API</span>
            </div>
            <p className="text-xs text-slate-400">
              Leverer sanitert JSON-format i henhold til API-kontrakten. Kun samlinger merket som offentlige deles.
            </p>
            {apiTestResponse && (
              <p
                className={`text-xs font-mono pt-1 ${
                  apiTestResponse.startsWith("Suksess") ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {apiTestResponse}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestApi}
            disabled={isTestingApi}
            className="px-4 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {isTestingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Test API-endepunkt nå</span>
          </button>
        </div>
      </section>

      {/* Seksjon 5: Administrasjon & Sletting av testdata (Farefelt) */}
      <section className="p-5 sm:p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-900/30 pb-3">
          <div>
            <h3 className="text-base font-bold text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Tilbakestilling & Sletting</span>
            </h3>
            <p className="text-xs text-red-300/80 mt-0.5">
              Tøm kun testpersoner og planlegger-data, eller foreta en fullstendig tilbakestilling av databasen.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-red-300 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded self-start sm:self-auto">
            {totalDocuments} dokumenter i Firestore
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Valg 1: Tøm kun testdata */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tøm kun testdata (Personer & Planlegger)</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fjerner alle testpersoner, grupper, samlinger og oppgaver.{" "}
                <strong className="text-emerald-400 font-semibold">CMS-sider og nyheter forblir uberørt.</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmClearPlannerDialog(true)}
              disabled={isWorking}
              className="px-3.5 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Tøm planlegger-testdata</span>
            </button>
          </div>

          {/* Valg 2: Komplett sletting av alt */}
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-red-200 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Total tilbakestilling av alle samlinger</span>
              </span>
              <p className="text-[11px] text-red-300/80 leading-relaxed">
                Permanent sletting av samtlige dokumenter (også CMS-sider og artikler). Krever ekstra bekreftelse.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDeleteDialog(true)}
              disabled={isWorking}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Slett alt i databasen</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bekreftelsesdialog for tømming av kun planlegger-data */}
      {confirmClearPlannerDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-amber-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Tømme testpersoner og planleggerdata?</h4>
                <p className="text-xs text-amber-300">CMS-sider og nyheter bevares.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dette sletter alle dokumenter i samlingene for personer ({allPersons.length}), grupper ({groups.length}), samlinger ({gatherings.length}) og oppgaver ({tasks.length}). CMS-sider og nyhetsartikler forblir urørt.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearPlannerDialog(false)}
                disabled={isWorking}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleClearPlannerOnly}
                disabled={isWorking}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isWorking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isWorking ? "Tømmer..." : "Ja, tøm testdata"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bekreftelsesdialog for full sletting */}
      {confirmDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-red-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Slette absolutt alle data i databasen?</h4>
                <p className="text-xs text-red-300">Dette kan ikke angres.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dette vil permanent slette <strong>{totalDocuments} dokumenter</strong> fra Firestore for alle brukere
              (personer, grupper, samlinger, oppgaver, meldinger og CMS-innhold som sider og nyheter).
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteDialog(false)}
                disabled={isWorking}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isWorking}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isWorking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isWorking ? "Sletter alt..." : "Ja, slett alt permanent"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
