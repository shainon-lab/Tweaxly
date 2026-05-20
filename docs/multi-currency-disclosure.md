# Multi-Currency Composition Disclosure

How aggregated financial values across the app should disclose when they combine transactions from multiple original currencies.

This complements [`docs/multi-currency.md`](./multi-currency.md) — that document covers per-transaction conversion, this one covers aggregated-total disclosure.

---

## The primitive

[`src/components/MoneyAmountWithCurrencyBreakdown.tsx`](../src/components/MoneyAmountWithCurrencyBreakdown.tsx)

```tsx
<MoneyAmountWithCurrencyBreakdown
  convertedTotal={current.expenses}
  baseCurrency={business.currency}
  currencyBreakdown={[
    { originalCurrency: "USD", originalAmountTotal: 600000, convertedAmountTotal: 600000, baseCurrency: "USD" },
    { originalCurrency: "EUR", originalAmountTotal:  92000, convertedAmountTotal: 100000, baseCurrency: "USD", conversionMethod: "daily_historical" },
  ]}
  hasMultipleCurrencies // auto-derived if omitted
  conversionMethod="daily_historical"
  dateRange={{ from: "2026-01-01", to: "2026-05-19" }}
/>
```

Behaviour:
- **Single-currency aggregate**: renders identically to `fmtMoney(convertedTotal, baseCurrency)` — no badge, no tooltip.
- **Multi-currency aggregate**: shows the base-currency total with a small `i` chip; hover/click/focus opens a tooltip with the full breakdown, the conversion method, and the optional date range.

## The helper

[`src/lib/currencyBreakdown.ts`](../src/lib/currencyBreakdown.ts)

Two entry points:

- `breakdownFromTxns(txns, baseCurrency, { absolute? })` — pure function over an in-memory list of transactions. Use this when the page already loaded the rows for other reasons.
- `breakdownFromDb(where, baseCurrency, { absolute? })` — accepts any `Prisma.TransactionWhereInput` and returns the same shape. Use this for KPI tiles, dashboards, and pages that aggregate without needing raw rows.

Both return:

```ts
{
  convertedTotal: number;
  baseCurrency: string;
  currencyBreakdown: CurrencyBreakdownItem[];
  hasMultipleCurrencies: boolean;
  conversionMethod?: string;
}
```

`absolute: true` sums `Math.abs(amount)` — useful for "Expenses" tiles where the magnitude is the user-facing number.

## Wired in this release

### Dashboard / Quick Overview ([page](../src/app/(app)/dashboard/page.tsx))
Every headline tile now passes its breakdown:
- Revenue
- Expenses
- Net profit
- Normalized profit (shares the net bucket)
- Fixed expenses
- Variable expenses
- Payroll (txns + roster)
- Marketing
- Processing fees
- Taxes
- One-time costs

Breakdowns are computed in one pass via [`buildDashboardBreakdowns`](../src/lib/dashboardBreakdowns.ts) — a single DB query, then in-memory bucketing that mirrors the classifier in `metrics.ts`. Each tile gets the per-bucket breakdown matching the same membership rules the displayed total uses.

### Data Flow → Summary view ([page](../src/app/(app)/data-flow/page.tsx))
Headline tiles in the resolved window:
- Revenue
- Total outcome
- P&L

Each passes the date range explicitly so the tooltip shows the window the totals cover.

## Intentionally not wired

The following are documented as "no aggregate disclosure to make" rather than pending work:

### Forecast (`src/app/(app)/forecast/`)
Forecast values are forward projections extrapolated from base-currency aggregates. They have no underlying multi-currency composition to disclose — the projection itself is base-currency by construction. Per-month projection tooltips, scenario impact totals, and chart series fall in this category.

### Transactions (`src/app/(app)/transactions/`)
The transactions list renders per-row values. There is no aggregate header total on this page to retrofit. Per-row currency disclosure is the job of [`<CurrencyAmount>`](../src/components/CurrencyAmount.tsx) (a separate, already-built primitive). Wiring it row-by-row into the table is a row-level migration, not an aggregate-disclosure one.

### Workforce (`src/app/(app)/workforce/`)
Workforce totals are derived from the Employee roster (`grossMonthlySalary` × loaded-cost multiplier), not from transactions. The Employee model has no per-employee currency field — salaries are assumed to be in the business base currency. There is no multi-currency composition to disclose here. If the data model later grows a per-employee currency, this page would need wiring; today it does not.

## Pending — finer-grain (not yet wired)

These have an underlying multi-currency composition but rendering it requires either a deeper page refactor or a finer-grain breakdown:

### Data Flow → SummaryTable per-category subtotals ([component](../src/app/(app)/data-flow/SummaryTable.tsx))
The table shows per-category subtotals (one row per revenue category, one row per outcome category). Wiring each requires extending `buildDataFlowSummary` to return per-category breakdowns. The window-level totals are already wired in the headline tiles.

### Insights / Signals
Signal messages that embed an aggregated figure ("Marketing spend up $4,200") — the figure is hardcoded into the prose. To disclose composition, signals would need to emit a separate amount field instead of pre-formatted text. A larger refactor.

### Reports / Exports
P&L export and category drill-downs. Most are CSV exports where a tooltip wouldn't render — the breakdown could be added as additional columns in the export instead. Decide UX before wiring.

## Pattern for adding a new site

1. On the server-side page or API route, compute the breakdown alongside the existing aggregate:
   ```ts
   import { breakdownFromDb } from "@/lib/currencyBreakdown";
   const b = await breakdownFromDb(
     { businessId, accountingMonth: { gte, lte }, type: "income" },
     business.currency,
     { absolute: true },
   );
   ```
2. Render with the component instead of a plain `fmtMoney()` call:
   ```tsx
   <MoneyAmountWithCurrencyBreakdown
     convertedTotal={current.income}
     baseCurrency={business.currency}
     currencyBreakdown={b.currencyBreakdown}
     hasMultipleCurrencies={b.hasMultipleCurrencies}
     conversionMethod={b.conversionMethod}
   />
   ```
3. For single-currency businesses, the chip never appears — no UX regression.
4. For tiles whose `value` prop is `string`-only (legacy), refactor the prop to accept `React.ReactNode`. `Stat` already does; check before assuming.

## Hard rules (per the spec)

- Never hide that a total includes multiple currencies. The chip is non-optional once `hasMultipleCurrencies` is true.
- The main displayed amount is always in the business base currency.
- The tooltip always shows the per-currency breakdown plus the conversion method.
- The component is reusable — do not implement parallel breakdown rendering per screen.
