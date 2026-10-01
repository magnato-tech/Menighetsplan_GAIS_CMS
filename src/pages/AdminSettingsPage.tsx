import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModuleConfig, useAdminDashboard } from "../hooks/useAppHooks";
import { useMockData } from "../context/MockDataContext";
import { useCms } from "../context/CmsContext";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { populateWithMockData, deleteAllData, type DatabaseAdminResult } from "../services/databaseAdmin";
import {
  Trash2,
  AlertTriangle,
  Shield,
  ArrowLeft,
  Settings,
  Calendar,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Sliders,
  Info,
  Database,
  RefreshCw,
  AlertCircle,
  Globe,
  ExternalLink,
  Code,
} from "lucide-react";

const CONFIRM_DELETE_WORD = "SLETT";

type DatabaseFeedback = { type: "success" | "warning" | "error"; message: string };

function describeResult(result: DatabaseAdminResult, successText: string): DatabaseFeedback {
  if (result.failures.length === 0) {
    return { type: "success", message: `${successText} (${result.total} dokumenter).` };
  }
  const failed = result.failures.map((f) => `${f.collection}: ${f.message}`).join(" · ");
  return {
    type: result.total > 0 ? "warning" : "error",
    message: `${successText} (${result.total} dokumenter), men ${result.failures.length} samling(er) feilet: ${failed}`,
  };
}

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin, currentUser } = useAdminDashboard();
  const { kalender, meldinger, toggleKalender, toggleMeldinger } = useModuleConfig();
  const {
    isFirestoreConnected,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    groupMessages,
    attendances,
  } = useMockData();
  const { pages, news, sermons, staff } = useCms();

  // Which confirmation is open. Deleting takes two separate confirmations.
  const [dialog, setDialog] = useState<"populate" | "delete" | "delete-final" | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [databaseFeedback, setDatabaseFeedback] = useState<DatabaseFeedback | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiResult, setApiResult] = useState<{ status: string; count: number } | null>(null);

  const testPublicApi = async () => {
    setTestingApi(true);
    try {
      const res = await fetch('/api/public/gatherings');
      const data = await res.json();
      setApiResult({ status: 'ok', count: data.antall ?? data.arrangementer?.length ?? 0 });
    } catch {
      setApiResult({ status: 'error', count: 0 });
    } finally {
      setTestingApi(false);
    }
  };

  const runDatabaseAction = async (action: () => Promise<DatabaseAdminResult>, successText: string) => {
    setIsWorking(true);
    setDatabaseFeedback(null);
    try {
      setDatabaseFeedback(describeResult(await action(), successText));
    } catch (err: unknown) {
      setDatabaseFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "En feil oppstod mot Firestore.",
      });
    } finally {
      setIsWorking(false);
      setDialog(null);
    }
  };

  const handlePopulate = () => runDatabaseAction(populateWithMockData, "Databasen er fylt med mockdata");
  const handleDeleteAll = () => runDatabaseAction(deleteAllData, "Alle data er slettet");

  const databaseContents: [string, number][] = [
    ["Personer", allPersons.length],
    ["Grupper", groups.length],
    ["Samlinger", gatherings.length],
    ["Oppgaver", tasks.length],
    ["Tildelinger", assignments.length],
    ["Gruppemeldinger", groupMessages.length],
    ["Påmeldinger", attendances.length],
    ["Nettsider", pages.length],
    ["Nyheter", news.length],
    ["Taler", sermons.length],
    ["Stab", staff.length],
  ];
  const totalDocuments = databaseContents.reduce((sum, [, count]) => sum + count, 0);

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
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til innstillingsflaten.
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

      {/* Top Header */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin-from-settings"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Innstillinger
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Valgfrie moduler</h2>
            <p className="text-xs text-slate-500 font-medium">
              Aktiver eller deaktiver tilleggsfunksjoner for menigheten
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-950">Modulstatus i prototypen</p>
            <p className="text-[11px] text-blue-800/90 mt-0.5">
              Valgfrie moduler er som standard satt til <strong>«off»</strong>. Når de slås på, vises modulens fane i toppmenyen og åpner en plassholderside.
            </p>
          </div>
        </div>

        {/* Module Switches Section */}
        <section
          id="admin-module-toggles-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" />
              Tilleggsmoduler (useModuleConfig)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Session mock-state</span>
          </div>

          <div className="space-y-3">
            {/* Kalender Toggle Card */}
            <div
              id="module-toggle-card-kalender"
              className={`p-3.5 rounded-xl border transition-all ${
                kalender === "on"
                  ? "bg-emerald-50/60 border-emerald-200/80"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      kalender === "on"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Kalendermodul
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          kalender === "on"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {kalender.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Felles kalenderoversikt for menighetens arrangementer.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-settings-toggle-kalender"
                  onClick={toggleKalender}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    kalender === "on"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {kalender === "on" ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      På (on)
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Av (off)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Meldinger Toggle Card */}
            <div
              id="module-toggle-card-meldinger"
              className={`p-3.5 rounded-xl border transition-all ${
                meldinger === "on"
                  ? "bg-blue-50/60 border-blue-200/80"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      meldinger === "on"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Meldingsmodul
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          meldinger === "on"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {meldinger.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Separat meldingsmodul (fremtidig produktområde). «Beskjed til gruppen» i gruppelederflaten fungerer uavhengig av denne innstillingen.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-settings-toggle-meldinger"
                  onClick={toggleMeldinger}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    meldinger === "on"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {meldinger === "on" ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      På (on)
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Av (off)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Firestore Database & Mockdata Section */}
        <section
          id="admin-firestore-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              Firestore-database & Mockdata
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              {isFirestoreConnected ? "Tilkoblet" : "Kobler til..."}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Databasen er koblet til Firestore og synkroniserer samlinger, oppgaver, personer og meldinger i sanntid.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-slate-800">{allPersons.length}</div>
                <div className="text-[10px] text-slate-500">Personer</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-slate-800">{groups.length}</div>
                <div className="text-[10px] text-slate-500">Grupper</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-slate-800">{gatherings.length}</div>
                <div className="text-[10px] text-slate-500">Samlinger</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-slate-800">{tasks.length}</div>
                <div className="text-[10px] text-slate-500">Oppgaver</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                id="btn-populate-firestore"
                onClick={() => setDialog("populate")}
                disabled={isWorking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isWorking && dialog === "populate" ? "animate-spin" : ""}`} />
                Fyll databasen med mockdata
              </button>
              <button
                type="button"
                id="btn-delete-all-firestore"
                onClick={() => setDialog("delete")}
                disabled={isWorking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-700 font-bold text-xs rounded-xl border border-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Slett alle data i databasen
              </button>
            </div>

            {/* Feedback alert */}
            {databaseFeedback && (
              <div
                role="status"
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  databaseFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : databaseFeedback.type === "warning"
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-red-50 text-red-900 border-red-200"
                }`}
              >
                {databaseFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : databaseFeedback.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="min-w-0 break-words">{databaseFeedback.message}</span>
              </div>
            )}
          </div>
        </section>

        {dialog === "populate" && (
          <ConfirmDialog
            key="populate"
            title="Fylle databasen med mockdata?"
            confirmLabel={isWorking ? "Fyller..." : "Fyll med mockdata"}
            busy={isWorking}
            onConfirm={handlePopulate}
            onCancel={() => setDialog(null)}
          >
            <p>
              Mockdata skrives til Firestore. Dokumenter med samme ID blir overskrevet, så endringer du har gjort i
              testdataene går tapt. Andre dokumenter blir stående.
            </p>
          </ConfirmDialog>
        )}

        {dialog === "delete" && (
          <ConfirmDialog
            key="delete"
            title="Slette alle data i databasen?"
            tone="danger"
            confirmLabel="Fortsett"
            onConfirm={() => setDialog("delete-final")}
            onCancel={() => setDialog(null)}
          >
            <p>
              Dette sletter <strong>{totalDocuments} dokumenter</strong> fra Firestore, for alle brukere:
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {databaseContents.map(([label, count]) => (
                <li key={label} className="flex justify-between gap-2">
                  <span>{label}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </li>
              ))}
            </ul>
          </ConfirmDialog>
        )}

        {dialog === "delete-final" && (
          <ConfirmDialog
            key="delete-final"
            title="Siste advarsel: dette kan ikke angres"
            tone="danger"
            confirmLabel={isWorking ? "Sletter..." : "Slett alt permanent"}
            requireText={CONFIRM_DELETE_WORD}
            busy={isWorking}
            onConfirm={handleDeleteAll}
            onCancel={() => setDialog(null)}
          >
            <p>
              Alle personer, grupper, samlinger, oppgaver, meldinger og alt innhold på nettsiden blir slettet permanent.
              Det finnes ingen sikkerhetskopi i appen.
            </p>
          </ConfirmDialog>
        )}

        {/* Public Website & CMS Integration Section */}
        <section
          id="admin-cms-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              Offentlig Nettside & CMS-integrasjon
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              menighetsplan_ClaudeCMS
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Nettside-CMS-et henter offentlige samlinger og gudstjenester direkte fra Menighetsplan. Når du oppretter eller avlyser en samling her, synkroniseres det automatisk til menighetens forside.
            </p>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  Offentlig API-endepunkt
                </span>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                  GET /api/public/gatherings
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Leverer sanitert JSON-format i henhold til versjon 1 av API-kontrakten. Kun samlinger merket som offentlige deles.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-test-cms-api"
                onClick={testPublicApi}
                disabled={testingApi}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingApi ? "animate-spin" : ""}`} />
                {testingApi ? "Tester..." : "Test API-endepunkt nå"}
              </button>

              <a
                href="https://github.com/magnato-tech/menighetsplan_ClaudeCMS"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {apiResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  apiResult.status === "ok"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-red-50 text-red-900 border-red-200"
                }`}
              >
                {apiResult.status === "ok" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>API svarer OK: <strong>{apiResult.count}</strong> offentlige arrangementer klare for CMS-et.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Kunne ikke hente data fra API-endepunktet.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
