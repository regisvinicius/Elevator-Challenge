import type { ElevatorState } from "@/types/elevator";

const STATE_COLORS: Record<ElevatorState, string> = {
  Idle: "bg-teal-500 shadow-md shadow-teal-500/30",
  MovingUp: "bg-sky-500 shadow-md shadow-sky-500/40",
  MovingDown: "bg-indigo-500 shadow-md shadow-indigo-500/40",
  DoorOpening: "bg-amber-400 shadow-md shadow-amber-400/30",
  DoorOpen: "bg-emerald-500 shadow-md shadow-emerald-500/30",
  DoorClosing: "bg-amber-500 shadow-md shadow-amber-500/30",
  Maintenance: "bg-orange-500 shadow-md shadow-orange-500/30",
  EmergencyStopped: "bg-rose-500 shadow-md shadow-rose-500/40",
};

interface ElevatorShaftProps {
  elevatorId: number;
  currentFloor: number;
  state: ElevatorState;
  minFloor: number;
  maxFloor: number;
  label?: string;
  hideFloorNumbers?: boolean;
}

export function ElevatorShaft({
  elevatorId,
  currentFloor,
  state,
  minFloor,
  maxFloor,
  label = `E${elevatorId}`,
  hideFloorNumbers = false,
}: ElevatorShaftProps) {
  const floors = Array.from(
    { length: maxFloor - minFloor + 1 },
    (_, i) => maxFloor - i,
  );
  const colorClass =
    STATE_COLORS[state] ?? "bg-teal-500 shadow-md shadow-teal-500/30";

  const cellHeight = 28;
  const cabTop = (maxFloor - currentFloor) * cellHeight;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </div>
      <div className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-600 dark:bg-slate-800/80">
        {floors.map((floor) => (
          <div
            key={floor}
            className="flex h-7 w-20 items-center justify-between border-b border-slate-200/80 px-2 last:border-b-0 dark:border-slate-600/80"
          >
            {hideFloorNumbers ? (
              <span className="invisible text-xs" aria-hidden>
                0
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {floor}
              </span>
            )}
            <div className="h-5 w-8 shrink-0 rounded-lg" aria-hidden />
          </div>
        ))}
        <div
          className={`absolute right-1.5 top-1 h-5 w-8 rounded-lg transition-transform duration-300 ease-out ${colorClass}`}
          style={{ transform: `translateY(${cabTop}px)` }}
          aria-label={`Floor ${currentFloor}, ${state}`}
          data-testid={`elevator-cab-${elevatorId}`}
        />
      </div>
    </div>
  );
}
