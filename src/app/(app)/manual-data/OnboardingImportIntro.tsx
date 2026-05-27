// Reassurance + integration-stub banner shown above the Import
// form when the user arrives at /manual-data from the adaptive
// onboarding wizard (?onboarding=1). Replaces the normal Settings
// tab strip for this first-import moment.

import Link from "next/link";

export default function OnboardingImportIntro() {
  return (
    <div className="space-y-4 mb-6">
      <div className="rounded-xl border border-brand-purple/30 bg-accent-soft/15 p-4 text-sm">
        <div className="flex items-start gap-3">
          <span className="text-brand-purple text-base leading-none mt-0.5">✨</span>
          <div>
            <div className="text-slate-100 font-medium">
              Most businesses discover trends, unusual spending, or cash-flow risks within minutes of uploading.
            </div>
            <div className="text-slate-400 mt-1">
              The AI auto-detects revenue vs. expenses, suggests categories, and learns your patterns. You can edit anything later.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-brand-purple/40 bg-accent-soft/20 p-4 ring-1 ring-brand-purple/30">
          <div className="text-[10px] uppercase tracking-wider text-brand-purple font-semibold">Recommended</div>
          <div className="text-base font-medium text-slate-100 mt-1.5">Upload CSV / Excel</div>
          <div className="text-xs text-slate-400 mt-1">
            Upload your transactions using CSV or Excel from any bank or processor.
          </div>
          <div className="mt-3 text-[11px] text-accent">↓ Scroll to the upload card below</div>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Need a template?</div>
          <div className="text-base font-medium text-slate-100 mt-1.5">Tweaxly Template</div>
          <div className="text-xs text-slate-400 mt-1">
            Three columns: Date · Description · Amount. We figure out the rest.
          </div>
          <Link
            href="/templates/tweaxly-transactions-template.csv"
            download
            className="mt-3 inline-flex items-center gap-1 text-[11px] text-accent hover:text-white transition"
          >
            Download template →
          </Link>
        </div>

        <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-4 opacity-80">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Automatic</div>
            <span className="text-[10px] uppercase tracking-wider pill">coming soon</span>
          </div>
          <div className="text-base font-medium text-slate-100">Bank & integrations</div>
          <div className="text-xs text-slate-400 mt-1">
            Connect banks and financial systems automatically - no more CSV exports.
          </div>
        </div>
      </div>
    </div>
  );
}
