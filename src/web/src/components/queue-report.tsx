interface ElevatorQueue {
  id: number;
  pendingRequestCount: number;
  targetFloors: number[];
  type?: string;
}

interface QueueReportProps {
  elevators: ElevatorQueue[];
  label?: (e: ElevatorQueue) => string;
  embedded?: boolean;
}

const GRID_4 = { cols: "1.5rem 0.5rem 0.125rem auto", gap: "1.25rem" };
const GRID_5 = { cols: "7rem 1rem 0.5rem 1fr", gap: "0.75rem" };

export function QueueReport({
  elevators,
  label = (e) => `E${e.id}`,
  embedded = false,
}: QueueReportProps) {
  const is4 = elevators.length === 4;
  const { cols: gridCols, gap } = is4 ? GRID_4 : GRID_5;
  const cols = elevators.length > 4 ? 3 : 2;
  return (
    <div
      className={
        embedded
          ? "border-b border-slate-200 pb-4 dark:border-slate-600"
          : "rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50"
      }
      data-testid="queue-report"
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-x-4">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Queue per elevator
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-500">
            (waiting · processing)
          </span>
        </div>
        <div
          className="grid w-max font-mono gap-y-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${gridCols})`,
            columnGap: gap,
          }}
        >
          {elevators.map((e) => (
            <div key={e.id} className="contents">
              <span className="truncate text-slate-500 dark:text-slate-400">
                {label(e)}
              </span>
              <span className="text-right tabular-nums text-amber-600 dark:text-amber-500">
                {e.pendingRequestCount}
              </span>
              <span className="text-slate-400">·</span>
              <span className="min-w-0 truncate text-emerald-600 dark:text-emerald-500">
                {e.targetFloors.length > 0 ? e.targetFloors.join(", ") : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
