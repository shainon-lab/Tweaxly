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

- Dashboard / Quick Overview: **Revenue**, **Expenses**, **Net profit** tiles in [src/app/(app)/dashboard/page.tsx](../src/app/(app)/dashboard/page.tsx). Each tile passes the breakdown computed via three parallel `breakdownFromDb` calls for the visible range.

## Sweep — sites that still need it

These call sites currently render aggregated money via `fmtMoneyWhole()` directly and should be migrated to `MoneyAmountWithCurrencyBreakdown` in follow-up PRs. None of them break today — they just don't disclose multi-currency composition.

### Dashboard (`src/app/(app)/dashboard/page.tsx`)
- Normalized profit tile
- Fixed / Variable / Payroll / Marketing / Fees / Taxes / One-time tiles
- P&L breakdown comparison column

### Forecast (`src/app/(app)/forecast/`)
- Forecast overview KPIs
- Month-by-month projection totals
- Scenario impact totals
- ForecastChart series (chart axes show converted base values; the per-month tooltips should disclose composition when applicable)

### Data Flow (`src/app/(app)/data-flow/`)
- Per-category row totals
- Per-month column totals
- Grand total cell

### Transactions (`src/app/(app)/transactions/`)
- Period totals at the top of the table
- Group-by-category subtotals

### Workforce (`src/app/(app)/workforce/`)
- Total payroll cost
- Per-employee loaded cost
- Payroll chart series

### Insights / Signals
- Any signal that quotes an aggregated number ("Marketing spend up $4,200")
- Recommendations referencing totals

### Reports / Exports
- P&L export
- Category-detail drill-downs

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
