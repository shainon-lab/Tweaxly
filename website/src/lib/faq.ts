// Single source of truth for the FAQ content. Both the dedicated
// /faq page and any homepage teaser pull from this list so the copy
// stays in sync.

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Tweaxly?",
    a: "Tweaxly is an AI financial intelligence platform for small and medium business owners. It connects your financial activity, surfaces business signals in real time, runs cash flow forecasting and revenue forecasting, and gives you an AI financial advisor that understands your real numbers — so you can run your business with the clarity of a finance team without hiring one.",
  },
  {
    q: "What is an AI financial advisor?",
    a: "An AI financial advisor reads the actual numbers in your business — categories, vendors, payroll, monthly snapshots — and answers questions about them in plain English. Unlike a generic finance chatbot, it references your real data (\"Marketing spend in May was $1,100, down from $2,400 in April\") and reasons over financial trends, cash flow, and forecasts you can verify.",
  },
  {
    q: "How does AI financial forecasting work?",
    a: "Tweaxly's forecasting engine combines validated historical actuals with detected trends, recurring patterns, light seasonality, and your own scenarios into an explainable projection. Every forecasted number is traceable to a baseline period, growth assumption, and confidence score — no black-box AI predictions.",
  },
  {
    q: "Can Tweaxly help with cash flow forecasting?",
    a: "Yes — cash flow forecasting is one of the core surfaces. The platform projects expected revenue, expenses, payroll, and net cash position month by month, and lets you layer hires, marketing changes, contracts, and one-time items on top to model what-if scenarios.",
  },
  {
    q: "Is Tweaxly a financial planning platform?",
    a: "Yes. Tweaxly is built for AI-powered financial planning — financial forecasting, scenario modeling, expense tracking and forecasting, revenue forecasting, and business performance analytics — all in one financial intelligence platform.",
  },
  {
    q: "How does AI detect business signals?",
    a: "Tweaxly continuously watches every line of your financial data and flags changes worth your attention — vendor cost spikes, margin compression, cash risks, unusual financial behavior, and growth opportunities — using statistical thresholds plus AI interpretation, with a confidence level on every signal.",
  },
  {
    q: "Can I track business expenses and revenue in real time?",
    a: "Yes. Connect or upload bank, card, and payment-processor data and the platform produces a real-time financial dashboard with revenue, expenses, payroll, profitability, and cash flow updated as new data arrives.",
  },
  {
    q: "Is Tweaxly suitable for small businesses?",
    a: "Tweaxly is built specifically for small and medium business owners who need financial intelligence without hiring a CFO. It's small business financial software designed around the questions owners actually ask — am I profitable, what changed, what should I do about it?",
  },
  {
    q: "What makes Tweaxly different from accounting software?",
    a: "Tweaxly isn't bookkeeping or ERP. It's the intelligence layer above the systems you already use — it reads your data, tells you what changed, what matters, and what to do next. Your accountant still does the books; Tweaxly turns those books into business insights.",
  },
  {
    q: "Can Tweaxly forecast future business performance?",
    a: "Yes — Tweaxly produces forward-looking projections for revenue, expenses, payroll, profitability, and cash flow, with confidence bands. Forecasts are based on validated historical data and respect the financial-date rule (no in-progress months distorting the trend).",
  },
  {
    q: "How does the AI advisory system work?",
    a: "The AI advisor sees your aggregated business context — current and trailing-month snapshots, top vendors, top categories, employees, forecast, recent uploads, and free-text notes from your own transactions — and uses that to answer free-form questions about your business in real time.",
  },
  {
    q: "Does Tweaxly replace a CFO?",
    a: "Tweaxly doesn't replace a senior CFO for complex M&A or capital-strategy work, but it covers the day-to-day financial intelligence most SMBs hire fractional CFOs for — financial planning, forecasting, expense tracking, business performance analytics, and decision-support advisory.",
  },
  {
    q: "Can I connect multiple business accounts?",
    a: "Yes. Owners with more than one business can run multiple workspaces under a single login. Each workspace has its own base currency, fiscal year, transactions, forecast, and AI advisor context.",
  },
  {
    q: "How does financial trend analysis work?",
    a: "Tweaxly compares each period to its trailing window and to comparable prior periods to surface trends — revenue growth, margin shifts, payroll ratio changes, expense-category trajectories — and explains them in plain language with the underlying numbers attached.",
  },
  {
    q: "Can Tweaxly identify unusual business activity?",
    a: "Yes. Statistical outlier detection plus pattern matching identifies unusual months, vendor cost spikes, missing expected income, duplicate transactions, and other irregularities. These surface in the signals deck with severity tags and recommended actions.",
  },
  {
    q: "What financial metrics does Tweaxly monitor?",
    a: "Revenue, expenses, net profit, normalized profit (one-times excluded), fixed and variable expenses, payroll, marketing spend, processing fees, taxes, one-time costs, gross margin, cash flow, payroll-to-revenue ratio, marketing-to-revenue ratio — plus per-category and per-vendor totals.",
  },
  {
    q: "Do I need to be technical or financially trained?",
    a: "No. Tweaxly is built for owners, not accountants. Every screen is designed around the questions you actually ask, and the AI advisor accepts plain-English questions and answers in plain English — no formulas, no SQL, no spreadsheets.",
  },
  {
    q: "Is my data secure?",
    a: "Your business data lives in your private workspace and is never used to train shared models. We process only the minimum data needed to generate the dashboards, signals, forecasts, and answers you see.",
  },
  {
    q: "How much does it cost?",
    a: "We're onboarding a small group of business owners during early access. Pricing will be announced closer to general availability — sign up and we'll keep you posted.",
  },
];
