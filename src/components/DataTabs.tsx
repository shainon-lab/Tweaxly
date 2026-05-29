"use client";

// Data section tab nav. All surfaces (Import, Sources, Transactions,
// Categories & Vendors, Data Log, Integration) render as flat
// sub-tabs - no Advanced dropdown. The owner asked for a single
// row of equal-rank tabs matching the other section navs.
//
// Categories & Vendors actually lives at /settings?tab=categories
// (the editor is part of SettingsClient) but appears here because
// users reach for it while reviewing data, not while configuring the
// business.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

type TabDef = {
  href: string;
  tKey: string;
  activeWhen: (path: string, tab: string | null) => boolean;
};

const TABS: TabDef[] = [
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
  const t    = useT();
  const path = usePathname();
  const sp   = useSearchParams();
  const tab  = sp.get("tab");

  return (
    // Sticky directly under the PageHeader (which is ~85px tall in
    // its single fixed form). Solid bg-ink-950 + border so content
    // can never show through during scroll. No transitions, no
    // scroll-driven state - the strip stays in the DOM at all times.
    <div className="sticky top-[85px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((d) => {
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
      </div>
    </div>
  );
}
