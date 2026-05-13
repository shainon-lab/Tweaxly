"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tab nav shown at the top of every page under the "Reports and Insights"
// umbrella. The sidebar links to /report — from there the user picks
// Monthly Reports, Data Flow, or Insights. The Insights tab carries its
// own second-level nav (General / Yearly Summary) once you're inside.
const TABS = [
  { href: "/report",    label: "Monthly Reports" },
  { href: "/data-flow", label: "Data Flow"       },
  { href: "/insights",  label: "Insights"        },
];

export default function ReportsTabs() {
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
