import PageHeader from "@/components/PageHeader";
import ReportsTabs from "@/components/ReportsTabs";
import { requireBusiness } from "@/lib/auth";
import DashboardInsights from "../dashboard/DashboardInsights";

// "Charts" tab in the Reports umbrella. Renders the seven-chart period
// grid (Trend, Cash flow, Top expense categories, Revenue channel,
// Spending shape, Swing, Top vendors). The Yearly Summary view used to
// live under this URL too; it now sits under Reports → Yearly Summary
// at /insights/yearly.
export default async function ChartsPage({
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
        title="Charts"
        subtitle="Visual breakdowns of your business — pick a period to drive every chart below."
      />
      <ReportsTabs />
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
