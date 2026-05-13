"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Umbrella tab nav for the Reports section. Two top-level views:
//   Reports — the formal data-review pages: P&L Statement, Category Trends,
//             Yearly Summary. Its second-level nav (ReportsInnerTabs) sits
//             below this row on those pages.
//   Charts  — the visual exploration grid (the seven-chart period view).
const TABS = [
  { href: "/report",   label: "Reports" },
  { href: "/insights", label: "Charts"  },
];

const REPORTS_ROUTES = ["/report", "/data-flow", "/insights/yearly"];

export default function ReportsTabs() {
  const path = usePathname();
  return (
    <div className="mb-3 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        // Reports stays active across all three report sub-pages
        // (P&L Statement / Category Trends / Yearly Summary). Charts is
        // matched exactly so visiting /insights/yearly doesn't also
        // highlight it.
        const active =
          t.href === "/report"
            ? REPORTS_ROUTES.some((r) => path === r || path.startsWith(r + "/"))
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
  );
}
