"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Sub-tabs inside the Yearly Summary view — flips between the textual
// insights and the headline numbers. Preserves the ?year= query string
// so switching tabs keeps the user on the same year.
export default function YearlySubTabs() {
  const path = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();
  const suffix = qs ? `?${qs}` : "";
  const TABS = [
    { href: `/insights/yearly${suffix}`,         label: "Top insights & tips" },
    { href: `/insights/yearly/numbers${suffix}`, label: "Key numbers" },
  ];
  return (
    <div className="mb-6 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const base = t.href.split("?")[0];
        const active = path === base;
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
