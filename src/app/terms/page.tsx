// Public Terms of Service page. Reachable without authentication so
// the link in the register form works on the marketing journey.

import Link from "next/link";
import Logo from "@/components/Logo";
import TermsContent, { TERMS_LAST_UPDATED } from "@/components/TermsContent";

export const metadata = {
  title: "Terms of Service - Tweaxly",
  description: "The Tweaxly Terms of Service. Governs your use of the Tweaxly platform and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-3xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between gap-3 border-b border-line/40">
        <Link href="/login">
          <Logo size="md" showTagline />
        </Link>
        <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">
          ← Back to sign in
        </Link>
      </header>
      <article id="main-content" className="max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last Updated: {TERMS_LAST_UPDATED}</p>
        </div>
        <TermsContent />
      </article>
    </div>
  );
}
