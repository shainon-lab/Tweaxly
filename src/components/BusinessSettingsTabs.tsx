"use client";

// Unified tab nav shown across every Business Settings destination.
// The Settings page used to own a 3-tab internal switcher (Business
// Profile, Categories & Vendors, Integration) and the Data section
// owned its own 3-tab switcher (Import data, Transactions, Data log).
// Both groups now collapse into one 6-tab row anchored to this
// component - the Data sidebar entry is gone and these views live
// under Business Settings.
//
// /settings holds three of the six tabs via a ?tab= query (profile is
// the default, no param needed); the other three are full routes.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Tab labels are i18n keys; the component resolves them per render.
const TAB_DEFS: { href: string; tKey: string; activeWhen: (path: string, tab: string | null) => boolean }[] = [
  {
    href: "/settings",
    tKey: "settings.tab.profile",
    activeWhen: (path, tab) => path === "/settings" && (!tab || tab === "profile"),
  },
  {
    href: "/manual-data",
    tKey: "settings.tab.import",
    activeWhen: (path) => path === "/manual-data" || path.startsWith("/manual-data/"),
  },
  {
    href: "/settings?tab=integration",
    tKey: "settings.tab.integration",
    activeWhen: (path, tab) => path === "/settings" && tab === "integration",
  },
  {
    href: "/settings?tab=categories",
    tKey: "settings.tab.categories",
    activeWhen: (path, tab) => path === "/settings" && tab === "categories",
  },
  {
    href: "/transactions",
    tKey: "settings.tab.transactions",
    activeWhen: (path) => path === "/transactions" || path.startsWith("/transactions/"),
  },
  {
    href: "/data-log",
    tKey: "settings.tab.dataLog",
    activeWhen: (path) => path === "/data-log" || path.startsWith("/data-log/"),
  },
  {
    href: "/settings/workspaces",
    tKey: "settings.tab.workspaces",
    activeWhen: (path) => path === "/settings/workspaces" || path.startsWith("/settings/workspaces/"),
  },
];

export default function BusinessSettingsTabs() {
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
