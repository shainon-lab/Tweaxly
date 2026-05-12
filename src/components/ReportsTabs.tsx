"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tab nav shown at the top of every page under the "Reports" umbrella. The
// sidebar only links to /report — from there the user picks the view they
// want (Monthly Reports vs. Data Flow).
const TABS = [
  { href: "/report",    label: "Monthly Reports" },
  { href: "/data-flow", label: "Data Flow"       },
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
