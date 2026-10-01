import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { HusfellesskapView } from "../components/HusfellesskapView";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { useMockData } from "../context/MockDataContext";
import { useHusfellesskap } from "../hooks/useAppHooks";
import {
  ChevronLeft,
  FlaskConical,
  UserPlus,
  UserMinus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
} from "lucide-react";

export const HusfellesskapPage: React.FC = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const {
    allPersons,
    currentUserId,
    setCurrentUserId,
    addGroupMember,
    removeGroupMember,
    addPerson,
  } = useMockData();
  const { group, isMember } = useHusfellesskap(groupId);

  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Helper to simulate a new person joining today for Scenario F test
  const handleCreateAndJoinNewMember = () => {
    if (!group) return;
    const newName = `Testmedlem (${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })})`;
    const pRes = addPerson({ name: newName });
    if (pRes.success && pRes.person) {
      addGroupMember(group.id, pRes.person.id);
      setCurrentUserId(pRes.person.id);
      setTestResult(
        `Opprettet ${newName} med innmeldingsdato NÅ. Byttet aktiv bruker til denne personen. Verifiser at gamle meldinger fra før innmelding er skjult!`
      );
    }
  };

  // Helper to remove current user from group for Scenario G test
  const handleLeaveGroup = () => {
    if (!group) return;
    removeGroupMember(group.id, currentUserId);
    setTestResult(
      `Bruker meldt ut av gruppen. Verifiser at tilgang til chat og innhold nå er sperret!`
    );
  };

  // Helper to re-join current user
  const handleRejoinGroup = () => {
    if (!group) return;
    addGroupMember(group.id, currentUserId);
    setTestResult(
      `Bruker lagt til i gruppen igjen. Merk at nye medlemskapsdato gjelder fra nå.`
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher */}
      <UserQuickSwitcherBar />

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Tilbake til Min side</span>
          </Link>

          {/* Test panel trigger */}
          <button
            type="button"
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-xl hover:bg-emerald-200/80 transition-colors cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Testverktøy Sprint 1B</span>
            {showTestPanel ? (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            )}
          </button>
        </div>

        {/* Sprint 1B Test Scenario Panel */}
        {showTestPanel && group && (
          <div
            id="panel-sprint-1b-tests"
            className="p-4 bg-emerald-950 text-emerald-100 rounded-3xl space-y-3 animate-in fade-in text-xs border border-emerald-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Testscenarier for Sprint 1B</span>
              </span>
              <span className="text-[10px] text-emerald-300">
                Gruppe: {group.name}
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <p className="text-emerald-200">
                Bruk knappene under for å teste tilgangsregler og historikk:
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {/* Scenario F Test */}
                <button
                  type="button"
                  id="btn-test-new-member"
                  onClick={handleCreateAndJoinNewMember}
                  className="p-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div>
                      <span className="block font-bold">
                        Scenario F: Nytt medlem inn
                      </span>
                      <span className="text-[10px] text-emerald-300 font-normal">
                        Oppretter ny bruker i dag og verifiserer at meldinger
                        fra august skjules.
                      </span>
                    </div>
                  </div>
                </button>

                {/* Scenario G Test */}
                {isMember ? (
                  <button
                    type="button"
                    id="btn-test-leave-group"
                    onClick={handleLeaveGroup}
                    className="p-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 font-semibold flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserMinus className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="block font-bold">
                          Scenario G: Melde ut aktiv bruker
                        </span>
                        <span className="text-[10px] text-amber-300 font-normal">
                          Fjerner medlemskapet. Verifiserer at chatten stenges
                          for innsyn.
                        </span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-test-rejoin-group"
                    onClick={handleRejoinGroup}
                    className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-200 shrink-0" />
                      <div>
                        <span className="block font-bold">
                          Legg aktiv bruker inn i gruppen igjen
                        </span>
                        <span className="text-[10px] text-emerald-200 font-normal">
                          Gjenoppretter medlemskap fra nåværende tidspunkt.
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {testResult && (
                <div className="p-2.5 rounded-xl bg-emerald-900/90 text-emerald-100 border border-emerald-700 text-[11px] leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div>{testResult}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <HusfellesskapView groupId={groupId} />
      </div>
    </div>
  );
};
