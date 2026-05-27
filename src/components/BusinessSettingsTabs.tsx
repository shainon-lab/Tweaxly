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

const TAB_DEFS: { href: string; label: string; activeWhen: (path: string, tab: string | null) => boolean }[] = [
  {
    href: "/settings",
    label: "Business Settings",
    activeWhen: (path, tab) => path === "/settings" && (!tab || tab === "settings"),
  },
  {
    href: "/settings?tab=profile",
    label: "Business Profile",
    activeWhen: (path, tab) => path === "/settings" && tab === "profile",
  },
  {
    href: "/settings?tab=plan",
    label: "Business Plan",
    activeWhen: (path, tab) => path === "/settings" && tab === "plan",
  },
  {
    href: "/settings?tab=members",
    label: "Members & Access",
    activeWhen: (path, tab) => path === "/settings" && tab === "members",
  },
];

export default function BusinessSettingsTabs() {
  const t = useT();
  // First three tab labels are i18n-managed; "Members & Access" is
  // English-only for now. Mirror the existing label-fallback pattern
  // by mapping by href.
  const I18N: Record<string, string> = {
    "/settings":              t("settings.tab.businessSettings"),
    "/settings?tab=profile":  t("settings.tab.businessProfile"),
    "/settings?tab=plan":     t("settings.tab.businessPlan"),
  };
  const TABS = TAB_DEFS.map((d) => ({ ...d, label: I18N[d.href] ?? d.label }));
  const path = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab");
  return (
    // Sticky directly under the PageHeader (~85px). Solid background
    // + border-bottom; no transitions, no scroll-driven state.
    <div className="sticky top-[85px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
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
    </div>
  );
}
