import React from "react";
import { Images } from "lucide-react";
import { MediaLibraryPanel } from "../../../components/admin/MediaLibraryPanel";
import type { ShowFeedback } from "../studio";

interface MediaTabProps {
  showFeedback: ShowFeedback;
}

export const MediaTab: React.FC<MediaTabProps> = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-800/60">
          <Images className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Mediebibliotek</h1>
          <p className="text-xs text-slate-400">
            Last opp, søk og gjenbruk bilder på tvers av sider og moduler.
          </p>
        </div>
      </div>

      <MediaLibraryPanel />
    </div>
  );
};
