"use client";

// Sub-tab nav for the Business Signals page.
//   Signals — rotating advisor observations (the random-5-of-15 feed).
//   Monitor — threshold rules that have fired (formerly "Alerts"). The
//             Monitor sub-tab also houses notification rule management
//             via an inline "Monitor Events" toggle.
// When `firingAlerts > 0`, the Monitor tab gets a red count badge so the
// user can see at a glance that something is over-threshold. The sidebar
// shows the same badge on the Business Signals entry itself.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function BusinessSignalsTabs({
  firingAlerts,
}: {
  firingAlerts: number;
}) {
  const t = useT();
  const path = usePathname();
  const TABS: { href: string; label: string; alert?: boolean }[] = [
    { href: "/business-signals",        label: t("tabs.signals.signals") },
    { href: "/business-signals/alerts", label: t("tabs.signals.monitor"), alert: firingAlerts > 0 },
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
                {firingAlerts > 99 ? "99+" : firingAlerts}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
