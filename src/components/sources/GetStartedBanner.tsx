"use client";

// First-run onboarding banner for the Financial Data Pipeline.
//
// Renders ONLY when the workspace has zero active financial sources.
// Once even one source exists, the regular HealthScoreWidget +
// MonthlyChecklist take over and this banner self-hides. So existing
// users never see it; new workspaces get a clean 3-step explainer.
//
// The "Add your first source" CTA jumps to /sources; from there the
// AddSource modal asks the user to pick a startMonth — that's where
// "how far back to import" gets answered concretely (rather than as
// a separate "3/6/12 months" abstract question).

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Database, Upload, type LucideIcon } from "lucide-react";

export default function GetStartedBanner() {
  const [hasSources, setHasSources] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/financial-sources");
        const d = await r.json();
        if (!cancelled) setHasSources((d.sources ?? []).length > 0);
      } catch {
        if (!cancelled) setHasSources(true); // fail closed — hide on error
      }
    })();
    return () => { cancelled = true };
  }, []);

  if (hasSources !== false) return null;

  return (
    <div className="card mb-4 border-brand-purple/40 bg-accent-soft/15">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <div className="text-[11px] uppercase tracking-wider text-brand-purple font-semibold">Get started</div>
          <div className="text-lg font-semibold text-slate-100 mt-1">
            Bring in your bank, card, and PayPal data
          </div>
          <div className="text-sm text-slate-300 mt-1 leading-relaxed">
            Tweaxly works best with at least the last 3 months of activity. We auto-detect columns, handle multi-currency conversion, and flag credit-card settlements so nothing gets double-counted.
          </div>
        </div>
        <Link
          href="/sources"
          className="btn-primary text-sm inline-flex items-center gap-1.5 shrink-0 self-start"
        >
          Add your first source <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <Step n={1} Icon={Database} title="Add a source" body="Bank account, credit card, PayPal — anywhere money moves. Pick how far back you want to track (last 3, 6, or 12 months works for most owners)." />
        <Step n={2} Icon={Upload} title="Upload statements" body="One file at a time. The guided wizard maps columns, confirms date format, and remembers your choices for next month." />
        <Step n={3} Icon={Calendar} title="See your coverage" body="The monthly grid shows what's loaded and what's missing. You'll get an alert when a source is overdue." />
      </div>
    </div>
  );
}

function Step({ n, Icon, title, body }: { n: number; Icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-ink-900/30 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-[10px] font-semibold">{n}</span>
        <Icon size={14} className="text-slate-400" />
        <div className="text-sm font-medium text-slate-100">{title}</div>
      </div>
      <div className="text-xs text-slate-400 leading-relaxed">{body}</div>
    </div>
  );
}
