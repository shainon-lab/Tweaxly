"use client";

// Sub-tab nav for the Forecast section. Two top-level views:
//   Forecast            — the baseline + scenario forecast view at /forecast
//   Workforce Planning  — the workforce financial-impact view at /workforce
//
// Workforce used to be a top-level sidebar entry. The product is not
// an HR system, so it now lives under Forecast as a financial-planning
// lever rather than a standalone destination.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/forecast",  label: "Forecast"           },
  { href: "/workforce", label: "Workforce Planning" },
];

export default function ForecastTabs() {
  const path = usePathname();
  return (
    <div className="mb-6 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(t.href + "/");
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
