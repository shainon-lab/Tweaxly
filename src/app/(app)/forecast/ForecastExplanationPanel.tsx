"use client";

// "Why this forecast?" - compact executive panel.
//
// Layer 1 (always visible): single dense header row with title +
//   inline confidence chip + a tight driver-cards grid sorted by
//   impact (warnings first).
// Layer 2 (collapsed): the full technical breakdown - baseline range,
//   excluded records, recurring items, seasonality note, engine
//   narrative.
//
// All driver rollups are derived from the structured ForecastResult
// fields; the engine's long explanationText is hidden inside Layer 2
// so it doesn't visually compete with the chart and KPI cards above.

import { useState } from "react";
import { fmtMoney } from "@/lib/format";
import type { ForecastResult } from "@/lib/forecastEngine";
import NarrativeBody from "@/components/NarrativeBody";

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

// Rank order used to sort drivers in the card grid (warnings first,
// positives second, neutrals last) so the most-important cards lead.
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

  // Sort drivers by impact (warnings first, then positives, then
  // neutral) so the most-important cards lead. Previously this was
  // done only for the now-removed "Main Drivers" bullet list - the
  // cards rendered in build order. Sorting them now lets us drop the
  // duplicate bullet list entirely.
  const drivers = [...buildDrivers(result)]
    .sort((a, b) => TONE_RANK[a.impact] - TONE_RANK[b.impact]);

  const confidencePct = result.confidenceScore;
  const confTone: Tone = result.confidence === "high"   ? "positive"
                       : result.confidence === "medium" ? "neutral"
                       :                                  "warning";

  const volatility = volatilityLabel(result);
  const recurringCount = result.recurringDetected.length;

  // Compact "based on" line - same four data points the old verbose
  // confidence chip listed, now joined into one wrapping inline.
  const basedOn = [
    `${result.baselinePeriod.monthsWithData}/${result.baselinePeriod.monthsResolved} months`,
    `${volatility.toLowerCase()} volatility`,
    result.seasonalityApplied ? "seasonal pattern applied" : "no seasonal pattern",
    recurringCount > 0
      ? `${recurringCount} recurring item${recurringCount === 1 ? "" : "s"}`
      : "no recurring items",
  ].join(" · ");

  return (
    <div className="card mb-6">
      {/* ─── Single-line header: title + inline confidence chip ───
          Title, score and based-on facts share ONE row. No subtitle,
          no stacked elements - removes the vertical dead space the
          old layout left between the title block and the (then-tall)
          confidence chip on wide screens. */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <div className="t-section text-slate-100 shrink-0">Why this forecast?</div>
        <div className="flex items-center gap-3 shrink-0 rounded-md border border-line bg-ink-900/50 px-3 py-1.5">
          <div className="text-right">
            <div className="t-meta uppercase tracking-wide text-slate-500 leading-tight">Confidence</div>
            <div className={`t-section font-bold leading-tight ${TONE_TEXT[confTone]}`}>
              {confidencePct}%
            </div>
          </div>
          <div className="t-meta text-slate-400 leading-snug max-w-[220px]">
            {basedOn}
          </div>
        </div>
      </div>

      {/* ─── Driver cards (sorted by impact: warning → positive →
            neutral). The tone dot already encodes the WATCH /
            POSITIVE / NEUTRAL signal so the explicit label pill is
            redundant - dropped to reduce visual weight per card.
            Title sits at t-card (18px / semibold) so readers can
            scan; detail is t-body (16px) per the typography
            standard - analytical text never goes below 16px. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {drivers.map((d, i) => (
          <div
            key={i}
            className="rounded-lg border border-line bg-ink-900/40 px-4 py-3"
          >
            <div className="flex items-center gap-2 min-w-0 mb-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${TONE_DOT[d.impact]}`} />
              <div className={`t-card truncate ${TONE_TEXT[d.impact]}`}>{d.title}</div>
            </div>
            <div className="t-body text-slate-300">{d.detail}</div>
          </div>
        ))}
      </div>

      {/* ─── Layer 2: detailed analysis (collapsed) ────────────── */}
      <div className="mt-4 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="t-meta text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5"
        >
          <span className="inline-block w-3 text-center">{detailsOpen ? "▾" : "▸"}</span>
          {detailsOpen ? "Hide detailed analysis" : "View detailed analysis"}
        </button>

        {detailsOpen ? (
          <div className="mt-4 space-y-5">
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
                the full chain of reasoning. Shared NarrativeBody so
                the typography + paragraph-split matches the dashboard. */}
            {result.explanationText ? (
              <NarrativeBody text={result.explanationText} size="md" />
            ) : null}

            {result.recurringDetected.length > 0 ? (
              <div>
                <div className="t-meta uppercase tracking-wide text-slate-400 mb-2">Recurring items projected forward</div>
                <ul className="t-body text-slate-300 space-y-1.5">
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
                <div className="t-meta uppercase tracking-wide text-slate-400 mb-2">Outliers excluded from trend</div>
                <ul className="t-body text-slate-300 space-y-1.5">
                  {result.outliersDetected.slice(0, 6).map((o, i) => (
                    <li key={i}>{o.reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.excludedRecords.length > 0 ? (
              <div>
                <div className="t-meta uppercase tracking-wide text-slate-400 mb-2">Excluded records</div>
                <ul className="t-body text-slate-300 space-y-1.5">
                  {result.excludedRecords.map((e, i) => (
                    <li key={i}>{e.count} {e.reason.toLowerCase()}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.seasonalityNote ? (
              <div className="t-body text-slate-400">{result.seasonalityNote}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Warnings always rendered (outside Layer 3) because they're
          risks the user should see without an extra click. Bumped
          from meta (13px) to body (16px) per the typography standard
          - warnings are analytical text, not labels. */}
      {result.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-warn/30 bg-warn/10 p-4">
          <div className="t-meta uppercase tracking-wide text-warn mb-2">Warnings</div>
          <ul className="t-body text-slate-200 space-y-1.5">
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
      <div className="t-meta uppercase tracking-wide text-slate-400">{label}</div>
      <div className="t-body text-slate-100 mt-1 font-semibold">{value}</div>
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
      ? `Strong history - ${monthsWithData} of ${monthsResolved} months populated.`
      : coverage >= 0.6
      ? `Partial history - ${monthsWithData} of ${monthsResolved} months populated.`
      : `Limited history - only ${monthsWithData} of ${monthsResolved} months populated.`,
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
      ? "Stable month-to-month results - low variation."
      : result.confidence === "medium"
      ? `Moderate variation across the baseline${expenseOutliers + incomeOutliers > 0 ? `, ${expenseOutliers + incomeOutliers} month${expenseOutliers + incomeOutliers === 1 ? "" : "s"} flagged` : ""}.`
      : `High volatility - ${volatility.toLowerCase()} variation in the baseline.`,
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
      detail: "No recurring patterns detected - forecast leans on the trailing average.",
    });
  }

  // ── Seasonality ──
  drivers.push({
    title: "Seasonality",
    impact: result.seasonalityApplied ? "positive" : "neutral",
    detail: result.seasonalityApplied
      ? "Seasonal pattern detected and applied to upcoming months."
      : "No seasonal pattern applied - not enough history yet, or trend is flat.",
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
        ? `${result.scenariosApplied} scenario assumptions stacked - uncertainty grows.`
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
