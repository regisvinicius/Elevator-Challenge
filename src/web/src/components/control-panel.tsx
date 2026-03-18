import type { ReactNode } from "react";

interface ControlPanelProps {
  children: ReactNode;
}

export function ControlPanel({ children }: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:ring-slate-400/5">
      {children}
    </div>
  );
}
