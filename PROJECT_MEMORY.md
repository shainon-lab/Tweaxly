# Tweaxly Project Memory

> **Scope of this document.** Captures what is observably true about the
> Tweaxly codebase and the work completed/pending as of 2026-05-29.
> Sections marked **[inferred]** are inferences from code patterns
> rather than confirmed business decisions; treat those as starting
> points for verification, not ground truth. Sections marked
> **[confirmed]** are directly observed in code or git history.

---

## 1. Repository & Stack

### Repository structure [confirmed]
- Single git repo: `/Users/shai-mac/ai-cfo-mvp`
- Remote: `https://github.com/shainon-lab/Tweaxly.git`
- Branch: `main`
- Two codebases inside the same repo:
  - **Product app** (root) — Next.js 14 App Router on port 3000
  - **Marketing website** (`website/`) — Next.js 16 + React 19 on port 3001

### Product app stack [confirmed]
- Next.js 14 App Router
- React (Server Components + Client Components mix)
- Prisma 5.22 ORM
- PostgreSQL (Neon-hosted, based on env references)
- Tailwind CSS with custom theme tokens (light + dark)
- Polar.sh embedded checkout iframe for billing

### Website stack [confirmed]
- Next.js 16.2.6
- React 19.2
- Tailwind CSS 4
- Turbopack build
- No DB / no backend (pure static site, deployed to Vercel)

### Workspace conventions [confirmed]
- The product runs at port 3000, the website at port 3001
- **CRITICAL OPS NOTE**: kill+restart the Next 14 product server after every
  `prisma db push` so the regenerated client loads. Never touch the
  Next 16 website on 3001 when restarting the product.

---

## 2. Product App — Information Architecture

### Top-level sections (sidebar nav) [confirmed]
1. **Dashboard** — landing page after login, KPI tiles + P&L breakdown + AI executive summary
2. **Signals** — `/business-signals`
   - Signals (default tab)
   - Monitor (alerts/threshold rules)
3. **Advisory** — `/consultation`
   - New Advisory (free-form Q&A)
   - Suggested (AI-curated questions)
   - History (past consultations)
4. **Forecast** — `/forecast`
   - Overview (`?view=overview` or default)
   - Scenarios (`?view=scenarios`)
   - Workforce Planning (`/workforce`)
   - Employees (`/employees`) — drill-down inside Workforce Planning
5. **Reports** — `/report`
   - P&L Statements (`/report`)
   - Category Trends (`/data-flow`)
   - Yearly Summary (`/insights/yearly`)
   - Charts (`/insights`) — "View Charts" affordance, secondary
6. **Data** — `/manual-data`
   - Import (`/manual-data`)
   - Sources (`/sources`)
   - Transactions (`/transactions`)
   - Categories & Vendors (`/settings?tab=categories`) — physically under /settings but conceptually Data
   - Data Log (`/data-log`)
   - Integration (`/integration`)
7. **Settings** — `/settings`
   - Business Settings (default tab)
   - Business Profile (`?tab=profile`)
   - Business Plan (`?tab=plan`)
   - Members & Access (`?tab=members`)
8. **Account** — `/account` (client-side tabs via AccountClient)
   - Workspaces (default tab, cross-workspace overview)
   - Orders & Invoices (Payment Methods section nested inside)
   - Password
   - Language & Region
   - Communication & Notifications (inner tabs: Communication / Notifications)
   - Accessibility
   - Access Logs
   - Close Account

### Page title convention [confirmed]
- Every page uses a **"Section - Sub-Tab"** title format
  (e.g. "Data - Import", "Reports - P&L Statements",
  "Forecast - Workforce Planning")
- One H1 per page
- A `<HowItWorks/>` `?` icon next to the title opens a modal
  describing every sub-tab in the section — the modal content
  is identical regardless of which sub-tab the user is on
- Help modal components live in `src/components/`:
  `DataHelp`, `ReportsHelp`, `SignalsHelp`, `AdvisoryHelp`,
  `SettingsHelp`, `AccountHelp`, `ForecastHelp`
- The `AccountClient` is a client component, so it renders its
  own `PageHeader` with a dynamic title computed from the
  active sub-tab

---

## 3. Workspaces & Multi-tenancy

### Model [confirmed]
- Multiple workspaces per user via `businessMembership` join table
- Each workspace = a separate Business
- Each workspace has independent: subscription, AI credits, team, data
- One user can be a member of many workspaces (e.g. their own + a
  client's)
- `currentBusinessId` lives on the session and is rewritten via
  `POST /api/businesses/switch` (full reload on switch)

### Roles [inferred from membership.role values]
- `account_admin` — can rename workspace
- (other roles likely exist; `member`, `viewer` referenced in copy)
- `ownerId` on Business identifies the workspace owner; the owner
  cannot leave, only delete

### Workspace lifecycle [confirmed]
- Created via `POST /api/businesses/create`
- Renamed via `PATCH /api/businesses/:id`
- Leave via `POST /api/businesses/:id/leave` (non-owner only)
- Delete via `DELETE /api/businesses/:id?confirm=delete` (owner only,
  cascade-deletes all transactions/uploads/employees/etc.)

### Workspace UI [confirmed]
- `/account` (Workspaces tab) shows one card per workspace with plan
  + AI credits + alerts + last activity + inline management actions
  (Switch, Manage plan, Rename, Leave, Delete)
- A "Create new workspace" button + dialog lives at the top of the
  same pane
- The old `/settings/workspaces` route has been **retired**; all
  workspace management now lives on `/account`
- `BusinessSwitcher` (sidebar header) has an "All workspaces
  overview →" link to `/account`

### Workspace statuses [inferred]
- `active`, `suspended` (suspended workspaces filtered out of
  Account → Workspaces grid)
- `demo`, `test` referenced as pill styles but their behaviour is
  unconfirmed

---

## 4. Plans & Billing

### Plans referenced in code [confirmed names; behaviour partly inferred]
- **Free** — entry-level, capped on most features
- **Pro** — full feature access
- **Business** — referenced in `PLAN_BADGE` but treated as Pro in the
  entitlements layer (`{ label: "Pro", cls: ... }`); appears to be
  legacy / collapsed

### Effective plan resolution [confirmed]
- `getEffectivePlan(businessId)` returns `{ plan, source, readOnly }`
- `source` is one of: `"override"` (admin override),
  `"subscription"` (active Polar subscription), `"default"` (free)
- `readOnly: true` puts the workspace into a non-editable mode
  (shown as "Read-only" on the workspace card)

### Pro-gated features [confirmed via `hasFeature(businessId, key)`]
- `workforcePlanning` — Workforce Planning page
- `yearlyReports` — Yearly Summary tab
- `exportExcel` — Excel/CSV/PDF export (single gate for all 3
  formats)
- (Scenario Builder is also Pro-gated based on code paths; exact
  feature key not directly observed)

### Billing surface [confirmed]
- Polar.sh embedded checkout (iframe injected by their SDK)
- Per-workspace subscriptions (upgrading workspace A does not affect
  workspace B)
- Billing UI lives at `/settings?tab=plan` (Business Plan tab)
- "Manage plan" button on Account → Workspaces cards switches into
  the workspace and routes to `/settings?tab=plan`
- Account → Orders & Invoices shows cross-workspace billing history
  (invoices downloadable from Polar) and a Payment Methods section
- **Payment methods** currently shows "No payment methods on file"
  placeholder ("Tweaxly is free during preview")

---

## 5. AI Credits System

### Model [confirmed]
- `AiCreditWallet` per business with `balance` and `monthlyAllowance`
- `ensureMonthlyAllowance(businessId)` auto-refills on access if a
  month has rolled over

### Costs [confirmed via help copy]
- 1 credit — standard advisory question
- 3 credits — deep analysis on a signal / refreshing signals
- 5 credits — fresh forecast generation / scenario run

### Allowances [confirmed in concept; exact numbers not memorised]
- Free plan and Pro plan have different `monthlyAICredits` floors
  exposed via `getPlanLimits(plan)`

### UI [confirmed]
- Wallet balance displayed on Account → Workspaces cards
- "Pro AI Credits" badge referenced in copy

---

## 6. Onboarding

### Entry flow [confirmed]
1. User registers at `/register`
2. Default workspace created
3. Landing pages (Dashboard / Forecast / Signals / Advisory /
   Insights) show the **empty preview state**:
   - Blurred mock content underneath (signals deck, KPIs, forecast
     chart) so the user sees what the page will look like
   - `<BankIntelligenceEmptyState>` CTA card centered on top
4. CTA prompts upload at `/manual-data?onboarding=1`
5. Recommended: "Upload at least 3 months of bank activity"
6. Once data uploaded, the real page renders

### Empty-state surfaces [confirmed]
- `EmptyDataPreview` wraps every page that needs ≥1 transaction
- Affects: dashboard, forecast, insights, consultation, signals

---

## 7. Signals System

### Architecture [confirmed]
- `BusinessSignal` table — persistent rows representing the current
  state of each detected signal
- One signal = one row; the deterministic evaluator writes /
  updates / resolves rows over time
- Notifications fire only on real change events
  (created / updated / severity-changed / resolved), NOT on every
  page render
- `sweepAndDispatch(userId, businessId)` runs in the background on
  every Signals page render, throttled to once per 5 minutes inside
  the lib

### Signal fields (visible in PushRec mapping) [confirmed]
- `id`, `signalKey`, `level`, `observation`, `interpretation`,
  `recommendation`, `impact`, `category`, `status`, `firstSeenAt`

### Lifecycle [confirmed via UI labels]
- New (just created)
- Ongoing (still present, already seen)
- Resolved (closed by user OR engine determined condition gone)
- Status: `active`, `acknowledged` (Mark as read)

### Plan caps [confirmed]
- `planSignalCap(plan)` returns the max active signals per plan
- Free plan has a low cap; Pro is higher
- The user-facing UI counts shown as "N of N active · Plan"

### Refresh [confirmed]
- Manual refresh costs 3 AI credits
- Automatic updates (post-data-upload, weekly re-eval) are free

### Per-signal actions [confirmed in PushRecommendations]
- **Mark as read** — keeps the signal in the active list, visually
  muted, until the underlying condition changes or it's resolved
- **Mark as resolved** — removes from active list; if the same
  condition re-appears later, a brand-new signal opens
  automatically
- **Consult about this signal** — opens Advisory with the question
  prefilled (`/consultation?q=<question>`)

### Categories [confirmed via `CATEGORY_LABEL` map]
- (Categories exist but exact set not memorised — referenced as
  `r.category` on each PushRec; revenue / expense / cash flow /
  vendor / etc. patterns mentioned in copy)

### Bell deep-linking [confirmed]
- Bell notifications use `?signal=<BusinessSignal.id>` to open the
  detail panel for a specific signal on first render
- The page tolerates stale links: if the signal has been resolved /
  archived, it looks up the orphan row directly so View Details
  still opens the correct content

---

## 8. Notifications & Monitor (Threshold Alerts)

### Two distinct concepts that share the bell [confirmed]
- **Signals** = AI-generated observations (Signals tab)
- **Monitor / threshold alerts** = user-defined rules (Monitor tab)
- Bell badge counts the combined firing alerts

### NotificationRule fields [confirmed]
- `metric` (revenue / expenses / specific category / etc.)
- `direction` (up / down)
- `thresholdType` (% change / absolute amount)
- `thresholdValue`
- `period` (vs last month / quarter / year)
- `label` (user-chosen name)
- `enabled`
- `severity` (critical / important / info)
- `channelPreferences` (in-app / push / email)

### Evaluation flow [confirmed]
- `evaluateNotificationRules(businessId)` runs read-only checks
- `evaluateAndStampNotificationRules(businessId)` persists firing
  state + dispatches notifications
- `acknowledgedAt` on each triggered alert tracks "still firing
  but already seen"

### User preferences [confirmed via copy]
- Quiet hours
- Daily caps
- Per-rule channel overrides
- Per-rule severity

### Bell behaviour [confirmed]
- Notification = an EVENT (signal created / updated / escalated /
  resolved; or rule fired)
- The bell never repeats a notification for a signal that is simply
  still present

---

## 9. Forecasting System

### Readiness states [confirmed]
- `disabled` — not enough data; the page shows an error message
- `basic` / `standard` / `reliable` / `advanced` — increasing
  quality tiers based on `daysOfData` + `monthsOfData`
- Surfaced via `ForecastReadinessBanner`

### Confidence model [confirmed]
- `high` / `medium` / `low` from the engine
- Numeric `confidenceScore` (percent)
- Color tone per level (good / neutral / warn)

### Forecast drivers [confirmed; surfaced as "Why this forecast?" panel]
- **Data Coverage** — `monthsWithData / monthsResolved`
- **Volatility** — Low / Medium / High based on `confidence` level
- **Recurring Items** — count of `recurringDetected`
- **Seasonality** — boolean `seasonalityApplied`
- **Anomalies** — count of `outliersDetected`
- **Scenarios** — count of `scenariosApplied`

### Horizons & plan gating [confirmed]
- Picker offers: 3 / 6 / 12 / 24 / 36 / 60 months
- Free plan capped at **3 months**
- Pro plan supports up to **60 months**

### Scenario Builder [confirmed; Pro feature]
- Event-based: user picks an event type (Add hire / Terminate hire /
  Salary increase / Contract added / Contract ended / etc.)
- Event families: Revenue, Expense, Workforce, Strategic
- Events filter by family via `familyFilter` prop
- Salary-increase has scope toggle: "Specific employee" vs
  "Overall salary"
- Each saved assumption stacks on top of the baseline forecast

### Workforce Planning [confirmed; Pro feature]
- Live total cost, payroll-as-share-of-revenue, MoM change, 12-month
  forecast
- Roots into the team roster (`/employees`)
- Model hires, raises, contractor changes before committing

### Employee model [confirmed]
- Employees and contractors stored separately
- Fields: name, role, gross monthly salary, employer cost multiplier,
  startDate, endDate, notes
- EmployeeEvent table: type (raise / termination / role change),
  employeeId, effectiveDate, amount
- Future-dated events honored by the forecast

---

## 10. Reports System

### Sub-tabs [confirmed]
1. **P&L Statements** — `/report`
2. **Category Trends** — `/data-flow`
3. **Yearly Summary** — `/insights/yearly`
4. **Charts** — `/insights` (secondary affordance)

### P&L Statements [confirmed]
- Granularity: month / quarter / year
- Up to 3 comparison columns (`MAX_COMPARE = 3`)
- Period anchoring defaults to the latest month with data, not
  today's calendar month
- Multi-currency: amounts shown in business base currency, with
  per-category FX breakdown chips driven by `MoneyAmountWithCurrencyBreakdown`
- Income rows use signed sums (positive), outcome rows use
  magnitudes (positive shown as `−$X`)
- Categories sorted income-first via `compareCategoriesIncomeFirst`,
  then by primary-period magnitude desc

### Category Trends [confirmed]
- Two views: `summary` and `detail`
- Summary: revenue + outcomes broken by category with totals
- Detail: per-month grid with one row per category, one column per
  month
- Filters: range (this_month / last_month / this_quarter /
  last_quarter / this_year / last_year / all / custom), category
  drill-down

### Yearly Summary [confirmed]
- Pro-gated (`yearlyReports`)
- Free shows a blurred preview behind a LockedOverlay
- 20-ish "Key numbers" tiles via `statBoxes()` covering financials,
  workforce, cost composition
- Two sub-tabs: Key numbers (default) and Insights (text-style
  retrospective with AI-generated takeaways)
- Year selector pulls from `listCompletedYearsWithData()`

### Currency / FX [confirmed]
- `breakdownFromDb` and `breakdownFromTxns` produce per-currency
  composition with historical conversion
- `originalAmount` / `originalCurrency` / `baseCurrency` /
  `exchangeRate` / `conversionMethod` stored per transaction

### Export [confirmed]
- Excel + CSV + PDF, gated behind `exportExcel` feature flag
- `DownloadButton` + `ExportPayload` shape (filename, title,
  subtitle, businessName, baseCurrency, filters, columns, sections,
  footnote)

---

## 11. Data Management

### Sources of data [confirmed via subtabs]
- **Import** — manual data upload (`/manual-data`)
- **Sources** — registered data sources / connectors
- **Transactions** — full transaction list
- **Categories & Vendors** — taxonomy (lives at `/settings?tab=categories`)
- **Data Log** — audit log of uploads + categorisations
- **Integration** — third-party connections

### Plaid integration [confirmed via memory note]
- Full integration built (commit f64606e referenced in memory)
- Currently gated behind a "coming soon" modal
- Connect button non-functional in production preview
- AES key for encryption stored separately
- **Status: ON HOLD** — resume checklist tracked outside this file

### Categorisation [inferred from category model]
- Auto-categorisation rules survive future imports
- Categories have a `kind` field: `"revenue"` (income) or other
  (outcomes)
- The kind drives the income-first sort + sign convention
  throughout Reports

### Transaction model fields [inferred from query patterns]
- amount, currency
- originalAmount, originalCurrency
- baseCurrency, exchangeRate, conversionMethod
- categoryId, accountingMonth
- type (`transfer` is filtered out of P&L)
- isExcludedFromPnl (boolean)

---

## 12. Settings & Account Split

### Settings (workspace-scoped) [confirmed]
1. **Business Settings** — name, currency, fiscal year, VAT,
   branding. Currency changes re-convert past activity at locked
   historical rates so totals stay accurate.
2. **Business Profile** — industry, model, customers, KPIs.
   Drives every AI prompt — consultation answers and signal
   interpretations are grounded in this profile.
3. **Business Plan** — AI Credit balance, Free vs Pro, billing
   via Polar.
4. **Members & Access** — role-based invites (Owner / Admin /
   Viewer). Pro feature. Free workspaces have a single owner only.
   Pending invitations count toward 3-seat cap.

### Account (user-scoped) [confirmed]
1. **Workspaces** — cross-workspace overview + management (see §3)
2. **Orders & Invoices** — billing history across all workspaces +
   Payment Methods section
3. **Password** — change password + 2FA toggle (2FA is preview
   only — enforcement not wired yet)
4. **Language & Region** — preferred UI language, region for
   date/number formatting. Region defaults from IP detection
   (`detectIpCountry`).
5. **Communication & Notifications** — internal tabs:
   Communication Preferences + Notifications
6. **Accessibility** — toggle for the in-app accessibility widget;
   placeholder section for future native a11y controls (high
   contrast, larger text, etc.)
7. **Access Logs** — every sign-in, password change, billing event,
   upload, source change. Sourced from `/api/account/access-logs`.
8. **Close Account** — DELETE confirmation pattern. Routes through
   support during preview (no automatic deletion yet).

### Categories & Vendors [confirmed]
- Lives at `/settings?tab=categories` for legacy / routing reasons
- Conceptually belongs to **Data**, not Settings
- Uses `<DataHelp/>` tooltip, not `<SettingsHelp/>`
- The settings page hardcodes the title to "Data - Categories &
  Vendors" when tab=categories

---

## 13. Advisory / AI Consultation

### Sub-tabs [confirmed]
1. **New Advisory** (`/consultation`) — free-form Q&A
2. **Suggested** (`/consultation/suggested`) — AI-curated questions
   from `pickRecommendedConsultation` + `pickSuggestedConsultations`
3. **History** (`/consultation/history`) — past Q&A pairs

### New Advisory flow [confirmed]
- Empty state when business has 0 transactions
- Otherwise: textarea + Analyze button
- URL params:
  - `?q=<question>` prefills the draft
  - `?q=<question>&auto=1` prefills AND auto-submits
- Standard arrival path from a suggested question card or from a
  signal's "Consult about this" button

### Response rendering [confirmed]
- Server returns markdown
- `src/app/(app)/consultation/markdown.tsx` renders it with:
  - 50-word paragraph split for long blocks
  - `### Heading` → t-card heading
  - `> Quote` → bordered blockquote
  - `**emphasis**` → semibold span

### Data context [confirmed via existence of `buildBusinessContext`]
- Each consultation has access to full BusinessContext (categories,
  vendors, employees, monthly snapshots, recent uploads, business
  profile)
- LLM reads pre-computed context; doesn't hallucinate numbers

### History model [confirmed]
- `ConsultationMessage` table with role + content + consultationId
- Q/A pairs grouped by consecutive user → assistant messages within
  the same consultation

### Costs [confirmed via help copy]
- 1 credit per simple question
- (Deep analysis on signals = 3 credits as noted in §5)

---

## 14. Help System

### Pattern [confirmed]
- Every section has a single shared "How … works?" modal
- A `?` icon next to the page title opens it
- The same modal renders on every sub-tab of the section so the
  content stays identical when moving between tabs
- Components live in `src/components/`:
  - `DataHelp`, `ReportsHelp`, `SignalsHelp`, `AdvisoryHelp`,
    `SettingsHelp`, `AccountHelp`, `ForecastHelp`
- All driven by the `HowItWorks` primitive (icon + title + cards + outro)

### Special case [confirmed]
- Account help renders inside `AccountClient` (client component)
  rather than `page.tsx`, so its title can vary by active sub-tab
  while sharing the same help content

---

## 15. Typography System (in progress)

### Standard [confirmed; commit e906b04]
Five-level hierarchy, single source of truth in `src/app/globals.css`:

| Class | Size | Weight | Use |
|---|---|---|---|
| `.t-page` | 28px | 700 | Page titles (one per page) |
| `.t-section` | 20px | 600 | Major sections inside a page |
| `.t-card` | 18px | 600 | Card / panel / widget titles |
| `.t-body` | 16px | 400 | Default reading size — insights, AI responses, warnings, explanations |
| `.t-meta` | 13px | 500 | Short UI labels only — table headers, pills, dates, status badges |

### Rules [confirmed in spec]
- Analytical text never below 16px
- Metadata sizing never used for explanatory prose
- Allowed sizes: 13 / 16 / 18 / 20 / 28
- Hierarchy comes from size + weight + color, not size alone

### Primitives aligned [confirmed]
- `.label` 12px → 13px / medium
- `.pill` 11px → 13px / medium
- `.table-base` headers 12 → 13, cells 14 → 16
- `NarrativeBody` floored at 16px; `lg` variant lifts to 18px on
  wide viewports

### Surfaces completed [confirmed; commits e906b04 + b75d237]
**Batch 1 (commit e906b04):**
- Forecast Explanation Panel ("Why this forecast?")
- Forecast Readiness Banner
- NarrativeBody (shared component)
- Signal cards (PushRecommendations)
- Signal detail panel
- Advisory markdown renderer
- Reports P&L footnote

**Batch 2 (commit b75d237):**
- PageHeader subtitle (ripples app-wide)
- Stat tile (KPI tiles)
- Dashboard P&L card
- Category Trends report
- Yearly Summary report
- Forecast Setup picker
- Scenario Builder + Scenario Builder Panel
- Bank-Intelligence empty state

### Surfaces pending (approved, ready to execute)
- Items 9-16 in the audit list:
  9. PageHeader **title** itself (currently text-xl/2xl → t-page 28px)
  10. Workforce Planning KPI strip
  11. Advisory shell (ConsultationClient input + rails)
  12. Account tabs (~33 small-text instances)
  13. Forecast chart annotations
  14. Transactions list page
  15. Data Log page
  16. LockedOverlay (Pro upsell card)

### Audit not yet done
- Employees / EmployeesClient
- Settings sub-tabs detailed contents
- Notifications page
- Threshold rule editor (ThresholdAlertsBox)
- Various pills, badges, and one-off labels app-wide

---

## 16. Website (Learning Center) — `website/`

> Separate codebase, deployed independently. Resources hub at
> `https://tweaxly.com/resources`.

### Structure [confirmed]
- 10 categories, fixed taxonomy: Financial Fundamentals,
  Business Metrics & KPIs, Cash Flow Management, Business
  Forecasting, Expense Management, Business Growth, Business
  Intelligence & Analytics, Business Signals & Insights,
  Small Business Operations, Business Glossary
- 47 full articles across 9 topical categories
- 50 glossary entries
- Total 97 article pages + 10 category landings + 1 hub = 108 routes

### Routes [confirmed]
- `/resources` — hub
- `/resources/[category]` — category landing
- `/resources/[category]/[slug]` — article or glossary entry

### Internal linking architecture [confirmed; commit a219aa8 + ac1f22b]
14-layer plan implemented:
1. Article → Glossary (manual `ArticleLink` calls in article bodies)
2. Glossary → Glossary (Related Terms blocks)
3. Article → Related Articles (auto bottom-of-article rail)
4. Glossary → Articles (manual + auto "Articles using this term")
5. Category → Category (curated map in `[category]/page.tsx`)
6. Category → Articles (Featured + Latest blocks)
7. Category → Glossary ("Key terms in this category" auto block)
8. Article → Product Features ("Practical application" curated CTA)
9. Article → Site nav ("Explore Tweaxly" footer rail)
10. Marketing homepage → Resources (LearningCenterSection)
11. Search (client-side, articles + categories)
12. Breadcrumbs everywhere
13. JSON-LD schema (Article + BreadcrumbList + FAQPage + CollectionPage)
14. Auto-derivation (`src/content/resources/relations.ts`)

### Glossary difficulty filter [confirmed; commit 15ebcf8]
- `difficulty: "beginner" | "intermediate" | "advanced"` on
  ArticleMeta (glossary-only)
- Counts: 14 beginner / 32 intermediate / 4 advanced
- Filter chips on `/resources/business-glossary` landing

### Redirects [confirmed]
- 5 legacy `/resources/<slug>` URLs 301-redirect to new nested URLs
- Defined in `website/next.config.ts`

### Sitemap [confirmed]
- Auto-generated from registry: all 10 category landings + all 97
  article URLs + static marketing pages

---

## 17. Architectural Decisions of Note

### Single git repo for both apps [confirmed]
- Product app and marketing website share one repository
- Independent build / deploy targets (different Vercel projects)
- Conscious choice: keeps documentation, brand assets, and shared
  patterns close together

### Multi-tenancy via business memberships [confirmed]
- Sessions carry a `currentBusinessId` rewritten on workspace switch
- Every Prisma query in the app scopes to `business.id`
- Removes need for separate tenants table

### Server-first rendering [confirmed]
- Most pages are server components reading directly from Prisma
- Client components used only for interactive UI (filters,
  scenario builder, panel overlays, etc.)
- This makes the app fast on initial render and crawler-friendly

### Deterministic engine + LLM layer [confirmed]
- Forecast engine, signal evaluator, recurring-pattern detection
  are all pure deterministic code (`lib/forecastEngine`,
  `lib/signals/evaluator`)
- LLM is invoked only on top of pre-computed structured context to
  produce narrative — never replaces the math
- This is the single most important quality bet of the platform

### Sticky page header + sticky sub-tab strips [confirmed]
- Every page has a sticky `<PageHeader>` at top:0
- Sub-tab strips stick at top:[85px], 56px below the header
- Inner tabs sometimes stack at top:[140px] (e.g. Comm/Notifications)
- Pure CSS sticky; no JS scroll tracking

### Workspace + Account split [confirmed]
- Settings = per-workspace (every business has its own)
- Account = per-user (personal preferences cross-workspace)
- Workspaces themselves are managed under Account, not Settings —
  recently consolidated; `/settings/workspaces` route retired

### Plain business English policy [confirmed via shared style file]
- `src/lib/ai/businessLanguageStyle.ts` enforces no
  YoY/MoM/EBITDA/CAGR/MRR/ARR/LTV/CAC/runway/burn/concentration in
  user-facing AI surfaces
- Spell out + put acronym in parens only when needed
- Audience: small-business owners, not analysts

### No em-dash policy [confirmed via repeated reminders in memory]
- Replace any "—" with " - " in AI prompts, UI strings, narrative
  output, and chat responses
- The em-dash is treated as an AI giveaway

### Help modal pattern: section-level, not page-level [confirmed]
- One help modal per section (Data, Reports, Forecast, etc.) shared
  across all sub-tabs of that section
- Identical content regardless of active sub-tab
- Recent change from per-page modals

---

## 18. Recent Completed Work (this conversation)

### Product app
- **Section / Sub-Tab title hierarchy** rolled out across every page
- **Shared help modals** per section (replacing per-page tooltips)
- **Workspaces management moved to Account** (deleted `/settings/workspaces`)
- **Workspaces card removed from Settings tooltip**
- **Typography system foundation** in globals.css
- **Typography batch 1** — Forecast Explanation, Forecast Readiness,
  NarrativeBody, Signal cards + detail, Advisory markdown, Reports
  footnote
- **Typography batch 2** — PageHeader subtitle, Stat tile, Dashboard
  P&L, Category Trends, Yearly Summary, Forecast Setup, Scenario
  Builder, Bank-Intelligence empty state

### Website
- **Resources → Learning Center rebuild** (10 categories, nested
  routing, schema markup)
- **47 full articles** authored across 9 topical categories
- **50 glossary entries** authored (3 batches: 5 → 9 → 50)
- **Difficulty filter** added to the glossary landing page
- **Internal linking architecture** — all 14 layers built
- **Auto-derivation library** (`relations.ts`) — new articles and
  glossary entries connect automatically without manual wiring
- **Resources homepage redesign** + **marketing homepage Learning
  Center section**
- **301 redirects** for old `/resources/<slug>` URLs
- **Sitemap** auto-includes all 108 routes with per-page meta tags
  and JSON-LD schema

---

## 19. Pending / Open Items

### Typography (approved, ready to execute)
- Batch 2 items 9-16: PageHeader title, Workforce Planning,
  Advisory shell, Account tabs, Forecast chart, Transactions,
  Data Log, LockedOverlay
- Future batches: Employees, Settings sub-tabs, ThresholdAlertsBox,
  miscellaneous pills/labels app-wide

### Product features in "preview only" state
- **2FA** — toggle exists in UI but enforcement at sign-in is not wired
- **Email change** — routes through support; no in-app flow
- **Account deletion** — routes through support; no automatic delete
- **Payment methods** — placeholder ("no payment methods on file";
  Tweaxly free during preview)
- **Member invitations & ownership transfer** — not wired; super_admin
  is the only path to add members today

### Plaid integration
- **ON HOLD** per the workspace memory
- Full integration code lives in the repo (commit f64606e referenced)
- Connect button gated behind a "coming soon" modal
- Resume checklist + AES encryption key tracked outside this file

### Content backlog (Learning Center)
- All 50 articles + 50 glossary entries are written but quality
  varies across the batch — the first 25 articles got the most
  careful authoring, the back half is solid but compact and would
  benefit from a human editorial pass before sustained promotion
- 8-15 inline glossary links per article is met via the
  auto-derived "Key terms in this article" block; some articles
  could still benefit from more inline links inside the prose

### Documentation gaps
- This file documents what is observable; the following are not
  fully documented anywhere in the repo:
  - Exact AI credit allowances per plan tier
  - Exact signal cap per plan tier
  - The full enum of signal categories
  - The full enum of membership roles
  - The full enum of business statuses

---

## 20. Coding Conventions & Patterns

### Comments [confirmed in CLAUDE.md & system instructions]
- Default to writing no comments
- Comment only when the WHY is non-obvious: hidden constraint,
  subtle invariant, workaround for a specific bug, surprising
  behavior
- Don't explain WHAT the code does — well-named identifiers do that
- Don't reference current task / fix / callers in comments — those
  belong in PR descriptions

### File structure conventions
- Server components by default; `"use client"` only when needed
- Help modal components live in `src/components/`
- Page-specific components co-located in the route folder
  (e.g. `src/app/(app)/forecast/ScenarioBuilder.tsx`)
- Shared business logic in `src/lib/`

### Tailwind conventions
- Custom theme tokens via CSS variables (`--c-ink-950`, `--c-line`,
  `--c-accent-soft`, etc.)
- Light + dark mode via `[data-theme="light"]` on `<html>`
- Custom component classes via `@layer components`: `.card`,
  `.card-tight`, `.btn`, `.btn-primary`, `.btn-ghost`, `.input`,
  `.label`, `.pill`, `.table-base`
- Typography: `.t-page`, `.t-section`, `.t-card`, `.t-body`, `.t-meta`

### Date / time conventions
- `accountingMonth` field on transactions is the canonical period
  bucket (string `YYYY-MM`)
- Period anchors default to **the latest month with data**, not
  today's calendar date
- All currency math: business base currency, with per-transaction
  historical FX rates preserved for breakdown chips

### Money formatting [confirmed]
- `fmtMoney(amount, currency)` — abbreviated
- `fmtMoneyWhole(amount, currency)` — whole units
- `fmtMoneyExact(amount, currency)` — full precision
- `<MoneyAmountWithCurrencyBreakdown/>` — chip-style with currency
  composition popover

### Workspace-scoping
- Every database query MUST scope to `businessId`
- `requireBusiness()` returns `{ user, business }` from the session;
  this is the canonical entry point for every protected page

### Background work patterns
- Always invoked as fire-and-forget after `await requireBusiness()`:
  `void sweepAndDispatch(user.id, business.id).catch(() => {})`
- Throttled inside the lib (sweepAndDispatch = 5 minutes)

---

## 21. Memory Conventions

### Auto-memory [confirmed]
- The user's auto-memory file (`MEMORY.md`) records ongoing rules
- Critical rules currently recorded:
  - **Restart product dev server** (port 3000) after every `prisma db
    push`; never touch the Next 16 website on 3001
  - **Never use em-dash** in user-facing text or AI prompts
  - **Plain business English** (no analyst jargon) in AI surfaces;
    enforced via `src/lib/ai/businessLanguageStyle.ts`
  - **Plaid integration on hold**; resume checklist + AES key tracked

### This file [PROJECT_MEMORY.md]
- A static snapshot of the architecture, not an auto-updating
  memory; refresh manually when major decisions change
- Treat as a starting reference for any new contributor; verify
  inferred sections against the live code before relying on them

---

*Last updated: 2026-05-29 — generated from observable codebase state
during the typography standardisation pass.*
