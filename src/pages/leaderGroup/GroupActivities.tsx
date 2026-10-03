import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { LeaderGroupDetail } from "./leaderGroupDetail";
import { ActivitiesFilters } from "./activities/ActivitiesFilters";
import { ActivitiesStatusBanner } from "./activities/ActivitiesStatusBanner";
import { ActivitiesTable } from "./activities/ActivitiesTable";
import { GatheringCard } from "./activities/GatheringCard";
import { useGroupActivitiesView } from "./activities/useGroupActivitiesView";

interface GroupActivitiesProps {
  detail: LeaderGroupDetail;
  showToast: (text: string) => void;
}

export const GroupActivities: React.FC<GroupActivitiesProps> = ({ detail, showToast }) => {
  const { hasLeaderAccess, members, groupGatherings, assignTaskToPerson } = detail;
  const navigate = useNavigate();
  const view = useGroupActivitiesView(groupGatherings);
  const openDetail = (gatheringId: string) => navigate(`/leder/samling/${gatheringId}`);

  const assign = (taskId: string, member: { id: string; name: string }) => {
    // A direct assignment: the leader has already agreed it with the person
    const res = assignTaskToPerson(taskId, member.id, "confirmed");
    if (res.success) {
      view.closeQuickAssign();
      showToast(`Oppgaven ble direkte tildelt ${member.name}!`);
    } else {
      showToast(res.error || "Kunne ikke tildele oppgaven.");
    }
  };

  return (
    <section
      id="section-group-gatherings"
      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Planlagte aktiviteter</span>
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">
          {view.filtered.length} av {groupGatherings.length} aktiviteter
        </span>
      </div>

      <ActivitiesStatusBanner vacantTasks={view.vacantTasks} onShowVacant={view.showVacantOnly} />

      <ActivitiesFilters
        monthOptions={view.monthOptions}
        month={view.month}
        status={view.status}
        viewMode={view.viewMode}
        onMonthChange={view.setMonth}
        onStatusChange={view.setStatus}
        onViewModeChange={view.setViewMode}
      />

      {view.viewMode === "kort" && (
        <div>
          {view.filtered.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              Ingen aktiviteter matcher valgt måned eller filter for denne gruppen.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {view.filtered.map((item) => (
                <GatheringCard
                  key={item.gathering.id}
                  item={item}
                  isExpanded={view.expandedGatheringId === item.gathering.id}
                  members={members}
                  hasLeaderAccess={hasLeaderAccess}
                  quickAssignTaskId={view.quickAssignTaskId}
                  onToggleExpanded={() => view.toggleExpanded(item.gathering.id)}
                  onToggleQuickAssign={view.toggleQuickAssign}
                  onOpenDetail={() => openDetail(item.gathering.id)}
                  onAssign={assign}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view.viewMode === "tabell" && (
        <div className="pt-1">
          <ActivitiesTable
            rows={view.tableRows}
            hasLeaderAccess={hasLeaderAccess}
            onAssignSubstitute={view.openAssignment}
            onOpenDetail={openDetail}
          />
        </div>
      )}
    </section>
  );
};
