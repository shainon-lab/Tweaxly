import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  FinancialAnalysisContextSchema,
  applyAnswersToContext,
} from "@/lib/financialReview/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/financial-review/context - the workspace's durable
// financial-analysis context (country, currency, business model, the
// detected flags and the plain-English answers).
export async function GET() {
  const { business } = await requireBusiness();
  const ctx = FinancialAnalysisContextSchema.parse(business.financialAnalysisContext ?? {});
  return NextResponse.json({ context: ctx });
}

// POST /api/financial-review/context - merge contextual follow-up
// answers into the durable business context. Body: { answers: {...} }.
// Answers are plain-English business context, never accounting
// treatment - the audited statement remains the source of truth.
export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();

  let body: { answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }

  // Keep only string answers, capped in size.
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.answers ?? {})) {
    if (typeof k === "string" && typeof v === "string" && v.trim()) {
      answers[k.slice(0, 60)] = v.trim().slice(0, 200);
    }
  }
  if (Object.keys(answers).length === 0) {
    return NextResponse.json({ error: "No answers were provided." }, { status: 400 });
  }

  const updated = applyAnswersToContext(
    business.financialAnalysisContext as Record<string, unknown> | null,
    answers,
    new Date().toISOString(),
  );

  await prisma.business.update({
    where: { id: business.id },
    data: { financialAnalysisContext: updated },
  });

  return NextResponse.json({ ok: true, context: updated });
}
