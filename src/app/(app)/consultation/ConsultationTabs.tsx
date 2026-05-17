"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Tabs shown on every page under the Consultation umbrella.
// Chat = the active conversation; Chat history = accordion of past Q&As.
const TAB_HREFS = [
  { href: "/consultation",         tKey: "tabs.consult.new"     },
  { href: "/consultation/history", tKey: "tabs.consult.history" },
];

export default function ConsultationTabs({ historyCount }: { historyCount?: number }) {
  const t = useT();
  const path = usePathname();
  const TABS = TAB_HREFS.map((x) => ({ href: x.href, label: t(x.tKey) }));
  return (
    <div className="mb-6 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
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
  );
}
