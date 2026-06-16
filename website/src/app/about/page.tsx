import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const DESCRIPTION = "Tweaxly is an AI financial intelligence platform built for small and medium business owners. Forecast, monitor, and decide with the clarity of a finance team.";

export const metadata: Metadata = {
  title: { absolute: "About - Your AI Business Pulse Platform | Tweaxly" },
  description: DESCRIPTION,
  keywords: [
    "about Tweaxly",
    "AI financial intelligence platform",
    "AI CFO",
    "financial planning for SMBs",
    "business forecasting platform",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About - Your AI Business Pulse Platform | Tweaxly",
    description: DESCRIPTION,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About - Your AI Business Pulse Platform | Tweaxly",
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader active="about" />

      <section className="container-wide pt-10 pb-16 lg:pt-16 lg:pb-24 max-w-3xl">
        <div className="eyebrow mb-4">About Tweaxly</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Financial clarity for business owners - <span className="gradient-text">without hiring a CFO</span>.
        </h1>
        <p className="mt-8 text-lg text-slate-700 leading-relaxed">
          Most small and medium businesses run on the same gap: an accounting
          system that records what already happened, and a busy owner who
          needs to know what's about to happen next. Spreadsheets, monthly
          closes, and gut feel try to fill that gap - until they don't.
        </p>
        <p className="mt-5 text-lg text-slate-700 leading-relaxed">
          Tweaxly was built to close it. It's an AI financial intelligence
          platform that connects your real numbers, surfaces what's
          changing, forecasts where you're heading, and gives you an AI
          advisor that can answer business questions in plain English - in
          real time.
        </p>
      </section>

      <section className="container-wide pb-16 lg:pb-24 max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Who Tweaxly is for</h2>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {[
            { title: "Owners running 1–50 person businesses", body: "eCommerce, agencies, SaaS, restaurants, retail, manufacturing, consultancies, and studios - anyone who needs financial visibility without a full finance team." },
            { title: "Operators who outgrew spreadsheets", body: "If your forecast lives in a tab nobody opens, or your category totals never match between sheets, Tweaxly replaces the manual layer." },
            { title: "Founders making hiring / pricing calls", body: "Model the impact of a new hire, a price change, a marketing cut - see the cash flow and profit consequences before you commit." },
            { title: "Businesses with a bookkeeper but no CFO", body: "Your accountant does the books. Tweaxly turns those books into business intelligence." },
          ].map((c) => (
            <div key={c.title} className="card">
              <div className="font-medium text-[color:var(--color-ink-strong)]">{c.title}</div>
              <div className="text-sm text-slate-700 mt-2 leading-relaxed">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-wide pb-16 lg:pb-24 max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">What you can achieve with Tweaxly</h2>
        <ul className="mt-6 space-y-3 text-slate-700 text-base leading-relaxed">
          {[
            "See your real-time financial dashboard - revenue, expenses, payroll, profit, cash flow - without exporting a single spreadsheet.",
            "Forecast the next 3 to 24 months with explainable assumptions, recurring patterns, seasonality, and confidence bands.",
            "Catch vendor cost spikes, margin compression, missing income, and unusual financial activity the moment they appear.",
            "Ask the AI advisor anything about your business and get answers grounded in your real categories, vendors, and trends.",
            "Run scenario plans - new hires, marketing changes, contracts, one-time costs - and see the cash flow impact before you decide.",
            "Operate with the confidence of a finance team, at SMB cost.",
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-purple shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-wide pb-24 max-w-3xl">
        <div className="card">
          <div className="font-medium text-[color:var(--color-ink-strong)] text-lg">Why we built this</div>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Enterprise finance teams have had this kind of intelligence for
            years - Anaplan, Workday Adaptive, dedicated FP&A staff. Small
            businesses got bookkeeping software and a quarterly check-in
            with their accountant. We thought that was the wrong gap to
            leave open. Tweaxly is the AI financial intelligence platform
            we wished existed when we were running businesses ourselves.
          </p>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <a href="https://app.tweaxly.com/register" className="btn-brand text-base px-6 py-3">See the platform</a>
          <Link href="/contact" className="btn-ghost text-base px-6 py-3">Get in touch →</Link>
        </div>
      </section>
    </main>
  );
}
