"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Tabs for the Financial Review module. "Business Evolution" only
// appears once the workspace has two or more financial years.
export default function FinancialReviewTabs({ showEvolution }: { showEvolution: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: "/financial-review", label: "Reviews" },
    ...(showEvolution ? [{ href: "/financial-review/evolution", label: "Business Evolution" }] : []),
  ];
  return (
    <div className="sticky top-[85px] z-20 -mx-4 mb-6 border-b border-line/40 bg-ink-950 px-4 pb-3 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
        {tabs.map((tb) => {
          const active = path === tb.href;
          return (
            <Link
              key={tb.href}
              href={tb.href}
              className={`rounded px-4 py-1.5 transition ${
                active ? "bg-accent-soft text-accent" : "text-slate-300 hover:text-white"
              }`}
            >
              {tb.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
