"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Second-level nav inside the Reports umbrella. Picks which kind of
// report the user is reading: a period P&L statement, the per-month
// category-trends grid, or a closed-year retrospective. Also hosts
// the "View Charts" affordance on the right side of the same row, so
// the user has one tab strip for the section instead of two stacked.
const TAB_DEFS = [
  { href: "/report",          tKey: "tabs.reports.pnl",    fallback: "P&L Statement"   },
  { href: "/data-flow",       tKey: "tabs.reports.trends", fallback: "Category Trends" },
  { href: "/insights/yearly", tKey: "tabs.reports.yearly", fallback: "Yearly Summary"  },
];

export default function ReportsInnerTabs() {
  const t = useT();
  const TABS = TAB_DEFS.map((d) => ({ href: d.href, label: t(d.tKey) }));
  const path = usePathname();
  return (
    <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
      <div className="inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
        {TABS.map((t) => {
          // Yearly Summary stays active for its inner pages too
          // (/insights/yearly/insights). The other two are exact matches.
          const active =
            t.href === "/insights/yearly"
              ? path === t.href || path.startsWith(t.href + "/")
              : path === t.href;
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

      {/* View Charts - secondary affordance on the right of the same
          row. Same height as the tab pills; visually demoted so it
          doesn't compete with the main reports flow. */}
      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-slate-400 hover:text-slate-100 hover:border-accent/40 transition"
        title="View the charts grid for this period"
      >
        <span>📈</span>
        <span>{t("tabs.reports.viewCharts")}</span>
      </Link>
    </div>
  );
}
