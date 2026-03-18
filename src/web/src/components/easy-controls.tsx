import {
  processRequests,
  requestDestination,
  requestElevator,
} from "@/api/elevator-api";
import { ArrowUpIcon, MapPinIcon, PlayIcon } from "@/components/icons";
import { useApiHealth } from "@/contexts/api-health";
import type { Direction } from "@/types/elevator";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function EasyControls() {
  const queryClient = useQueryClient();
  const { isOnline } = useApiHealth();
  const [floorInput, setFloorInput] = useState("1");
  const [direction, setDirection] = useState<Direction>("Up");
  const [destFloorInput, setDestFloorInput] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["single-status"] });

  const parseFloor = (s: string) => {
    const n = Number.parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  };
  const floor = parseFloor(floorInput);
  const destFloor = parseFloor(destFloorInput);
  const isValidFloor = (n: number | null) => n !== null && n >= 1 && n <= 10;

  const handleRequest = async () => {
    if (!floor || !isValidFloor(floor)) return;
    setError(null);
    setLoading(true);
    try {
      await requestElevator(floor, direction);
      invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDestination = async () => {
    if (!destFloor || !isValidFloor(destFloor)) return;
    setError(null);
    setLoading(true);
    try {
      await requestDestination(destFloor);
      invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setError(null);
    setLoading(true);
    try {
      await processRequests();
      invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
        <div>
          <label
            htmlFor="easy-floor"
            className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Floor
          </label>
          <input
            id="easy-floor"
            data-testid="easy-floor"
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={floorInput}
            onChange={(e) => setFloorInput(e.target.value.replace(/\D/g, ""))}
            className="w-14 rounded-lg border border-slate-300 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label
            htmlFor="easy-direction"
            className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Direction
          </label>
          <select
            id="easy-direction"
            data-testid="easy-direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="Up">Up</option>
            <option value="Down">Down</option>
          </select>
        </div>
        <button
          type="button"
          data-testid="request-elevator"
          onClick={handleRequest}
          disabled={loading || !isOnline || !floor || !isValidFloor(floor)}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowUpIcon className="size-4 shrink-0" />
          Request Elevator
        </button>
        <div
          className="mx-2 h-8 w-px bg-slate-200 dark:bg-slate-600"
          aria-hidden
        />
        <div>
          <label
            htmlFor="easy-dest"
            className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            Destination
          </label>
          <input
            id="easy-dest"
            data-testid="easy-dest"
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={destFloorInput}
            onChange={(e) =>
              setDestFloorInput(e.target.value.replace(/\D/g, ""))
            }
            className="w-14 rounded-lg border border-slate-300 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          data-testid="request-destination"
          onClick={handleDestination}
          disabled={
            loading || !isOnline || !destFloor || !isValidFloor(destFloor)
          }
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <MapPinIcon className="size-4 shrink-0" />
          Request Destination
        </button>
      </div>
      <div>
        <button
          type="button"
          data-testid="process-requests"
          onClick={handleProcess}
          disabled={loading || !isOnline}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <PlayIcon className="size-4 shrink-0" />
          Process Requests
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
