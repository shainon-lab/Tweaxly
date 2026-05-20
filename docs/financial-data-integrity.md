# Financial Data Integrity — 18-Point Charter

How Tweaxly enforces (or commits to enforce) data integrity across every KPI, chart, report, forecast, signal, and AI response.

**Status legend:** ✅ done · 🟡 partial · ⏳ planned

---

## §1 — Single Source of Truth ✅

Every aggregator is re-exported from [`src/lib/calc.ts`](../src/lib/calc.ts):

- `buildMonthSnapshot`, `trailingMonthsSummary`, `listAccountingMonths` (from `metrics.ts`)
- `buildPeriodAggregate`, `resolvePeriod` (from `period.ts`)
- `loadBaseline`, `runScenario`, `summarizeForecast` (from `forecast.ts`)
- `getRate`, `convertAmount`, `setManualRate` (from `fx.ts`)
- `breakdownFromTxns`, `breakdownFromDb` (from `currencyBreakdown.ts`)
- `roundMoney`, `sumMoney`, `multiplyMoney`, `divideMoney`, `moneyEqual`, `isZero` (from `money.ts`)
- `fmtMoney`, `fmtMoneyWhole`, `fmtMoneyExact`, `fmtPct` (from `format.ts`)

**Rule:** new screens MUST import from `calc.ts` instead of writing their own `reduce/sum` over the Transaction table. Code review should reject duplicate aggregation logic.

## §2 — Strict Date Integrity ✅

Documented in [`docs/financial-date-rule.md`](./financial-date-rule.md). Summary:

- Every `Transaction` has exactly one `transactionDate` and one `accountingMonth`.
- All reports filter by `accountingMonth` (or `transactionDate` for sub-monthly windows).
- `createdAt`, `updatedAt`, `uploadBatch.createdAt` are NEVER used for financial bucketing.
- Manual entries without an explicit `endDate` only materialize the start occurrence — no silent fan-out.
- CSV imports drop rows without a parseable date instead of falling back to today.

## §3 — Currency Integrity & Historical FX Rates ✅

Documented in [`docs/multi-currency.md`](./multi-currency.md). Every Transaction stores:

- `originalAmount`, `originalCurrency`
- `baseCurrency`, `exchangeRate`, `exchangeRateDate`, `exchangeRateSource`, `conversionMethod`
- `rateFetchStatus` (`success` | `missing` | `failed` | `manual` | `same_currency` | `needs_review`)

Historical rates come from Frankfurter (ECB-sourced) for the transaction date. Rates are cached in `ExchangeRate` keyed `(base, quote, rateDate, source)`. Manual overrides win.

## §4 — Immutable Historical Data 🟡

- Per-transaction FX snapshots are immutable by convention (no auto-recalc on rate provider changes — see `docs/multi-currency.md` "Rules").
- Bumping `MARKETING_POLICY_VERSION` / `CONSENT_VERSION` re-prompts users instead of mutating their records.
- ⏳ **Deferred:** versioned snapshots of any backfill operation, with `recalculationTimestamp` + who/when on `AuditLog`. Today AuditLog records administrative actions; we do not log every UPDATE to a Transaction row.

## §5 — Deduplication Engine 🟡

- `DuplicateGroup` table + `findDuplicateCandidates` already detect candidates on import. CSV uploads surface flagged rows in the preview/commit flow.
- ⏳ **Pending sweep:** strengthen the similarity heuristic (currently: amount + date proximity); add vendor + reference-number components per the charter.

## §6 — Transaction Identity ✅

Every `Transaction` row carries:
- `id` (cuid)
- `externalId` (source's row id when available)
- `source` (`bank` / `credit_card` / `manual` / `payroll` / ...)
- `uploadBatchId` (FK to `UploadBatch`)
- `originalSourceFile` (filename for CSVs)

## §7 — Validation Before Save ✅

[`src/lib/validateTransaction.ts`](../src/lib/validateTransaction.ts) — `validateTransaction(input)` returns `{ valid, issues, normalized }` with structured `ValidationIssue` codes:

- `missing_amount` / `invalid_amount` / `zero_amount`
- `missing_date` / `invalid_date` / `future_date`
- `missing_currency` / `invalid_currency`
- `missing_type` / `invalid_type`

Use this on every write path (manual entries, CSV import, future integrations). The `/api/manual-entries` route already enforces start-date + amount + frequency + category presence; ⏳ a follow-up will route all paths through `validateTransaction` for one consistent error shape.

## §8 — Reconciliation Layer ✅

[`src/lib/reconcile.ts`](../src/lib/reconcile.ts) — `reconcileMonth` and `reconcileAllMonths` cross-check the snapshot totals against the raw transactions. Findings flow to the Admin → Data Health page. Checks today:

- `income == Σ revenue-kind categories`
- `netProfit == income − expenses` (identity)
- `amount == originalAmount × exchangeRate` (FX integrity)

⏳ Add: `forecast baseline == trailing actuals` once the forecast engine exposes its baseline aggregates.

## §9 — AI Must Use Filtered Data Only 🟡

[`src/lib/advisor.ts`](../src/lib/advisor.ts) builds a `BusinessContext` anchored on a specific YM and forwards trailing windows around it. The AI prompt is told explicitly which period its data covers. The product UI doesn't yet have a global "selected period" that the consultation tab inherits — ⏳ planned alongside the consultation UI refactor.

## §10 — Timezone Consistency 🟡

- Materializer and dateToYM use `Date.UTC(...)` for date math.
- CSV importer reads dates and produces UTC-anchored `transactionDate` rows.
- ⏳ **Pending sweep:** audit every UI-facing date renderer for timezone correctness (especially the picker boundaries — `new Date("2024-04-20")` interprets as UTC midnight which can roll back a day in negative-offset timezones).

## §11 — Locked Financial Periods ⏳

Planned. Will require a `PeriodLock` model + middleware on every Transaction-mutating route. Out of scope for this pass.

## §12 — Audit Trail System 🟡

`AuditLog` model + [`src/lib/audit.ts`](../src/lib/audit.ts) helper exist. Currently used for:
- `impersonation.*`
- `account.status_change`
- `consent.signup` / `consent.marketing_update`

⏳ **Expansion needed:** every Transaction mutation (manual edit, category change, delete, bulk update, override) should write an AuditLog row with `old_value` + `new_value`. Today most paths log nothing.

## §13 — Missing Data Detection 🟡

The dashboard signals engine and `dataConfidence` warnings cover:
- gaps in recent uploads (freshness component)
- partial uploads (per-month row counts)
- uncategorized %
- duplicates flagged
- FX issues

⏳ "Sudden category disappearance" + "broken integrations" detectors arrive once the integration layer lands.

## §14 — Forecast Data Isolation ✅

`ForecastAssumption` and `ForecastItem` are separate tables. The forecast engine reads from `Transaction` (actuals) but never writes back. Scenario layers are computed on the fly from assumptions — never persisted as transactions.

## §15 — Financial Precision Rules 🟡

[`src/lib/money.ts`](../src/lib/money.ts) exports `roundMoney` (banker's rounding), `sumMoney`, `multiplyMoney`, `divideMoney`. New code should use these.

⏳ **Deferred:** Prisma schema currently uses `Float` for `Transaction.amount` and related columns. Migrating to `Decimal(15, 4)` is a major schema change requiring touching every aggregator. Tracked as a separate initiative — practical impact at SMB volume is minimal, but a true financial-grade platform should make the migration before commercial GA.

## §16 — Data Confidence Scoring ✅

[`src/lib/dataConfidence.ts`](../src/lib/dataConfidence.ts) computes a 0-100 score from six weighted components:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| History depth | 25% | Months of data (saturates at 6) |
| Categorization | 25% | % of transactions categorized |
| Duplicate hygiene | 15% | % of transactions NOT flagged duplicate |
| Date integrity | 10% | % of transactions with valid dates |
| FX integrity | 10% | % of transactions with resolved FX status |
| Freshness | 15% | Days since last upload (decay 0–90d) |

Returned as `{ score, band: low|medium|high, components, warnings }`. Surfaces on the Data Health admin page; ⏳ to-do: pipe the band into the AI prompt so the model hedges its language when the data is thin.

## §17 — Import Preview & Validation Layer 🟡

The CSV upload flow already has a preview step (`/api/upload/preview` → `/api/upload/commit`) that surfaces detected columns, currencies, and duplicate candidates. ⏳ Pending: route preview rows through `validateTransaction` so the user sees a structured "invalid rows" list before commit.

## §18 — Health Monitoring Dashboard ✅

[`/admin/data-health`](../src/app/admin/data-health/page.tsx) renders:
- Global counters (businesses, transactions, uncategorized, duplicates, FX issues).
- Per-business confidence breakdown + warnings.
- Per-month reconciliation findings (income vs categories / net identity / FX integrity).

Admin-only (gated by `requireAdminOrSuper`). Linked from the admin nav.

---

## Charter status

| # | Item | Status |
|---|------|--------|
| 1 | Single Source of Truth | ✅ |
| 2 | Strict Date Integrity | ✅ |
| 3 | Currency Integrity & Historical FX | ✅ |
| 4 | Immutable Historical Data | 🟡 |
| 5 | Deduplication Engine | 🟡 |
| 6 | Transaction Identity | ✅ |
| 7 | Validation Before Save | ✅ |
| 8 | Reconciliation Layer | ✅ |
| 9 | AI Uses Filtered Data Only | 🟡 |
| 10 | Timezone Consistency | 🟡 |
| 11 | Locked Financial Periods | ⏳ |
| 12 | Audit Trail System | 🟡 |
| 13 | Missing Data Detection | 🟡 |
| 14 | Forecast Data Isolation | ✅ |
| 15 | Financial Precision Rules | 🟡 |
| 16 | Data Confidence Scoring | ✅ |
| 17 | Import Preview & Validation | 🟡 |
| 18 | Health Monitoring Dashboard | ✅ |

## Roadmap for the 🟡 / ⏳ items

In suggested priority order:

1. **Prisma Float → Decimal migration (§15).** The largest single integrity uplift. Migration must touch every `amount` column, every aggregator, every chart adapter. Best done as a dedicated initiative with regression tests.
2. **Period locking (§11).** Schema + mutation-guard middleware. Required before we serve accountants.
3. **AuditLog on every Transaction mutation (§12).** Add a `tx-mutation` helper that wraps `prisma.transaction.update/delete` and writes an AuditLog row in the same transaction.
4. **Strengthen deduplication (§5).** Add vendor + reference-number similarity components.
5. **Timezone audit (§10).** Sweep every `new Date(...)` site for offset hazards.
6. **AI filter propagation (§9).** Tie the consultation context to whatever period the user is viewing in the dashboard.
7. **Apply `validateTransaction` to import preview (§17)** — surface row-level rejections in the UI before commit.
8. **Versioned historical snapshots (§4)** — record before/after on any backfill or recalc operation.
