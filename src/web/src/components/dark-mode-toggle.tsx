import { useTheme } from "@/contexts/theme";

export function DarkModeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="dark-mode-toggle"
    >
      {theme === "dark" ? "☀ Light" : "☽ Dark"}
    </button>
  );
}
