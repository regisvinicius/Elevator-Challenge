import type { ElevatorAnalytics } from "@/types/elevator";

interface AnalyticsPanelProps {
  analytics: ElevatorAnalytics;
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const entries = Object.entries(analytics.byElevator);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Analytics
      </h3>
      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
        <p>Total trips: {analytics.totalTripsCompleted}</p>
        <p>Avg wait: {analytics.averageWaitTimeMs.toFixed(0)} ms</p>
        {entries.length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-600">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              By elevator
            </p>
            <ul className="mt-1 space-y-0.5">
              {entries.map(([id, data]) => (
                <li key={id}>
                  E{id}: {data.tripsCompleted} trips
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
