// Yearly Summary → Key numbers (default landing). The textual companion
// view lives at /insights/yearly/insights.

import PageHeader from "@/components/PageHeader";
import ReportsTabs from "@/components/ReportsTabs";
import InsightsTabs from "@/components/InsightsTabs";
import { requireBusiness } from "@/lib/auth";
import {
  computeYearlyStats,
  listCompletedYearsWithData,
  statBoxes,
} from "@/lib/yearlySummary";
import YearSelect from "./YearSelect";
import YearlySubTabs from "./YearlySubTabs";

const TONE_CLASS: Record<string, string> = {
  good: "text-good",
  warn: "text-warn",
  bad:  "text-bad",
};

export default async function YearlyNumbersPage({
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
  const boxes = statBoxes(stats, ccy);

  return (
    <>
      <PageHeader
        title={`Insights · ${selected} Summary`}
        subtitle="Headline numbers across financials, workforce, and cost composition for the chosen year."
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

      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="font-medium">Key numbers · {selected}</div>
            <div className="text-xs text-slate-400">
              {boxes.length} headline metrics across financials, workforce, and cost composition
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {boxes.map((b, i) => (
            <div key={i} className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">{b.label}</div>
              <div className={`mt-2 text-lg font-semibold ${b.tone ? TONE_CLASS[b.tone] : ""}`}>
                {b.value}
              </div>
              {b.hint ? (
                <div className="text-xs text-slate-400 mt-1">{b.hint}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
