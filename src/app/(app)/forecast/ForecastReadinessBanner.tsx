// Compact banner above the forecast body that names the current
// readiness state (Basic / Standard / Reliable / Advanced) and its
// one-line description. When state = "disabled" the parent page
// hides the whole forecast body and the engine's error message
// surfaces instead.

import type { ReadinessReport } from "@/lib/forecastEngine";

export default function ForecastReadinessBanner({
  readiness,
}: { readiness: ReadinessReport }) {
  const toneClass =
    readiness.state === "advanced" ? "border-good/40 bg-good/5 text-good" :
    readiness.state === "reliable" ? "border-good/30 bg-good/5 text-good" :
    readiness.state === "standard" ? "border-accent/40 bg-accent/5 text-accent" :
    readiness.state === "basic"    ? "border-warn/40 bg-warn/5 text-warn"   :
                                     "border-bad/40 bg-bad/5 text-bad";
  return (
    <div className={`rounded-lg border ${toneClass} px-4 py-3 mb-4 flex items-baseline gap-3 flex-wrap`}>
      <div className="t-meta font-semibold uppercase tracking-wide">{readiness.label}</div>
      <div className="t-body text-slate-300 flex-1 min-w-0">{readiness.description}</div>
      {readiness.state !== "disabled" ? (
        <div className="t-meta text-slate-400">
          {readiness.daysOfData} day{readiness.daysOfData === 1 ? "" : "s"} · {readiness.monthsOfData} mo of data
        </div>
      ) : null}
    </div>
  );
}
