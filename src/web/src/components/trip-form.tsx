import * as Switch from "@radix-ui/react-switch";
import { useState } from "react";
import { z } from "zod";
import { SendIcon } from "./icons";

interface TripFormProps {
  onSubmit: (pickup: number, destination: number, isVip?: boolean) => void;
  minFloor: number;
  maxFloor: number;
  includeVip?: boolean;
  disabled?: boolean;
  compact?: boolean;
  embedded?: boolean;
}

function parseFloor(s: string): number | null {
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

export function TripForm({
  onSubmit,
  minFloor,
  maxFloor,
  includeVip = false,
  disabled = false,
  compact = false,
  embedded = false,
}: TripFormProps) {
  const schema = z.object({
    pickup: z
      .number({ error: "Pickup is required" })
      .int("Must be a whole number")
      .min(minFloor, `Pickup must be ${minFloor}–${maxFloor}`)
      .max(maxFloor, `Pickup must be ${minFloor}–${maxFloor}`),
    destination: z
      .number({ error: "Destination is required" })
      .int("Must be a whole number")
      .min(minFloor, `Destination must be ${minFloor}–${maxFloor}`)
      .max(maxFloor, `Destination must be ${minFloor}–${maxFloor}`),
    isVip: z.boolean().optional(),
  });

  const [pickupInput, setPickupInput] = useState(String(minFloor));
  const [destinationInput, setDestinationInput] = useState(String(maxFloor));
  const [isVip, setIsVip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickup = parseFloor(pickupInput);
  const destination = parseFloor(destinationInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = schema.safeParse({
      pickup: pickup ?? undefined,
      destination: destination ?? undefined,
      isVip: includeVip ? isVip : undefined,
    });
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join(". "));
      return;
    }
    onSubmit(result.data.pickup, result.data.destination, result.data.isVip);
  };

  const maxLen = String(maxFloor).length;

  const inputClass =
    "w-24 min-w-24 rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
  const labelClass = "text-sm font-medium text-slate-600 dark:text-slate-400";

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className={`grid grid-cols-[5rem_minmax(5rem,1fr)] items-center gap-y-1.5 gap-x-1.5 pt-4 ${
          embedded
            ? ""
            : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5"
        }`}
      >
        <label htmlFor="pickup" className={labelClass}>
          Pickup
        </label>
        <input
          id="pickup"
          data-testid="pickup"
          type="text"
          inputMode="numeric"
          maxLength={maxLen}
          value={pickupInput}
          onChange={(e) => setPickupInput(e.target.value.replace(/\D/g, ""))}
          className={inputClass}
        />
        <label htmlFor="destination" className={labelClass}>
          Destination
        </label>
        <input
          id="destination"
          data-testid="destination"
          type="text"
          inputMode="numeric"
          maxLength={maxLen}
          value={destinationInput}
          onChange={(e) =>
            setDestinationInput(e.target.value.replace(/\D/g, ""))
          }
          className={inputClass}
        />
        {includeVip && (
          <>
            <span className={labelClass}>VIP</span>
            <div className="flex items-center gap-2">
              <Switch.Root
                data-testid="vip"
                checked={isVip}
                onCheckedChange={setIsVip}
                className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors data-[state=checked]:bg-indigo-600 data-[disabled]:opacity-50 dark:bg-slate-600 dark:data-[state=checked]:bg-indigo-500"
              >
                <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
              </Switch.Root>
            </div>
          </>
        )}
        <div className="col-span-2">
          <button
            type="submit"
            data-testid="request-trip"
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <SendIcon className="size-4 shrink-0" />
            Request Trip
          </button>
        </div>
        {error && (
          <p className="col-span-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-wrap items-end gap-4 pt-4 ${
        embedded
          ? ""
          : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5"
      }`}
    >
      <div>
        <label htmlFor="pickup" className={`mr-2 ${labelClass}`}>
          Pickup
        </label>
        <input
          id="pickup"
          data-testid="pickup"
          type="text"
          inputMode="numeric"
          maxLength={maxLen}
          value={pickupInput}
          onChange={(e) => setPickupInput(e.target.value.replace(/\D/g, ""))}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="destination" className={`mr-2 ${labelClass}`}>
          Destination
        </label>
        <input
          id="destination"
          data-testid="destination"
          type="text"
          inputMode="numeric"
          maxLength={maxLen}
          value={destinationInput}
          onChange={(e) =>
            setDestinationInput(e.target.value.replace(/\D/g, ""))
          }
          className={inputClass}
        />
      </div>
      {includeVip && (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Switch.Root
            data-testid="vip"
            checked={isVip}
            onCheckedChange={setIsVip}
            className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors data-[state=checked]:bg-indigo-600 data-[disabled]:opacity-50 dark:bg-slate-600 dark:data-[state=checked]:bg-indigo-500"
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
          </Switch.Root>
          VIP
        </div>
      )}
      <button
        type="submit"
        data-testid="request-trip"
        disabled={disabled}
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
      >
        <SendIcon className="size-4 shrink-0" />
        Request Trip
      </button>
      {error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
