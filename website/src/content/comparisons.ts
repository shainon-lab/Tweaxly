// Comparison-page registry: Tweaxly vs Excel / Accounting Software /
// Static Dashboards. Each entry powers one /compare/[slug] page.
//
// GEO note: comparison pages are some of the most-cited content in
// AI search ("how is X different from Y") - so every row in the
// table, every prose paragraph and every FAQ is written to be
// extractable as a standalone snippet.

export type ComparisonSlug = "excel" | "accounting-software" | "dashboards";

export interface ComparisonRow {
  dimension: string;   // e.g. "Anomaly detection"
  competitor: string;  // value for the comparison subject
  tweaxly: string;     // value for Tweaxly
}

export interface ComparisonFaq { q: string; a: string }

export interface ComparisonContent {
  slug:            ComparisonSlug;
  // Display name of the comparison subject. Plural-safe.
  subject:         string;        // "Excel", "Traditional Accounting Software"
  headline:        string;        // page H1
  subtitle:        string;        // 1-2 sentence framing under H1

  metaTitle:       string;
  metaDescription: string;
  keywords:        string[];

  // 2-4 short paragraphs framing the comparison. AI-readable.
  intro:           string[];

  // The comparison table itself.
  rows:            ComparisonRow[];

  // "When [subject] is the right tool" / "When Tweaxly is the right
  // tool" - balanced framing, not a hit piece.
  whenSubject:     string[];
  whenTweaxly:     string[];

  // Concrete use cases / scenarios.
  useCases:        string[];

  // 4-6 FAQs for this comparison page (own FAQPage JSON-LD).
  faqs:            ComparisonFaq[];

  // Related resources article slugs.
  relatedArticleSlugs?: string[];
}

// ─────────────────────────────────────────────────────────────────────

export const COMPARISONS: ComparisonContent[] = [
  // ── Tweaxly vs Excel ────────────────────────────────────────────
  {
    slug:    "excel",
    subject: "Excel",
    headline:
      "Tweaxly vs Excel: When to Move From Spreadsheets to AI Business Intelligence",
    subtitle:
      "Spreadsheets are great for one-off analysis. They're not built for continuous business intelligence. Here's where Tweaxly takes over.",

    metaTitle:
      "Tweaxly vs Excel | AI Business Intelligence vs Spreadsheets",
    metaDescription:
      "How Tweaxly compares to Excel for small business financial management. Real-time business signals, AI forecasting, multi-currency reports - and what spreadsheets still do well.",
    keywords: [
      "Tweaxly vs Excel",
      "Excel alternative for small business",
      "AI business intelligence vs spreadsheets",
      "SMB financial dashboard alternative",
      "replace Excel for finance",
      "Tweaxly comparison",
    ],

    intro: [
      "Most small business owners run their finances out of a spreadsheet. It's free, familiar and infinitely flexible. For one-off analysis - building a quick model, checking a number, prepping a board slide - Excel is still the right tool.",
      "It stops being the right tool the moment you need the analysis to run continuously, the data to come from multiple sources, or the system to surface changes you didn't know to look for. That's the gap Tweaxly fills.",
      "Tweaxly isn't trying to replace Excel for ad-hoc modelling. It replaces the spreadsheet you keep meaning to update on Sunday night - the one tracking your business performance, your cash position, your top vendors, your forecasts. Tweaxly keeps that view live, AI-monitored and explainable, so you don't have to maintain it.",
    ],

    rows: [
      { dimension: "Setup time",
        competitor: "Hours to days (build formulas, format, validate)",
        tweaxly:    "5 minutes from CSV import to working dashboard" },
      { dimension: "Data updates",
        competitor: "Manual - someone has to remember and re-enter",
        tweaxly:    "Continuous - reports and forecasts re-run on every import" },
      { dimension: "Anomaly detection",
        competitor: "None unless explicitly built (and rarely maintained)",
        tweaxly:    "AI Business Signals - automatic, severity-tagged, explained" },
      { dimension: "Cash flow forecasting",
        competitor: "Manually-built models that drift the moment the business changes",
        tweaxly:    "AI forecast engine with confidence bands, re-runs on every update" },
      { dimension: "Scenario planning",
        competitor: "Possible, but every scenario = a new tab or workbook",
        tweaxly:    "Built-in scenario builder, side-by-side comparison in seconds" },
      { dimension: "Multi-currency support",
        competitor: "Manual conversion with hard-coded rates (out of date)",
        tweaxly:    "Automatic detection + ECB-rate conversion with audit log" },
      { dimension: "AI assistance",
        competitor: "Generic LLM that can't see your numbers",
        tweaxly:    "Built-in advisor grounded in your actual transactions" },
      { dimension: "Error risk",
        competitor: "High - formula errors, broken refs, copy-paste mistakes",
        tweaxly:    "Calculations are versioned and validated; no fragile formulas" },
      { dimension: "Collaboration",
        competitor: "Email a file, hope no-one overwrites it",
        tweaxly:    "Single source of truth, role-based access" },
      { dimension: "Audit trail",
        competitor: "None by default",
        tweaxly:    "Every conversion, override and category change is logged" },
      { dimension: "Mobile-friendly",
        competitor: "Painful - shrunken cells, broken formulas on mobile Excel",
        tweaxly:    "Built mobile-first - dashboards, signals and forecasts read on a phone" },
      { dimension: "Cost",
        competitor: "Free, plus the cost of your time maintaining it",
        tweaxly:    "Free during early access, then a flat monthly plan" },
    ],

    whenSubject: [
      "You're building a one-off model for a single decision (a fundraising pitch, a tax projection, a sensitivity analysis on a specific deal).",
      "You need infinite flexibility for unusual calculations that don't fit a structured product.",
      "Your accountant or finance team is doing the heavy lifting and you're just opening the workbook to check a cell.",
    ],
    whenTweaxly: [
      "You want a live view of how your business is doing - not a snapshot you have to update.",
      "You need anomalies, signals and forecasts to surface themselves, not be manually checked.",
      "You're running on CSV exports from your bank or accounting software and rebuilding the same view every month.",
      "You operate in more than one currency.",
      "You want an AI advisor you can ask questions of, grounded in your real numbers.",
    ],

    useCases: [
      "A founder who has been maintaining a \"company financials\" workbook for 18 months imports the same CSVs into Tweaxly in 5 minutes and gets a continuously-updated dashboard, signals and a 12-month forecast - without rebuilding a single formula.",
      "An owner who spent 6 hours every Sunday updating a cash flow spreadsheet moves to Tweaxly's forecast engine and reclaims the day.",
      "A B2B services business with EUR / USD / GBP invoices stops manually converting in Excel - Tweaxly handles it with ECB rates and audit-logs every conversion.",
    ],

    faqs: [
      {
        q: "Can Tweaxly import data from my existing Excel spreadsheets?",
        a: "Yes - export your spreadsheet to CSV (File → Save As → CSV) and drop it in. Most bank-export and accounting-software-export columns are recognised automatically; on first upload Tweaxly will guide you through mapping any non-standard column.",
      },
      {
        q: "Will I still need Excel after switching to Tweaxly?",
        a: "Probably, yes - for one-off models, ad-hoc analysis, custom calculations that don't fit a structured product. Tweaxly replaces the spreadsheet you maintain for continuous business tracking, not the spreadsheet you build for a single decision.",
      },
      {
        q: "How much time do owners save moving from Excel to Tweaxly?",
        a: "Most early users report saving 2-6 hours a week of spreadsheet maintenance time. The bigger win is what they catch that they would have missed - business signals that surface anomalies a static spreadsheet would never flag.",
      },
      {
        q: "Is Excel cheaper than Tweaxly?",
        a: "On paper - if you don't value your time. Excel is free; Tweaxly is free during early access and then a flat plan. The real cost of Excel is the hours of upkeep plus the cost of decisions made on stale data.",
      },
      {
        q: "What happens to my historical Excel data?",
        a: "Once imported into Tweaxly it lives in your workspace alongside any new transactions you add. You can export anything back to CSV or Excel at any point - no lock-in.",
      },
    ],

    relatedArticleSlugs: ["spreadsheets-not-enough", "business-signals-founders-monitor"],
  },

  // ── Tweaxly vs Traditional Accounting Software ──────────────────
  {
    slug:    "accounting-software",
    subject: "Traditional Accounting Software",
    headline:
      "Tweaxly vs Traditional Accounting Software: Two Different Jobs",
    subtitle:
      "QuickBooks, Xero and FreshBooks record what happened. Tweaxly explains what's happening, projects what's next, and recommends what to do. Most SMBs need both.",

    metaTitle:
      "Tweaxly vs QuickBooks, Xero & Accounting Software | Tweaxly",
    metaDescription:
      "How Tweaxly compares to traditional accounting software for small business owners. Accounting records the past; Tweaxly explains, forecasts and advises in real time using AI.",
    keywords: [
      "Tweaxly vs QuickBooks",
      "Tweaxly vs Xero",
      "accounting software alternative",
      "AI business intelligence vs accounting",
      "small business financial intelligence",
      "Tweaxly comparison",
    ],

    intro: [
      "Traditional accounting software - QuickBooks, Xero, FreshBooks, Sage and similar - is built for one job: recording what happened to the business so the books are clean, tax filings are correct and an accountant can close the period. It does that job well.",
      "Tweaxly is built for a different job: helping the owner understand what's happening, what's coming next, and what to do about it. That's an intelligence layer, not a bookkeeping layer.",
      "These two systems are complementary, not competitive. Most SMBs that adopt Tweaxly keep their accounting software for compliance and use Tweaxly for decisions - signals, forecasts, scenario planning and an AI advisor that can read their numbers.",
    ],

    rows: [
      { dimension: "Primary purpose",
        competitor: "Bookkeeping and tax-ready ledgers",
        tweaxly:    "Business intelligence and decision support" },
      { dimension: "Primary user",
        competitor: "Bookkeeper or accountant",
        tweaxly:    "Business owner / operator" },
      { dimension: "View of time",
        competitor: "Past (what happened)",
        tweaxly:    "Present + future (what's happening, what's coming)" },
      { dimension: "AI insights",
        competitor: "Minimal - rule-based categorisation, sometimes a chatbot",
        tweaxly:    "Built-in: signals, advisor, forecast summaries, contextual recommendations" },
      { dimension: "Forecasting depth",
        competitor: "Basic cash projections at best",
        tweaxly:    "Full forecast engine + scenario builder with confidence bands" },
      { dimension: "Business signals",
        competitor: "None or generic threshold alerts",
        tweaxly:    "AI-detected anomalies, severity-tagged, paired with an action" },
      { dimension: "Scenario planning",
        competitor: "Not supported as a first-class feature",
        tweaxly:    "Hire, cut, contract, marketing-spend - model side-by-side with baseline" },
      { dimension: "AI consultation",
        competitor: "Not designed for it",
        tweaxly:    "Business-aware AI advisor that sees your transactions" },
      { dimension: "Multi-currency UX",
        competitor: "Functional but opaque",
        tweaxly:    "Transparent conversion + tooltips + audit log on every aggregate" },
      { dimension: "Setup",
        competitor: "Chart of accounts, tax codes, integrations - hours to days",
        tweaxly:    "CSV import + base currency - 5 minutes" },
      { dimension: "Owner-facing UI",
        competitor: "Built for finance pros",
        tweaxly:    "Built for owners - plain English, no accounting vocabulary required" },
    ],

    whenSubject: [
      "You need invoicing, payroll, tax filings, statutory reports and a clean general ledger.",
      "You have an accountant or bookkeeper who lives in the system.",
      "You need bank-feed integrations, deep integration with payroll providers, and other compliance-oriented capabilities.",
    ],
    whenTweaxly: [
      "You want decision-grade insight from your numbers, not just a bookkeeping record.",
      "You want to know what changed and why, the moment it changes.",
      "You want forecasts and scenarios you can act on, not just historical reports.",
      "You want an AI advisor grounded in your actual business data.",
    ],

    useCases: [
      "An owner running QuickBooks for invoicing and tax keeps using it for those jobs, exports a monthly transactions CSV into Tweaxly, and uses Tweaxly for the Monday-morning \"how are we doing\" view.",
      "A founder whose Xero dashboard never matched their mental model of the business adopts Tweaxly to get the owner-facing view - and keeps Xero for the bookkeeper.",
      "A consultancy moves from \"once-a-quarter look at the P&L\" to continuous monitoring + AI signals - without changing how the books are kept.",
    ],

    faqs: [
      {
        q: "Do I need to stop using QuickBooks (or Xero / FreshBooks) to use Tweaxly?",
        a: "No. Tweaxly sits alongside your accounting software, not in place of it. Most users export a transactions CSV from their accounting tool and import it into Tweaxly - the accounting tool keeps doing its job, Tweaxly adds the intelligence layer on top.",
      },
      {
        q: "Is Tweaxly accounting software?",
        a: "No. Tweaxly is an AI business intelligence platform for SMB owners. It explains, forecasts and advises - it doesn't keep the books, file taxes or generate statutory reports. For those, you still want accounting software.",
      },
      {
        q: "Why not just use my accounting software's built-in dashboard?",
        a: "Accounting dashboards are designed by accountants for accountants - they show ledger health, not business health. They also rarely include AI-detected signals, real forecasting, scenario planning or a business-aware advisor. Tweaxly's UI and feature set are built around how owners think, not how the books are organised.",
      },
      {
        q: "What makes Tweaxly different from accounting software?",
        a: "Accounting software records what happened so the books are clean. Tweaxly explains what's happening, projects what's next, surfaces business signals as they appear, supports scenario planning, and includes an AI advisor grounded in your real data. Different jobs, same source data.",
      },
      {
        q: "Can my accountant export reports from Tweaxly?",
        a: "Yes - every report exports as Excel, CSV or PDF, with the underlying transactions, period, categorisation and any currency conversion notes attached. Accountants get full traceability.",
      },
    ],

    relatedArticleSlugs: ["spreadsheets-not-enough", "what-is-ai-financial-advisor"],
  },

  // ── Tweaxly vs Static Dashboards ────────────────────────────────
  {
    slug:    "dashboards",
    subject: "Static BI Dashboards",
    headline:
      "Tweaxly vs Static Dashboards: From Showing Data to Explaining It",
    subtitle:
      "Power BI, Tableau and generic SaaS dashboards display your numbers beautifully. Tweaxly explains them, forecasts forward, and tells you what to do.",

    metaTitle:
      "Tweaxly vs Static Dashboards (Power BI, Tableau) | Tweaxly",
    metaDescription:
      "How Tweaxly compares to traditional BI dashboards like Power BI and Tableau for small businesses. AI signals, plain-English forecasts and a business-aware advisor - not just charts.",
    keywords: [
      "Tweaxly vs Power BI",
      "Tweaxly vs Tableau",
      "AI dashboard alternative",
      "static BI vs AI insights",
      "SMB business intelligence",
      "Tweaxly comparison",
    ],

    intro: [
      "Static BI dashboards - Power BI, Tableau, Looker, and most embedded SaaS dashboards - are display layers. They visualise data that's already organised, on questions someone already knew to ask. Beautiful, often expensive, and entirely passive.",
      "Tweaxly is an intelligence layer. The same data goes in, but Tweaxly pushes signals when something material shifts, projects forward with confidence bands, runs scenarios on demand and answers business questions in plain English via an AI advisor.",
      "If you've ever opened a dashboard, looked at it, and thought \"…okay, but what does that mean for me?\" - that gap is what Tweaxly closes.",
    ],

    rows: [
      { dimension: "Primary mode",
        competitor: "Display - you look at it",
        tweaxly:    "Conversation - it tells you when something matters" },
      { dimension: "Anomaly detection",
        competitor: "Manual - you have to spot it",
        tweaxly:    "AI Business Signals, severity-tagged + explained" },
      { dimension: "Plain-English explanation",
        competitor: "None - charts only",
        tweaxly:    "Every signal, forecast and report ships with an English summary" },
      { dimension: "Forecasting",
        competitor: "Requires custom modelling per chart",
        tweaxly:    "Built-in forecast engine with confidence bands" },
      { dimension: "Scenario builder",
        competitor: "Not native - build your own DAX or workbook",
        tweaxly:    "First-class feature, side-by-side with baseline" },
      { dimension: "AI advisor",
        competitor: "Bolt-on chatbot at best",
        tweaxly:    "Grounded in your actual transactions, contextual to where you are" },
      { dimension: "Setup",
        competitor: "Data modelling, semantic layer, dashboard authoring",
        tweaxly:    "CSV import - dashboard and signals are pre-built" },
      { dimension: "Maintenance",
        competitor: "Ongoing - someone owns the dashboards",
        tweaxly:    "None - reports and forecasts re-run on every import" },
      { dimension: "Cost",
        competitor: "$10-$70 per user per month + setup labour",
        tweaxly:    "Free in early access, flat plan after" },
      { dimension: "Built for SMBs",
        competitor: "Built for enterprises with BI teams",
        tweaxly:    "Built for owners running the business themselves" },
    ],

    whenSubject: [
      "You have a BI team that authors dashboards and a defined semantic layer.",
      "You need pixel-perfect, brand-controlled embedded dashboards for customer-facing analytics.",
      "Your data lives across many systems and the primary need is unification + display.",
    ],
    whenTweaxly: [
      "You're the person looking at the dashboard - not the person building it.",
      "You want the system to surface anomalies, not just visualise data you have to interpret.",
      "You want forecasts, scenarios and AI advice on top of the visuals, not just the visuals themselves.",
      "You don't have (or want) a BI team to maintain dashboards for you.",
    ],

    useCases: [
      "An owner who paid for a Power BI dashboard project last year and hasn't opened it in 3 months replaces it with Tweaxly's pre-built dashboards + AI signals - zero maintenance, every report up to date.",
      "A founder who keeps asking their analyst the same three questions (\"how's revenue tracking?\", \"any vendor problems?\", \"what's our runway?\") gets all three answered automatically by Tweaxly signals + the AI advisor.",
      "A growing SMB shelving plans to hire a BI/data analyst, because Tweaxly covers 80% of what they wanted that hire for.",
    ],

    faqs: [
      {
        q: "How is Tweaxly different from Power BI or Tableau?",
        a: "Power BI and Tableau are display layers - they show data that's already modelled, on charts someone already authored. Tweaxly is an intelligence layer: it surfaces anomalies, projects forecasts, runs scenarios and answers questions in plain English via an AI advisor. Same data, completely different output.",
      },
      {
        q: "Can Tweaxly replace my existing BI dashboard?",
        a: "For most SMB use cases, yes - revenue tracking, expense monitoring, cash flow forecasting, vendor analysis, signals and an AI advisor all come pre-built. For enterprise-scale custom analytics or customer-facing embedded dashboards, traditional BI is still the right tool.",
      },
      {
        q: "Do I need a data analyst to use Tweaxly?",
        a: "No - Tweaxly is built for the owner. There's no dashboard authoring, no semantic layer, no DAX. Import your transactions and the dashboards, signals, forecasts and AI advisor are all immediately live.",
      },
      {
        q: "What does \"AI dashboard\" actually mean in Tweaxly?",
        a: "It means the dashboard doesn't just show numbers - it interprets them. Anomalies are flagged automatically (with severity and a recommended action), forecasts ship with plain-English summaries, and an AI advisor sits one click away from any chart so you can ask follow-up questions in your own words.",
      },
      {
        q: "Is Tweaxly cheaper than Power BI or Tableau?",
        a: "Yes. Both Power BI and Tableau charge per user, with setup labour costs that often dwarf the licence fee for SMBs. Tweaxly is free during early access and will move to a flat plan - and there's no dashboard build-out to pay for.",
      },
    ],

    relatedArticleSlugs: ["business-signals-founders-monitor", "what-is-ai-financial-advisor"],
  },
];

export function getComparison(slug: string): ComparisonContent | null {
  return COMPARISONS.find((c) => c.slug === slug) ?? null;
}

export function comparisonSlugs(): string[] {
  return COMPARISONS.map((c) => c.slug);
}
