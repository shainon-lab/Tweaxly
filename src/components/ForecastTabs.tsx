"use client";

// Sub-tab nav for the Forecast section. Three views:
//   Overview            - passive AI-generated outlook (default landing)
//   Scenarios           - interactive scenario builder ('what if…')
//   Workforce Planning  - workforce financial-impact view at /workforce
//
// Overview and Scenarios share the same /forecast route - they're
// differentiated by a ?view= query. Switching between them preserves
// the historical-period and assumption state in the URL so a user
// can build a scenario and flip back to Overview without losing it.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function ForecastTabs() {
  const t = useT();
  const path = usePathname();
  const sp = useSearchParams();
  const currentView = sp.get("view");

  // Preserve every other query param when generating tab links -
  // hist_from/hist_to/horizon/assumptions all live in the URL.
  const preserve = (override: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(override)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const onForecast = path === "/forecast" || path.startsWith("/forecast/");
  // /employees is a drill-down inside Workforce Planning (Edit
  // Roster), so it keeps the Workforce Planning tab highlighted.
  const onWorkforce =
    path === "/workforce" ||
    path.startsWith("/workforce/") ||
    path === "/employees" ||
    path.startsWith("/employees/");
  const overviewActive  = onForecast && (!currentView || currentView === "overview");
  const scenariosActive = onForecast && currentView === "scenarios";
  const workforceActive = onWorkforce;

  const TABS = [
    {
      label: t("tabs.forecast.overview"),
      href: `/forecast${preserve({ view: null })}`,
      active: overviewActive,
    },
    {
      label: t("tabs.forecast.scenarios"),
      href: `/forecast${preserve({ view: "scenarios" })}`,
      active: scenariosActive,
    },
    {
      label: t("tabs.forecast.workforce"),
      href: "/workforce",
      active: workforceActive,
    },
  ];

  return (
    <div className="mb-6 -mt-2 inline-flex items-center rounded-md border border-line bg-ink-900/60 p-1 text-sm">
      {TABS.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className={`px-4 py-1.5 rounded transition ${
            t.active
              ? "bg-accent-soft text-accent"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
