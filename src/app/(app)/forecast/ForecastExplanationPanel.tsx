"use client";

// "Why this forecast?" - 3-layer executive panel.
//
// Layer 1 (always visible): confidence widget + 3-4 main driver bullets.
// Layer 2: compact driver cards in a grid (one per forecasting factor).
// Layer 3 (collapsed): the full technical breakdown - baseline range,
//   excluded records, recurring items, seasonality note, warnings.
//
// All driver rollups are derived from the structured ForecastResult
// fields; the engine's long explanationText is hidden inside Layer 3 so
// it doesn't visually compete with the chart and KPI cards above.

import { useState } from "react";
import { fmtMoney } from "@/lib/format";
import type { ForecastResult } from "@/lib/forecastEngine";

type Tone = "positive" | "warning" | "neutral";

type Driver = {
  title:   string;
  impact:  Tone;
  detail:  string;
};

const TONE_DOT: Record<Tone, string> = {
  positive: "bg-good",
  warning:  "bg-warn",
  neutral:  "bg-slate-500",
};

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-good",
  warning:  "text-warn",
  neutral:  "text-slate-400",
};

const TONE_LABEL: Record<Tone, string> = {
  positive: "Positive",
  warning:  "Watch",
  neutral:  "Neutral",
};

// Rank order used when picking which drivers to surface as the top
// bullets in Layer 1. Warnings bubble up so the user sees risks first;
// positives next so they understand what the engine is leaning on.
const TONE_RANK: Record<Tone, number> = {
  warning:  0,
  positive: 1,
  neutral:  2,
};

export default function ForecastExplanationPanel({
  result,
  currency,
}: { result: ForecastResult; currency: string }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const drivers = buildDrivers(result);
  // Layer 1 main-driver bullets: top 4 by impact ranking. Warnings
  // first so risks lead, then positives.
  const topDrivers = [...drivers]
    .sort((a, b) => TONE_RANK[a.impact] - TONE_RANK[b.impact])
    .slice(0, 4);

  const confidencePct = result.confidenceScore;
  const confTone: Tone = result.confidence === "high"   ? "positive"
                       : result.confidence === "medium" ? "neutral"
                       :                                  "warning";

  // Volatility label derived from confidence + outlier count -
  // the user-facing word for what the engine measures.
  const volatility = volatilityLabel(result);
  const recurringCount = result.recurringDetected.length;

  return (
    <div className="card mb-6">
      {/* ─── Layer 1: confidence widget + main drivers ─────────── */}
      <div className="flex items-start justify-between gap-6 flex-wrap mb-5">
        <div className="min-w-0 flex-1">
          <div className="font-medium mb-1">Why this forecast?</div>
          <div className="text-xs text-slate-400">
            The top drivers behind this projection, ranked by impact.
          </div>
        </div>

        {/* Confidence chip - the trust layer. Big number, short
            "based on" bullets so the user sees what fed the score. */}
        <div className="rounded-lg border border-line bg-ink-900/50 px-4 py-3 min-w-[200px]">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Forecast Confidence
          </div>
          <div className={`text-2xl font-semibold leading-tight ${TONE_TEXT[confTone]}`}>
            {confidencePct}%
          </div>
          <ul className="text-[11px] text-slate-400 mt-1 space-y-0.5">
            <li>· {result.baselinePeriod.monthsWithData} of {result.baselinePeriod.monthsResolved} months analyzed</li>
            <li>· {volatility} volatility</li>
            <li>· {result.seasonalityApplied ? "Seasonal pattern applied" : "No seasonal pattern"}</li>
            <li>· {recurringCount > 0 ? `${recurringCount} recurring item${recurringCount === 1 ? "" : "s"}` : "No recurring items"}</li>
          </ul>
        </div>
      </div>

      {topDrivers.length > 0 ? (
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
            Main Drivers
          </div>
          <ul className="space-y-1.5">
            {topDrivers.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT[d.impact]}`} />
                <span className="text-sm text-slate-200 leading-snug">
                  {d.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ─── Layer 2: driver cards grid ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {drivers.map((d, i) => (
          <div
            key={i}
            className="rounded-lg border border-line bg-ink-900/40 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT[d.impact]}`} />
                <div className="text-xs font-medium text-slate-200 truncate">{d.title}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wide font-semibold shrink-0 ${TONE_TEXT[d.impact]}`}>
                {TONE_LABEL[d.impact]}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">{d.detail}</div>
          </div>
        ))}
      </div>

      {/* ─── Layer 3: detailed analysis (collapsed) ────────────── */}
      <div className="mt-4 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="text-xs text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5"
        >
          <span className="inline-block w-3 text-center">{detailsOpen ? "▾" : "▸"}</span>
          {detailsOpen ? "Hide detailed analysis" : "View detailed analysis"}
        </button>

        {detailsOpen ? (
          <div className="mt-4 space-y-4">
            {/* Baseline + horizon meta. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Row label="Baseline period"   value={result.baselinePeriod.label} />
              <Row label="Range"             value={`${result.baselinePeriod.fromYM} → ${result.baselinePeriod.toYM}`} />
              <Row label="Months resolved"   value={String(result.baselinePeriod.monthsResolved)} />
              <Row label="Months with data"  value={String(result.baselinePeriod.monthsWithData)} />
              <Row label="Forecast horizon"  value={`Next ${result.forecastHorizon.months} months`} />
              <Row label="Actuals used"      value={`${result.actualsUsed.toLocaleString("en-US")} transactions`} />
              <Row label="Scenarios applied" value={String(result.scenariosApplied)} />
            </div>

            {/* Engine narrative - kept here for accountants who want
                the full chain of reasoning. */}
            {result.explanationText ? (
              <div className="text-sm text-slate-300 leading-relaxed">
                {result.explanationText}
              </div>
            ) : null}

            {result.recurringDetected.length > 0 ? (
              <div>
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
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Outliers excluded from trend</div>
                <ul className="text-sm text-slate-300 space-y-1">
                  {result.outliersDetected.slice(0, 6).map((o, i) => (
                    <li key={i}>{o.reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.excludedRecords.length > 0 ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Excluded records</div>
                <ul className="text-sm text-slate-300 space-y-1">
                  {result.excludedRecords.map((e, i) => (
                    <li key={i}>{e.count} {e.reason.toLowerCase()}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.seasonalityNote ? (
              <div className="text-xs text-slate-400">{result.seasonalityNote}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Warnings always rendered (outside Layer 3) because they're
          risks the user should see without an extra click. */}
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

// ── Driver derivation ──────────────────────────────────────────
// Pure function: take the structured engine result, return the set of
// driver cards we render. Each driver becomes both a Layer-2 card AND a
// candidate for the Layer-1 "Main Drivers" bullets.

function buildDrivers(result: ForecastResult): Driver[] {
  const drivers: Driver[] = [];
  const { monthsResolved, monthsWithData } = result.baselinePeriod;

  // ── Data coverage ──
  const coverage = monthsResolved > 0 ? monthsWithData / monthsResolved : 0;
  drivers.push({
    title: "Data Coverage",
    impact: coverage >= 0.9 ? "positive" : coverage >= 0.6 ? "neutral" : "warning",
    detail: coverage >= 0.9
      ? `Strong history — ${monthsWithData} of ${monthsResolved} months populated.`
      : coverage >= 0.6
      ? `Partial history — ${monthsWithData} of ${monthsResolved} months populated.`
      : `Limited history — only ${monthsWithData} of ${monthsResolved} months populated.`,
  });

  // ── Volatility ──
  const expenseOutliers = result.outliersDetected.filter((o) => o.metric === "expense").length;
  const incomeOutliers  = result.outliersDetected.filter((o) => o.metric === "income").length;
  const volatility = volatilityLabel(result);
  drivers.push({
    title: "Volatility",
    impact: result.confidence === "high" ? "positive"
          : result.confidence === "medium" ? "neutral"
          : "warning",
    detail: result.confidence === "high"
      ? "Stable month-to-month results — low variation."
      : result.confidence === "medium"
      ? `Moderate variation across the baseline${expenseOutliers + incomeOutliers > 0 ? `, ${expenseOutliers + incomeOutliers} month${expenseOutliers + incomeOutliers === 1 ? "" : "s"} flagged` : ""}.`
      : `High volatility — ${volatility.toLowerCase()} variation in the baseline.`,
  });

  // ── Recurring revenue / cost base ──
  if (result.recurringDetected.length > 0) {
    const sampleNames = result.recurringDetected.slice(0, 2).map((r) => r.description).join(", ");
    drivers.push({
      title: "Recurring Items",
      impact: "positive",
      detail: `${result.recurringDetected.length} recurring pattern${result.recurringDetected.length === 1 ? "" : "s"} projected forward (e.g. ${sampleNames}).`,
    });
  } else {
    drivers.push({
      title: "Recurring Items",
      impact: "neutral",
      detail: "No recurring patterns detected — forecast leans on the trailing average.",
    });
  }

  // ── Seasonality ──
  drivers.push({
    title: "Seasonality",
    impact: result.seasonalityApplied ? "positive" : "neutral",
    detail: result.seasonalityApplied
      ? "Seasonal pattern detected and applied to upcoming months."
      : "No seasonal pattern applied — not enough history yet, or trend is flat.",
  });

  // ── Outliers ──
  const totalOutliers = result.outliersDetected.length;
  if (totalOutliers === 0) {
    drivers.push({
      title: "Anomalies",
      impact: "positive",
      detail: "No anomalies detected in the baseline window.",
    });
  } else {
    drivers.push({
      title: "Anomalies",
      impact: totalOutliers > 2 ? "warning" : "neutral",
      detail: `${totalOutliers} month${totalOutliers === 1 ? "" : "s"} flagged as outlier${totalOutliers === 1 ? "" : "s"} and excluded from trend.`,
    });
  }

  // ── Scenarios ──
  if (result.scenariosApplied > 0) {
    drivers.push({
      title: "Scenarios",
      impact: result.scenariosApplied > 3 ? "warning" : "neutral",
      detail: result.scenariosApplied > 3
        ? `${result.scenariosApplied} scenario assumptions stacked — uncertainty grows.`
        : `${result.scenariosApplied} scenario assumption${result.scenariosApplied === 1 ? "" : "s"} applied on top of the baseline.`,
    });
  }

  return drivers;
}

function volatilityLabel(result: ForecastResult): "Low" | "Medium" | "High" {
  if (result.confidence === "high")   return "Low";
  if (result.confidence === "medium") return "Medium";
  return "High";
}
