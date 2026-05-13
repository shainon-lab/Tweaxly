"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tabs shown on every page under the Data umbrella. The sidebar collapses
// Transactions / Import data / Data log into one Data entry — the user
// picks the view from this row instead of the sidebar.
const TABS = [
  { href: "/manual-data",  label: "Import data"  },
  { href: "/transactions", label: "Transactions" },
  { href: "/data-log",     label: "Data log"     },
];

export default function DataTabs() {
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
