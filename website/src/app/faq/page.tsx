import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { FAQ, FAQ_CATEGORIES } from "@/lib/faq";

const DESCRIPTION =
  "Answers about Tweaxly's AI business intelligence platform for small and medium businesses - forecasting, business signals, multi-currency reports, CSV imports, AI consultation, pricing and how Tweaxly differs from accounting software and dashboards.";

export const metadata: Metadata = {
  title: { absolute: "Tweaxly FAQ | AI Business Intelligence for SMBs" },
  description: DESCRIPTION,
  keywords: [
    "Tweaxly FAQ",
    "AI business intelligence FAQ",
    "AI financial forecasting questions",
    "business signals explained",
    "multi-currency reports",
    "CSV upload financial software",
    "Tweaxly vs accounting software",
    "AI financial advisor",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Tweaxly FAQ | AI Business Intelligence for SMBs",
    description: DESCRIPTION,
    url: "/faq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweaxly FAQ | AI Business Intelligence for SMBs",
    description: DESCRIPTION,
  },
};

// ─────────────────────────────────────────────────────────────────────
// Structured data
// ─────────────────────────────────────────────────────────────────────
// FAQPage emits the flat list of all questions (Google ignores any
// grouping inside FAQPage). BreadcrumbList gives the page its
// position in the IA. Every answer is written as a standalone
// snippet so AI engines can cite a single Q/A pair cleanly.

const SITE_URL = "https://tweaxly.com";

function FaqStructuredData() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name:    f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "FAQ",  item: `${SITE_URL}/faq` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  return (
    <main id="main-content" className="flex-1">
      <FaqStructuredData />
      <SiteHeader active="faq" />

      {/* Visible breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-wide pt-8 pb-2">
        <ol className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <li><Link href="/" className="hover:text-slate-800 transition">Home</Link></li>
          <li className="text-slate-600">›</li>
          <li className="text-slate-700">FAQ</li>
        </ol>
      </nav>

      <section className="container-wide pt-4 pb-8 lg:pt-6 lg:pb-10 max-w-3xl">
        <div className="eyebrow mb-4">FAQ</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Tweaxly, <span className="gradient-text">in plain English</span>.
        </h1>
        <p className="mt-6 text-lg text-slate-700 leading-relaxed">
          Answers about Tweaxly&apos;s AI business intelligence platform -
          how the AI works, what it tracks, how data gets in, what makes it
          different from accounting software and BI dashboards, and what
          early access looks like.
        </p>
      </section>

      {/* Category jump-nav */}
      <nav
        aria-label="FAQ categories"
        className="border-y border-line/60 bg-ink-900/30 backdrop-blur-sm"
      >
        <div className="container-wide py-4 flex items-center gap-x-6 gap-y-2 flex-wrap text-[11px] uppercase tracking-[0.18em] text-slate-600">
          {FAQ_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="hover:text-[color:var(--color-ink-strong)] transition flex items-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-brand-purple" />
              {c.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Question sections */}
      {FAQ_CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          id={cat.id}
          className="container-wide pt-12 pb-6 max-w-3xl scroll-mt-24"
        >
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
              {cat.label}
            </div>
            <p className="text-base text-slate-600 leading-relaxed">
              {cat.blurb}
            </p>
          </div>
          <div className="space-y-3">
            {cat.items.map((item, i) => (
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <div className="faq-answer">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}

      {/* Contact + early access CTA */}
      <section className="container-wide pt-12 pb-24 max-w-3xl text-center">
        <div className="card">
          <div className="text-base font-medium text-[color:var(--color-ink-strong)]">Didn&apos;t find your answer?</div>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">
            Reach out and we&apos;ll get back to you. We&apos;re a small team
            still in early access so replies come from a real human.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn-brand text-sm px-5 py-2.5">Contact us</Link>
            <a href="https://app.tweaxly.com/register" className="btn-ghost text-sm px-5 py-2.5">
              Start Free →
            </a>
          </div>
        </div>

        {/* Internal-linking footer - GEO authority signal */}
        <div className="mt-8 text-xs text-slate-500 flex items-center gap-4 flex-wrap justify-center">
          <Link href="/features" className="hover:text-slate-700 transition">
            All features →
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/compare/accounting-software" className="hover:text-slate-700 transition">
            Tweaxly vs accounting software
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/compare/dashboards" className="hover:text-slate-700 transition">
            Tweaxly vs dashboards
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/resources" className="hover:text-slate-700 transition">
            Resources →
          </Link>
        </div>
      </section>
    </main>
  );
}
