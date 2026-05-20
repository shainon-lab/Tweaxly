# Multi-Currency

How Tweaxly handles businesses whose transactions are in more than one currency while keeping dashboards, forecasts, and AI insights normalized to a single base currency.

---

## Principles

1. **Single base currency.** Every business has exactly one base currency (`Business.currency`). All reports, KPIs, charts, forecasts, and AI insights speak in that currency.
2. **Original currency preserved.** Each transaction stores both the original amount/currency and the converted amount in the base currency. Reports use the converted value; the tooltip on every amount shows the original.
3. **Historical rates only.** Conversion happens at import time using the historical rate from the transaction date. We never recalculate old transactions when the base currency changes or when rates move — the imported value is a permanent snapshot.
4. **No silent guessing.** If a rate is unavailable, the transaction is flagged `needs_review`; we do not invent a rate.
5. **Cache by default.** Every external rate lookup is persisted to a local table. A CSV with 5,000 EUR transactions on 30 distinct dates makes 30 outbound HTTP calls, not 5,000.

## Architecture

```
Transaction (one row per imported / manual entry)
├── amount               ← canonical, in base currency
├── currency             ← original (kept for backward compat)
├── originalAmount       ← pre-conversion (signed)
├── originalCurrency     ← ISO 4217 source currency
├── baseCurrency         ← business base at import time
├── exchangeRate         ← original → base multiplier
├── exchangeRateDate     ← which day's rate
├── exchangeRateSource   ← "frankfurter" | "ecb" | "manual" | "same_currency"
├── conversionMethod     ← "daily_historical" | "manual_fixed" | "none"
├── isConverted          ← true when origCcy != base
├── manualRateOverride   ← true after a manual rate is applied
├── manualRateNote
└── rateFetchStatus      ← "success" | "missing" | "failed" | "manual" | "same_currency" | "needs_review"

ExchangeRate (local cache + audit log)
├── baseCurrency
├── quoteCurrency
├── rate
├── rateDate             ← what the caller asked for
├── effectiveDate        ← what the provider rolled to (e.g. previous trading day)
├── source               ← "frankfurter" | "manual" | "ecb"
└── @@unique [base, quote, rateDate, source]
```

The service layer is [src/lib/fx.ts](../src/lib/fx.ts):

- `getRate(base, quote, date)` — same-currency short-circuit, cache lookup, Frankfurter fetch, cache write. Never throws.
- `convertAmount(amount, originalCurrency, baseCurrency, date)` — wraps `getRate` and returns the full set of fields the caller spreads into `prisma.transaction.create({ data: {...} })`.
- `setManualRate({ base, quote, rate, rateDate })` — persists a manual rate under `source="manual"`. Future lookups for the same pair/date prefer manual over Frankfurter.

## Provider: Frankfurter

- Endpoint pattern: `https://api.frankfurter.dev/v1/{date}?base={quote}&symbols={base}`.
- ECB-sourced. Free. No API key. Covers EUR plus all currencies the ECB reference rates publish against EUR (including USD, GBP, ILS, JPY, etc.).
- Returns the latest available rate for the requested date — Frankfurter rolls back to the previous trading day automatically for weekends/holidays. We pin the cache `rateDate` to what the caller asked for, but stamp `effectiveDate` with what Frankfurter returned so the audit shows the rolled-back date.
- Pre-1999 EUR dates and unsupported currency pairs return 404 → we mark `rateFetchStatus = "missing"`.
- Network failure / timeout (8s) → `rateFetchStatus = "failed"`.

ECB is also a possible reference fallback but its rates publish only on working days around 16:00 CET. Not wired today; Frankfurter already wraps ECB.

## Where conversion runs

Every transaction-create site goes through the service:

- **CSV import** — [src/app/api/upload/commit/route.ts](../src/app/api/upload/commit/route.ts) calls `convertAmount` for each normalized row.
- **Manual entries** — [src/lib/manualEntries.ts](../src/lib/manualEntries.ts) bypasses the API (the form has no currency picker) and stamps `same_currency` + `rate=1`. The fields are populated for consistency.
- **Manual override** — [/api/transactions/[id]/fx-override](../src/app/api/transactions/[id]/fx-override/route.ts) recomputes `amount` from the user-supplied rate and writes a `source="manual"` cache row so other transactions on the same date can be batch-corrected just by re-importing or refreshing.

## UI

[`<CurrencyAmount>`](../src/components/CurrencyAmount.tsx) is the display primitive. Pass any transaction row:

```tsx
<CurrencyAmount
  amount={t.amount}
  baseCurrency={business.currency}
  originalAmount={t.originalAmount}
  originalCurrency={t.originalCurrency}
  exchangeRate={t.exchangeRate}
  exchangeRateDate={t.exchangeRateDate}
  exchangeRateSource={t.exchangeRateSource}
  conversionMethod={t.conversionMethod}
  rateFetchStatus={t.rateFetchStatus}
/>
```

Behaviour:

- Same-currency transactions: renders identically to `fmtMoney(amount)` — no badge, no tooltip.
- Converted transactions: shows a small `fx` chip next to the number. Hover/focus/click opens a tooltip with Original / Converted / Rate / Rate date / Source / Method.
- `needs_review` / `failed` / `missing`: chip turns into a red `!` and the tooltip prompts the user to set a manual rate.

## Business Settings → Currency

[`src/app/(app)/settings/CurrencySection.tsx`](../src/app/(app)/settings/CurrencySection.tsx) renders inside the Profile tab. Shows:

- Base currency (read-only here; edit in the Business Profile form above).
- Conversion method (locked to **Daily historical rate** for the MVP; **Monthly average** and **Manual fixed** are previewed as "coming soon").
- Rate source (Frankfurter).
- Detected currencies — auto-generated from the user's imported and manual data via [/api/business/currencies](../src/app/api/business/currencies/route.ts) (raw SQL group by `COALESCE(originalCurrency, currency)`).

The user is **never asked to define a currency list in advance**. Currencies appear as transactions arrive.

## AI awareness

[`src/lib/advisor.ts`](../src/lib/advisor.ts) → `BusinessContext.currencyMix` lists non-base currencies present in the underlying data with row counts. The system prompt in [`src/lib/claudeAdvisor.ts`](../src/lib/claudeAdvisor.ts) now explicitly tells the model:

> All monetary values in this context are already normalized to ctx.ccy (the business base currency) … When ctx.currencyMix is non-empty and you notice a meaningful change in base-currency totals between periods, briefly consider whether exchange-rate movement is a contributing factor and call it out if plausible (e.g. "Revenue in USD stayed roughly flat, but the ILS-reported figure declined ~6% largely because of FX movement").

## Rules

| Rule | Implementation |
|---|---|
| Base currency required | `Business.currency` is non-null with default "USD". |
| Original currency preserved | `originalCurrency` + `originalAmount` on every transaction. |
| Historical rate per transaction | `exchangeRate`, `exchangeRateDate`, `exchangeRateSource`. |
| Never recalculate old transactions | No backfill job; only re-write on explicit manual override. |
| Detected currencies auto-generated | `/api/business/currencies` queries existing rows. |
| Manual override possible | `/api/transactions/[id]/fx-override` + same-pair cache reuse. |
| Failed/missing rates → review | `rateFetchStatus = "needs_review"`; surfaced via the red `!` chip. |

## MVP scope (this release)

Built:
- Base currency support (already existed; semantics tightened so all reports speak in it).
- Currency field captured per imported transaction.
- Daily historical conversion through Frankfurter.
- Local `ExchangeRate` cache with weekend roll-back recorded as `effectiveDate`.
- Converted-amount-as-canonical display + `<CurrencyAmount>` tooltip primitive.
- Detected-currencies UI in Business Settings.
- Per-transaction manual override (API ready; UI follow-up).
- AI context aware of FX as a possible driver.

Deferred:
- Monthly average rate.
- Bulk manual rate management.
- Accounting-period rate policies.
- FX gain/loss reporting on translation differences.
- Paid premium exchange-rate providers.

## Adding a new conversion method

1. Add the method id to the union on `conversionMethod` in `prisma/schema.prisma` (it's a string field — no enum change required).
2. Wire the implementation in `src/lib/fx.ts` — either in `convertAmount` (if it depends on the transaction date) or in a new helper that the import path calls.
3. Add an option in `src/app/(app)/settings/CurrencySection.tsx` and enable it on the picker.
4. Document it here.
