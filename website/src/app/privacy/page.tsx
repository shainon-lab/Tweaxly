import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import PrivacyContent, { PRIVACY_LAST_UPDATED } from "@/components/PrivacyContent";

const DESCRIPTION = "How Tweaxly collects, uses, stores, processes, discloses, and protects personal information across our AI financial intelligence platform.";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Tweaxly" },
  description: DESCRIPTION,
  keywords: ["Tweaxly privacy policy", "AI financial platform privacy", "data protection", "GDPR"],
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | Tweaxly",
    description: DESCRIPTION,
    url: "/privacy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Tweaxly",
    description: DESCRIPTION,
  },
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">Last Updated: {PRIVACY_LAST_UPDATED}</p>
        </div>
        <PrivacyContent />
      </article>
    </main>
  );
}
