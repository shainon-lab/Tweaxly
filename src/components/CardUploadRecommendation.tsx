// Smart recommendation surfaced on the dashboard when:
//   - the workspace has bank data
//   - we detected recurring credit-card or PayPal settlement charges
//     in that bank data
//   - the user hasn't uploaded a card / paypal source yet
//
// The card explains what unlocking detailed card analysis does, names
// the brand(s) we detected (Visa, MAX, Isracard, etc.), and links into
// the upload flow with the right source-type pre-suggested. Hides
// automatically once a card/paypal source exists — the settlement
// detector then takes over and replaces summarized bank charges with
// the detailed card lines.

import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import type { BankCardSignals } from "@/lib/settlements";

export default function CardUploadRecommendation({
  signals,
}: {
  signals: BankCardSignals;
}) {
  // Render guards — must have a bank source, missing card / paypal
  // source, and at least one settlement-style hit detected.
  if (!signals.hasBankSource) return null;
  const needsCard   = signals.cardCandidates   > 0 && !signals.hasCardSource;
  const needsPaypal = signals.paypalCandidates > 0 && !signals.hasPaypalSource;
  if (!needsCard && !needsPaypal) return null;

  const brandList = signals.detectedBrands.join(", ");

  return (
    <section className="mb-4 rounded-2xl border border-brand-purple/30 bg-accent-soft/10 p-5 md:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="shrink-0 inline-flex w-10 h-10 rounded-xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <CreditCard size={18} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-brand-purple font-semibold mb-1">
            Recommended next step
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-slate-50 leading-tight tracking-tight">
            {needsCard && needsPaypal
              ? "Unlock detailed credit-card + PayPal analysis"
              : needsCard
              ? "Unlock detailed credit-card analysis"
              : "Unlock detailed PayPal analysis"}
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            We detected{" "}
            {needsCard ? (
              <>
                recurring credit-card payments in your bank activity
                {brandList ? <> (<span className="text-slate-200">{brandList}</span>)</> : null}
              </>
            ) : (
              <>recurring PayPal transfers in your bank activity</>
            )}
            . Uploading{" "}
            {needsCard && needsPaypal
              ? "card and PayPal statements"
              : needsCard
              ? "your credit-card statement"
              : "your PayPal statement"}{" "}
            separately will:
          </p>

          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-brand-purple mt-0.5">·</span>
              categorize purchases automatically
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-purple mt-0.5">·</span>
              identify vendors and subscriptions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-purple mt-0.5">·</span>
              improve spending analysis
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-purple mt-0.5">·</span>
              enhance forecasting accuracy
            </li>
          </ul>

          <div className="mt-4 rounded-md border border-line/60 bg-ink-900/40 px-3 py-2 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">Note:</span> Detailed
            card transactions automatically replace the summarized bank charges
            so the same money isn't counted twice.
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Link
              href="/sources?new=1"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              Add a {needsCard ? "credit-card" : "PayPal"} source
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <Link
              href="/manual-data"
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Or jump straight to upload →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
