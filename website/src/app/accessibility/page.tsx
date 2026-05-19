import Link from "next/link";
import Logo from "@/components/Logo";
import AccessibilityContent, { ACCESSIBILITY_LAST_UPDATED } from "@/components/AccessibilityContent";

export const metadata = {
  title: "Accessibility Statement — Tweaxly",
  description: "Tweaxly's commitment to making our platform accessible to all users, including individuals with disabilities.",
};

export default function AccessibilityPage() {
  return (
    <main className="flex-1">
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
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Accessibility Statement</h1>
          <p className="mt-2 text-sm text-slate-400">Last Updated: {ACCESSIBILITY_LAST_UPDATED}</p>
        </div>
        <AccessibilityContent />
      </article>
    </main>
  );
}
