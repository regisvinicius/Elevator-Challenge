import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { HealthIndicator } from "@/components/health-indicator";
import { ApiHealthProvider } from "@/contexts/api-health";
import { ThemeProvider } from "@/contexts/theme";
import { Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export function RootLayout() {
  return (
    <ThemeProvider>
      <ApiHealthProvider>
        <Toaster richColors position="top-right" />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Elevator System Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <a
                  href={`${import.meta.env.VITE_API_URL ?? "http://localhost:5050"}/swagger`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  data-testid="api-docs"
                >
                  API Docs
                </a>
                <DarkModeToggle />
                <HealthIndicator />
              </div>
            </div>
            <nav className="mt-2 flex gap-1">
              <NavLink to="/easy" data-testid="nav-easy">
                Easy
              </NavLink>
              <NavLink to="/medium" data-testid="nav-medium">
                Medium
              </NavLink>
              <NavLink to="/enterprise" data-testid="nav-enterprise">
                Enterprise
              </NavLink>
              <NavLink to="/concurrency" data-testid="nav-concurrency">
                Concurrency
              </NavLink>
            </nav>
          </header>
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </ApiHealthProvider>
    </ThemeProvider>
  );
}

function NavLink({
  to,
  children,
  "data-testid": testId,
}: {
  to: string;
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  return (
    <Link
      to={to}
      data-testid={testId}
      activeProps={{
        className:
          "font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
      }}
      inactiveProps={{
        className:
          "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
      }}
      className="rounded-lg px-3 py-1.5 text-sm transition-colors"
    >
      {children}
    </Link>
  );
}
