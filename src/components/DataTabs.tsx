"use client";

// Data section tab nav — six operational surfaces:
//   Import Data · Manual Sources · Transactions · Categories & Vendors
//   · Manual Data Log · Integration
//
// The sidebar's "Data" entry is the visual home; each tab is its own
// full route under the (app) layout. Categories & Vendors actually
// lives at /settings?tab=categories (the editor is part of
// SettingsClient) but appears in the Data tab strip because users
// reach for it while reviewing their data, not while configuring the
// business.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

const TAB_DEFS: { href: string; tKey: string; activeWhen: (path: string, tab: string | null) => boolean }[] = [
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
  const t = useT();
  const TABS = TAB_DEFS.map((d) => ({ ...d, label: t(d.tKey) }));
  const path = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab");
  return (
    <div className="mb-6 -mt-2 flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active = t.activeWhen(path, tab);
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
