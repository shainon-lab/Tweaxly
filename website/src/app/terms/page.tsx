import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import TermsContent, { TERMS_LAST_UPDATED } from "@/components/TermsContent";

const DESCRIPTION = "The Tweaxly Terms of Service govern your use of the Tweaxly AI financial intelligence platform — forecasting, business signals, and AI advisory.";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service | Tweaxly" },
  description: DESCRIPTION,
  keywords: ["Tweaxly terms of service", "AI financial platform terms", "Tweaxly user agreement"],
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | Tweaxly",
    description: DESCRIPTION,
    url: "/terms",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Tweaxly",
    description: DESCRIPTION,
  },
};

export default function TermsPage() {
  return (
    <main id="main-content" className="flex-1">
      <header className="container-wide pt-8 pb-4 flex items-center justify-between gap-3 border-b border-line/40">
        <Link href="/">
          <Logo size="md" showTagline />
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
          ← Back to home
        </Link>
      </header>

      <article className="container-wide py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last Updated: {TERMS_LAST_UPDATED}</p>
        </div>
        <TermsContent />
      </article>
    </main>
  );
}
