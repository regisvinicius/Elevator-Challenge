import { useApiHealth } from "@/contexts/api-health";

export function HealthIndicator() {
  const { isOnline } = useApiHealth();

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      title={isOnline ? "API online" : "API offline"}
      data-testid="health-indicator"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
        }`}
        aria-hidden
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}
