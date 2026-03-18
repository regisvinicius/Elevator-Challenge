import { getSingleStatus } from "@/api/elevator-api";
import { BuildingView } from "@/components/building-view";
import { EasyControls } from "@/components/easy-controls";
import { useQuery } from "@tanstack/react-query";

export function EasyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["single-status"],
    queryFn: getSingleStatus,
    refetchInterval: 300,
  });

  if (isLoading || !data) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-100">
          Easy — Single Elevator
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Easy — Single Elevator (floors 1–10)
      </h2>
      <BuildingView
        data={{
          mode: "single",
          floor: data.floor,
          state: data.state,
        }}
      />
      <EasyControls />
    </div>
  );
}
