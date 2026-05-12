# AI CFO — MVP

A web-based **Business Financial Operating System** for SMB owners. Not bookkeeping — a clarity layer that combines income, bank, credit-card, PayPal/Stripe, and payroll data into one monthly story: revenue, real expenses, recurring vs one-time, employee costs, duplicates, anomalies, and a 3-month forecast.

## Stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · Recharts
- Prisma ORM · SQLite (swap to Postgres for prod by changing `prisma/schema.prisma`)
- iron-session for auth
- SheetJS (`xlsx`) for CSV/XLSX parsing

## Run it

```bash
npm install
npx prisma db push        # creates dev.db
npm run db:seed           # optional: demo user + 3 months of data
npm run dev
```

Open http://localhost:3000.

If you ran the seed:
- email: `demo@example.com`
- password: `demo1234`

Otherwise click "Create one" on the login screen.

## What's in the box

- **Auth** — register / sign in (iron-session, bcrypt hashing).
- **Business setup** — name, currency, fiscal start month, optional VAT. Default categories seeded automatically.
- **Upload** — CSV / XLSX from bank, credit card, PayPal, Stripe, invoicing, payroll, other. Column auto-mapping with manual overrides. Save mapping templates per source for reuse.
- **Normalization** — every row becomes a unified `Transaction` with `transactionDate` + editable `accountingMonth` (so a Feb-paid Jan salary stays in Jan).
- **Categorization** — every txn lands in `Uncategorized` by default; bulk-categorize from the Transactions table or define rules (description / vendor / source × contains/equals/startsWith/regex). Rules can also auto-flag recurring or one-time. "Re-apply rules to all transactions" runs them across history.
- **Duplicate detection** — runs after each upload. Finds same-amount-different-source within ±3 days, equal-and-opposite transfer pairs, and same-id matches. Open the Duplicates page to keep one, exclude others, or dismiss.
- **Transactions table** — search, filter by source / month / uncategorized, bulk set category / mark recurring / mark one-time / exclude from P&L. Per-row inline edit of accounting month and category.
- **Employees** — roster + employer-cost multiplier; events for hire / termination / salary change / bonus / one-time. Drives payroll projections automatically.
- **Dashboard** — revenue, expenses, net & **normalized profit (excluding one-time)**, fixed/variable/payroll/marketing/fees/taxes, MoM deltas, 6-month trend, cash-flow bars, top expense categories.
- **Monthly report** — line-item table (current vs prior + Δ + Δ%), and inline insights.
- **Forecast** — next 3 months. Trailing-3-month avg + employee schedule + manual `+/-` items per month.
- **Insights** — deterministic plain-English bullets: revenue swings, marketing-vs-revenue divergence, vendor cost spikes, one-time distortion, payroll outlook, open duplicates, uncategorized share, expected negative cash flow.

## Data model highlights

Key tables (see `prisma/schema.prisma`):

- `User` → `Business` (workspace per owner; multiple businesses per user supported).
- `Transaction` — unified shape with `accountingMonth` independent of `transactionDate`, `isRecurring` / `isOneTime` / `isExcludedFromPnl` / `isDuplicateCandidate` flags.
- `Category` — has a `kind` (revenue/fixed/variable/payroll/fee/tax/transfer/other) and an `isOneTime` default. The dashboard groups by `kind`, not category name, so renaming categories never breaks the buckets.
- `MappingTemplate` — saved column mappings per source.
- `CategorizationRule` — priority-ordered field/match/pattern → category (+ recurring/one-time flags).
- `DuplicateGroup` — open / merged / dismissed; transactions point back to the group.
- `Employee` + `EmployeeEvent` — roster and timeline.
- `ForecastItem` — manual +1 / +2 / +3 month adjustments.

## Positioning

This is **not** an accounting system or ERP. It is a financial clarity tool for CEOs: it answers "did we really make money this month, what changed, what's coming," not "is this entry GAAP-compliant."

## What an LLM layer would add

The `lib/insights.ts` rules engine is intentionally deterministic for the MVP. The natural extension is to feed `MonthBuckets + lookback + insights[]` into a small LLM call to produce a 2-paragraph executive narrative on top of the bullets.

## Production checklist (when you're ready)

- Switch `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL`, run `prisma migrate deploy`.
- Set a strong `SESSION_PASSWORD` (32+ chars) and add HTTPS / `secure: true` cookies.
- Add per-row currency conversion if you want multi-currency consolidation.
- Replace `xlsx` (community CDN tarball) with the AGPL release or a paid SheetJS license depending on your needs.
- Add file storage for original uploads (currently we don't persist the raw file).
