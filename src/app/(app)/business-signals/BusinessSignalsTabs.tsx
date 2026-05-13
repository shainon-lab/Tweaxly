"use client";

// Sub-tab nav for the Business Signals page.
//   Signals — rotating advisor observations (the random-5-of-15 feed).
//   Alerts  — threshold rules that have fired.
// When `firingAlerts > 0`, the Alerts tab gets a red "!" badge so the
// user can see at a glance that something is over-threshold. The sidebar
// shows the same badge on the Business Signals entry itself.

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BusinessSignalsTabs({
  firingAlerts,
}: {
  firingAlerts: number;
}) {
  const path = usePathname();
  const TABS: { href: string; label: string; alert?: boolean }[] = [
    { href: "/business-signals",        label: "Signals" },
    { href: "/business-signals/alerts", label: "Alerts", alert: firingAlerts > 0 },
  ];
  return (
    <div className="mb-6 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => {
        const active =
          path === t.href ||
          (t.href === "/business-signals" && path === "/business-signals");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-2 px-4 py-1.5 rounded transition ${
              active
                ? "bg-accent-soft text-accent"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>{t.label}</span>
            {t.alert ? (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-bad text-white text-[10px] font-bold leading-none"
                title={`${firingAlerts} alert${firingAlerts === 1 ? "" : "s"} firing`}
                aria-label={`${firingAlerts} alerts`}
              >
                !
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
