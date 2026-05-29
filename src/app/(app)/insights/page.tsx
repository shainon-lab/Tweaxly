import PageHeader from "@/components/PageHeader";
import ReportsTabs from "@/components/ReportsTabs";
import ReportsHelp from "@/components/ReportsHelp";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardInsights from "../dashboard/DashboardInsights";
import EmptyDataPreview from "@/components/EmptyDataPreview";

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
  const totalTxnCount = await prisma.transaction.count({
    where: { businessId: business.id },
  });
  return (
    <>
      <PageHeader
        title="Reports - Charts"
        subtitle="Visual snapshot - seven charts on one page for the selected period."
        help={<ReportsHelp />}
      />
      <ReportsTabs />
      {totalTxnCount === 0 ? (
        <EmptyDataPreview surface="insights" />
      ) : (
        <DashboardInsights
          businessId={business.id}
          currency={business.currency}
          granularity={sp.insights_gran}
          anchor={sp.insights_period}
          from={sp.insights_from}
          to={sp.insights_to}
        />
      )}
    </>
  );
}
