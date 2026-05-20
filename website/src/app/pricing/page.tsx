import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const DESCRIPTION = "Tweaxly pricing for AI financial intelligence, forecasting, business insights, cash flow monitoring, and AI advisory - full plans launching soon.";

export const metadata: Metadata = {
  title: { absolute: "Your AI Business Pulse Pricing | Tweaxly" },
  description: DESCRIPTION,
  keywords: [
    "Tweaxly pricing",
    "AI financial advisor pricing",
    "financial forecasting software pricing",
    "business intelligence pricing",
    "small business financial software",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Your AI Business Pulse Pricing | Tweaxly",
    description: DESCRIPTION,
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your AI Business Pulse Pricing | Tweaxly",
    description: DESCRIPTION,
  },
};

export default function PricingPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader active="pricing" />

      <section className="container-wide pt-10 pb-16 lg:pt-20 lg:pb-28 max-w-3xl">
        <div className="eyebrow mb-4">Pricing</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          <span className="gradient-text">Launching soon</span>.
        </h1>
        <p className="mt-8 text-lg text-slate-300 leading-relaxed">
          We&apos;re onboarding the first cohort of business owners in early
          access while we finalize plan tiers and pricing for the public
          launch.
        </p>
        <p className="mt-5 text-lg text-slate-300 leading-relaxed">
          This page will be updated with full plan details - AI financial
          advisor, forecasting, business signals, and team seats - when
          general availability opens.
        </p>

        <div className="mt-10 card max-w-xl">
          <div className="font-medium text-white">Early access</div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Sign up today to use Tweaxly during early access. Pricing will
            be announced ahead of general availability and you&apos;ll have
            the option to lock in early-access terms.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://app.tweaxly.com/register" className="btn-brand text-sm px-5 py-2.5">
              Start in early access
            </a>
            <Link href="/contact" className="btn-ghost text-sm px-5 py-2.5">
              Talk to us →
            </Link>
          </div>
        </div>

        <div className="mt-12 text-xs text-slate-500 leading-relaxed">
          Want to be notified the moment plans go live? Email
          {" "}<a href="mailto:hello@tweaxly.com" className="text-brand-purple hover:underline">hello@tweaxly.com</a>{" "}
          and we&apos;ll keep you posted.
        </div>
      </section>
    </main>
  );
}
