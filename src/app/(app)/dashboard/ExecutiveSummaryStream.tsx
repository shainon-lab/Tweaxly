// Streaming wrapper around buildExecutiveSummary so the AI narrative
// (which calls Claude with thinking mode and can take 3-10 seconds)
// doesn't block the rest of the dashboard from rendering.
//
// Sits inside a <Suspense> boundary on dashboard/page.tsx - the page
// renders KPI tiles + charts immediately, and this hero slot streams
// in once Claude responds.

import ExecutiveSummaryHero from "@/components/ExecutiveSummaryHero";
import LoadingBar from "@/components/LoadingBar";
import {
  buildExecutiveSummary,
  timeframeForRange,
  periodLabelForHero,
} from "@/lib/executiveSummary";
import type { PeriodAggregate } from "@/lib/period";
import { DASHBOARD_RANGE_LABEL, type DashboardRange } from "@/lib/period";

type TrailingMonth = { ym: string; income: number; expenses: number; net: number };

export default async function ExecutiveSummaryStream({
  ccy,
  businessId,
  businessName,
  range,
  fromYM,
  toYM,
  current,
  prev,
  trailing,
  employeeCostMonthly,
}: {
  ccy: string;
  businessId: string;
  businessName: string;
  range: DashboardRange;
  fromYM: string;
  toYM: string;
  current: PeriodAggregate;
  prev: PeriodAggregate;
  trailing: TrailingMonth[];
  employeeCostMonthly: number;
}) {
  const summary = await buildExecutiveSummary({
    ccy,
    businessName,
    rangeLabel: DASHBOARD_RANGE_LABEL[range],
    periodLabel: periodLabelForHero(fromYM, toYM),
    timeframe: timeframeForRange(range),
    current,
    prev,
    trailing,
    employeeCostMonthly,
    businessId,
  });
  return <ExecutiveSummaryHero summary={summary} />;
}

// Loading skeleton that matches the real ExecutiveSummaryHero chrome
// pixel-for-pixel: same rounded-2xl + gradient background, same Summary
// title, same two-column layout. Slot a LoadingBar where the narrative
// goes so the user immediately sees the box appear with a clear "data
// is loading here" signal instead of an empty pulsing placeholder.
export function ExecutiveSummarySkeleton() {
  return (
    <section
      className="mb-6 rounded-2xl border border-line p-6 md:p-8 shadow-sm"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.12) 0%, rgba(79,125,255,0.08) 50%, rgba(34,211,238,0.08) 100%)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight">
            Summary
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            AI-generated business overview · loading…
          </div>
        </div>
        <span className="pill-accent text-xs px-3 py-1 font-semibold opacity-70">
          Analyzing…
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        <div className="md:col-span-8">
          <LoadingBar label="Reading your numbers" hint="Drafting the narrative…" />
          <div className="mt-4 space-y-2">
            <div className="h-3 rounded bg-ink-700/40 w-5/6 animate-pulse" />
            <div className="h-3 rounded bg-ink-700/40 w-full animate-pulse" />
            <div className="h-3 rounded bg-ink-700/40 w-3/4 animate-pulse" />
            <div className="h-3 rounded bg-ink-700/40 w-2/3 animate-pulse" />
          </div>
        </div>

        <aside className="md:col-span-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
            Business Bulletins
          </div>
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="h-3 rounded bg-ink-700/40 w-24 animate-pulse" />
                <span className="h-3 rounded bg-ink-700/40 w-16 animate-pulse" />
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
