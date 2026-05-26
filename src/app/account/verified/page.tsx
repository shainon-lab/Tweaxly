// /account/verified
//
// Success surface the API redirects to after a successful
// verification-token consume. Always loads with no token in the URL
// (the API strips it on redirect) so users sharing this URL never
// expose a token.
//
// Public route - no auth required. The user may have hit the link in
// a different browser where they're signed out.

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function VerifiedPage() {
  return (
    <div className="auth-shell">
      <div className="card w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="md" showTagline />
        </div>
        <div
          className="inline-flex w-16 h-16 rounded-full bg-good/15 text-good items-center justify-center mb-5 mx-auto a11y-verified-pulse"
          aria-hidden="true"
        >
          <CheckCircle2 size={36} strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-50 mb-2 leading-tight">
          Your email is verified
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          All Tweaxly features are now unlocked. Welcome aboard.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          Continue to dashboard
          <span aria-hidden="true">→</span>
        </Link>
        <p className="mt-5 text-[11px] text-slate-500">
          Not signed in? <Link href="/login" className="text-accent hover:underline">Sign in here</Link>.
        </p>
      </div>
      {/* Small entrance animation on the check icon so the success
          state has a moment of life without becoming distracting. */}
      <style>{`
        @keyframes a11y-verified-pulse-kf {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .a11y-verified-pulse {
          animation: a11y-verified-pulse-kf 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
}
