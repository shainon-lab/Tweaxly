"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Umbrella row for the Reports section. The page header already
// communicates "Reports", so the umbrella no longer renders a
// redundant Reports pill — only the side affordance for Charts. The
// inner report sub-pages (P&L Statement, Category Trends, Yearly
// Summary) are switched via ReportsInnerTabs below this row.
export default function ReportsTabs() {
  const path = usePathname();
  const onCharts  = path === "/insights" || path.startsWith("/insights/")
    ? !path.startsWith("/insights/yearly")
    : false;
  return (
    <div className="mb-3 -mt-2 flex items-center justify-end gap-2 flex-wrap">
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
