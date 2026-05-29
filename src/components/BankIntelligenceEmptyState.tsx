// Unified empty-state card shown across Dashboard / Forecast /
// Insights / Consultation when the workspace has no transactions yet.
// One canonical visual + copy so the platform feels coherent and the
// user always gets the same CTA wherever they bounce.
//
// Per the onboarding spec: bank statement first, additional sources
// later. CTA jumps into /manual-data?onboarding=1 which renders the
// guided import flow with the same framing.

import Link from "next/link";
import { Upload, Sparkles } from "lucide-react";

export default function BankIntelligenceEmptyState({
  surface,
}: {
  // Light contextual nudge so each page can keep its own primary
  // headline (e.g. "Forecast" → "Upload to activate forecasting").
  // Default speaks generically about business intelligence.
  surface?: "dashboard" | "forecast" | "insights" | "consultation";
}) {
  const heading = surface === "forecast"
      ? "Upload your bank transactions to activate forecasting"
    : surface === "insights"
      ? "Upload your bank transactions to surface insights"
    : surface === "consultation"
      ? "Upload your bank transactions to consult with the AI advisor"
    :  "Upload your bank transactions to activate your business intelligence";

  return (
    <section
      className="mb-6 rounded-2xl border border-line p-6 md:p-10 shadow-sm relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.12) 0%, rgba(79,125,255,0.08) 50%, rgba(34,211,238,0.08) 100%)",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="shrink-0 inline-flex w-11 h-11 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <Sparkles size={20} strokeWidth={1.5} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="t-section text-slate-50 leading-tight tracking-tight">
            {heading}
          </h2>
          <p className="mt-3 t-body text-slate-300 max-w-2xl">
            Start by uploading at least 3 months of bank activity. Tweaxly will
            immediately begin analyzing your revenue, expenses, cash flow and
            financial trends.
          </p>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Link
              href="/manual-data?onboarding=1"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <Upload size={14} strokeWidth={2} />
              Upload Bank Statement
            </Link>
            <span className="t-meta text-slate-500">
              More historical data = better forecasting and smarter insights.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
