// Single source of truth for every financial aggregation in Tweaxly.
//
// Hard rule: every screen that displays a calculated money amount
// must source the number from one of the functions re-exported here.
// New screens MUST NOT introduce their own ad-hoc reduce/sum logic
// over the Transaction table.
//
// The functions themselves live in their own modules (period.ts,
// metrics.ts, etc.) — this file is the discoverable barrel + the
// place to document the contract.
//
// Filtering contract (single rule):
//   Every aggregator filters by `accountingMonth` (or
//   transactionDate for sub-monthly windows) only. createdAt /
//   updatedAt / uploadedAt are NEVER used for financial bucketing.
//   See docs/financial-date-rule.md for the canonical statement.

// ── Period aggregates ────────────────────────────────────────────────
export {
  buildMonthSnapshot,       // sum a single accountingMonth
  trailingMonthsSummary,    // N most recent months
  listAccountingMonths,     // ordered list of YMs with data
} from "./metrics";

export {
  buildPeriodAggregate,     // sum a YM range — the workhorse for
                            // dashboard tiles + reports
  resolveDashboardRange,    // YM resolution for dashboard / report
  resolveCompareRange,
} from "./period";

// ── Forecast layer ────────────────────────────────────────────────────
// Forecasts live in a separate sandbox; assumptions never mutate the
// transactions store. See docs/financial-data-integrity.md §14.
export {
  loadBaseline,
  runScenario,
  summarizeForecast,
} from "./forecast";

// ── Currency conversion ───────────────────────────────────────────────
export { getRate, convertAmount, setManualRate } from "./fx";
export {
  breakdownFromTxns,
  breakdownFromDb,
} from "./currencyBreakdown";

// ── Money primitives ─────────────────────────────────────────────────
export { roundMoney, sumMoney, multiplyMoney, divideMoney, moneyEqual, isZero } from "./money";

// ── Display formatters ───────────────────────────────────────────────
export { fmtMoney, fmtMoneyWhole, fmtMoneyExact, fmtMoneySigned, fmtPct } from "./format";
