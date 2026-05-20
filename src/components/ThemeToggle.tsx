"use client";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

// Sidebar mode picker - toggles between dark and light. Dark is the default.
// The value is persisted in localStorage under "theme" and applied to the
// html element via the data-theme attribute. An inline script in the root
// layout sets the attribute BEFORE the first paint so there's no flash.
export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (document.documentElement.dataset.theme as Theme | undefined)
      ?? (localStorage.getItem("theme") as Theme | null)
      ?? "dark";
    setThemeState(saved === "light" ? "light" : "dark");
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
  }

  return (
    <div className="px-4 py-3 border-t border-line">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Mode</div>
      <div className="inline-flex items-center rounded-md border border-line overflow-hidden text-xs w-full">
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex-1 px-3 py-1.5 transition ${
            theme === "dark"
              ? "bg-accent-soft text-accent"
              : "text-slate-400 hover:bg-ink-700"
          }`}
          aria-pressed={theme === "dark"}
        >
          Dark
        </button>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex-1 px-3 py-1.5 transition ${
            theme === "light"
              ? "bg-accent-soft text-accent"
              : "text-slate-400 hover:bg-ink-700"
          }`}
          aria-pressed={theme === "light"}
        >
          Light
        </button>
      </div>
    </div>
  );
}
