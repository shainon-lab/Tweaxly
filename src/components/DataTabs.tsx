"use client";

// Data section tab nav. Three primary surfaces visible by default
// (Import, Sources, Transactions) - the ones a typical user reaches
// for during normal work. The remaining surfaces (Categories & Vendors,
// Manual Data Log, Integration) live behind an "Advanced ▾" dropdown
// so first-time users aren't visually overwhelmed but power users can
// still reach everything in one click.
//
// Categories & Vendors actually lives at /settings?tab=categories
// (the editor is part of SettingsClient) but appears here because
// users reach for it while reviewing data, not while configuring the
// business.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

type TabDef = {
  href: string;
  tKey: string;
  activeWhen: (path: string, tab: string | null) => boolean;
};

const PRIMARY_TABS: TabDef[] = [
  {
    href: "/manual-data",
    tKey: "data.tab.import",
    activeWhen: (path) => path === "/manual-data" || path.startsWith("/manual-data/"),
  },
  {
    href: "/sources",
    tKey: "data.tab.sources",
    activeWhen: (path) => path === "/sources" || path.startsWith("/sources/"),
  },
  {
    href: "/transactions",
    tKey: "data.tab.transactions",
    activeWhen: (path) => path === "/transactions" || path.startsWith("/transactions/"),
  },
];

const ADVANCED_TABS: TabDef[] = [
  {
    href: "/settings?tab=categories",
    tKey: "data.tab.categories",
    activeWhen: (path, tab) => path === "/settings" && tab === "categories",
  },
  {
    href: "/data-log",
    tKey: "data.tab.dataLog",
    activeWhen: (path) => path === "/data-log" || path.startsWith("/data-log/"),
  },
  {
    href: "/integration",
    tKey: "data.tab.integration",
    activeWhen: (path) => path === "/integration" || path.startsWith("/integration/"),
  },
];

export default function DataTabs() {
  const t    = useT();
  const path = usePathname();
  const sp   = useSearchParams();
  const tab  = sp.get("tab");

  // Surface the Advanced dropdown as "active" when the current route
  // matches any of its children, so users on Data Log / Categories /
  // Integration see the contextual highlight.
  const advancedActive = ADVANCED_TABS.some((d) => d.activeWhen(path, tab));

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside-click + Escape close. Light handler - the dropdown is
  // small and only opens on user intent.
  useEffect(() => {
    if (!advancedOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdvancedOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAdvancedOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [advancedOpen]);

  return (
    <div className="mb-6 -mt-2 flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {PRIMARY_TABS.map((d) => {
        const active = d.activeWhen(path, tab);
        return (
          <Link
            key={d.href}
            href={d.href}
            className={`px-4 py-1.5 rounded transition ${
              active ? "bg-accent-soft text-accent" : "text-slate-300 hover:text-white"
            }`}
          >
            {t(d.tKey)}
          </Link>
        );
      })}

      {/* Advanced dropdown - secondary surfaces tucked here so the
          primary nav stays focused on the everyday actions. */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          aria-haspopup="menu"
          className={`px-4 py-1.5 rounded transition inline-flex items-center gap-1 ${
            advancedActive ? "bg-accent-soft text-accent" : "text-slate-300 hover:text-white"
          }`}
        >
          Advanced
          <span className={`text-xs transition ${advancedOpen ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {advancedOpen ? (
          <div
            role="menu"
            className="absolute left-0 top-full mt-1 z-30 min-w-[12rem] rounded-md border border-line bg-ink-900 shadow-xl py-1"
          >
            {ADVANCED_TABS.map((d) => {
              const active = d.activeWhen(path, tab);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  role="menuitem"
                  onClick={() => setAdvancedOpen(false)}
                  className={`block px-3 py-1.5 text-sm transition ${
                    active ? "bg-accent-soft text-accent" : "text-slate-300 hover:bg-ink-700/40 hover:text-white"
                  }`}
                >
                  {t(d.tKey)}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
