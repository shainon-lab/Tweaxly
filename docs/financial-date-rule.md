# Financial-Date Rule

How every financial total in Tweaxly is bucketed against a date.

---

## The rule

**Every Transaction has exactly one financial date — `transactionDate` — and exactly one accounting bucket — `accountingMonth` (YYYY-MM derived from `transactionDate`). All reports, dashboards, KPIs, charts, forecasts, insights, signals, and the AI consultation context filter by `accountingMonth` (or `transactionDate` for sub-monthly windows). System metadata (`createdAt`, `uploadedAt`) is never used as a financial date.**

This applies uniformly to every data source — CSV imports, manual entries, future integrations.

## Per-source implementation

### CSV / file uploads
[`src/lib/normalize.ts`](../src/lib/normalize.ts) → `normalizeRow`:
- `parseDate(rawDate)` is required. If the row has no parseable date, the row is dropped — never imported with a fallback to today.
- `accountingMonth = dateToYM(transactionDate)`. The parsed date is the single source of truth.

The `forceAccountingMonth` option exists only for monthly-summary uploads where the user explicitly declares the period the file represents (e.g., "this CSV is May 2024's P&L"). It is opt-in and visible in the UI.

### Manual entries
[`src/lib/manualEntries.ts`](../src/lib/manualEntries.ts) → `createManualEntryAndMaterialize`:

| Frequency | endDate | Materialized transactions |
|-----------|---------|----------------------------|
| `one_time` | n/a | One Transaction at `startDate`. |
| recurring (`monthly` / `quarterly` / `yearly`) | provided | One Transaction per occurrence from `startDate` to `MIN(endDate, today)`. |
| recurring | omitted | **One Transaction at `startDate` only.** The forecast engine still projects the recurring expense forward from trailing-month averages. |

The "recurring with no endDate" rule is the important one: it explicitly does **not** auto-backfill from `startDate` to today. Earlier the materializer fanned recurring entries to the current month — a one-shot historical expense entered with the default `monthly` frequency would silently materialize as N transactions across N months, including the current month. That behaviour is removed.

If you genuinely want N monthly transactions in between two dates, set an explicit `endDate`.

### Form defaults
The manual-entry form defaults `frequency` to `one_time`. The most common case — a single historical or current expense/income — now does what the user expects. Recurring is explicit opt-in.

## Filtering rules (every report)

Every aggregation goes through one of:

- `buildMonthSnapshot(businessId, ym)` — filters by `accountingMonth: ym`.
- `buildPeriodAggregate(businessId, fromYM, toYM)` — filters by `accountingMonth: { gte: fromYM, lte: toYM }`.
- `buildDataFlowSummary` / `buildDataFlow` — same `accountingMonth` range filter.
- `trailingMonthsSummary` — `accountingMonth` range.

No path uses `createdAt`, `updatedAt`, or upload-batch timestamps for financial bucketing. Those columns are audit metadata only.

## Acceptance test

Per the user's spec:

1. Today's month is May 2026.
2. Add a manual expense — Amount 1,000, Type Expense, **Start Date 20.04.2024**, Frequency `one_time` (the new default).
3. Open Overview for May 2026 → the 1,000 expense **does not** appear.
4. Open Overview for April 2024 → the 1,000 expense **does** appear.
5. Open Overview for Q2 2024 → the 1,000 expense **does** appear (April is in Q2).
6. Open Overview for Year 2024 → the 1,000 expense **does** appear.

This is the result of two combined changes:
- The materializer creates exactly one Transaction at `transactionDate = 2024-04-20`, `accountingMonth = "2024-04"`.
- Every report's filter is `accountingMonth: { gte, lte }` against the user-selected period.

## What about data created before this fix?

Manual entries created before this release with the legacy "monthly + no endDate" behaviour have already materialized N Transactions across N months. The fix does not retroactively delete them — that would touch user data without consent.

To clean up an over-materialized entry: delete the ManualEntry row (Manual Data → Existing manual entries → delete). The `Transaction.manualEntryId` foreign key has `ON DELETE CASCADE`, so all materialized child Transactions are removed in the same operation. The user can then re-create the entry as `one_time` (or with an explicit endDate).

## Validation requirements

| Source | Required date | Validation |
|--------|---------------|------------|
| Manual entry | `startDate` | Server validates `new Date(body.startDate)` is a finite date; missing/invalid → 400 with `"startDate is required"`. |
| Manual entry (recurring) | `endDate` optional | If provided, must be ≥ `startDate`. Server validates and 400s. |
| CSV import | parsed date column | `parseDate(raw)` returns `null` for unparseable inputs; null rows are excluded from import. Future enhancement: surface the count of dropped rows in the preview/commit UI so the user knows which rows were skipped. |
| Integrations (future) | provider's transaction date | The integration adapter must extract the date from the source payload and map to `transactionDate`; rows without a date should be rejected or held as pending until the user resolves them. |

## What this rule explicitly excludes

- **System metadata** (`createdAt`, `updatedAt`, `uploadBatch.createdAt`) is never used for financial bucketing. It powers audit history and admin views only.
- **Future-dated transactions** are not currently allowed via the manual-entry form's recurring path — the materializer caps occurrences at today's end-of-month. (Future forecast occurrences are projected by the forecast engine, not materialized as Transactions.)
