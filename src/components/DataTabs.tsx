"use client";

// Data section tab nav — five operational surfaces:
//   Sources · Import Data · Integration · Transactions · Data Log
//
// The sidebar's "Data" entry is the visual home; each tab is its own
// full route under the (app) layout. Structured so future surfaces
// (Connected accounts, Sync status, Upload archive, File history,
// Failed imports, AI parsing logs, Source health, Import scheduling,
// Duplicate history) can slot in alongside without nav rework.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

const TAB_DEFS: { href: string; tKey: string; activeWhen: (path: string) => boolean }[] = [
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
    href: "/integration",
    tKey: "data.tab.integration",
    activeWhen: (path) => path === "/integration" || path.startsWith("/integration/"),
  },
  {
    href: "/transactions",
    tKey: "data.tab.transactions",
    activeWhen: (path) => path === "/transactions" || path.startsWith("/transactions/"),
  },
  {
    href: "/data-log",
    tKey: "data.tab.dataLog",
    activeWhen: (path) => path === "/data-log" || path.startsWith("/data-log/"),
  },
];

export default function DataTabs() {
  const t = useT();
  const TABS = TAB_DEFS.map((d) => ({ ...d, label: t(d.tKey) }));
  const path = usePathname();
  return (
    <div className="mb-6 -mt-2 flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active = t.activeWhen(path);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-1.5 rounded transition ${
              active
                ? "bg-accent-soft text-accent"
                : "text-slate-300 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
