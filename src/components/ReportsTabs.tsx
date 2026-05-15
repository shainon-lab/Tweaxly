"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Umbrella tab nav for the Reports section. Reports is the main thing
// (P&L Statement, Category Trends, Yearly Summary — the second-level
// nav lives in ReportsInnerTabs and renders below this row on those
// pages). Charts is a secondary option — moved to the right side so
// it doesn't compete with the main reports flow.
const REPORTS_ROUTES = ["/report", "/data-flow", "/insights/yearly"];

export default function ReportsTabs() {
  const path = usePathname();
  const onReports = REPORTS_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
  const onCharts  = path === "/insights" || path.startsWith("/insights/")
    ? !path.startsWith("/insights/yearly")
    : false;
  return (
    <div className="mb-3 -mt-2 flex items-center justify-between gap-2 flex-wrap">
      {/* Main pill — Reports. Active across all three report sub-pages. */}
      <div className="inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
        <Link
          href="/report"
          className={`px-4 py-1.5 rounded transition ${
            onReports
              ? "bg-accent-soft text-accent"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Reports
        </Link>
      </div>

      {/* Secondary option — Charts. Demoted to a small button on the
          right so the main reports flow stays the headline. */}
      <Link
        href="/insights"
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition ${
          onCharts
            ? "border-accent/50 bg-accent-soft/40 text-accent"
            : "border-line text-slate-400 hover:text-slate-100 hover:border-accent/40"
        }`}
        title="View the charts grid for this period"
      >
        <span>📈</span>
        <span>{onCharts ? "Viewing Charts" : "View Charts"}</span>
      </Link>
    </div>
  );
}
