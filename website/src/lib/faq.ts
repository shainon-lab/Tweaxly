// Single source of truth for the FAQ content. Both the /faq page
// and any homepage teaser pull from here. Questions are grouped
// into categories for the visible UI; the FAQPage JSON-LD on /faq
// emits the flat list (Google ignores groupings inside FAQPage).
//
// GEO note: every answer is written as a standalone, AI-citable
// snippet - the question can be quoted by an AI engine and the
// answer extracted without surrounding context.

export interface FaqItem { q: string; a: string }

export interface FaqCategory {
  id:    string;   // anchor + jump-link target
  label: string;   // section heading
  blurb: string;   // 1-sentence intro under the heading
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id:    "getting-started",
    label: "Getting started",
    blurb: "What Tweaxly is, who it's for, and how to get up and running.",
    items: [
      {
        q: "What is Tweaxly?",
        a: "Tweaxly is an AI-powered business intelligence platform for small and medium business owners. It turns your real financial activity into business signals, financial reports, forecasts, scenario planning and an AI advisor you can ask questions of - in plain English, in real time. Tweaxly is not accounting software; it's the intelligence layer above it.",
      },
      {
        q: "Who is Tweaxly for?",
        a: "Business owners and operators of small and medium businesses - typically $250K to $25M in annual revenue - who want decision-grade insight from their numbers without hiring a finance team. Founders, owner-operators, fractional CFOs and operations leads all use Tweaxly as the place where the business gets understood.",
      },
      {
        q: "How long does it take to set up Tweaxly?",
        a: "About 5 minutes. Create an account, set your business base currency, upload a CSV of your transactions, and the Quick Overview, signals and forecast start populating immediately. Categorisation happens automatically on first upload and you can refine it as you go.",
      },
      {
        q: "Do I need to be technical or financially trained to use Tweaxly?",
        a: "No. Tweaxly is built for owners, not accountants. Every screen is designed around the questions owners actually ask, and the AI advisor accepts plain-English questions and answers in plain English - no formulas, no SQL, no spreadsheets.",
      },
    ],
  },
  {
    id:    "ai-intelligence",
    label: "AI & business intelligence",
    blurb: "How the AI in Tweaxly actually works - signals, forecasts and the advisor.",
    items: [
      {
        q: "What is AI business intelligence?",
        a: "AI business intelligence is software that doesn't just display your data - it interprets it. Where a traditional dashboard shows revenue, expenses and cash on charts, AI business intelligence detects anomalies, projects the data forward, runs scenarios on demand and answers questions in plain language. Tweaxly is built around that distinction: it's an intelligence layer on top of your financial data, not a display layer.",
      },
      {
        q: "How does AI financial forecasting work in Tweaxly?",
        a: "Tweaxly analyses your transaction history component by component - recurring revenue, one-off revenue, recurring expenses, payment timing, seasonality - and projects each one forward. The model surfaces both the projection and a confidence band so you see signal vs. assumption. Forecasts re-run automatically whenever new data lands.",
      },
      {
        q: "What is an AI financial advisor?",
        a: "An AI financial advisor reads the actual numbers in your business and answers questions about them in plain English. Unlike a generic LLM chatbot, Tweaxly's advisor sees your transactions, categories, vendors and the context you're in (a specific signal, report or forecast) - so every answer is grounded in your real data, not hallucinated.",
      },
      {
        q: "How does Tweaxly detect business signals?",
        a: "Tweaxly continuously evaluates your financial activity against statistical baselines and pattern-matching rules, and flags changes worth attention - vendor cost spikes, margin compression, cash risk, customer concentration, revenue drops, growth opportunities. Every signal is tagged Low / Medium / Medium-High / High / Critical and paired with a recommended action, not just a number.",
      },
      {
        q: "Can Tweaxly detect unusual expenses?",
        a: "Yes - two ways. Threshold alerts catch the explicit limits you set (\"notify me if any vendor exceeds $X\"), and AI Business Signals catch the implicit ones - unusual swings against your historical baseline, even when no fixed threshold has been crossed. Most owners use both.",
      },
    ],
  },
  {
    id:    "data-currency",
    label: "Data, imports & currency",
    blurb: "How data gets in, how multi-currency works, and what's coming next.",
    items: [
      {
        q: "Can I upload CSV files to Tweaxly?",
        a: "Yes. CSV upload is the primary import path during early access. A documented template makes it work with most bank exports out of the box; on first upload Tweaxly will guide you through mapping any non-standard columns. You can export your data back to CSV at any time - no lock-in.",
      },
      {
        q: "Does Tweaxly support multiple currencies?",
        a: "Yes. Tweaxly detects every currency in your transactions, converts amounts into your business base currency for reporting, and clearly indicates conversion via tooltips. Conversion uses European Central Bank reference rates (via the Frankfurter API) on the transaction date, with the rate, source and date kept on record. Manual rate overrides are supported and tagged in the audit log.",
      },
      {
        q: "Does Tweaxly integrate with my bank?",
        a: "Direct bank integrations are on the roadmap. During early access the primary import path is CSV - most bank CSV exports are supported out of the box, and the upload flow guides you through any non-standard columns.",
      },
      {
        q: "Can I manage multiple businesses under one Tweaxly account?",
        a: "Yes. One user can run multiple businesses under a single account and switch between them in a click. Data, base currency, fiscal calendar and notification preferences are kept cleanly separated per business.",
      },
    ],
  },
  {
    id:    "reports-analysis",
    label: "Reports & analysis",
    blurb: "What Tweaxly tracks and what you can do with the output.",
    items: [
      {
        q: "What financial metrics does Tweaxly monitor?",
        a: "Revenue, expenses, net profit, normalised profit (one-offs excluded), fixed and variable expenses, payroll, marketing spend, processing fees, taxes, one-time costs, gross margin, cash flow, payroll-to-revenue ratio, marketing-to-revenue ratio, customer concentration, vendor concentration - plus per-category and per-vendor totals.",
      },
      {
        q: "Can I export Tweaxly reports for my accountant?",
        a: "Yes. Every report exports as Excel, CSV or PDF, with the underlying transactions, period, categorisation and any currency conversion notes attached - so an accountant has full traceability.",
      },
      {
        q: "Does Tweaxly help with cash flow forecasting?",
        a: "Yes - cash flow forecasting is one of Tweaxly's core surfaces. The platform projects expected inflows, outflows, payroll and net cash position forward by month, with confidence bands. You can layer hires, marketing changes, contracts and one-time items on top to model what-if scenarios.",
      },
      {
        q: "How does scenario planning work in Tweaxly?",
        a: "The scenario builder lets you model concrete changes - hire two engineers at $9K/mo each, double marketing, sign a new $14K/mo recurring contract, cut a category - and see the impact against baseline side by side. Decisions get better when the alternative is visible; Tweaxly makes the alternative visible in seconds.",
      },
    ],
  },
  {
    id:    "comparisons",
    label: "Comparisons & positioning",
    blurb: "How Tweaxly relates to the other tools you already use.",
    items: [
      {
        q: "Is Tweaxly accounting software?",
        a: "No. Tweaxly is an AI business intelligence platform for SMB owners. It explains, forecasts and advises - it doesn't keep the books, file taxes or generate statutory reports. For those, you still want accounting software (QuickBooks, Xero, FreshBooks). Tweaxly sits alongside, not in place of, your accounting tool.",
      },
      {
        q: "What makes Tweaxly different from accounting software?",
        a: "Accounting software records what happened so the books are clean. Tweaxly explains what's happening, projects what's next, surfaces business signals as they appear, supports scenario planning, and includes an AI advisor grounded in your real data. Different jobs, same source data. See the full comparison at tweaxly.com/compare/accounting-software.",
      },
      {
        q: "What makes Tweaxly different from dashboards like Power BI or Tableau?",
        a: "Power BI and Tableau are display layers - they show data that's already modelled, on charts someone authored. Tweaxly is an intelligence layer: anomalies surface themselves, forecasts come with plain-English summaries, scenarios run on demand, and an AI advisor sits one click from any chart. Same data, completely different output. See tweaxly.com/compare/dashboards.",
      },
      {
        q: "What's the difference between Tweaxly and Excel for business finance?",
        a: "Excel is great for one-off models - quick what-ifs, a pitch deck, a specific deal. Tweaxly replaces the spreadsheet you maintain for continuous business tracking - the workbook you update every Sunday with this week's numbers. Most owners keep Excel for ad-hoc work and use Tweaxly for the live view. See tweaxly.com/compare/excel.",
      },
      {
        q: "Does Tweaxly replace a CFO?",
        a: "Tweaxly doesn't replace a senior CFO for complex M&A or capital-strategy work, but it covers the day-to-day financial intelligence most SMBs hire fractional CFOs for - financial planning, forecasting, expense tracking, business performance analytics, and decision-support advisory.",
      },
    ],
  },
  {
    id:    "pricing-security",
    label: "Pricing, security & account",
    blurb: "What it costs, how your data is handled, and what's next.",
    items: [
      {
        q: "How much does Tweaxly cost?",
        a: "Tweaxly is free during early access while we onboard the first cohort of business owners. Public pricing will be announced ahead of general availability and early-access users will have the option to lock in early-access terms. Email info@tweaxly.com or sign up to be notified when plans go live.",
      },
      {
        q: "Is my data secure in Tweaxly?",
        a: "Yes. Tweaxly runs on encrypted infrastructure with role-based access; financial data is encrypted in transit and at rest. AI consultation queries are processed via Anthropic's Claude API with a strict no-training policy on customer data - only the minimum context needed to answer is included in the model request. Your raw transactions never leave your workspace.",
      },
      {
        q: "Does Tweaxly use my data to train AI models?",
        a: "No. Your data is yours - we never use it to train shared or third-party models. The AI advisor processes the minimum context needed to answer a specific question, via Anthropic's Claude API under their no-training policy for customer data.",
      },
      {
        q: "What happens to my data if I leave Tweaxly?",
        a: "You can export everything - transactions, categories, reports, signal history, consultation history - as CSV or PDF at any time. There's no lock-in. If you delete your account, your data is removed from the active system and purged from backups within 30 days.",
      },
    ],
  },
];

// Flat list for FAQPage JSON-LD. Order is preserved across categories
// so the schema mirrors the on-page reading order.
export const FAQ: FaqItem[] = FAQ_CATEGORIES.flatMap((c) => c.items);
