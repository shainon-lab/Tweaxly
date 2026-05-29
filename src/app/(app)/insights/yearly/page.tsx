// Yearly Summary → Key numbers (default landing). The textual companion
// view lives at /insights/yearly/insights.

import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { CalendarRange, Lightbulb, FileText } from "lucide-react";
import ReportsInnerTabs from "@/components/ReportsInnerTabs";
import { requireBusiness } from "@/lib/auth";
import {
  computeYearlyStats,
  listCompletedYearsWithData,
  statBoxes,
} from "@/lib/yearlySummary";
import YearSelect from "./YearSelect";
import YearlySubTabs from "./YearlySubTabs";
import DownloadButton from "@/components/DownloadButton";
import type { ExportPayload } from "@/lib/exporters/types";
import { hasFeature, getPlanFor } from "@/lib/billing";
import LockedOverlay from "@/components/billing/LockedOverlay";

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
          subtitle="Yearly retrospective - drill into a completed year's full picture."
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
  const boxes = statBoxes(stats, ccy);
  const canExport      = await hasFeature(business.id, "exportExcel");
  const canYearly      = await hasFeature(business.id, "yearlyReports");
  const currentPlan    = await getPlanFor(business.id);

  return (
    <>
      <PageHeader
        title={`Insights · ${selected} Summary`}
        subtitle="Headline numbers across financials, workforce, and cost composition for the chosen year."
        help={
          <HowItWorks
            title="How the yearly summary works"
            intro="A full retrospective on any completed calendar year. Headline financials, workforce changes, cost composition, biggest swings, plus AI-written insights and tips ranked by importance - everything you'd want to know before planning next year."
            cards={[
              { icon: <CalendarRange size={16} strokeWidth={1.7} />, title: "Year picker",      body: "Switch between any completed year using the selector below. Only years with at least one month of transactions appear. The current year shows up here once it ends." },
              { icon: <Lightbulb size={16} strokeWidth={1.7} />,     title: "Top insights & tips", body: "Twenty observations ranked by importance - revenue and expense movements, margin trajectory, payroll ratio, vendor concentration, marketing efficiency, headcount trajectory. Each one comes with a one-line tip on what to do with it." },
              { icon: <FileText size={16} strokeWidth={1.7} />,      title: "PDF export",       body: "Download the whole summary as a clean PDF for sharing with stakeholders, accountants, or board members. Pro feature." },
            ]}
            outro="Everything here is computed deterministically from your data - same year, same data, same report. AI is only used to write the prose narrative; the numbers come straight from your transactions."
          />
        }
      />
      {!canYearly ? (
        <LockedOverlay
          locked
          feature="Yearly Insights"
          plan={currentPlan}
          blurb="Free plans can see this layout as a preview. Upgrade to Pro to unlock yearly summaries, headline-metric grids and exports."
          benefits={[
            "Full-year P&L, payroll, and cost-composition summaries",
            "Per-year drill-down + Insights subtabs",
            "Export the whole year to Excel, CSV, PDF",
            "Plus everything else on Pro: full forecasting + Scenario Builder + unlimited signals",
          ]}
          blur="md"
        >
          <YearlyContentPreview boxes={boxes} selected={selected} />
        </LockedOverlay>
      ) : (
        <YearlyContent
          selected={selected}
          years={years}
          stats={stats}
          boxes={boxes}
          ccy={ccy}
          businessName={business.name}
          canExport={canExport}
        />
      )}
    </>
  );
}

// Pulled out so we can render either the full content (Pro+) or a
// minimal blurred preview (Free, wrapped by LockedOverlay). Both
// reuse the same Stat tiles so the visual identity matches.

function YearlyContentPreview({
  boxes, selected,
}: { boxes: ReturnType<typeof statBoxes>; selected: number }) {
  return (
    <div className="mt-2">
      <div className="card mb-6">
        <div className="font-medium mb-3">Key numbers · {selected}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {boxes.slice(0, 8).map((b, i) => (
            <div key={i} className="card-tight">
              <div className="text-xs uppercase tracking-wide text-slate-400">{b.label}</div>
              <div className={`mt-2 text-lg font-semibold ${b.tone ? TONE_CLASS[b.tone] : ""}`}>{b.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function YearlyContent({
  selected, years, stats, boxes, ccy, businessName, canExport,
}: {
  selected: number;
  years: number[];
  stats: Awaited<ReturnType<typeof computeYearlyStats>>;
  boxes: ReturnType<typeof statBoxes>;
  ccy: string;
  businessName: string;
  canExport: boolean;
}) {
  return (
    <>
      <ReportsInnerTabs />
      <YearlySubTabs />
      <div className="flex items-end justify-end mb-4 flex-wrap gap-3">
        <YearSelect selected={selected} years={years} />
        <DownloadButton
          payload={{
            filename:     `Tweaxly_Yearly_Summary_${selected}`,
            title:        `Yearly Summary - ${selected}`,
            subtitle:     stats.coverage.partialNote ?? undefined,
            businessName: businessName,
            baseCurrency: ccy,
            filters: { "Year": String(selected) },
            columns: [
              { key: "metric", label: "Metric", kind: "text",     width: 36 },
              { key: "value",  label: "Value",  kind: "text",     width: 20 },
              { key: "hint",   label: "Notes",  kind: "text",     width: 40 },
            ],
            sections: [
              {
                rows: boxes.map((b) => ({
                  metric: b.label,
                  value:  b.value,
                  hint:   b.hint ?? "",
                })),
              },
            ],
            footnote: "Yearly stats computed from full-year actuals. Multi-currency totals are converted at the historical rate from each transaction's date.",
          }}
          entitled={canExport}
        />
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
