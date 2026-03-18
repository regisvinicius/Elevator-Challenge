import {
  clearEmergency,
  emergencyStop,
  setMaintenance,
} from "@/api/elevator-api";
import * as Switch from "@radix-ui/react-switch";
import { useState } from "react";
import { toast } from "sonner";

interface ElevatorControlsProps {
  elevatorIds: number[];
  elevatorStatus?: { id: number; state: string }[];
  disabled?: boolean;
  onEmergencyChange?: () => void;
}

export function ElevatorControls({
  elevatorIds,
  elevatorStatus = [],
  disabled = false,
  onEmergencyChange,
}: ElevatorControlsProps) {
  const [maintenance, setMaintenanceState] = useState<Record<number, boolean>>(
    Object.fromEntries(elevatorIds.map((id) => [id, false])),
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const isEmergency = (id: number) =>
    elevatorStatus.find((e) => e.id === id)?.state === "EmergencyStopped";

  const toggleMaintenance = async (id: number) => {
    const next = !maintenance[id];
    setLoading((l) => ({ ...l, [`m${id}`]: true }));
    try {
      await setMaintenance(id, next);
      setMaintenanceState((m) => ({ ...m, [id]: next }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading((l) => ({ ...l, [`m${id}`]: false }));
    }
  };

  const toggleEmergency = async (id: number) => {
    const currentlyEmergency = isEmergency(id);
    setLoading((l) => ({ ...l, [`e${id}`]: true }));
    try {
      if (currentlyEmergency) {
        await clearEmergency(id);
      } else {
        await emergencyStop(id);
      }
      onEmergencyChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading((l) => ({ ...l, [`e${id}`]: false }));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Elevator Controls
      </h3>
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3">
        {elevatorIds.map((id) => (
          <div key={id} className="space-y-1.5">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              E{id}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Switch.Root
                checked={maintenance[id] ?? false}
                onCheckedChange={() => toggleMaintenance(id)}
                disabled={disabled || loading[`m${id}`]}
                data-testid={`maintenance-${id}`}
                className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors data-[state=checked]:bg-orange-500 data-[disabled]:opacity-50 dark:bg-slate-600 dark:data-[state=checked]:bg-orange-500"
              >
                <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
              </Switch.Root>
              <span className="text-slate-600 dark:text-slate-400">
                Maintenance
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Switch.Root
                checked={isEmergency(id)}
                onCheckedChange={() => toggleEmergency(id)}
                disabled={disabled || loading[`e${id}`]}
                data-testid={`emergency-${id}`}
                className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors data-[state=checked]:bg-red-600 data-[disabled]:opacity-50 dark:bg-slate-600 dark:data-[state=checked]:bg-red-600"
              >
                <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
              </Switch.Root>
              <span className="text-slate-600 dark:text-slate-400">
                Emergency
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
