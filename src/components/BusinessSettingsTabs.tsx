"use client";

// Settings tab nav - configuration only. Data-ops tabs (Sources,
// Import, Integration, Transactions, Manual Data Log, Categories &
// Vendors) live under <DataTabs /> in the /data sidebar section, so
// this strip is three tabs:
//   Business Settings · Business Profile · Business Plan
//
// /settings uses a ?tab= query for the last two (settings is the
// default with no param). The Categories & Vendors editor still lives
// inside SettingsClient at /settings?tab=categories, but its tab pill
// is rendered by <DataTabs /> from the Data section.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

const TAB_DEFS: { href: string; tKey: string; activeWhen: (path: string, tab: string | null) => boolean }[] = [
  {
    href: "/settings",
    tKey: "settings.tab.businessSettings",
    activeWhen: (path, tab) => path === "/settings" && (!tab || tab === "settings"),
  },
  {
    href: "/settings?tab=profile",
    tKey: "settings.tab.businessProfile",
    activeWhen: (path, tab) => path === "/settings" && tab === "profile",
  },
  {
    href: "/settings?tab=plan",
    tKey: "settings.tab.businessPlan",
    activeWhen: (path, tab) => path === "/settings" && tab === "plan",
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
