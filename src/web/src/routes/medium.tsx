import { getSystemStatus, requestSystemTrip } from "@/api/elevator-api";
import { BuildingView } from "@/components/building-view";
import { QueueReport } from "@/components/queue-report";
import { TripForm } from "@/components/trip-form";
import { useApiHealth } from "@/contexts/api-health";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function MediumPage() {
  const queryClient = useQueryClient();
  const { isOnline } = useApiHealth();
  const { data, isLoading } = useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    refetchInterval: 300,
  });

  const mutate = useMutation({
    mutationFn: ({
      pickup,
      destination,
    }: {
      pickup: number;
      destination: number;
    }) => requestSystemTrip(pickup, destination),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["system-status"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading || !data) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-100">
          Medium — 4 Elevators
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Medium — 4 Elevators (floors 1–20)
      </h2>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
        <div className="min-w-0 lg:flex-none">
          <BuildingView
            data={{
              mode: "system",
              elevators: data,
              minFloor: 1,
              maxFloor: 20,
            }}
          />
        </div>
        <aside className="w-full shrink-0 lg:min-w-[28rem] lg:w-[44rem]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
            <QueueReport elevators={data} label={(e) => `E${e.id}`} embedded />
            <TripForm
              compact
              embedded
              minFloor={1}
              maxFloor={20}
              disabled={!isOnline}
              onSubmit={(pickup, destination) =>
                mutate.mutate({ pickup, destination })
              }
            />
          </div>
          {mutate.isError && (
            <p className="mt-2 text-sm text-red-600">{mutate.error?.message}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
