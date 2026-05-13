"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tabs shown on every page under the Insights umbrella.
// General = the existing 7-chart grid scoped to a chosen period.
// Yearly Summary = closed-year retrospective with insights + stat boxes.
const TABS = [
  { href: "/insights",        label: "General"        },
  { href: "/insights/yearly", label: "Yearly Summary" },
];

export default function InsightsTabs() {
  const path = usePathname();
  return (
    <div className="mb-6 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active = path === t.href || (t.href !== "/insights" && path.startsWith(t.href));
        // /insights is matched exactly so visiting /insights/yearly doesn't
        // also highlight the General tab.
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
