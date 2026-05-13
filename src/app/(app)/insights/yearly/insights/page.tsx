// Yearly Summary → Top insights & tips sub-tab. The numeric companion
// view (default landing) lives at /insights/yearly.

import PageHeader from "@/components/PageHeader";
import ReportsTabs from "@/components/ReportsTabs";
import InsightsTabs from "@/components/InsightsTabs";
import { requireBusiness } from "@/lib/auth";
import {
  computeYearlyStats,
  generateYearlyInsights,
  listCompletedYearsWithData,
} from "@/lib/yearlySummary";
import YearSelect from "../YearSelect";
import YearlyInsightsList from "../YearlyInsightsList";
import YearlySubTabs from "../YearlySubTabs";

export default async function YearlyInsightsTextPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const ccy = business.currency;

  const years = await listCompletedYearsWithData(business.id);
  if (years.length === 0) {
    return (
      <>
        <PageHeader
          title="Insights"
          subtitle="Yearly retrospective — drill into a completed year's full picture."
        />
        <ReportsTabs />
        <InsightsTabs />
        <div className="card text-center py-12">
          <div className="text-lg font-medium">No completed years to summarize yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Once at least one full prior calendar year has transactions in the database,
            its summary will appear here.
          </div>
        </div>
      </>
    );
  }

  const requested = Number(sp.year);
  const selected = years.includes(requested) ? requested : years[0];

  const stats = await computeYearlyStats(business.id, selected);
  const insights = generateYearlyInsights(stats, ccy);

  return (
    <>
      <PageHeader
        title={`Insights · ${selected} Summary`}
        subtitle="Plain-English observations about the chosen year, each paired with a tip you can act on."
      />
      <ReportsTabs />
        <InsightsTabs />
      <YearlySubTabs />
      <div className="flex items-end justify-end mb-4 flex-wrap gap-3">
        <YearSelect selected={selected} years={years} />
      </div>

      {stats.coverage.isPartial && stats.coverage.partialNote ? (
        <div className="card mb-4 border-warn/40">
          <div className="flex items-start gap-3">
            <span className="pill-warn shrink-0">Partial year</span>
            <div className="text-sm text-slate-200">{stats.coverage.partialNote}</div>
          </div>
        </div>
      ) : null}

      <YearlyInsightsList insights={insights} />
    </>
  );
}
