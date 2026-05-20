// "Why this forecast?" — the mandatory explanation panel.
//
// Renders the structured engine output so users (and accountants who
// look over their shoulder) can answer: where did this number come
// from? Which months were used? What was excluded as an outlier?
// What's the confidence?

import { fmtMoney } from "@/lib/format";
import type { ForecastResult } from "@/lib/forecastEngine";

const CONF_TONE: Record<ForecastResult["confidence"], string> = {
  low:    "text-bad",
  medium: "text-warn",
  high:   "text-good",
};

export default function ForecastExplanationPanel({
  result,
  currency,
}: { result: ForecastResult; currency: string }) {
  const tone = CONF_TONE[result.confidence];
  return (
    <div className="card mb-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div className="font-medium">Why this forecast?</div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>
          Confidence: {result.confidence}
          <span className="text-slate-400 font-normal ml-1">({result.confidenceScore}/100)</span>
        </div>
      </div>

      <div className="text-sm text-slate-200 leading-relaxed mb-4">
        {result.explanationText}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Row label="Baseline period"   value={result.baselinePeriod.label} />
        <Row label="Range"             value={`${result.baselinePeriod.fromYM} → ${result.baselinePeriod.toYM}`} />
        <Row label="Months resolved"   value={String(result.baselinePeriod.monthsResolved)} />
        <Row label="Months with data"  value={String(result.baselinePeriod.monthsWithData)} />
        <Row label="Forecast horizon"  value={`Next ${result.forecastHorizon.months} months`} />
        <Row label="Actuals used"      value={`${result.actualsUsed.toLocaleString("en-US")} transactions`} />
        <Row label="Scenarios applied" value={String(result.scenariosApplied)} />
      </div>

      {result.recurringDetected.length > 0 ? (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Recurring items projected forward</div>
          <ul className="text-sm text-slate-300 space-y-1">
            {result.recurringDetected.slice(0, 6).map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span>{r.description}</span>
                <span className="text-slate-500 tabular-nums">≈{fmtMoney(r.monthlyAmount, currency)} / mo</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.outliersDetected.length > 0 ? (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Outliers excluded from trend</div>
          <ul className="text-sm text-slate-300 space-y-1">
            {result.outliersDetected.slice(0, 6).map((o, i) => (
              <li key={i}>{o.reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.excludedRecords.length > 0 ? (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Excluded records</div>
          <ul className="text-sm text-slate-300 space-y-1">
            {result.excludedRecords.map((e, i) => (
              <li key={i}>{e.count} {e.reason.toLowerCase()}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="text-xs text-slate-400">{result.seasonalityNote}</div>

      {result.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-warn/30 bg-warn/10 p-3">
          <div className="text-xs uppercase tracking-wide text-warn mb-1">Warnings</div>
          <ul className="text-xs text-slate-200 space-y-1">
            {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-100 mt-0.5 font-medium">{value}</div>
    </div>
  );
}
