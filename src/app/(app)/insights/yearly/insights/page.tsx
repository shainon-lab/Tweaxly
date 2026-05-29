// Yearly Summary → Top insights & tips sub-tab. The numeric companion
// view (default landing) lives at /insights/yearly.

import PageHeader from "@/components/PageHeader";
import ReportsHelp from "@/components/ReportsHelp";
import ReportsInnerTabs from "@/components/ReportsInnerTabs";
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
          title="Reports - Yearly Summary"
          subtitle="Yearly retrospective - drill into a completed year's full picture."
          help={<ReportsHelp />}
        />
        <ReportsInnerTabs />
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
        title="Reports - Yearly Summary"
        subtitle={`${selected} retrospective - plain-English observations paired with tips you can act on.`}
        help={<ReportsHelp />}
      />
      <ReportsInnerTabs />
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
