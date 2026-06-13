// Helpers for computing the currency-composition breakdown of an
// aggregated financial value. Server-side code (page.tsx files, API
// route handlers) groups transactions by originalCurrency and hands
// the result to MoneyAmountWithCurrencyBreakdown so the UI can decide
// whether to render a plain number or a number-plus-tooltip.
//
// Conventions:
//   - All sums are signed (income > 0, expense < 0) by default. Pass
//     `absolute: true` to sum |amount| instead - useful for "total
//     expenses" tiles where we want the magnitude.
//   - originalAmount + originalCurrency are the source of truth for
//     the original column. Pre-multi-currency rows where these are
//     null fall back to amount + currency.
//   - baseCurrency on the row wins over the business-level base
//     because it captures what the base was AT IMPORT TIME - a future
//     base-currency change does not retroactively alter snapshots.

import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { normalizeCurrency } from "./currency";
import type { CurrencyBreakdownItem } from "@/components/MoneyAmountWithCurrencyBreakdown";

// Subset of Transaction fields the breakdown helpers need. Keeping
// this narrow lets callers select only what they need from Prisma.
export type BreakdownTxn = {
  amount:           number;
  currency:         string;
  originalAmount:   number | null;
  originalCurrency: string | null;
  baseCurrency:     string | null;
  exchangeRate:     number | null;
  conversionMethod: string | null;
};

export interface BreakdownResult {
  convertedTotal:        number;
  baseCurrency:          string;
  currencyBreakdown:     CurrencyBreakdownItem[];
  hasMultipleCurrencies: boolean;
  conversionMethod?:     string;
}

// Compute a breakdown from an in-memory list of transactions. Used by
// SSR pages that already loaded the rows for other reasons (so we
// don't double-query the DB).
export function breakdownFromTxns(
  txns: BreakdownTxn[],
  businessBaseCurrency: string,
  opts: { absolute?: boolean } = {},
): BreakdownResult {
  const base = businessBaseCurrency.toUpperCase();
  const sign = opts.absolute ? (v: number) => Math.abs(v) : (v: number) => v;

  // Group by original currency.
  const groups = new Map<string, { original: number; converted: number; method?: string }>();
  let convertedTotal = 0;

  for (const t of txns) {
    const oc   = normalizeCurrency(t.originalCurrency ?? t.currency ?? base, {
      fallback: (t.originalCurrency ?? t.currency ?? base).toUpperCase(),
    });
    const oamt = t.originalAmount ?? t.amount;
    const cv   = sign(t.amount);
    convertedTotal += cv;
    const g = groups.get(oc) ?? { original: 0, converted: 0, method: t.conversionMethod ?? undefined };
    g.original  += sign(oamt);
    g.converted += cv;
    // Keep the most informative method we've seen. If different rows
    // used different methods we still report "daily_historical" as the
    // dominant unless one of them was manual_fixed.
    if (t.conversionMethod && t.conversionMethod !== "none" && t.conversionMethod !== "same_currency") {
      g.method = t.conversionMethod;
    }
    groups.set(oc, g);
  }

  const items: CurrencyBreakdownItem[] = Array.from(groups.entries())
    .map(([currency, g]) => ({
      originalCurrency:     currency,
      originalAmountTotal:  g.original,
      convertedAmountTotal: g.converted,
      baseCurrency:         base,
      conversionMethod:     g.method,
    }))
    // Largest contributor first.
    .sort((a, b) => Math.abs(b.convertedAmountTotal) - Math.abs(a.convertedAmountTotal));

  const nonBaseCount = items.filter((i) => i.originalCurrency !== base).length;
  const hasMultiple = nonBaseCount > 0;

  // Dominant method across the breakdown.
  const method = items.find((i) => i.conversionMethod)?.conversionMethod;

  return {
    convertedTotal,
    baseCurrency: base,
    currencyBreakdown: items,
    hasMultipleCurrencies: hasMultiple,
    conversionMethod: method,
  };
}

// Compute a breakdown directly from the database. The caller provides
// a `where` clause (any Prisma Transaction filter - businessId,
// accountingMonth, categoryId, transactionDate range, etc.) and we
// groupBy originalCurrency / currency.
//
// Returns the same shape as breakdownFromTxns so the call sites are
// interchangeable. Prefer this for KPIs and dashboards that don't need
// the raw rows.
export async function breakdownFromDb(
  where: Prisma.TransactionWhereInput,
  businessBaseCurrency: string,
  opts: { absolute?: boolean } = {},
): Promise<BreakdownResult> {
  const base = businessBaseCurrency.toUpperCase();

  // SUM grouped by COALESCE(originalCurrency, currency) - handles both
  // new and legacy rows in one query.
  type Row = {
    currency:          string;
    original_total:    number | null;
    converted_total:   number | null;
    method:            string | null;
  };
  // Build the WHERE clause via the queryRaw param API to avoid SQL
  // injection while still letting Prisma compose the filter. The
  // easiest portable approach: pull the IDs we want via prisma.findMany
  // and then aggregate in-memory. For our scale (KPI grids, dashboards)
  // this is fine; we already pull these rows for other reasons.
  const rows = await prisma.transaction.findMany({
    where,
    select: {
      amount: true, currency: true,
      originalAmount: true, originalCurrency: true,
      baseCurrency: true, exchangeRate: true,
      conversionMethod: true,
    },
  });
  // Cast away the runtime narrowing; the row shape matches BreakdownTxn.
  return breakdownFromTxns(rows as BreakdownTxn[], base, opts);
}
