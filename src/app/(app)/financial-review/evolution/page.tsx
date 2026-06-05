// Business Evolution (V2). Multi-year analysis across the workspace's
// financial reports. The deterministic trend dashboard renders
// immediately; the AI narrative (story, timeline, DNA, strategy) is
// generated on demand and cached per workspace.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildYearSeries,
  computeEvolutionMetrics,
  yearsKeyOf,
  EvolutionResultSchema,
} from "@/lib/financialReview/evolution";
import FinancialReviewTabs from "../FinancialReviewTabs";
import ReviewDisclaimer from "@/components/financial-review/Disclaimer";
import EvolutionDashboard from "./EvolutionDashboard";
import EvolutionAnalysis from "./EvolutionAnalysis";

export const dynamic = "force-dynamic";

export default async function EvolutionPage() {
  const { business } = await requireBusiness();

  const reviews = await prisma.financialReview.findMany({
    where: { businessId: business.id, status: "complete", financialYear: { not: null } },
    select: { financialYear: true, status: true, score: true, financials: true, createdAt: true },
  });

  const series = buildYearSeries(reviews);
  const enoughYears = series.length >= 2;

  if (!enoughYears) {
    return (
      <>
        <PageHeader title="Business Evolution" subtitle="Multi-year analysis of how your business has changed." />
        <FinancialReviewTabs showEvolution={false} />
        <div className="card mx-auto max-w-xl py-10 text-center">
          <div className="t-card">Business Evolution unlocks with two years</div>
          <p className="t-meta mx-auto mt-2 max-w-md text-slate-400">
            You currently have {series.length} financial {series.length === 1 ? "year" : "years"} of completed reviews.
            Upload a report for another year and the multi-year analysis - business story, timeline, DNA profile and
            multi-year forecast - will appear here.
          </p>
          <Link href="/financial-review" className="btn-primary mt-5 inline-flex">Go to Reviews</Link>
        </div>
      </>
    );
  }

  const metrics = computeEvolutionMetrics(series);
  const currentKey = yearsKeyOf(series);

  const cached = await prisma.businessEvolution.findUnique({ where: { businessId: business.id } });
  const parsed = cached ? EvolutionResultSchema.safeParse(cached.result) : null;
  const initialResult = parsed?.success ? parsed.data : null;
  const stale = !!initialResult && cached!.yearsKey !== currentKey;

  return (
    <>
      <PageHeader
        title="Business Evolution"
        subtitle={`How your business has changed across ${series.length} years (${metrics.years[0]} - ${metrics.years[metrics.years.length - 1]}).`}
      />
      <FinancialReviewTabs showEvolution />

      <div className="space-y-8 pb-12">
        <ReviewDisclaimer />
        <EvolutionDashboard metrics={metrics} currency={business.currency} />
        <EvolutionAnalysis initialResult={initialResult} stale={stale} />
      </div>
    </>
  );
}
