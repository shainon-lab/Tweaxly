// Testimonials page. Placeholder/demo content for MVP — copy is
// realistic and believable, not exaggerated marketing. Real names
// and companies are fictional and clearly framed as illustrative
// in the page-level disclosure at the bottom.

import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Testimonials — Tweaxly | AI Financial Intelligence",
  description:
    "How business owners use Tweaxly's AI financial advisor, financial forecasting, and real-time business insights to plan, forecast, and act with confidence.",
};

interface Testimonial {
  quote:   string;
  name:    string;
  role:    string;
  company: string;
  rating?: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Tweaxly helped us spot a cash flow issue nearly two months before it became a real problem. The forecast told us where we were heading; the signals told us why.",
    name: "Maya Adler", role: "Founder", company: "Northbound — eCommerce",
    rating: 5,
  },
  {
    quote: "The forecasting tools gave us much more confidence when planning hiring decisions. We modeled three scenarios in an afternoon and chose the one with the cleanest cash runway.",
    name: "Daniel Reyes", role: "Co-founder & CEO", company: "Verso Labs — SaaS startup",
    rating: 5,
  },
  {
    quote: "For the first time, I actually understand where the business is heading financially. The AI advisor speaks like a finance partner, not a chatbot.",
    name: "Sara Bensaid", role: "Owner", company: "Maison Anwar — Restaurant",
    rating: 5,
  },
  {
    quote: "The business signals feature immediately highlighted vendor cost increases we completely missed. Two suppliers had quietly raised rates 8–11% over six months.",
    name: "Ravi Krishnan", role: "Operations Lead", company: "Linecraft — Small manufacturing",
    rating: 4,
  },
  {
    quote: "It feels like having a financial advisor built directly into the business. I open Tweaxly the way I used to open my accounting software, except I actually learn something.",
    name: "Elena Falk", role: "Founder", company: "Falk & Co — Marketing agency",
    rating: 5,
  },
  {
    quote: "Cash flow forecasting on a multi-location retail business is genuinely hard. Tweaxly is the first tool that gave me one number I could trust across all three stores.",
    name: "Tomás Vega", role: "Owner", company: "Tres Hermanos — Multi-location retail",
    rating: 5,
  },
  {
    quote: "I'm a one-person studio and I don't have a finance team. The AI advisor answers the questions I'd otherwise pay a fractional CFO to think about.",
    name: "Hannah Pierce", role: "Independent consultant", company: "Pierce Studio",
    rating: 5,
  },
  {
    quote: "We caught a missed invoice because Tweaxly's signal said expected income hadn't arrived. That signal paid for the next two years of subscription in a single afternoon.",
    name: "Yusuf Demir", role: "Director", company: "Demir Atelier — Design studio",
    rating: 5,
  },
];

const SUPPORTING_SECTIONS = [
  {
    title: "Why businesses use AI financial intelligence",
    body:  "Business owners running small and medium businesses don't have time to live in spreadsheets — but they need the same clarity a finance team would bring. Tweaxly's AI financial advisor reads your real numbers, surfaces trends and risks, and turns business intelligence into decisions you can act on the same day.",
  },
  {
    title: "Financial forecasting for growing businesses",
    body:  "Financial forecasting and cash flow forecasting shouldn't require a spreadsheet wizard. Tweaxly combines validated historical actuals, recurring patterns, and your own scenarios into explainable projections — built specifically for SMB owners who need a real forecast, not enterprise-grade complexity.",
  },
  {
    title: "Real-time business insights without complex spreadsheets",
    body:  "Tweaxly produces a real-time financial dashboard that explains itself. Business signals call out vendor spikes, revenue changes, margin compression, and growth opportunities the moment they appear — no manual analysis, no monthly close ritual, no third-party BI tool.",
  },
];

export default function TestimonialsPage() {
  return (
    <main id="main-content" className="flex-1 overflow-x-hidden">
      <header className="container-wide pt-8 pb-4 flex items-center justify-between gap-3">
        <Link href="/">
          <Logo size="md" showTagline />
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
          ← Back to home
        </Link>
      </header>

      {/* Hero */}
      <section className="container-wide pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">Testimonials</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            What business owners are <span className="gradient-text">saying</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed">
            See how businesses use Tweaxly to understand trends, forecast
            growth, and make smarter financial decisions — with AI-powered
            financial planning, business signals, and a real-time financial
            dashboard built for SMB owners.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="container-wide pb-20 lg:pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={i}
              className="card flex flex-col justify-between gap-5 relative overflow-hidden group"
            >
              {/* Quote */}
              <blockquote className="text-sm text-slate-200 leading-relaxed">
                <span aria-hidden="true" className="block text-2xl text-brand-purple/40 leading-none mb-1">“</span>
                {t.quote}
              </blockquote>

              {/* Footer: avatar placeholder + identity */}
              <div className="flex items-center gap-3 pt-2 border-t border-line/60">
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-teal text-white text-xs font-semibold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">{t.name}</div>
                  <div className="text-xs text-slate-400 truncate">{t.role} · {t.company}</div>
                </div>
                {t.rating ? (
                  <div className="ml-auto text-xs text-warn" aria-label={`${t.rating} of 5 stars`}>
                    {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                  </div>
                ) : null}
              </div>

              {/* Subtle gradient on hover */}
              <div
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-purple to-brand-teal opacity-40 group-hover:opacity-80 transition"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </section>

      {/* Supporting SEO sections — keyword-aware copy + light visuals. */}
      <section className="container-wide pb-20 lg:pb-28">
        <div className="grid gap-6 lg:grid-cols-3">
          {SUPPORTING_SECTIONS.map((s, i) => (
            <article key={i} className="glass p-6 sm:p-7 rounded-2xl">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                {s.title}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-wide pb-20">
        <div className="relative rounded-3xl border border-brand-purple/25 overflow-hidden">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.15),transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative p-10 lg:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Run your business with the clarity of a finance team.
            </h2>
            <p className="mt-3 text-base text-slate-300 max-w-xl mx-auto">
              Open Tweaxly and see your numbers the way an AI financial advisor would.
            </p>
            <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
              <a href="https://app.tweaxly.com/register" className="btn-brand text-base px-6 py-3">
                See the platform
              </a>
              <a href="/" className="btn-ghost text-base px-6 py-3">
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclosure footer */}
      <div className="container-wide pb-12 text-xs text-slate-500 leading-relaxed max-w-3xl">
        Testimonials shown above are illustrative examples representing the
        kinds of outcomes Tweaxly is designed to deliver. As we onboard our
        first cohort of business owners in early access, this page will be
        replaced with verified customer testimonials.
      </div>
    </main>
  );
}
