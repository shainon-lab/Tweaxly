"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Tabs shown on every page under the Consultation umbrella.
//   - New advisory  - blank-slate textarea for custom questions
//   - Suggested     - AI-curated questions based on the workspace's data
//   - History       - accordion of past Q&As
const TAB_HREFS = [
  { href: "/consultation",           tKey: "tabs.consult.new"       },
  { href: "/consultation/suggested", tKey: "tabs.consult.suggested" },
  { href: "/consultation/history",   tKey: "tabs.consult.history"   },
];

export default function ConsultationTabs({ historyCount }: { historyCount?: number }) {
  const t = useT();
  const path = usePathname();
  const TABS = TAB_HREFS.map((x) => ({ href: x.href, label: t(x.tKey) }));
  return (
    // Sticky just under the PageHeader (~85px). Solid bg + border so
    // the tab strip stays readable while scrolling and doesn't get
    // cut by the sticky title. Matches the pattern used by DataTabs,
    // BusinessSettingsTabs, and the Account sub-tabs.
    <div className="sticky top-[85px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40 mb-6">
    <div className="inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active = path === t.href;
        const isHistory = t.href === "/consultation/history";
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-1.5 rounded transition flex items-center gap-2 ${
              active
                ? "bg-accent-soft text-accent"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>{t.label}</span>
            {isHistory && historyCount && historyCount > 0 ? (
              <span className="text-slate-500 text-xs">({historyCount})</span>
            ) : null}
          </Link>
        );
      })}
    </div>
    </div>
  );
}
