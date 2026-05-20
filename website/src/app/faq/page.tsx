import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { FAQ } from "@/lib/faq";

const DESCRIPTION = "Answers about Tweaxly, AI financial advisory, financial planning, forecasting, cash flow insights, business signals, and financial dashboards.";

export const metadata: Metadata = {
  title: { absolute: "FAQ – AI Financial Planning & Forecasting | Tweaxly" },
  description: DESCRIPTION,
  keywords: [
    "AI financial planning FAQ",
    "financial forecasting FAQ",
    "AI financial advisor",
    "cash flow forecasting",
    "business intelligence platform",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ – AI Financial Planning & Forecasting | Tweaxly",
    description: DESCRIPTION,
    url: "/faq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ – AI Financial Planning & Forecasting | Tweaxly",
    description: DESCRIPTION,
  },
};

// Structured-data FAQPage block lets Google render rich-result FAQ
// answer cards directly in search. Same Q/A list as the visible page.
function FaqStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function FaqPage() {
  return (
    <main id="main-content" className="flex-1">
      <FaqStructuredData />
      <SiteHeader active="faq" />

      <section className="container-wide pt-10 pb-12 lg:pt-16 lg:pb-16 max-w-3xl">
        <div className="eyebrow mb-4">FAQ</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Frequently asked <span className="gradient-text">questions</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 leading-relaxed">
          Answers about Tweaxly, AI financial advisory, financial planning,
          forecasting, cash flow insights, business signals, and the
          financial dashboard.
        </p>
      </section>

      <section className="container-wide pb-20 max-w-3xl">
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <div className="faq-answer">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="container-wide pb-24 max-w-3xl text-center">
        <div className="card">
          <div className="text-base font-medium text-white">Didn&apos;t find your answer?</div>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Reach out and we&apos;ll get back to you. We&apos;re a small team
            still in early access so replies come from a real human.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn-brand text-sm px-5 py-2.5">Contact us</Link>
            <a href="https://app.tweaxly.com/register" className="btn-ghost text-sm px-5 py-2.5">Start in early access →</a>
          </div>
        </div>
      </section>
    </main>
  );
}
