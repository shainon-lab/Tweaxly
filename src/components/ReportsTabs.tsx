"use client";
import Link from "next/link";

// Standalone back-affordance shown on the Charts page (/insights) only.
// The report pages use the same tab strip as ReportsInnerTabs and host
// their own "View Charts" button on the right; this component exists
// just so the Charts view has a one-click way back into Reports.
export default function ReportsTabs() {
  return (
    <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
      <Link
        href="/report"
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-accent/40 transition"
      >
        <span>←</span>
        <span>Back to Reports</span>
      </Link>
      <span className="text-xs text-slate-500">Charts view</span>
    </div>
  );
}
