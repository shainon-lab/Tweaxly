# Forecasting Engine

How Tweaxly projects future months and explains every projected number. The engine is the single source of truth for any screen displaying a forecasted value (forecast tab, dashboard projection tile, signals quoting forward figures, AI consultation context).

---

## Philosophy

Every forecasted number is explainable. The user always knows:
- Which historical period was used
- Which growth trend was detected
- Which recurring items were projected forward
- Whether seasonality was applied
- Which scenario assumptions affected the result
- What confidence level applies

The engine refuses to forecast when there isn't enough validated data instead of producing low-quality projections.

## Module map

| File | Role |
|------|------|
| [`src/lib/forecastEngine.ts`](../src/lib/forecastEngine.ts) | Centralized engine entry. Resolves baseline, gates on readiness, runs trend + scenarios, returns structured result. |
| [`src/lib/forecast.ts`](../src/lib/forecast.ts) | Underlying math: `loadBaseline`, `runScenario`, `summarizeForecast`. Wrapped by the engine. |
| [`src/lib/metrics.ts`](../src/lib/metrics.ts) | `buildMonthSnapshot` — financial-date-filtered monthly aggregates. |
| [`src/lib/dataConfidence.ts`](../src/lib/dataConfidence.ts) | 0-100 data-quality score fed into the engine's forecast confidence. |

## Public API

```ts
const result = await buildForecastEngine({
  businessId,
  baselineId:    "last_12m",     // | "recommended" | "last_quarter" | "last_6m" | "last_18m" | "last_24m" | "custom"
  horizonId:     "12m",          // | "3m" | "6m" | "24m"
  customFromYM:  "2024-01",      // optional, only with baselineId="custom"
  customToYM:    "2024-12",
  assumptions:   [...],          // optional scenario layer
});

if (!result.ok) {
  // result.reason: "not_enough_data" | "custom_range_too_short" |
  //                "custom_range_empty" | "custom_range_invalid"
  // result.message — already-formatted user-facing string
  // result.readiness — current state to surface in the UI
  return showBlockedState(result);
}

// result.projectedMonths, .baselinePeriod, .confidence, .explanationText,
// .warnings, .recurringDetected, .outliersDetected, .seasonalityApplied,
// .excludedRecords, .scenariosApplied, .assumptions
```

## Readiness states

`evaluateReadiness(businessId)` returns the current state based on the span of validated historical data:

| Days of data | State | User-facing label | Default baseline |
|--------------|-------|-------------------|------------------|
| < 90 | `disabled` | "Not enough data" | — (forecast blocked) |
| 90 to < 6 mo | `basic` | "Basic Forecast — Based on your last quarter of validated business data." | `last_quarter` |
| 6 to < 12 mo | `standard` | "Standard Forecast — Based on your last 6 months of validated business data." | `last_6m` |
| 12 to < 18 mo | `reliable` | "Reliable Forecast — Based on your last 12 months of validated business data." | `last_12m` |
| 18+ mo | `advanced` | "Advanced Forecast — Based on long-term historical business patterns." | `last_12m` |

**The recommended default for 24+ month accounts is still `last_12m`, not `last_24m`.** Older data may be less relevant — the user can opt into longer windows explicitly.

## Baseline options

```
recommended    — engine picks per readiness rules above
last_quarter   — 3 months
last_6m        — 6 months
last_12m       — 12 months
last_18m       — 18 months
last_24m       — 24 months
custom         — user-picked YM range, minimum 90 days, must contain data
```

**Removed by design:** "Last Month" is intentionally not an option. One month is not enough data for a reliable forecast.

## Calculation layers

1. **Historical baseline.** `loadBaseline(...)` aggregates `Transaction.amount` per `accountingMonth` in the resolved window. `transactionDate` (or its derived `accountingMonth`) is the financial date — never `createdAt`/`uploadedAt`. Cross-reference: [`docs/financial-date-rule.md`](./financial-date-rule.md).

2. **Trend.** `revenueGrowthMoM` and `expenseGrowthMoM` from `loadBaseline` are linear-fit relative slopes per month. The engine caps extrapolation at ±5%/month so long horizons don't compound into absurd numbers.

3. **Seasonality.**
   - < 12 months → not applied. Engine emits: *"Seasonality was not applied because there is not enough historical data (12+ months required)."*
   - ≥ 12 months → `seasonalityApplied = true`. (Note: current implementation surfaces the flag in the explanation but does not yet modulate per-month projections; the surface is in place for the per-month seasonality multiplier when added.)

4. **Outlier detection.** Z-score over monthly income and expense series within the baseline window. Months > 2σ from the mean are flagged in `outliersDetected` and surfaced in the explanation panel. (Outlier-aware trend recomputation is a follow-up; today they're surfaced for user awareness.)

5. **Recurring patterns.** Every active `ManualEntry` with `frequency in ("monthly", "quarterly", "yearly")` is listed in `recurringDetected` with its monthly-equivalent amount. The forecast engine respects them as the recurring base. Future expansion: detect recurring vendors automatically from transaction history.

6. **Scenarios.** Stay separate from the baseline. `runScenario(baseline, horizon, [])` is the baseline projection; `runScenario(baseline, horizon, assumptions)` is the scenario layer. Both surfaced per month in `projectedMonths` so the UI can show baseline + scenario side by side. Scenarios NEVER mutate historical data.

## Confidence score

Derived from:
- Data-quality components (history depth, categorization, dedup, date integrity, FX integrity, freshness — see `dataConfidence.ts`).
- Forecast-specific lens caps (< 6 months → max 55, < 12 months → max 75).
- Outlier count (each outlier subtracts up to 5 points, capped at 3 deductions).
- Scenario complexity (> 3 stacked assumptions subtracts 5).

Returned as `{ confidence: "low" | "medium" | "high", confidenceScore: 0–100 }`. When `confidence === "low"`, the engine prepends to `warnings`: *"This forecast should be treated as directional only."*

## Guardrails enforced

- **No forecast from one month** — readiness `disabled` until ≥ 90 days.
- **No "Last Month" option** — not in `BASELINE_OPTIONS`.
- **Incomplete current month** — if a custom range's `toYM` is today's month, a warning prepends: *"The current month is still in progress and may distort the forecast."*
- **Future-dated baselines** — silently clamped to last completed month.
- **System timestamps never used** — every aggregator filters by `accountingMonth` (derived from `transactionDate`).
- **Scenarios never mutate actuals** — `ForecastAssumption` and the runtime scenario layer are read-only over the Transaction store.
- **Invalid/missing-date rows excluded** — surfaced in `excludedRecords` so the user knows they exist.

## UI surface

[`src/app/(app)/forecast/page.tsx`](../src/app/(app)/forecast/page.tsx) renders:

- [`<ForecastReadinessBanner>`](../src/app/(app)/forecast/ForecastReadinessBanner.tsx) — one-line state label + description.
- [`<ForecastExplanationPanel>`](../src/app/(app)/forecast/ForecastExplanationPanel.tsx) — "Why this forecast?" body: explanation paragraph, baseline range, recurring items, outliers excluded, excluded-record audit, seasonality note, warnings, confidence pill.
- The existing KPI tiles + chart + month-by-month table continue to render the legacy `runScenario` output. The engine output is the explanation layer above; the underlying numbers are computed by the same `loadBaseline` / `runScenario` it wraps, so the numbers shown match the engine's explanation.

When the engine returns `ok: false`, the page renders an inline blocked message in place of the explanation panel with the engine's structured `message`.

## Acceptance tests (per spec)

| Test | Expected |
|------|---|
| < 90 days of data | `evaluateReadiness` → `state: "disabled"`. UI shows "Not enough data" banner; engine returns `{ ok: false, reason: "not_enough_data" }`. |
| "Last Month" baseline | Not in `BASELINE_OPTIONS`. |
| Custom range < 90 days | `buildForecastEngine` returns `{ ok: false, reason: "custom_range_too_short" }` with the spec's exact message. |
| Historical date filtering | Per `docs/financial-date-rule.md` — transactions are filtered by `accountingMonth` only. A 20.04.2024 expense affects baselines that include 2024-04 and nothing else. |
| 18 months available | Default baseline still `last_12m` (per spec); `last_18m` available as an explicit option. |
| Scenario isolation | `result.assumptions` is a separate field; `result.projectedMonths` exposes baselineX / scenarioX columns side by side. Historical Transactions are untouched. |
| Explanation required | Every successful engine result includes `explanationText` plus the structured fields (`baselinePeriod`, `recurringDetected`, `outliersDetected`, `seasonalityNote`, `confidence`). |

## Status

| Spec section | Status |
|---|---|
| §1 Philosophy / explainable | ✅ explanation panel mandatory, structured fields surfaced |
| §2 Baseline options | ✅ implemented with "Last Month" omitted |
| §3 Default selection logic | ✅ in `evaluateReadiness` |
| §4 Custom range rules | ✅ 90-day minimum + empty-window guard |
| §5 Readiness states | ✅ 5 states wired into UI banner |
| §6.1 Historical baseline | ✅ via `loadBaseline` |
| §6.2 Trend calculation | ✅ MoM linear fit, capped extrapolation |
| §6.3 Seasonality | ✅ 12-month gate enforced; per-month multiplier applied to projected months (capped ±25%); strongest seasonal month surfaced in the note |
| §6.4 Outlier detection | ✅ z-score detection + outlier-aware trend refit (growth slopes recomputed after dropping flagged months) |
| §6.5 Recurring pattern detection | ✅ explicit ManualEntry recurring AND auto-detection from transaction history (vendor + amount-tightness + cadence clustering) |
| §6.6 Scenario adjustments | ✅ separate layer, scenarios never mutate actuals |
| §7 Forecast output | ✅ structured result returned + rendered |
| §8 "Why this forecast?" | ✅ mandatory panel |
| §9 Confidence score | ✅ low/medium/high + 0-100 |
| §10 Data quality | ✅ via `dataConfidence.ts` |
| §11 Forecast vs Actual | ⏳ deferred (needs forecast-snapshot schema to record what was projected, then compare to actuals as months close) |
| §12 UI baseline + horizon selectors | ✅ ForecastSetup now exposes Recommended / Last Quarter / 6m / 12m / 18m / 24m / YTD / Last year / Custom. Default is Recommended (engine picks per readiness rules). Custom-range 90-day guard surfaces via engine result. |
| §13 Guardrails | ✅ enforced |
| §14 Incomplete current month | ✅ warning surfaces |
| §15 Acceptance tests | ✅ all pass against the engine |
| §16 Centralized engine | ✅ `forecastEngine.ts` is the single entry point |

## Follow-ups

In priority order:

1. **Forecast vs Actual variance UI** (spec §11) — needs a `ForecastSnapshot` model so each forecast run is persisted with its projected months. As real months close, render side-by-side forecast vs actual deltas. Multi-day initiative — covers schema, snapshot capture (likely at "Apply" time on the setup row), and the comparison UI on /forecast.
2. **Outlier-aware confidence weighting** — beyond the current trend refit, lower confidence further when the dropped outliers represent > 20% of the baseline window (signals fundamental data instability).
3. **Recurring detection: extend to category-level cadence** — vendor clustering catches most patterns, but a small business with sparse vendor data still benefits from "category X averages $N every month" detection.
4. **Seasonality: per-category multipliers** — currently revenue and expenses get aggregate multipliers. A higher-fidelity pass would compute one per category (so December's marketing spike doesn't drag down January's payroll projection).
5. **AI confidence-pass propagation** — the engine surfaces confidence in the AI context; a future pass should also annotate per-tile signals (e.g. "Marketing spend up $4,200 — low-confidence projection") so the dashboard signals UI carries the same hedging.
