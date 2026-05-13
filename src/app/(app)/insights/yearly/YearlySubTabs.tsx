"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Sub-tabs inside the Yearly Summary view — flips between the textual
// insights and the headline numbers. Preserves the ?year= query string
// so switching tabs keeps the user on the same year.
export default function YearlySubTabs() {
  const path = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();
  const suffix = qs ? `?${qs}` : "";
  // Key numbers is the default landing of the Yearly Summary view, so it
  // sits first and is what /insights/yearly itself renders.
  const TABS = [
    { href: `/insights/yearly${suffix}`,          label: "Key numbers" },
    { href: `/insights/yearly/insights${suffix}`, label: "Top insights & tips" },
  ];
  return (
    // Block wrapper forces the sub-tabs onto their own line below the
    // InsightsTabs row. Without it the two inline-flex containers wrap
    // side-by-side on wide screens.
    <div className="mb-6">
    <div className="inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const base = t.href.split("?")[0];
        // /insights/yearly is matched exactly so visiting /insights/yearly/insights
        // doesn't also highlight the Key numbers tab.
        const active = path === base;
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
