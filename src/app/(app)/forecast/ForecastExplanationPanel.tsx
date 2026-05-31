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
import ShareAnalysisButton from "@/components/sharing/ShareAnalysisButton";
import { buildConfidenceMeta } from "./confidenceMeta";

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
  canShareAnalyses = false,
  currentPlan = "free",
  sourceId,
  kpiSlot,
}: {
  result: ForecastResult;
  currency: string;
  // Pro entitlement passthrough. Defaults are conservative so other
  // callers that don't pass them get the upgrade card on click.
  canShareAnalyses?: boolean;
  currentPlan?: string;
  // Identifier for the originating forecast (e.g. a saved scenario id
  // or a deterministic hash of the baseline window). Used as
  // SharedAnalysis.sourceId for back-tracing; defaults to a synthesised
  // string when the caller doesn't have one handy.
  sourceId?: string;
  // Optional KPI block (Projected Revenue / Expenses / Net Profit /
  // Avg Monthly Net) rendered at the bottom of the panel - the
  // numerical complement to the qualitative "why" drivers above.
  // Receives a ReactNode so the parent owns the layout grid and the
  // data wiring.
  kpiSlot?: React.ReactNode;
}) {
  // The driver cards (Anomalies / Data Coverage / etc.) are now the
  // collapsible "Why this forecast?" section - closed by default so
  // the always-visible detailed analysis above gets the immediate
  // attention. Click to reveal the qualitative drivers behind the
  // numerical analysis.
  const [whyOpen, setWhyOpen] = useState(false);

  // Sort drivers by impact (warnings first, then positives, then
  // neutral) so the most-important cards lead. Previously this was
  // done only for the now-removed "Main Drivers" bullet list - the
  // cards rendered in build order. Sorting them now lets us drop the
  // duplicate bullet list entirely.
  const drivers = [...buildDrivers(result)]
    .sort((a, b) => TONE_RANK[a.impact] - TONE_RANK[b.impact]);

  // basedOn is still needed for the share snapshot payload (the
  // public renderer reads it from the snapshot to redraw the
  // confidence chip on the shared page).
  const { basedOn } = buildConfidenceMeta(result);

  return (
    <div className="card mb-6">
      {/* ─── Header row: title on the left, Share button alone on the
          right. The confidence chip used to sit here too but now
          lives in the readiness banner above (both are "how
          trustworthy is this forecast" signals - belong together).
          The Share button is the only top-right control left, so it
          naturally anchors that corner. */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <div className="t-section text-slate-100 shrink-0">Forecast Analysis</div>
        {/* Share the structured explanation as a secure read-only
            link. Snapshot mirrors the ForecastResult fields the
            public renderer needs to redraw this panel - the engine
            narrative, drivers, baseline range, confidence, recurring
            items, outliers, seasonality note and warnings. */}
        <ShareAnalysisButton
          sourceType="forecast_explanation"
          sourceId={sourceId ?? `forecast:${result.baselinePeriod.fromYM}:${result.baselinePeriod.toYM}:h${result.forecastHorizon.months}`}
          snapshotContent={{
            title:              `Forecast - next ${result.forecastHorizon.months} months`,
            confidence:         result.confidence,
            confidenceScore:    result.confidenceScore,
            baselinePeriod:     result.baselinePeriod,
            forecastHorizon:    result.forecastHorizon,
            actualsUsed:        result.actualsUsed,
            scenariosApplied:   result.scenariosApplied,
            explanationText:    result.explanationText,
            drivers,
            recurringDetected:  result.recurringDetected,
            outliersDetected:   result.outliersDetected,
            excludedRecords:    result.excludedRecords,
            seasonalityApplied: result.seasonalityApplied,
            seasonalityNote:    result.seasonalityNote,
            warnings:           result.warnings,
            basedOn,
          }}
          snapshotMeta={{
            title: `Forecast explanation - next ${result.forecastHorizon.months} months`,
            currency,
            generatedAt: new Date().toISOString(),
          }}
          canShare={canShareAnalyses}
          currentPlan={currentPlan}
        />
      </div>

      {/* ─── Detailed analysis - always visible. This is the body
            of "Forecast Analysis": baseline window + horizon meta,
            the engine narrative, recurring items, outliers,
            excluded records and any seasonality note. Used to be
            collapsed behind a "View detailed analysis" toggle; user
            wants this open by default since it IS the analysis. */}
      <div className="space-y-5">
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

      {/* ─── "Why this forecast?" - collapsible, closed by default.
            Holds the driver cards (Anomalies / Data Coverage /
            Recurring Items / Seasonality / Volatility / Scenarios)
            which are the qualitative explanation for the numerical
            analysis above. Used to sit always-visible at the top of
            the panel; now hidden behind a click so the page leads
            with the analysis and reveals the "why" on demand.
            Tone dot already encodes the WATCH / POSITIVE / NEUTRAL
            signal so the explicit label pill is redundant - dropped
            to reduce visual weight per card. Title sits at t-card
            (18px / semibold); detail is t-body (16px). */}
      <div className="mt-4 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          className="t-meta text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5"
          aria-expanded={whyOpen}
        >
          <span className="inline-block w-3 text-center">{whyOpen ? "▾" : "▸"}</span>
          {whyOpen ? "Hide why this forecast" : "Why this forecast?"}
        </button>

        {whyOpen ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        ) : null}
      </div>

      {/* KPI slot - the projected revenue / expenses / net-profit /
          monthly-net tiles. The numerical bottom-line that pairs
          with the qualitative drivers and detailed analysis above.
          Parent owns the JSX so it can wire in `summary` / `view` /
          baseline-compare props without re-piping them through here.
          Warnings used to sit in this spot but are now rendered
          OUTSIDE the panel by the caller - they're risks, not part
          of "why this forecast". */}
      {kpiSlot ? <div className="mt-5">{kpiSlot}</div> : null}
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
