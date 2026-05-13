import PageHeader from "@/components/PageHeader";
import ReportsTabs from "@/components/ReportsTabs";
import InsightsTabs from "@/components/InsightsTabs";
import { requireBusiness } from "@/lib/auth";
import DashboardInsights from "../dashboard/DashboardInsights";

// Insights tab — the chart grid (Trend, Cash flow, Top expense categories,
// Revenue channel, Spending shape, Swing, Top vendors) all scoped to a
// user-selected period. Same component the dashboard used to render inline;
// it lives at this URL now.
export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{
    insights_gran?: string;
    insights_period?: string;
    insights_from?: string;
    insights_to?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  return (
    <>
      <PageHeader
        title="Reports and Insights"
        subtitle="Visual breakdowns of your business — pick a period to drive every chart below."
      />
      <ReportsTabs />
      <InsightsTabs />
      <DashboardInsights
        businessId={business.id}
        currency={business.currency}
        granularity={sp.insights_gran}
        anchor={sp.insights_period}
        from={sp.insights_from}
        to={sp.insights_to}
      />
    </>
  );
}
