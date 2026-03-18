import { requestSystemTrip } from "@/api/elevator-api";
import { ZapIcon } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

const BURST_SIZES = [50, 100, 120] as const;

function p95(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}

export function StressTestPanel({
  onBurstComplete,
  disabled,
}: {
  onBurstComplete?: () => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    durationMs: number;
    latencies: number[];
    error?: string;
  } | null>(null);

  const fireBurst = async (count: number) => {
    setLoading(true);
    setResult(null);
    const latencies: number[] = [];
    const burstStart = performance.now();
    const promises = Array.from({ length: count }, (_, i) => {
      const f = (i % 19) + 1;
      const d = ((i * 3) % 19) + 1;
      if (f === d) return Promise.resolve();
      const start = performance.now();
      return requestSystemTrip(f, d).then(() => {
        latencies.push(Math.round(performance.now() - start));
      });
    });
    try {
      await Promise.all(promises);
      const durationMs = Math.round(performance.now() - burstStart);
      setResult({ count, durationMs, latencies });
      onBurstComplete?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setResult({
        count,
        durationMs: Math.round(performance.now() - burstStart),
        latencies,
        error: msg,
      });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Stress Test — Fire Burst
      </h3>
      <div className="flex flex-wrap gap-2">
        {BURST_SIZES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => fireBurst(n)}
            disabled={loading || disabled}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
            data-testid={`fire-${n}`}
          >
            <ZapIcon />
            Fire {n} requests
          </button>
        ))}
      </div>
      {result && (
        <div
          data-testid="stress-result"
          className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400"
        >
          <p>
            Sent {result.count} requests in {result.durationMs} ms
          </p>
          {result.latencies.length > 0 && (
            <p>
              Per-request: avg{" "}
              {Math.round(
                result.latencies.reduce((a, b) => a + b, 0) /
                  result.latencies.length,
              )}{" "}
              ms , p95 {p95(result.latencies)} ms
              {p95(result.latencies) <= 100 && " ✓ <100ms"}
            </p>
          )}
          {result.error && (
            <p className="text-red-600">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
