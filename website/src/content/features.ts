// Single source of truth for the /features hub and every
// /features/[slug] subpage. The main hub renders the categories
// inline; the dynamic [slug] route reads SUBPAGES.
//
// Writing style is deliberately GEO-friendly (Generative Engine
// Optimisation): concrete numbers, operational vocabulary, no
// marketing fluff. AI engines (Google AI Overviews, ChatGPT,
// Perplexity, Gemini) extract from this content; humans skim it.

export type VisualKey =
  | "executive-overview"
  | "signal-deck"
  | "forecast-chart"
  | "consultation"
  | null;

export type SubpageSlug =
  | "reports"
  | "business-signals"
  | "forecasting"
  | "ai-consultation"
  | "multi-currency"
  | "alerts";

export interface FeatureFaq {
  q: string;
  a: string;
}

export interface Feature {
  name: string;          // H3 heading
  whatItDoes: string;    // plain English
  whyItMatters: string;  // business problem solved
  useCase: string;       // concrete example with a number
  faqs?: FeatureFaq[];   // 2-3 mini FAQs (optional)
}

export interface FeatureCategory {
  // Anchor id on the hub page.
  id:           string;
  // Mapped subpage slug.
  subpageSlug:  SubpageSlug;
  // Short label for the jump-nav strip.
  navLabel:     string;
  // Uppercase pill above the H2.
  eyebrow:      string;
  // The strong SEO/GEO heading - this is what the AI engines pick up.
  h2:           string;
  // 1-2 sentence intro under the H2.
  intro:        string;
  // Product mock visual keyed in the page component.
  visual:       VisualKey;
  features:     Feature[];
}

// ─────────────────────────────────────────────────────────────────────
// Six feature categories
// ─────────────────────────────────────────────────────────────────────

export const CATEGORIES: FeatureCategory[] = [
  {
    id:          "financial-visibility",
    subpageSlug: "reports",
    navLabel:    "Financial Visibility",
    eyebrow:     "Financial Visibility",
    h2:          "Financial Visibility for Small Business Owners",
    intro:
      "See revenue, expenses, profit and the changes that actually matter - in one executive-style dashboard built for owners who don't read accounting reports for a living.",
    visual: "executive-overview",
    features: [
      {
        name: "Quick Overview Dashboard",
        whatItDoes:
          "Surfaces revenue, expenses, profit, cash movement and key changes since last period on a single screen.",
        whyItMatters:
          "Owners lose hours every week assembling the same view in spreadsheets. Tweaxly assembles it automatically from your transactions.",
        useCase:
          "A founder opens Tweaxly on Monday morning and sees revenue is up 8.4% week-on-week while expenses jumped 22% - all without touching a spreadsheet.",
      },
      {
        name: "Revenue Reports",
        whatItDoes:
          "Tracks revenue trends, growth, drops, recurring patterns and period-over-period change by category, customer or source.",
        whyItMatters:
          "Revenue concentration and slow declines are easy to miss month-to-month. A purpose-built report makes both impossible to ignore.",
        useCase:
          "Tweaxly flags that 38% of last month's revenue came from a single customer whose contract ends in 60 days - so the owner can act before it becomes a cash problem.",
      },
      {
        name: "Expense Reports & Tracking",
        whatItDoes:
          "Breaks expenses down by category, supplier and period, and highlights unusual increases against the baseline.",
        whyItMatters:
          "Most owners can name their top 3 customers but not their top 3 cost drivers. Tweaxly closes that gap.",
        useCase:
          "Software costs rose from $1,820/mo to $2,310/mo (+27%) over the last quarter as small SaaS subscriptions stacked up - flagged for review.",
      },
      {
        name: "Profitability View",
        whatItDoes:
          "Shows how revenue and expenses combine into the bottom line, with margin trends and what's driving the change.",
        whyItMatters:
          "Healthy revenue can hide a deteriorating margin. The profitability view tells you which one you're actually running.",
        useCase:
          "Gross margin fell from 62% to 54% over three months. Tweaxly traces it to a new supplier contract signed in March - the owner can renegotiate or switch.",
        faqs: [
          {
            q: "Does Tweaxly calculate gross or net profitability?",
            a: "Both. The Quick Overview shows net profit (revenue minus all expenses) by default; reports let you isolate gross margin once you tag cost-of-goods categories.",
          },
          {
            q: "How is 'period' defined - calendar or fiscal?",
            a: "Calendar by default. You can switch to your business's fiscal calendar in Business Settings, and every report respects that choice.",
          },
        ],
      },
      {
        name: "Period Comparison",
        whatItDoes:
          "Compares the current period against last month, last quarter, last year or any custom window, with deltas and direction at a glance.",
        whyItMatters:
          "A number on its own is meaningless. The same number against a comparable period is a decision.",
        useCase:
          "Q2 revenue is $148K - up 12% versus Q1 ($132K) but down 4% versus Q2 last year ($154K). Two different stories, one screen.",
      },
    ],
  },
  {
    id:          "ai-business-intelligence",
    subpageSlug: "business-signals",
    navLabel:    "AI Business Intelligence",
    eyebrow:     "AI Business Intelligence",
    h2:          "AI Business Intelligence for Small Businesses",
    intro:
      "Tweaxly watches your numbers continuously and pushes the changes a finance team would flag - vendor spikes, margin erosion, customer concentration, cash position shifts - tagged by severity and explained in plain English.",
    visual: "signal-deck",
    features: [
      {
        name: "AI Business Signals",
        whatItDoes:
          "Generates push-style insights automatically when something material shifts in revenue, expenses, vendors, customers or cash position.",
        whyItMatters:
          "Owners don't have time to query their data daily. Signals reverse the model: the data reports itself when something changes.",
        useCase:
          "Tweaxly detects a 17% increase in operational expenses over the trailing 30 days - flagged before it shows up in next month's P&L.",
        faqs: [
          {
            q: "How often does Tweaxly check for signals?",
            a: "Continuously. Every time you upload new transactions or one of your connected sources changes, Tweaxly re-evaluates the signal set.",
          },
          {
            q: "Can I tune what's considered 'unusual'?",
            a: "Yes - sensitivity is configurable per category, and you can mute signals that aren't relevant for your business (eg seasonal swings you already know about).",
          },
        ],
      },
      {
        name: "AI Insights & Trend Detection",
        whatItDoes:
          "Detects patterns across rolling windows - month-over-month, quarter-over-quarter, year-over-year - and explains the trend in operational language.",
        whyItMatters:
          "Single-period spikes are noise; recurring patterns are decisions. Tweaxly separates the two.",
        useCase:
          "Marketing spend has grown 9% per quarter for four quarters straight while attributable revenue grew 3% - efficiency is decaying, even if the absolute numbers still look healthy.",
      },
      {
        name: "Profitability Warnings",
        whatItDoes:
          "Surfaces margin erosion, cost-base creep and revenue-mix shifts that quietly drag profit down.",
        whyItMatters:
          "Profitability rarely collapses overnight - it gets thinned by a series of small changes. Tweaxly catches them while they're still small.",
        useCase:
          "Net margin dropped from 18% to 12% over six months. Tweaxly attributes 60% of the drop to a single supplier whose pricing rose twice unannounced.",
      },
      {
        name: "Signal Severity",
        whatItDoes:
          "Tags every signal Low, Medium, Medium-High, High or Critical so you always know what to act on first.",
        whyItMatters:
          "An undifferentiated alert stream is worse than no alerts - it teaches owners to ignore them. Severity solves the prioritisation problem.",
        useCase:
          "Cash runway dropped under 90 days = Critical (open immediately). A 4% expense uptick on coffee subscriptions = Low (read at the end of the week).",
      },
      {
        name: "Action-Oriented Insights",
        whatItDoes:
          "Every signal explains what changed, why it matters and what you can do about it - not just a number on a chart.",
        whyItMatters:
          "Insights without next steps are trivia. Tweaxly always pairs the 'what' with a 'so what' and a 'now what'.",
        useCase:
          "\"Vendor X invoiced 28% more this month. Reason: pricing change effective Mar 1. Action: review contract clause 4.2 or switch to alternative vendor (3 options ranked by cost).\"",
      },
    ],
  },
  {
    id:          "business-profile",
    subpageSlug: "business-signals",
    navLabel:    "Business Profile",
    eyebrow:     "Business Profile & DNA",
    h2:          "Your Business DNA, Permanent Context for the AI",
    intro:
      "A short profile of your business — industry, specific category, model, customers, stage, goals, KPIs — that Tweaxly captures once and reuses across every AI surface so the advisor, signals and forecasts reason about you, not a generic SMB.",
    visual: null,
    features: [
      {
        name: "About Your Business",
        whatItDoes:
          "AI generates a 80-200 word \"About Your Business\" paragraph from your profile + live financial snapshot - editable, regeneratable, used as permanent context across the platform.",
        whyItMatters:
          "Without a profile, the advisor treats every workspace the same. With one, every answer leans into your actual stage, customers and challenges from the first sentence.",
        useCase:
          "After a 2-minute onboarding wizard, Tweaxly identifies the workspace as \"a growing boutique guitar shop primarily serving consumers, currently focused on growth, with inventory turnover called out as the active challenge.\"",
      },
      {
        name: "Specific Business Category",
        whatItDoes:
          "A typeahead pin of what kind of business this is - \"Recording Studio\", \"Jewelry Store\", \"Dental Clinic\" - far narrower than the high-level industry tag.",
        whyItMatters:
          "The advisor speaks in your vocabulary. Asking the same generic question on a Recording Studio vs a Dental Clinic should produce categorically different answers - and now it does.",
        useCase:
          "On a Recording Studio profile, asking \"should I raise prices?\" returns guidance framed around session rates, rehearsal vs recording, and how local studios benchmark - not generic small-business pricing advice.",
      },
      {
        name: "Smart Evolution - Patterns Tweaxly Noticed",
        whatItDoes:
          "Eight deterministic detectors plus an AI polish pass scan your trailing data for seasonality, growth trajectory, cash-flow concern, marketing intensity, payroll heaviness, vendor concentration and category concentration - and write the observations back to your profile.",
        whyItMatters:
          "The owner's stated profile is one half of the truth; the other half is what the data shows. Smart Evolution captures both and feeds them to the advisor together.",
        useCase:
          "Patterns include: \"Highly seasonal - Nov/Dec consistently run ~50%+ above the average month\", \"Marketing-heavy - paid acquisition runs at ~18% of revenue\", \"Vendor concentration - Fender Distribution accounts for ~42% of tracked spend.\"",
        faqs: [
          {
            q: "Do I have to do anything to get the patterns?",
            a: "No. The first time you open Settings → Business Profile after completing the wizard, Tweaxly runs the detectors automatically and populates the panel. You can refresh anytime; the panel keeps the last-refreshed timestamp.",
          },
        ],
      },
      {
        name: "AI Context Preferences",
        whatItDoes:
          "Owner-set biases the advisor honours on every answer - \"Prefer conservative forecasting\", \"Focus on growth opportunities\", \"Flag downside risks early\" - plus a free-text \"anything else for the AI to know\" box.",
        whyItMatters:
          "Two owners with the same numbers can have very different priorities. Preferences let the AI mirror the owner's posture without re-explaining it every conversation.",
        useCase:
          "A bootstrapped owner toggles \"Avoid aggressive expansion suggestions\" + writes \"never recommend taking on debt\" - subsequent advisor answers about growth lean into retention, pricing and unit-economic improvements instead.",
      },
      {
        name: "Onboarding Wizard",
        whatItDoes:
          "A short multi-step flow (industry, business category, business model, main goal, customer type, stage, biggest challenge, KPIs) with progress bar, skip-where-relevant, and a closing \"Analyzing your business…\" state that hands off to AI summary generation.",
        whyItMatters:
          "Profile capture has to feel like \"help us understand you,\" not a configuration form. The wizard takes ~2 minutes and ships the user straight into a dashboard that's already personalised.",
        useCase:
          "New signups complete the wizard before they see the dashboard - by the time they land, the AI advisor already knows their stage, model and main focus.",
      },
    ],
  },
  {
    id:          "forecasting",
    subpageSlug: "forecasting",
    navLabel:    "Forecasting",
    eyebrow:     "Forecasting & Scenarios",
    h2:          "AI Cash Flow Forecasting & Scenario Planning",
    intro:
      "Forward-looking forecasts grounded in your real history, with a scenario builder that lets you stress-test decisions - hires, contracts, marketing spend - against baseline before you commit.",
    visual: "forecast-chart",
    features: [
      {
        name: "Cash Flow Forecasting",
        whatItDoes:
          "Generates a forward-looking cash position from real historical activity - inflows, outflows, timing patterns and recurring obligations.",
        whyItMatters:
          "Profit and cash are not the same thing. Cash forecasting tells you when you'll run out of money, even if you're profitable on paper.",
        useCase:
          "Tweaxly projects a $34K cash gap in Week 9 driven by a quarterly tax payment plus a slow-paying customer - 6 weeks of runway to plan around it.",
        faqs: [
          {
            q: "How does AI forecasting work in Tweaxly?",
            a: "Tweaxly analyses your transaction history - revenue patterns, recurring expenses, seasonality, payment timing - and projects each component forward. The model surfaces both the projection and the confidence band, so you can see how much of the future is signal vs. assumption.",
          },
          {
            q: "What's the minimum history needed for a useful forecast?",
            a: "90 days minimum, 6-12 months recommended. Less history = wider confidence band; Tweaxly will tell you how reliable the forecast is rather than presenting a false-precision number.",
          },
          {
            q: "Does the forecast update automatically?",
            a: "Yes - every time you import new transactions or correct a category, the forecast is re-run so it always reflects the latest reality.",
          },
        ],
      },
      {
        name: "Revenue Predictions",
        whatItDoes:
          "Projects revenue forward by category, source or customer, accounting for recurring patterns and known seasonality.",
        whyItMatters:
          "Capacity, hiring and inventory decisions all hinge on a revenue view that goes beyond last month's number.",
        useCase:
          "Forecast shows recurring revenue holding flat at $42K/mo but one-off project revenue dropping from $18K/mo to $7K/mo - hiring plan needs adjusting.",
      },
      {
        name: "Expense Forecasting",
        whatItDoes:
          "Projects expenses forward by category, supplier and frequency - including known annual or quarterly hits.",
        whyItMatters:
          "Surprise expenses are usually not surprises at all - they're just out of sight. Expense forecasting puts them in sight.",
        useCase:
          "Tweaxly flags that the domain renewals, accounting subscription and insurance premium all land in the same week - $4,200 of \"unexpected\" expense the owner had forgotten about.",
      },
      {
        name: "Scenario Builder",
        whatItDoes:
          "Lets you model what changes if you hire, cut spend, double marketing, sign a new contract or shift revenue assumptions - side by side with baseline.",
        whyItMatters:
          "Decisions get made better when the alternative is visible. The scenario builder makes the alternative visible in 30 seconds.",
        useCase:
          "Modelling \"hire 2 engineers at $9K/mo each\" against baseline: cash runway drops from 14 months to 9 months unless monthly recurring revenue grows by $14K within 4 months.",
      },
      {
        name: "Workforce Planning",
        whatItDoes:
          "A dedicated view of payroll cost, hiring headroom and per-employee economics - revenue per head, burn per head, fixed vs variable workforce cost - with a forecast of total payroll over the next 12 months.",
        whyItMatters:
          "Payroll is the biggest decision in most small businesses. Workforce Planning shows whether the business can absorb the next hire before the owner commits to a salary offer.",
        useCase:
          "Roster of 4 employees at $24K/mo loaded cost = 42% of revenue. Tweaxly projects affordable hires at \"1 additional engineer if average monthly revenue clears $62K\" based on current margin.",
      },
      {
        name: "Historical Window Selection",
        whatItDoes:
          "Choose the baseline window - last quarter, 6/12/18 months or a custom window of at least 90 days - that best matches your business rhythm.",
        whyItMatters:
          "A B2B SaaS shouldn't be forecasted from a 90-day window; a seasonal retailer shouldn't be forecasted from a single quarter. The owner picks.",
        useCase:
          "A landscaping business sets the window to 12 months so winter dips don't get projected into June forecasts.",
      },
      {
        name: "Forecast Summary",
        whatItDoes:
          "Every forecast ships with a plain-English summary explaining the trajectory, the assumptions and what to watch.",
        whyItMatters:
          "Charts are for analysts. Summaries are for owners. Tweaxly gives you both.",
        useCase:
          "\"Cash holds above $50K through Q3 unless customer #4 churns - which would create a $12K gap by Week 22 that the current pipeline doesn't cover.\"",
      },
    ],
  },
  {
    id:          "business-consultation",
    subpageSlug: "ai-consultation",
    navLabel:    "AI Consultation",
    eyebrow:     "Business Consultation",
    h2:          "AI Financial Consultation for Small Business Owners",
    intro:
      "An AI advisor that already knows your numbers. Ask questions about your own business in plain English, jump from any signal or report into a contextual conversation, and keep a history of every consultation.",
    visual: "consultation",
    features: [
      {
        name: "Business-Aware AI Chat",
        whatItDoes:
          "Ask anything about your own financial data - revenue, expenses, customers, vendors, trends - and get an answer grounded in your real transactions, not a generic LLM response.",
        whyItMatters:
          "Generic chatbots can't see your numbers. Tweaxly's advisor can - so the answer is specific to your business, not theoretical.",
        useCase:
          "\"Why did our profit drop in April?\" → Tweaxly cites the three transactions that account for 72% of the drop and explains each.",
        faqs: [
          {
            q: "Does Tweaxly send my financial data to an external AI provider?",
            a: "Queries are processed via Anthropic's Claude API with a strict no-training policy on customer data. Your raw transactions stay in your Tweaxly workspace; only the minimum needed to answer the question is included in the model context.",
          },
          {
            q: "Can I ask follow-up questions?",
            a: "Yes - each consultation is a full multi-turn conversation. Follow-ups inherit the prior context so you don't have to re-explain.",
          },
        ],
      },
      {
        name: "Contextual Recommendations",
        whatItDoes:
          "Hit \"Consult\" on any signal or report and open a pre-filled conversation about that exact issue - no copy-pasting numbers, no re-explaining context.",
        whyItMatters:
          "Most consultations start with \"let me give you some background\". Contextual consultation skips that step.",
        useCase:
          "A High-severity vendor-cost-spike signal opens a consultation pre-loaded with the vendor, the months affected, the comparable category and three recommended actions.",
      },
      {
        name: "Financial Questions Library",
        whatItDoes:
          "Suggested starter questions tuned to where you are in the app - the dashboard, a specific report or a forecast view.",
        whyItMatters:
          "Most owners don't know what to ask, not because they don't have questions but because they don't know what's askable. Tweaxly shows them.",
        useCase:
          "On the Expenses report: \"Why did expenses increase?\" / \"Which suppliers grew the most?\" / \"What should I watch this month?\" - three clicks, three answers.",
      },
      {
        name: "Consultation History",
        whatItDoes:
          "Every conversation is saved with date, time and the context it started from - so you can come back, refine or share later.",
        whyItMatters:
          "Decisions outlive conversations. History gives you a paper trail of what you asked, what you learned and what you decided.",
        useCase:
          "Three months later the owner re-opens the April \"why did profit drop\" consultation to compare against the July numbers - same conversation, fresh data.",
      },
    ],
  },
  {
    id:          "data-integrations",
    subpageSlug: "multi-currency",
    navLabel:    "Data & Currency",
    eyebrow:     "Data & Integrations",
    h2:          "Multi-Currency Data, CSV Imports & Smart Categorization",
    intro:
      "Get your real numbers in without the setup pain. Simple CSV imports, automatic multi-currency conversion, transaction categorisation that learns from your corrections.",
    visual: null,
    features: [
      {
        name: "Multi-Currency Intelligence",
        whatItDoes:
          "Detects every currency in your transactions, converts amounts into your business base currency, and clearly explains every conversion in tooltips and reports.",
        whyItMatters:
          "International businesses run their books in multiple currencies but make decisions in one. Tweaxly bridges that gap transparently.",
        useCase:
          "A consultancy invoicing in EUR and USD but operating in GBP sees a unified £ revenue total, with a tooltip showing the original €/$ breakdown and the FX rate used.",
        faqs: [
          {
            q: "Does Tweaxly support multiple currencies?",
            a: "Yes - all major currencies are detected automatically and converted into your business base currency. Conversion uses the rate on the transaction date, and you can override it manually with an audit note if needed.",
          },
          {
            q: "Which exchange-rate source does Tweaxly use?",
            a: "European Central Bank reference rates via the Frankfurter API, fetched per transaction date. Manual overrides are preserved across reports and tagged in the audit log.",
          },
        ],
      },
      {
        name: "CSV Upload",
        whatItDoes:
          "Upload financial transactions with a simple, documented CSV template - no API integrations or bookkeeper required.",
        whyItMatters:
          "Most SMBs already have their data in spreadsheets or exports. CSV upload is the lowest-friction way to get started in under 5 minutes.",
        useCase:
          "An owner exports 18 months of bank transactions to CSV, drops the file in, and has a working dashboard before lunch.",
        faqs: [
          {
            q: "Can I upload CSV files exported from my bank?",
            a: "Yes. Most major banks' CSV exports are supported, and Tweaxly will guide you through mapping any non-standard column on first upload.",
          },
        ],
      },
      {
        name: "Smart Transaction Categorization",
        whatItDoes:
          "Assigns categories automatically on upload, learns from your corrections, and gets sharper over time.",
        whyItMatters:
          "Manual categorisation of every transaction is the single biggest reason owners abandon financial tools. Tweaxly absorbs the work.",
        useCase:
          "Out of 412 imported transactions, 387 are auto-categorised correctly; the owner corrects 25 and Tweaxly applies those rules to the next 1,000 transactions automatically.",
      },
      {
        name: "Required Income / Expense Type",
        whatItDoes:
          "Every transaction is marked as income or expense at upload, so Tweaxly can analyse your business even before full categorisation is done.",
        whyItMatters:
          "Partial data shouldn't block analysis. Knowing direction (in vs. out) is enough to produce meaningful signals on day one.",
        useCase:
          "A new user uploads 6 months of transactions; before they categorise a single one, Tweaxly already shows net cash flow, gross revenue and gross expenses by month.",
      },
      {
        name: "Historical Data Window",
        whatItDoes:
          "Stores your historical activity indefinitely and uses any window you select - 90 days minimum, multi-year supported - for analysis and forecasting.",
        whyItMatters:
          "Longer windows = more signal. Tweaxly keeps every transaction you import so forecasts and trends sharpen as you stay on the platform.",
        useCase:
          "After 18 months on Tweaxly, a seasonal business gets year-on-year comparisons that finally separate \"normal December dip\" from \"actual problem\".",
      },
      {
        name: "Transaction Review",
        whatItDoes:
          "A clean review surface for correcting, re-categorising and improving transactions after upload.",
        whyItMatters:
          "Data quality is iterative. Review lets owners and accountants tighten the dataset without rebuilding it.",
        useCase:
          "The owner spots 14 transactions miscategorised as \"Software\" that should have been \"Marketing\" - one click reclassifies all 14 and updates every report.",
      },
    ],
  },
  {
    id:          "alerts-monitoring",
    subpageSlug: "alerts",
    navLabel:    "Alerts",
    eyebrow:     "Alerts & Monitoring",
    h2:          "Real-Time Business Alerts & Custom Monitors",
    intro:
      "Desktop push notifications, custom monitors and a built-in Notification Center turn Tweaxly into a live business pulse. Critical changes reach you the moment they happen; quiet hours, severity routing and category toggles make sure the volume stays right.",
    visual: null,
    features: [
      {
        name: "Real-Time Business Alerts (Premium)",
        whatItDoes:
          "Browser-based desktop push notifications wired to AI signals and your custom monitors. Critical alerts ring through the moment they fire; non-critical ones honour your quiet hours and daily limit.",
        whyItMatters:
          "Email is too slow, dashboards are too passive. A native desktop notification on the moment a cash-flow risk or vendor anomaly is detected is the difference between catching it the same day and finding out next week.",
        useCase:
          "On a Friday afternoon a forecast model flips negative for the following month. The owner gets a desktop notification within seconds: \"Cash flow warning — projected balance falls below your threshold in 38 days. Open Forecast.\" One click lands them on the relevant view.",
        faqs: [
          {
            q: "Are push notifications free?",
            a: "No - desktop push notifications are a Premium feature. Free workspaces can still see every alert inside the in-app Notification Center; only the browser-push delivery layer is gated.",
          },
          {
            q: "Do I need to install an app?",
            a: "No. Tweaxly uses the Web Push standard through your browser - works on Chrome, Edge, Firefox, Brave and Safari on macOS without any install.",
          },
        ],
      },
      {
        name: "Custom Monitors (Premium)",
        whatItDoes:
          "Owner-defined rules: revenue / expense / cash thresholds, profitability bands, category-spend ceilings, vendor caps, forecast conditions. Each monitor carries its own severity, time-comparison (previous month, quarter, rolling average, custom) and notification channel.",
        whyItMatters:
          "Generic AI signals catch what the system thinks is unusual. Custom monitors catch what YOU think is unusual - the lines that, when crossed, mean someone needs to act today.",
        useCase:
          "Pre-built monitor: \"Alert me if cash runway falls below 60 days.\" When payroll lands and runway drops to 54 days, an Important alert fires with a one-tap link to the forecast.",
      },
      {
        name: "Notification Center",
        whatItDoes:
          "A bell-icon inbox in the top nav, with unread counts, severity badges, business filter, category filter, mark-as-read and clear. Every alert is preserved with a deep link back to the relevant insight, forecast, monitor or consultation.",
        whyItMatters:
          "Desktop pushes are ephemeral. The Notification Center is the durable record - so an owner who was away from their machine still sees what fired, when, and what to do about it.",
        useCase:
          "Returning from a long weekend, the owner opens the bell, filters to Critical-only across all workspaces, sees three alerts, clicks through to the deep-linked forecast, and is briefed in 90 seconds.",
      },
      {
        name: "Notification Severity Routing",
        whatItDoes:
          "Three severity levels - Critical, Important, Informational - each routed differently. Critical: desktop push + in-app + optional email. Important: in-app + push when the category is on. Informational: in-app only.",
        whyItMatters:
          "An undifferentiated alert stream is worse than no alerts - it trains owners to ignore everything. Severity routing makes sure the loudest channel is reserved for the loudest signal.",
        useCase:
          "\"Forecasted negative balance\" routes as Critical (desktop push at 11pm). \"Office-supplies category up 12%\" routes as Informational (in-app, no buzz).",
      },
      {
        name: "Quiet Hours & Daily Limit",
        whatItDoes:
          "Configure a daily quiet window in your local timezone; non-critical alerts delay until the window ends. A daily cap caps total deliveries so a noisy day never floods the inbox.",
        whyItMatters:
          "Real-time matters at 11am on a Tuesday and matters less at 11pm on a Sunday. The system respects the difference.",
        useCase:
          "Quiet hours 22:00-07:00 with critical-bypass on: a routine vendor-spike alert waits until 7am to deliver; a cash-flow warning rings through immediately.",
      },
      {
        name: "Category Toggles & Sensitivity",
        whatItDoes:
          "Per-category opt-in (Revenue, Expense, Cash flow, Forecast, Vendor anomaly, AI recommendations, Custom monitor, Weekly summary) plus a global sensitivity dial (Conservative / Balanced / Aggressive).",
        whyItMatters:
          "Owners want different things at different stages. A founder pre-PMF wants every signal; a stable cash-cow wants only critical ones. The dials let both work.",
        useCase:
          "An e-commerce owner turns off Weekly Summary, leaves Cash Flow + Vendor Anomaly + AI Recommendations on, and sets sensitivity to Aggressive during the Q4 promo crunch.",
      },
      {
        name: "Threshold Alerts (Free + Premium)",
        whatItDoes:
          "The original notification-rule engine - one threshold per workspace on the Free plan, unlimited on Pro - covering cash floor, expense ceiling, vendor spike, revenue drop.",
        whyItMatters:
          "Free users still get the headline guardrail. Premium unlocks the full real-time stack on top of it.",
        useCase:
          "Free workspace sets a single rule: \"Notify me if revenue drops more than 20% month-over-month.\" The rule still fires through the in-app Notification Center even without desktop push.",
      },
      {
        name: "Future Channels",
        whatItDoes:
          "The notification dispatcher is built around a channel abstraction so additional channels - mobile push, email digest, Slack, WhatsApp, Microsoft Teams, generic webhooks - drop in without changing the alert logic.",
        whyItMatters:
          "Owners live on different surfaces. The architecture doesn't force a re-design every time a new channel becomes interesting.",
        useCase:
          "Today: desktop push + in-app. On the roadmap: same alerts arriving in your team's Slack channel or as a webhook into your own system.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page-level FAQs (10-15) for FAQPage JSON-LD on the hub page
// ─────────────────────────────────────────────────────────────────────

export interface PageFaq { q: string; a: string }

export const PAGE_FAQS: PageFaq[] = [
  {
    q: "What is Tweaxly?",
    a: "Tweaxly is an AI-powered business intelligence platform for small and medium business owners. It turns your real financial activity into business signals, financial reports, forecasts, scenario planning and an AI advisor you can ask questions of - in plain English, in real time.",
  },
  {
    q: "What makes Tweaxly different from accounting software?",
    a: "Accounting software records what happened. Tweaxly explains what's happening, projects what's coming, and recommends what to do about it. Tweaxly sits on top of your financial data (whether from CSV uploads, bank exports or eventually direct integrations) and produces decision-grade insight - business signals, forecasts and AI consultation - that traditional bookkeeping tools don't.",
  },
  {
    q: "How does AI forecasting work in Tweaxly?",
    a: "Tweaxly analyses your transaction history - revenue patterns, recurring expenses, payment timing, seasonality - and projects each component forward. The model surfaces both the projection and a confidence band, so you see how much of the future is signal vs. assumption. Forecasts re-run automatically whenever new data lands.",
  },
  {
    q: "Can Tweaxly detect unusual expenses?",
    a: "Yes. Tweaxly has two layers of unusual-expense detection: threshold alerts you define explicitly (eg \"notify me if any vendor exceeds $X\"), and AI Business Signals that catch implicit anomalies - unusual swings against your historical baseline - even when no fixed threshold has been crossed. Both are tagged by severity.",
  },
  {
    q: "Does Tweaxly support multiple currencies?",
    a: "Yes. Tweaxly detects every currency in your transactions, converts amounts into your business base currency for reporting, and clearly indicates conversion via tooltips. Conversion uses ECB reference rates on the transaction date; manual rate overrides are supported and recorded in the audit log.",
  },
  {
    q: "Can I upload CSV files to Tweaxly?",
    a: "Yes. CSV upload is the primary import path during early access. A documented template makes it work with most bank exports out of the box; on first upload Tweaxly will guide you through mapping any non-standard columns.",
  },
  {
    q: "How long does it take to set up Tweaxly?",
    a: "About 5 minutes. Create an account, set your business base currency, upload a CSV of your transactions, and the Quick Overview, signals and forecast start populating immediately. Categorisation happens automatically on first upload and you can refine it as you go.",
  },
  {
    q: "What's the minimum historical data needed for forecasting?",
    a: "90 days minimum, 6-12 months recommended. With less than 90 days Tweaxly will still show signals and reports, but forecasting confidence bands widen. The more history you import, the sharper every projection becomes.",
  },
  {
    q: "Can I manage multiple businesses under one Tweaxly account?",
    a: "Yes. One user can run multiple businesses under a single account and switch between them in a click - data, currency, fiscal calendar and notification preferences are kept cleanly separated per business.",
  },
  {
    q: "Does Tweaxly work for businesses outside the US?",
    a: "Yes. Tweaxly is currency-agnostic (any business base currency, all major transaction currencies supported), date-format-aware (DD/MM/YYYY or MM/DD/YYYY), and the AI advisor responds in your interface language. There's no US-only logic.",
  },
  {
    q: "What kinds of business signals does Tweaxly detect?",
    a: "Revenue changes (growth, drops, concentration), expense anomalies (category spikes, vendor cost increases, unusual frequency), profitability shifts (margin erosion, mix changes), cash-position alerts (runway under threshold, liquidity gaps) and customer/vendor concentration risk. Each signal is tagged Low / Medium / Medium-High / High / Critical.",
  },
  {
    q: "How does the AI Consultation work?",
    a: "From the consultation surface you can ask any question about your own business numbers in plain English. The advisor sees your transactions, categories and the context you're in (a specific signal, report or forecast) and grounds its answer in your real data - not a generic LLM response. You can ask follow-ups, save the conversation and return later.",
  },
  {
    q: "Can I export reports for my accountant?",
    a: "Yes. Every report can be exported as Excel, CSV or PDF, with the source transactions, the period, the categorisation and any currency conversion notes included - so an accountant has full traceability.",
  },
  {
    q: "Does Tweaxly integrate with my bank?",
    a: "Direct bank integrations are on the roadmap; during early access the primary import path is CSV. Most bank CSV exports are supported out of the box.",
  },
  {
    q: "How does Tweaxly handle data security?",
    a: "Tweaxly runs on encrypted infrastructure with role-based access; financial data is encrypted in transit and at rest. AI consultation queries are processed via Anthropic's Claude API with a strict no-training policy on customer data - only the minimum context needed to answer is included in the model request.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Subpage content - one entry per /features/[slug]
// ─────────────────────────────────────────────────────────────────────

export interface SubpageContent {
  slug:          SubpageSlug;
  // Maps to the matching category on the hub.
  categoryId:    string;
  // SEO
  metaTitle:     string;
  metaDescription: string;
  keywords:      string[];
  // Hero
  h1:            string;
  subtitle:      string;
  // Deep explanation - 3-5 paragraphs, AI-readable prose.
  deepExplanation: string[];
  // Use-case examples - concrete, numbered.
  useCases:      string[];
  // Related article slugs from /resources.
  relatedArticleSlugs?: string[];
  // 3-6 dedicated FAQs for this subpage (own FAQPage JSON-LD).
  faqs:          PageFaq[];
}

export const SUBPAGES: SubpageContent[] = [
  {
    slug:       "reports",
    categoryId: "financial-visibility",
    metaTitle:  "Financial Reports & Dashboards for SMBs | Tweaxly Features",
    metaDescription:
      "Tweaxly's financial reports turn raw transactions into revenue, expense and profitability views built for small business owners - with export to Excel, CSV and PDF.",
    keywords: [
      "small business financial reports",
      "SMB revenue dashboard",
      "expense tracking software",
      "profitability reports",
      "financial dashboard SMB",
      "Tweaxly reports",
    ],
    h1: "Financial Reports & Dashboards Built for Business Owners",
    subtitle:
      "Revenue, expenses, profitability and period comparisons - assembled automatically from your real transactions and exportable in one click.",
    deepExplanation: [
      "Most small business owners don't have time to build financial reports from scratch every month, and the reports their accounting software produces are designed for accountants - not for the people running the business. Tweaxly closes that gap.",
      "Reports in Tweaxly are pre-assembled from your imported transactions. Revenue and expense breakdowns, profitability views, and period-over-period comparisons are continuously updated as new data lands. Owners open one screen, see the current state of the business, and know whether to act.",
      "Every report respects your business base currency: amounts in foreign currencies are converted transparently, with the conversion rate, source and date kept on record. Notes attached to transactions show up where they're relevant and feed the AI advisor, so the explanation behind any number is always one click away.",
      "When you need to share with an accountant, investor or partner, every report exports to Excel, CSV or PDF - with source transactions, period, categorisation and conversion notes included so the recipient has full traceability.",
    ],
    useCases: [
      "Monday morning: open the Quick Overview to see revenue is up 8.4% week-on-week, expenses jumped 22% on a one-off equipment purchase, and net cash position is healthy.",
      "Before a board call: export a PDF of last quarter's revenue, expense and profitability views in 30 seconds - same numbers, formatted for sharing.",
      "Suspicious month-over-month spike: open the Expense report, drill into the category, see the three transactions that account for 84% of the increase, click into the AI advisor for a contextual explanation.",
    ],
    relatedArticleSlugs: ["spreadsheets-not-enough", "business-signals-founders-monitor"],
    faqs: [
      {
        q: "How are Tweaxly reports different from QuickBooks or Xero reports?",
        a: "Accounting reports are designed for accountants and tax filings; Tweaxly reports are designed for business owners and decisions. The numbers come from the same place, but the framing - which categories are highlighted, which changes are flagged, which questions you can ask - is built around running the business, not closing the books.",
      },
      {
        q: "Can I export reports as PDF?",
        a: "Yes. Every report exports as PDF, Excel and CSV, with the source data, currency conversions and any AI notes attached so the recipient has full context.",
      },
      {
        q: "Do reports respect my fiscal calendar?",
        a: "Yes - set your fiscal calendar in Business Settings and every report respects it across period comparisons, quarter and year-to-date views.",
      },
    ],
  },
  {
    slug:       "business-signals",
    categoryId: "ai-business-intelligence",
    metaTitle:  "AI Business Signals | Tweaxly Features",
    metaDescription:
      "Discover how Tweaxly automatically detects important business changes and turns them into clear AI-powered signals for small and medium business owners.",
    keywords: [
      "AI business signals",
      "business alerts",
      "SMB insights",
      "financial signals",
      "AI financial monitoring",
      "Tweaxly",
    ],
    h1: "AI Business Signals That Tell You What Just Changed",
    subtitle:
      "Tweaxly watches your numbers continuously and pushes the things a finance team would flag - tagged by severity, explained in plain English, paired with an action.",
    deepExplanation: [
      "A business signal is a push-style insight - generated automatically, the moment something material shifts in revenue, expenses, vendors, customers or cash position. Tweaxly doesn't wait for the owner to come asking; it surfaces the change first.",
      "Every signal carries three things: what changed (the data), why it matters (the business interpretation), and what to do about it (a recommended action). That structure is non-negotiable - a signal without all three is a notification, not an insight.",
      "Signals are tagged by severity. Critical means open this now (cash runway under 90 days, a single customer disappearing). High means open this today. Medium and Medium-High mean queue for the week. Low means digest at the end of the month. The severity model exists so the alert stream stays useful instead of becoming background noise.",
      "Sensitivity is configurable. If your business has seasonal swings you already understand, mute that category; if a vendor's costs are expected to fluctuate, raise the threshold. Tweaxly learns from what you act on and what you ignore, and the signal mix sharpens over time.",
    ],
    useCases: [
      "Tweaxly detects a 17% increase in operational expenses over the last 30 days - flagged before it lands in next month's P&L.",
      "A High-severity signal fires when a single customer's share of monthly revenue crosses 35% - concentration risk surfaced months before that customer's contract ends.",
      "A Critical signal fires when projected cash runway drops below 90 days - the owner gets six weeks of warning to act, with a Consult link pre-loaded with the underlying data.",
    ],
    relatedArticleSlugs: ["business-signals-founders-monitor", "cash-flow-problems-early-warning"],
    faqs: [
      {
        q: "How often does Tweaxly check for signals?",
        a: "Continuously. Every transaction import or category change triggers a re-evaluation of the full signal set.",
      },
      {
        q: "Can I customise which signals I see?",
        a: "Yes - sensitivity is configurable per signal type, and any signal can be muted. The system also learns from what you act on vs. dismiss and tunes the mix over time.",
      },
      {
        q: "What's the difference between a business signal and a threshold alert?",
        a: "A threshold alert fires when an explicit limit you set is crossed (\"cash below $25K\"). A business signal is an AI-generated anomaly - something unusual relative to your historical baseline, even if no fixed threshold exists. Most owners use both.",
      },
    ],
  },
  {
    slug:       "forecasting",
    categoryId: "forecasting",
    metaTitle:  "AI Cash Flow Forecasting for Small Businesses | Tweaxly Features",
    metaDescription:
      "Tweaxly's AI forecasting engine projects revenue, expenses and cash flow forward from your real transaction history - with confidence bands, scenario planning and plain-English summaries.",
    keywords: [
      "AI cash flow forecasting",
      "small business forecasting",
      "revenue prediction software",
      "expense forecasting SMB",
      "scenario planning",
      "Tweaxly forecasting",
    ],
    h1: "AI Cash Flow Forecasting for Small Business Owners",
    subtitle:
      "Forward-looking forecasts grounded in your real history, with scenario planning that lets you stress-test hires, contracts and spend changes before you commit.",
    deepExplanation: [
      "Tweaxly's forecast engine projects revenue, expenses and cash position forward by analysing your real transaction history. Recurring patterns, payment timing, seasonality and known one-off events all feed the projection - so the future view is grounded in how your business actually behaves, not a generic model.",
      "Every forecast comes with a confidence band that widens as the projection extends further out. That band is the honest answer to \"how reliable is this number?\" - and it's what separates a useful forecast from a false-precision guess.",
      "The scenario builder is where most forecasting tools fall short. Tweaxly lets you model concrete changes - hire two engineers at $9K/mo each, double the marketing spend, sign that new $14K/mo recurring contract - and see the impact against baseline side by side, in seconds. Decisions get better when the alternative is visible.",
      "Forecasts re-run automatically every time new data lands. There's no \"refresh forecast\" button; what you see at any moment is the model's best read on your current trajectory.",
    ],
    useCases: [
      "Tweaxly projects a $34K cash gap in Week 9 driven by a quarterly tax payment plus a slow-paying customer - six weeks of runway to plan around it.",
      "Modelling \"hire 2 engineers at $9K/mo each\" against baseline: cash runway drops from 14 months to 9 months unless monthly recurring revenue grows by $14K within 4 months.",
      "A seasonal landscaping business sets the historical window to 12 months so winter dips don't get projected into the June forecast - and the resulting numbers align with the owner's lived experience.",
    ],
    relatedArticleSlugs: ["financial-forecasting-small-business-guide", "cash-flow-problems-early-warning"],
    faqs: [
      {
        q: "How does AI forecasting work?",
        a: "Tweaxly analyses your transaction history component by component (recurring revenue, one-off revenue, recurring expenses, payment timing, seasonality) and projects each forward. The model surfaces both the projection and the confidence band so you see signal vs. assumption.",
      },
      {
        q: "How accurate is Tweaxly's forecast?",
        a: "Accuracy depends on how much history you've imported and how stable your business is. The confidence band reflects this honestly - it widens for businesses with less history or more volatility. Most SMBs with 12+ months of data see useful, decision-grade forecasts.",
      },
      {
        q: "Can I model multiple scenarios at once?",
        a: "Yes. The scenario builder lets you stack scenarios (hire + new contract + marketing change) and see the combined impact against baseline.",
      },
    ],
  },
  {
    slug:       "ai-consultation",
    categoryId: "business-consultation",
    metaTitle:  "AI Financial Consultation | Tweaxly Features",
    metaDescription:
      "Ask any question about your own business numbers in plain English. Tweaxly's AI advisor grounds every answer in your real transactions - not a generic LLM response.",
    keywords: [
      "AI financial advisor",
      "AI business consultation",
      "ask questions about my business",
      "AI CFO for SMB",
      "financial advisor for small business",
      "Tweaxly AI",
    ],
    h1: "AI Financial Consultation for Business Owners",
    subtitle:
      "An AI advisor that already knows your numbers. Ask anything in plain English; every answer is grounded in your real transactions, not a generic LLM response.",
    deepExplanation: [
      "Most chatbots can't see your business data. Tweaxly's AI advisor can - and that single difference is what separates useful financial consultation from generic LLM chat.",
      "Every consultation runs in the context of your actual transactions, categories, signals and forecasts. Ask \"why did profit drop in April\" and the advisor cites the specific transactions that account for the drop, explains the why, and recommends a next step. Ask \"what should I watch this month\" and the answer is shaped by your business - not a textbook.",
      "Contextual consultation is where the advisor earns its keep. Hit \"Consult\" on any signal, report or forecast and the conversation opens pre-loaded with the relevant data, category, period and comparison window. No copy-pasting, no re-explaining context.",
      "Conversations are saved. You can return weeks later to a previous consultation, run the same question against fresh data, or share a thread with an accountant or partner.",
    ],
    useCases: [
      "\"Why did our profit drop in April?\" → Tweaxly cites the three transactions that account for 72% of the drop and explains each one.",
      "From a High-severity vendor-cost-spike signal: hit Consult and the conversation opens with the vendor, the months affected, the comparable category, and three recommended actions to take.",
      "On the Expenses report, the suggested-question list shows \"Which suppliers grew the most?\" - the answer comes back with a ranked list, percentages and a Consult link to keep digging.",
    ],
    relatedArticleSlugs: ["what-is-ai-financial-advisor", "spreadsheets-not-enough"],
    faqs: [
      {
        q: "Is the AI Consultation a chatbot?",
        a: "It's a chat interface, but it's not a generic chatbot. The advisor sees your transactions, categories and the context you're in - so every answer is grounded in your real data, not a hallucinated response.",
      },
      {
        q: "Does Tweaxly send my financial data to an external AI provider?",
        a: "Queries are processed via Anthropic's Claude API with a strict no-training policy on customer data. Your raw transactions stay in your Tweaxly workspace; only the minimum needed to answer the question is included in the model context.",
      },
      {
        q: "Can the AI advisor replace my accountant?",
        a: "No - and it's not trying to. The AI advisor helps you understand your numbers, ask better questions and make faster decisions. Your accountant still handles tax filings, statutory reporting and the regulated work.",
      },
    ],
  },
  {
    slug:       "multi-currency",
    categoryId: "data-integrations",
    metaTitle:  "Multi-Currency Intelligence | Tweaxly Features",
    metaDescription:
      "Tweaxly detects multiple currencies, converts totals into the business base currency, and explains every currency-aware calculation clearly.",
    keywords: [
      "multi-currency reports",
      "currency conversion",
      "SMB financial reports",
      "AI business intelligence",
      "currency-aware dashboard",
      "Tweaxly",
    ],
    h1: "Multi-Currency Intelligence for International Businesses",
    subtitle:
      "Automatic currency detection, transparent base-currency conversion and tooltips that always show the original breakdown. Any number that crossed currencies is explained, never silently assumed.",
    deepExplanation: [
      "International SMBs run their books in multiple currencies but make decisions in one. Tweaxly bridges that gap transparently - every transaction is recorded in its original currency, and every aggregate is converted into your business base currency for reporting.",
      "Currency detection happens automatically on import. Tweaxly parses the currency code from each transaction, applies the appropriate exchange rate (ECB reference rates via the Frankfurter API, fetched per transaction date) and stores both the original amount and the converted amount.",
      "Wherever a total spans more than one currency, Tweaxly shows a tooltip with the original breakdown, the conversion rate used and the source. There are no silent assumptions - if a number depends on FX, you can always see how it was built.",
      "Manual rate overrides are supported. When a transaction was settled at a contractually-agreed rate different from the market rate, you can override it with a note - and the override is recorded in the audit log so it's reproducible later.",
    ],
    useCases: [
      "A consultancy invoicing in EUR and USD but operating in GBP sees a unified £ revenue total, with a tooltip showing the original €/$ breakdown and the FX rate used per transaction.",
      "An e-commerce business with Stripe revenue in 4 currencies gets a single base-currency revenue line in every report - hover for the original-currency split.",
      "An owner contracts a supplier at a fixed EUR rate; they override Tweaxly's market rate for that transaction with a note - the override is preserved across every report and tagged in the audit log.",
    ],
    relatedArticleSlugs: ["spreadsheets-not-enough"],
    faqs: [
      {
        q: "Does Tweaxly support multiple currencies?",
        a: "Yes - all major currencies are detected automatically and converted into your business base currency. Conversion uses the rate on the transaction date, and you can override it manually with an audit note if needed.",
      },
      {
        q: "Which exchange-rate source does Tweaxly use?",
        a: "European Central Bank reference rates via the Frankfurter API, fetched per transaction date. The rate, the source and the date are all kept on record.",
      },
      {
        q: "Can I change my business base currency later?",
        a: "Yes, though it's a significant operation - all historical totals get re-converted. Tweaxly will walk you through it and preserve the original-currency record on every transaction so nothing is lost.",
      },
    ],
  },
  {
    slug:       "alerts",
    categoryId: "alerts-monitoring",
    metaTitle:  "Business Alerts & Monitoring | Tweaxly Features",
    metaDescription:
      "Set thresholds that matter for your business - cash floor, expense ceiling, vendor spikes - and let Tweaxly watch them continuously. Real-time monitoring with severity-tagged alerts.",
    keywords: [
      "business alerts",
      "cash flow alerts",
      "expense alerts",
      "SMB monitoring",
      "real-time financial monitoring",
      "Tweaxly alerts",
    ],
    h1: "Business Alerts & Continuous Financial Monitoring",
    subtitle:
      "Set the thresholds that matter - cash floor, expense ceiling, vendor concentration - and let Tweaxly watch them around the clock.",
    deepExplanation: [
      "Tweaxly's alert layer is built around owner-defined thresholds. You decide what's worth knowing: a cash floor that triggers a warning before payroll is at risk, an expense ceiling that flags creep before it becomes a problem, a vendor-concentration limit that catches risk before it bites.",
      "Threshold alerts complement AI Business Signals. Signals catch the implicit anomalies (unusual swings against your historical baseline); thresholds catch the explicit limits you've committed to. Most owners use both - signals as the radar, thresholds as the tripwire.",
      "Alerts are routed by rules you define. Critical alerts hit email and in-app; Medium can stay in-app only; Low can roll up into a weekly digest. The point is to make sure the right things get through without training you to ignore the rest.",
      "The Business Monitoring panel is the continuously-updated view of business health that sits behind every alert. Cash position, runway, margin, vendor concentration - all live, all readable in 30 seconds.",
    ],
    useCases: [
      "\"Notify me if cash falls below $25K\" - the owner gets a same-day alert when payroll pushes cash to $22.8K, with 10 days of runway and three recommended actions.",
      "An expense-ceiling alert fires when monthly software spend exceeds $2,500 - the owner finds three duplicate SaaS subscriptions and cancels two.",
      "A vendor-concentration alert fires when any single vendor's share of monthly spend exceeds 30% - catches supplier-lock-in risk before contract renewal.",
    ],
    relatedArticleSlugs: ["cash-flow-problems-early-warning", "business-signals-founders-monitor"],
    faqs: [
      {
        q: "Can I set custom alert thresholds?",
        a: "Yes. Cash floor, expense ceiling, single-vendor share, revenue drop, margin floor - all configurable per business. You set the number; Tweaxly watches it.",
      },
      {
        q: "Can Tweaxly detect unusual expenses without me setting a threshold?",
        a: "Yes. AI Business Signals catch implicit anomalies - unusual swings against your historical baseline - even when no fixed threshold has been crossed. Most owners use signals and thresholds together.",
      },
      {
        q: "How do I get alerts - email, SMS, in-app?",
        a: "Email and in-app are supported today. SMS is on the roadmap. Per-severity routing rules let you mix channels (eg Critical to email + in-app, Medium to in-app only).",
      },
    ],
  },
];

export function getSubpage(slug: string): SubpageContent | null {
  return SUBPAGES.find((s) => s.slug === slug) ?? null;
}

export function subpageSlugs(): string[] {
  return SUBPAGES.map((s) => s.slug);
}

export function categoryById(id: string): FeatureCategory | null {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}
