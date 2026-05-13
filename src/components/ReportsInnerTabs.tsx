"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Second-level nav inside the Reports umbrella. Picks which kind of
// report the user is reading: a period P&L statement, the per-month
// category-trends grid, or a closed-year retrospective.
const TABS = [
  { href: "/report",          label: "P&L Statement"   },
  { href: "/data-flow",       label: "Category Trends" },
  { href: "/insights/yearly", label: "Yearly Summary"  },
];

export default function ReportsInnerTabs() {
  const path = usePathname();
  return (
    <div className="mb-6 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
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
  );
}
