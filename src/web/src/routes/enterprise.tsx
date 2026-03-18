import {
  getEnterpriseAnalytics,
  getEnterpriseStatus,
  requestEnterpriseTrip,
} from "@/api/elevator-api";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { BuildingView } from "@/components/building-view";
import { ElevatorControls } from "@/components/elevator-controls";
import { QueueReport } from "@/components/queue-report";
import { TripForm } from "@/components/trip-form";
import { useApiHealth } from "@/contexts/api-health";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function EnterprisePage() {
  const queryClient = useQueryClient();
  const { isOnline } = useApiHealth();
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["enterprise-status"],
    queryFn: getEnterpriseStatus,
    refetchInterval: 300,
  });
  const { data: analytics } = useQuery({
    queryKey: ["enterprise-analytics"],
    queryFn: getEnterpriseAnalytics,
    refetchInterval: 300,
  });

  const mutate = useMutation({
    mutationFn: ({
      pickup,
      destination,
      isVip,
    }: {
      pickup: number;
      destination: number;
      isVip?: boolean;
    }) => requestEnterpriseTrip(pickup, destination, isVip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-status"] });
      queryClient.invalidateQueries({ queryKey: ["enterprise-analytics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (statusLoading || !status) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-100">
          Enterprise — 5 Elevators
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
      <div className="min-w-0 lg:flex-none">
        <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-100">
          Enterprise — 5 Elevators (floors 1–30)
        </h2>
        <BuildingView
          data={{
            mode: "enterprise",
            elevators: status,
            minFloor: 1,
            maxFloor: 30,
          }}
        />
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:min-w-[32rem] lg:w-[44rem]">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
          <QueueReport
            elevators={status}
            label={(e) => `E${e.id}${e.type ? ` (${e.type})` : ""}`}
            embedded
          />
          <TripForm
            compact
            minFloor={1}
            maxFloor={30}
            includeVip
            disabled={!isOnline}
            embedded
            onSubmit={(pickup, destination, isVip) =>
              mutate.mutate({ pickup, destination, isVip })
            }
          />
        </div>
        <ElevatorControls
          elevatorIds={status.map((e) => e.id)}
          elevatorStatus={status}
          disabled={!isOnline}
          onEmergencyChange={() =>
            queryClient.invalidateQueries({ queryKey: ["enterprise-status"] })
          }
        />
        {analytics && <AnalyticsPanel analytics={analytics} />}
        {mutate.isError && (
          <p className="text-sm text-red-600">{mutate.error?.message}</p>
        )}
      </aside>
    </div>
  );
}
