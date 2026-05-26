// Streaming wrapper around buildExecutiveSummary so the AI narrative
// (which calls Claude with thinking mode and can take 3-10 seconds)
// doesn't block the rest of the dashboard from rendering.
//
// Sits inside a <Suspense> boundary on dashboard/page.tsx — the page
// renders KPI tiles + charts immediately, and this hero slot streams
// in once Claude responds.

import ExecutiveSummaryHero from "@/components/ExecutiveSummaryHero";
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

export function ExecutiveSummarySkeleton() {
  return (
    <div className="card mb-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2.5">
          <div className="h-3 bg-ink-800 rounded w-3/4" />
          <div className="h-3 bg-ink-800 rounded w-full" />
          <div className="h-3 bg-ink-800 rounded w-5/6" />
          <div className="h-3 bg-ink-800 rounded w-4/5" />
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 bg-ink-800 rounded w-1/3" />
          <div className="h-3 bg-ink-800 rounded w-full" />
          <div className="h-3 bg-ink-800 rounded w-5/6" />
          <div className="h-3 bg-ink-800 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
