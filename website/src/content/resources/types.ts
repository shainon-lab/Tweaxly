// Shape every Resources article exports. Body is a React component so
// each piece can use the article primitives (Lead, Callout, TLDR,
// DefinitionBlock, Formula, ComparisonTable, KeyTakeaways, FAQ, etc.)
// directly in JSX without an MDX toolchain.
//
// The taxonomy below mirrors the Learning Center IA: 10 topical
// categories meant to grow into hundreds of articles + a glossary
// that scales to per-term entries. Category ids ARE the URL slugs;
// keep them stable (a rename means a 301 redirect entry).

import type { ComponentType } from "react";

export type CategoryId =
  | "financial-fundamentals"
  | "business-metrics-kpis"
  | "cash-flow-management"
  | "business-forecasting"
  | "expense-management"
  | "business-growth"
  | "business-intelligence"
  | "business-signals"
  | "small-business-operations"
  | "business-glossary";

export interface CategoryMeta {
  id:          CategoryId;
  label:       string;
  // 1-line surfaced on cards + meta description fallback.
  blurb:       string;
  // 300-500 word category intro lives on the category landing page.
  description: string;
  // Lucide icon name, resolved at render time. Kept as a string so
  // category metadata stays serializable and tree-shakeable.
  icon:        string;
  // 5-10 questions shown at the bottom of the category landing page
  // and emitted as FAQPage JSON-LD for GEO / rich-results pickup.
  faq:         FAQItem[];
}

export interface FAQItem {
  q: string;
  a: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id:    "financial-fundamentals",
    label: "Financial Fundamentals",
    blurb: "Core financial concepts every business owner should understand.",
    icon:  "BookOpen",
    description:
      "Financial Fundamentals is where every business owner should start. The category covers the basic vocabulary of money flowing through a business - what counts as revenue, what counts as cost, what's left over, and why those numbers behave the way they do. Articles here are written assuming no finance background. We don't assume you know what \"gross profit\" means or why \"profit\" and \"cash\" can disagree; we explain each idea from scratch with simple examples drawn from real small businesses. Read this category if you've ever felt out of your depth reading your own accountant's report, or if you want to understand the numbers your bookkeeping software puts in front of you every month. Each article lands one specific concept (revenue vs profit, gross vs net, what EBITDA actually measures, why a profitable business can still run out of cash) so you can use them as a reference and come back when you need to brush up. By the end of the category you should be able to read a basic profit & loss statement, follow a conversation with your accountant, and understand which numbers actually tell you how your business is doing.",
    faq: [
      { q: "Where should I start if I have no finance background?", a: "Begin with \"Revenue vs Profit\" and \"Gross Profit Explained\" - those two cover the vocabulary every other article assumes." },
      { q: "Do I need this if I already have a bookkeeper?", a: "Yes. A bookkeeper records numbers; understanding them is on you. Knowing what gross profit, EBITDA and cash flow each tell you is what turns a monthly report into a decision." },
      { q: "Will this teach me accounting?", a: "No. Bookkeeping rules and tax accounting aren't covered here. The goal is conceptual fluency - understanding what each number means and how to use it." },
      { q: "Are these concepts the same for any business?", a: "The definitions are universal. How heavily each one matters varies by business model - service businesses watch gross margin and utilization; product businesses watch inventory and contribution margin; subscription businesses watch recurring revenue and churn." },
      { q: "How long does it take to feel comfortable with the basics?", a: "Most owners can read a profit & loss statement confidently after 4-6 hours of reading combined with looking at their own statements while they read. The category is designed to support that." },
    ],
  },
  {
    id:    "business-metrics-kpis",
    label: "Business Metrics & KPIs",
    blurb: "The most important metrics used to measure business performance.",
    icon:  "Gauge",
    description:
      "Business Metrics & KPIs covers the numbers business owners actually track to know whether the business is healthy and growing. Every metric here answers a specific operational question: how much it costs to win a customer (Customer Acquisition Cost), how much that customer is worth over time (Customer Lifetime Value), how predictable your revenue is month to month (Monthly and Annual Recurring Revenue), whether you're growing faster or slower than you were (month-over-month, year-over-year). The category is written for owners who want a working understanding of what these metrics measure, when they're useful, and where they can mislead you. Each article explains the formula plainly, walks through a worked example with realistic numbers, and flags the most common ways the metric gets misread. We also call out which metrics matter for which business models - a product business and a subscription business shouldn't be tracking the same dashboard. By the end you'll know which KPIs (Key Performance Indicators) to put in front of yourself every week, which ones to revisit quarterly, and which ones the internet talks about that you can safely ignore for your stage. Read alongside Financial Fundamentals if any of the underlying terms (revenue, gross margin, retention) feel new.",
    faq: [
      { q: "What's the difference between a metric and a KPI?", a: "A metric is anything you measure. A KPI (Key Performance Indicator) is a metric you've decided is important enough to drive decisions. A business has many metrics; only a handful should be KPIs." },
      { q: "How many KPIs should I track?", a: "For most small businesses, five to eight is plenty. More than that and nothing is actually \"key\" anymore." },
      { q: "Which KPIs matter most for a service business?", a: "Revenue per client, gross margin, utilization (billable hours / total hours), and client retention. CAC and LTV matter once you're spending real money on acquisition." },
      { q: "Which KPIs matter most for a subscription business?", a: "Monthly Recurring Revenue, churn, Customer Acquisition Cost, Customer Lifetime Value, and CAC payback period. Growth rate and net revenue retention come next." },
      { q: "How often should I look at my KPIs?", a: "Weekly for operational metrics (sales, pipeline, cash). Monthly for financial KPIs (revenue, margin, expenses). Quarterly for strategic KPIs (LTV, retention, market share)." },
    ],
  },
  {
    id:    "cash-flow-management",
    label: "Cash Flow Management",
    blurb: "Understanding, managing and improving business cash flow.",
    icon:  "Wallet",
    description:
      "Cash Flow Management is the category most small businesses underrate until it's too late. A business can be profitable on paper and still go bust because the cash didn't show up when the bills were due. This category covers the difference between profit and cash, why timing matters as much as size, and the operational levers business owners actually have to keep their bank balance healthy. Articles walk through cash flow forecasting (predicting what your balance will look like 3 / 6 / 12 months out), how much cash reserve you should hold for your specific business, what to do when receivables slow down or expenses spike, and how to spot a cash crunch months before it happens. The writing assumes you understand the basics (revenue, profit, expenses) - if not, Financial Fundamentals first. The category is most valuable for product businesses, agencies, and any business that has inventory, deferred revenue, or large customer payments - those are the businesses where the cash-vs-profit gap is widest and the planning matters most. Read this category if you've ever been profitable on the P&L (Profit & Loss statement) and broke in the bank account, or if you want to never feel that way again.",
    faq: [
      { q: "How is cash flow different from profit?", a: "Profit is what you earned on paper - revenue minus expenses. Cash flow is what actually moved in and out of your bank account. Timing differences (invoices outstanding, inventory bought, taxes owed) can make the two look very different in any given month." },
      { q: "How much cash reserve should a business hold?", a: "A common rule of thumb is 3-6 months of fixed operating expenses. The right number depends on how volatile your revenue is, how concentrated your customer base is, and how seasonal your business is." },
      { q: "What's a cash flow forecast?", a: "A projection of what your bank balance will look like over the next 3 / 6 / 12 months based on expected incoming revenue, outgoing expenses, and any planned investments or financing." },
      { q: "What causes most cash flow problems?", a: "Slow customer payments, rapid growth (more cash tied up in operations), seasonal revenue dips without matching expense cuts, and lumpy large expenses (tax bills, annual subscriptions) hitting at the wrong time." },
      { q: "Should small businesses worry about cash flow or focus on growth?", a: "Both - but cash comes first. Profitable businesses can't pay payroll if their cash runs out. Once you have visibility into 3+ months of cash runway, you can plan growth investments more aggressively." },
    ],
  },
  {
    id:    "business-forecasting",
    label: "Business Forecasting",
    blurb: "Methods and frameworks used to predict future business performance.",
    icon:  "TrendingUp",
    description:
      "Business Forecasting is about answering one question well: what will the numbers look like 3, 6, 12, or 36 months from now, given what we know today? This category covers the practical end of forecasting - revenue forecasting methods that work for small businesses, expense forecasting that accounts for both your fixed costs and the messy variable ones, scenario planning so you can model \"what if we hired one more person\" or \"what if our biggest client churned\", and how much accuracy you should actually expect from a forecast at your size. The articles are written for owners who want to make better decisions about hiring, pricing, marketing spend, and growth investments without needing an MBA in financial modeling. We deliberately avoid the overcomplicated approaches that big-company finance teams use and focus on methods that produce useful answers from imperfect data. Read this category if you're tired of running the business by gut, or if you've ever wanted to know whether a decision is affordable BEFORE you commit to it. Read alongside Cash Flow Management and Scenario Planning if cash runway is what you're trying to project.",
    faq: [
      { q: "How accurate should a small business forecast be?", a: "For a 3-month forecast, aiming for ±10% accuracy is realistic. For 6 months, ±15-20% is normal. Beyond 12 months, forecasts are directional rather than precise - they tell you the shape of the future, not the exact numbers." },
      { q: "Do I need fancy software to forecast?", a: "No. A clear spreadsheet with explicit assumptions beats expensive software with hidden assumptions. The discipline matters more than the tool." },
      { q: "What's the difference between a forecast and a budget?", a: "A budget is what you decide to spend (a plan). A forecast is what you expect to happen (a prediction). Budgets are commitments; forecasts are projections." },
      { q: "How often should I update my forecast?", a: "Monthly is the right cadence for most small businesses. After every month closes, update actuals, revise assumptions, and re-project forward." },
      { q: "What's scenario planning?", a: "Building two or three versions of the same forecast under different assumptions (base case, downside, upside) so you understand the range of outcomes - not just one number." },
    ],
  },
  {
    id:    "expense-management",
    label: "Expense Management",
    blurb: "Understanding and optimizing business expenses.",
    icon:  "Receipt",
    description:
      "Expense Management covers the discipline of knowing what you're spending, why you're spending it, and where you have room to cut without hurting the business. The category is built around two ideas: every expense should map to a category that makes sense for your business, and the difference between fixed and variable costs should drive how you think about every spending decision. Articles cover the standard expense categories most businesses use, the difference between fixed and variable costs and why it matters more than people think, budget planning frameworks small enough to actually use, and cost optimization tactics that don't break the business in the process of saving money. We also call out the hidden costs - subscription creep, expense drift, vendor markup, opportunity costs - that quietly erode margins when nobody's looking. Read this category if your expenses feel out of control, if you're not sure what's reasonable versus excessive for your business, or if you want a clear view of where every dollar is going before the next planning cycle. Pairs well with Financial Fundamentals (so the underlying terms make sense) and Business Forecasting (so cuts and reallocations get modeled before they happen).",
    faq: [
      { q: "What's the difference between fixed and variable costs?", a: "Fixed costs stay roughly the same regardless of how much business you do (rent, salaries, software subscriptions). Variable costs scale with business activity (raw materials, payment processing fees, contractor work)." },
      { q: "What expense categories should every business use?", a: "Most businesses can start with: Payroll, Rent & Utilities, Software & Tools, Marketing & Sales, Professional Services, Travel & Meals, Office Supplies, and Other. Refine from there." },
      { q: "How much should I budget for each category?", a: "Standard ratios vary by industry. For most service businesses, payroll is 40-60% of revenue, rent is 5-10%, marketing is 5-15%. Compare to industry benchmarks rather than absolute numbers." },
      { q: "What are hidden business costs?", a: "Subscription creep (unused software still billing), vendor markup on \"included\" services, processing fees, opportunity cost of slow decisions, and the cost of customer churn from cutting too aggressively." },
      { q: "How do I cut expenses without hurting the business?", a: "Audit first, cut second. Look at the bottom 20% of every category by ROI (return on investment) and ask if you'd buy it today. Anything you wouldn't buy is a candidate to drop." },
    ],
  },
  {
    id:    "business-growth",
    label: "Business Growth",
    blurb: "Frameworks and concepts for sustainable business growth.",
    icon:  "Sprout",
    description:
      "Business Growth is about the choices that turn a small business into a bigger, healthier business - and the choices that look like growth but actually break the business. The category covers the tension between top-line growth and profitability, what \"sustainable growth\" actually means in practice, when to make your next hire, how to spot the bottlenecks that quietly cap your growth (capacity, sales process, fulfillment, leadership), and what scaling a small business actually involves versus what people on LinkedIn make it sound like. We're skeptical of growth-at-all-costs - the businesses that survive are the ones that grew at a pace they could fund and operate. Articles are written for owners deciding whether to push harder, hold steady, or fix something before pushing further. Each article maps the trade-offs honestly: more growth means more cash tied up, more management overhead, more risk if the growth doesn't stick. Read this category when you're thinking about your next major decision - the hire, the bigger office, the expanded marketing budget, the new market - and you want a clear-headed view of whether the timing is right. Pairs with Cash Flow Management (because growth is funded by cash) and Business Forecasting (because the decision should be modeled first).",
    faq: [
      { q: "What's the difference between growth and profitability?", a: "Growth is how fast you're getting bigger (revenue, customers, market share). Profitability is how much money you keep from what you sell. Growth without profitability burns cash; profitability without growth gets out-competed. Both matter; the balance changes with stage." },
      { q: "When should I hire my next employee?", a: "When the cost of NOT hiring (lost revenue, your own burnout, work falling through cracks) exceeds the loaded cost of the new hire for at least the next 6-12 months. Hire ahead of growth only if you have the cash cushion." },
      { q: "What does sustainable growth mean?", a: "Growth your business can fund from its own cash flow (or affordable financing) without breaking operationally. A useful rule of thumb: growth rate × cash conversion cycle shouldn't outrun your working capital." },
      { q: "What are common growth bottlenecks?", a: "Founder time, sales process maturity, fulfillment capacity, hiring pipeline, and customer concentration. Most small businesses are bottlenecked on one of these long before they hit a market ceiling." },
      { q: "How fast should a small business grow?", a: "Depends on stage and category. 20-50% year-over-year is strong for most small businesses; 100%+ is possible in early stage or fast-growing categories but creates real operational strain. Faster growth needs more cash and more hiring discipline." },
    ],
  },
  {
    id:    "business-intelligence",
    label: "Business Intelligence & Analytics",
    blurb: "How businesses use data to make better decisions.",
    icon:  "BarChart3",
    description:
      "Business Intelligence & Analytics covers the practice of turning the data your business already generates into decisions you can actually act on. Most small businesses already have more data than they look at - sales records, expense logs, customer transactions, payroll, vendor invoices. The problem isn't data; it's translating it into something useful. This category covers what business intelligence actually is in a small-business context (not enterprise BI platforms), how to build a dashboard that you'll genuinely use, how to make decisions from data without falling into analysis paralysis, the difference between leading indicators (predictive) and lagging indicators (historical), and the common reporting mistakes that produce confidently wrong answers. Articles are written for owners who want to be more analytical without becoming data analysts. We focus on the small handful of views and reports that drive most operational decisions - not the dashboard wallpaper that looks impressive in a screenshot but never gets opened twice. Read this category when you want to get more disciplined about how you measure the business and how you make decisions from what you measure. Pairs with Business Metrics & KPIs (so you know what to measure) and Business Forecasting (so you can project from history).",
    faq: [
      { q: "What is business intelligence in plain English?", a: "Using the data your business already collects (sales, expenses, customers) to answer questions that help you make better decisions. \"Are we growing the right customers?\" \"Where are margins dropping?\" \"Which marketing channel actually pays back?\"" },
      { q: "Do I need expensive software for BI?", a: "No. Spreadsheets, your accounting software's built-in reports, and a clear weekly habit cover most small businesses. Dedicated BI tools earn their cost when you're combining data from three or more systems regularly." },
      { q: "What's the difference between a leading and lagging indicator?", a: "A lagging indicator measures what already happened (last month's revenue, last quarter's churn). A leading indicator predicts what will happen (pipeline, signup rate, customer engagement). Both matter; lagging confirms, leading warns." },
      { q: "What's a good dashboard for a small business?", a: "One screen, fewer than ten numbers, mixing leading and lagging indicators, updated at a known cadence. If it takes more than two minutes to read, it's too big." },
      { q: "Should I make decisions from data or gut feel?", a: "Use data to narrow the range of reasonable decisions; use judgment to pick between them. Data without judgment over-fits to history. Judgment without data drifts off course." },
    ],
  },
  {
    id:    "business-signals",
    label: "Business Signals & Insights",
    blurb: "Understanding business trends, warning signs and early indicators.",
    icon:  "Radar",
    description:
      "Business Signals & Insights covers the discipline of catching changes in your business early - before they show up as bad results. Most business problems are slow before they're sudden: revenue softens over three months before it crashes; expenses creep before they spike; customer engagement drops before churn shows up in the numbers. This category covers the patterns that precede the problems, the early indicators worth watching, and how to build a routine that surfaces the right things to look at without burying you in noise. Articles cover the most common early warning signs (revenue growth slowing, expense growth outrunning revenue, customer concentration drifting, margin compression), how to distinguish noise from signal in monthly data, and how to translate a signal into action (or into a decision to keep watching). The writing assumes you're running the business day-to-day and don't have time for elaborate review processes - the goal is fast pattern recognition you can do in 15 minutes a week. Read this category if you've ever been blindsided by a number that, in hindsight, was telegraphing the problem for months. Pairs with Business Intelligence & Analytics (so the underlying reporting is sound) and Business Forecasting (so a signal can be modeled forward).",
    faq: [
      { q: "What's a business signal?", a: "An observable change in the data - revenue softening, expenses creeping, margins compressing, a customer slowing payments - that's worth investigating because it tends to predict a future problem or opportunity." },
      { q: "How do I tell a signal from random noise?", a: "Three filters: direction (is it consistent month over month?), magnitude (is the change material relative to history?), and breadth (is it showing up in more than one metric?). A change that fails all three is probably noise." },
      { q: "What signals should every business owner watch?", a: "Revenue growth rate, gross margin trend, expense growth vs revenue growth, customer concentration, and accounts receivable aging (how long invoices take to pay). Those five catch most early warning patterns." },
      { q: "How often should I review business signals?", a: "Weekly is ideal for operational signals (pipeline, cash, accounts receivable). Monthly for financial signals (revenue trend, margin, expense growth). Quarterly for strategic signals (customer mix, market share, retention)." },
      { q: "What's the difference between a signal and a KPI?", a: "A KPI is a number you measure regularly. A signal is when one of those KPIs changes in a way that demands attention. Every KPI can generate signals; not every signal lives inside a tracked KPI." },
    ],
  },
  {
    id:    "small-business-operations",
    label: "Small Business Operations",
    blurb: "Operational concepts that help businesses run efficiently.",
    icon:  "Cog",
    description:
      "Small Business Operations covers the machinery underneath the financials - the processes, workflows, team productivity, and delegation habits that determine whether the business actually runs or only looks like it does. Strong operations don't show up directly on the profit & loss statement; they show up indirectly through better margins, faster cycle times, less owner overload, and customers who come back. This category covers what business processes actually are and why writing yours down matters, the basics of operational efficiency without lean-manufacturing jargon, how to optimize workflows in service and product businesses, how to measure team productivity without turning the workplace toxic, and frameworks for delegation that let owners stop being the bottleneck. Articles are written for owner-operators who feel personally indispensable to every part of the business and want to change that. The category is most valuable for businesses past the first few hires - where coordination costs start to grow and \"just figure it out\" stops scaling. Read this category if you're feeling stretched, if work keeps falling through cracks, or if you want to build a business that runs without you being on call for every decision. Pairs with Business Growth (because operations are the bottleneck most growth runs into).",
    faq: [
      { q: "What's a business process?", a: "A repeated way of doing something - onboarding a customer, processing an invoice, hiring an employee. Writing it down (even loosely) is what makes it shareable, improvable, and survivable when people change." },
      { q: "How do I improve operational efficiency without spending money?", a: "Identify the three things you and your team do most often. Time them honestly. Look for steps that are duplicated, manual where they don't need to be, or done before they're needed. Most efficiency gains come from removing work, not adding tools." },
      { q: "How should I measure team productivity?", a: "Measure outcomes (work completed, customers served, problems solved) rather than activity (hours worked, emails sent). Productivity metrics that count activity create perverse incentives." },
      { q: "When should I start documenting processes?", a: "When you've had to explain the same thing twice. Documentation pays off the third time and after." },
      { q: "How do I delegate without losing quality?", a: "Define the outcome, not the steps. Show them what \"done well\" looks like with examples. Check in early enough to course-correct. Avoid the temptation to take it back when it isn't done your way." },
    ],
  },
  {
    id:    "business-glossary",
    label: "Business Glossary",
    blurb: "Simple explanations of important business, finance and analytics terms.",
    icon:  "BookA",
    description:
      "The Business Glossary is a reference - one term per entry, written in plain English. The goal is that any business owner can look up an acronym or piece of jargon and walk away in two minutes with a clear understanding of what it means and how it's used. Entries cover finance terms (EBITDA, ARR, MRR), metrics (CAC, LTV, churn), accounting concepts (accrual, deferred revenue, working capital), growth and operations vocabulary (runway, burn rate, retention cohort), and the rest of the language that gets thrown around in business writing. Each entry includes a one-line definition, a slightly longer plain-English explanation, a practical example, and links to related entries and the deeper articles in our category pages. The glossary is meant to grow - new entries get added as we discover terms that come up often enough to deserve a short explainer. Read the glossary when a term in a meeting or an article landed without context and you want to know what it actually means before you nod along. Use it alongside the topical categories: glossary entries explain the words; category articles explain how to use the concepts to run a better business.",
    faq: [
      { q: "What's the difference between a glossary entry and a full article?", a: "Glossary entries are short reference definitions, focused on one term, optimized for \"what does this word mean?\". Full articles in the other categories teach a concept or a method, with examples, formulas, and decisions to make from it." },
      { q: "Why do you keep telling me to explain acronyms?", a: "Because most business writing assumes the reader already knows what the acronym stands for - which excludes a lot of people who could otherwise be following along. We always spell out terms on first use." },
      { q: "Can I suggest a term to add?", a: "Yes - we add new entries based on what readers search for. If you've looked up a term and didn't find it, the chances are high we'll add it." },
      { q: "Are the definitions strict accounting definitions or plain-English?", a: "Plain-English. Where the formal accounting definition matters (revenue recognition rules, depreciation methods), we say so explicitly. Otherwise we explain the concept the way an owner would use it." },
      { q: "How is the glossary organized?", a: "Alphabetically inside the glossary category. Inside the rest of the Learning Center, every full article links out to the relevant glossary entries for any term that might need defining." },
    ],
  },
];

export function getCategory(id: CategoryId): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export interface ArticleMeta {
  slug:        string;                   // url segment inside the category
  title:       string;                   // H1
  excerpt:     string;                   // ~160 chars
  category:    CategoryId;
  tags:        string[];                 // surfaced as chips on the card
  author:      { name: string; role: string };
  publishedAt: string;                   // YYYY-MM-DD
  updatedAt?:  string;                   // YYYY-MM-DD, falls back to publishedAt
  readingTime: number;                   // minutes
  featured?:   boolean;
  // Glossary entries render denser; full articles get the full layout
  // (TL;DR, definition, formula, comparison, takeaways, FAQ). Default
  // is "article".
  kind?:       "article" | "glossary";
  // 3-7 bullet TL;DR rendered at the top of the article body. Empty
  // array hides the block. Strongly recommended for GEO pickup -
  // generative engines prefer articles that lead with a direct answer.
  tldr?:       string[];
  // Article-level FAQ. Rendered as an accordion AND emitted as
  // FAQPage JSON-LD on the article page.
  faq?:        FAQItem[];
  seo: {
    title:       string;                 // <= 60 chars recommended
    description: string;                 // 140-155 chars recommended
    keywords:    string[];
  };
}

export interface ArticleModule {
  meta: ArticleMeta;
  Body: ComponentType;
}

// Build the canonical URL path for an article. Centralized so the
// /resources homepage, category pages, breadcrumbs, internal links,
// JSON-LD, and the sitemap all stay in sync.
export function articleHref(meta: Pick<ArticleMeta, "category" | "slug">): string {
  return `/resources/${meta.category}/${meta.slug}`;
}

export function categoryHref(id: CategoryId): string {
  return `/resources/${id}`;
}
