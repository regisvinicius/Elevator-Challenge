import { useState } from "react";

const GUIDELINES = {
  "Thread Safety": [
    "Locks/mutexes for shared resources",
    "Atomic operations for elevator state changes",
    "Race conditions handled in request assignment",
    "Thread-safe collections",
  ],
  Performance: [
    "100+ concurrent requests efficiently",
    "Assignment response < 100ms",
    "Reasonable memory under load",
  ],
  "Error Handling": [
    "Invalid floor requests handled gracefully",
    "Timeouts for stuck elevators",
    "Exception handling for concurrent ops",
  ],
} as const;

export function ImplementationGuidelinesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/80"
      >
        Implementation Guidelines
        <span className="text-slate-400 dark:text-slate-500">
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-2 dark:border-slate-600">
          <div className="space-y-4">
            {Object.entries(GUIDELINES).map(([section, items]) => (
              <div key={section}>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {section}
                </h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 shrink-0 text-green-600"
                        title="Implemented in API"
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
