"use client";

// Unified tab nav shown across every Business Settings destination.
// The Settings page used to own a 3-tab internal switcher (Business
// Profile, Categories & Vendors, Integration) and the Data section
// owned its own 3-tab switcher (Import data, Transactions, Data log).
// Both groups now collapse into one 6-tab row anchored to this
// component — the Data sidebar entry is gone and these views live
// under Business Settings.
//
// /settings holds three of the six tabs via a ?tab= query (profile is
// the default, no param needed); the other three are full routes.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS: { href: string; label: string; activeWhen: (path: string, tab: string | null) => boolean }[] = [
  {
    href: "/settings",
    label: "Business Profile",
    activeWhen: (path, tab) => path === "/settings" && (!tab || tab === "profile"),
  },
  {
    href: "/settings?tab=categories",
    label: "Categories & Vendors",
    activeWhen: (path, tab) => path === "/settings" && tab === "categories",
  },
  {
    href: "/settings?tab=integration",
    label: "Integration",
    activeWhen: (path, tab) => path === "/settings" && tab === "integration",
  },
  {
    href: "/manual-data",
    label: "Import data",
    activeWhen: (path) => path === "/manual-data" || path.startsWith("/manual-data/"),
  },
  {
    href: "/transactions",
    label: "Transactions",
    activeWhen: (path) => path === "/transactions" || path.startsWith("/transactions/"),
  },
  {
    href: "/data-log",
    label: "Data log",
    activeWhen: (path) => path === "/data-log" || path.startsWith("/data-log/"),
  },
];

export default function BusinessSettingsTabs() {
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
