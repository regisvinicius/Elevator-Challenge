import { getSystemStatus } from "@/api/elevator-api";
import { BuildingView } from "@/components/building-view";
import { ImplementationGuidelinesPanel } from "@/components/implementation-guidelines";
import { QueueReport } from "@/components/queue-report";
import { StressTestPanel } from "@/components/stress-test-panel";
import { useApiHealth } from "@/contexts/api-health";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function ConcurrencyPage() {
  const queryClient = useQueryClient();
  const { isOnline } = useApiHealth();
  const { data, isLoading } = useQuery({
    queryKey: ["system-status", "concurrency"],
    queryFn: getSystemStatus,
    refetchInterval: 200,
  });

  if (isLoading || !data) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-100">
          Concurrency / Stress Test
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Concurrency — 100+ requests
      </h2>
      <ImplementationGuidelinesPanel />
      <StressTestPanel
        disabled={!isOnline}
        onBurstComplete={() =>
          queryClient.invalidateQueries({ queryKey: ["system-status"] })
        }
      />
      <QueueReport elevators={data} label={(e) => `E${e.id}`} />
      <BuildingView
        data={{
          mode: "system",
          elevators: data,
          minFloor: 1,
          maxFloor: 20,
        }}
      />
    </div>
  );
}
