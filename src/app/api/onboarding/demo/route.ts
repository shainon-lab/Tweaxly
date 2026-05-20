// POST /api/onboarding/demo
//
// Explore Demo Business - seeds the caller's current workspace with a
// 3.5-year digital-agency dataset so they can explore every product
// surface immediately without uploading data. Marks the workspace as
// onboarded + status='demo' so the operator can tell it's not real.
//
// Destructive: wipes existing transactions / employees / categories /
// vendors / etc. on the target business before seeding. (Safe - only
// called from the onboarding welcome screen.)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { seedDemoBusiness } from "@/lib/demoSeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const { business } = await requireBusiness();

  const { transactions } = await seedDemoBusiness(business.id);

  await prisma.business.update({
    where: { id: business.id },
    data: {
      onboardedAt: new Date(),
      status: "demo",
      industry: "Digital Agency",
      country: "US",
      timezone: "America/Los_Angeles",
      businessStage: "established",
      businessFormat: "llc",
      paysSalaries: true,
      hasAnnualReports: true,
      goals: "profitability,trends,growth",
    },
  });

  return NextResponse.json({ ok: true, transactions });
}
