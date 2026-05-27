"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Sub-tabs inside the Yearly Summary view - flips between the textual
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
    // Secondary-level sticky strip - sits below the primary
    // ReportsInnerTabs strip (which sticks at top-[85px] and is
    // ~55px tall). 85 + 55 = ~140px.
    <div className="sticky top-[140px] z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40 mb-6">
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
