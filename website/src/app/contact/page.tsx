import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ContactForm from "./ContactForm";

const DESCRIPTION = "Get in touch with Tweaxly. Ask about AI financial intelligence, forecasting, business signals, the AI advisor, or early access for your business.";

export const metadata: Metadata = {
  title: { absolute: "Contact - AI Financial Intelligence | Tweaxly" },
  description: DESCRIPTION,
  keywords: [
    "contact Tweaxly",
    "AI financial intelligence support",
    "early access financial software",
    "AI CFO contact",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact - AI Financial Intelligence | Tweaxly",
    description: DESCRIPTION,
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact - AI Financial Intelligence | Tweaxly",
    description: DESCRIPTION,
  },
};

export default function ContactPage() {
  return (
    <main id="main-content" className="flex-1">
      <SiteHeader active="contact" />

      <section className="container-wide pt-10 pb-12 lg:pt-16 lg:pb-16 max-w-3xl">
        <div className="eyebrow mb-4">Contact</div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Let&apos;s <span className="gradient-text">talk</span>.
        </h1>
        <p className="mt-6 text-lg text-slate-300 leading-relaxed">
          Questions about the AI financial advisor, forecasting, business
          signals, early access, or your specific business setup - send us a
          note and a real human gets back to you.
        </p>
      </section>

      <section className="container-wide pb-20 max-w-3xl">
        <ContactForm />

        <div className="mt-8 text-xs text-slate-500 leading-relaxed">
          Prefer email? Write to{" "}
          <a href="mailto:hello@tweaxly.com" className="text-brand-purple hover:underline">
            hello@tweaxly.com
          </a>
          .
        </div>
      </section>
    </main>
  );
}
