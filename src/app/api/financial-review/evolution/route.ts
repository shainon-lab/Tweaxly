import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildYearSeries, computeEvolutionMetrics, yearsKeyOf } from "@/lib/financialReview/evolution";
import { generateBusinessEvolution } from "@/lib/financialReview/evolutionGenerate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function claudeConfigured(): string | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ok =
    !!apiKey &&
    apiKey.length > 20 &&
    !/change-me|placeholder|todo|your[-_]key/i.test(apiKey);
  return ok ? apiKey! : null;
}

// POST /api/financial-review/evolution - (re)generate the multi-year
// Business Evolution analysis for the current workspace and cache it.
export async function POST() {
  const { business } = await requireBusiness();

  const apiKey = claudeConfigured();
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI engine is not configured (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const reviews = await prisma.financialReview.findMany({
    where: { businessId: business.id, status: "complete", financialYear: { not: null } },
    select: { financialYear: true, status: true, score: true, financials: true, createdAt: true },
  });

  const series = buildYearSeries(reviews);
  if (series.length < 2) {
    return NextResponse.json(
      { error: "Business Evolution needs at least two financial years." },
      { status: 400 },
    );
  }

  const metrics = computeEvolutionMetrics(series);

  let result;
  try {
    result = await generateBusinessEvolution({
      businessId: business.id,
      apiKey,
      currency: business.currency,
      metrics,
    });
  } catch {
    return NextResponse.json(
      { error: "The evolution analysis could not be generated. Please try again." },
      { status: 502 },
    );
  }

  const yearsKey = yearsKeyOf(series);
  await prisma.businessEvolution.upsert({
    where: { businessId: business.id },
    create: { businessId: business.id, yearsKey, result },
    update: { yearsKey, result },
  });

  return NextResponse.json({ ok: true, yearsKey, result });
}
