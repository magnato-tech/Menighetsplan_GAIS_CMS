import React from "react";
import { useFirebase } from "../../../context/FirebaseDataContext";
import { useCms } from "../../../context/CmsContext";
import { ShowFeedback, StudioData } from "../studio";
import { DatabaseCounts } from "./database/DatabaseCounts";
import { ExternalSiteExchange } from "./database/ExternalSiteExchange";
import { ModuleToggles } from "./database/ModuleToggles";
import { ResetSection } from "./database/ResetSection";
import { TestdataGenerator } from "./database/TestdataGenerator";
import { useDatabaseOperations } from "./database/useDatabaseOperations";
import { Database } from "lucide-react";

interface DatabaseTabProps {
  studio?: StudioData;
  showFeedback: ShowFeedback;
}

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
  const { pages, news, sermons } = useCms();
  const { isWorking, populate, clearPlanner, deleteAll } = useDatabaseOperations(showFeedback);

  const content = pages.length + news.length + sermons.length;
  const totalDocuments =
    allPersons.length + groups.length + gatherings.length + tasks.length + assignments.length + content;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            <span>Database og Testdata</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Administrer databasen, fyll inn testdata for menigheten med egne glidebrytere eller ferdige pakker, styr
            moduler og overvåk sanntidsstatus.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0 self-start sm:self-auto">
          <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="text-xs font-semibold text-slate-200">
            {isFirestoreConnected ? "Databasen er tilkoblet" : "Kobler til databasen …"}
          </span>
        </div>
      </div>

      <DatabaseCounts
        totals={{
          persons: allPersons.length,
          groups: groups.length,
          gatherings: gatherings.length,
          tasks: tasks.length,
          assignments: assignments.length,
          content,
        }}
        totalDocuments={totalDocuments}
      />
      <TestdataGenerator isWorking={isWorking} onPopulate={populate} />
      <ModuleToggles moduleConfig={moduleConfig} onToggleCalendar={toggleKalender} onToggleMessages={toggleMeldinger} />
      <ExternalSiteExchange showFeedback={showFeedback} />
      <ResetSection
        isWorking={isWorking}
        totalDocuments={totalDocuments}
        plannerCounts={{
          persons: allPersons.length,
          groups: groups.length,
          gatherings: gatherings.length,
          tasks: tasks.length,
        }}
        onClearPlanner={clearPlanner}
        onDeleteAll={deleteAll}
      />
    </div>
  );
};
