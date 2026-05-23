// POST /api/business/profile/save-summary
//   body: { summary: string }
//
// Saves an owner-edited "About Your Business" paragraph. Separate
// from the structured PATCH /api/business/profile so a manual edit
// to the summary text doesn't get clobbered by an unrelated field
// save, and so the generate-summary endpoint can stay the only
// writer of aiSummaryUpdatedAt for AI-generated copies.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SUMMARY_CHARS = 4000;

export async function POST(req: Request) {
  const { business } = await requireBusiness();

  let body: { summary?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  if (typeof body.summary !== "string") {
    return NextResponse.json({ error: "summary_required" }, { status: 400 });
  }

  const summary = body.summary.trim().slice(0, MAX_SUMMARY_CHARS);

  // Upsert - the row may not exist yet if the user opened this
  // screen on a workspace that never completed the wizard.
  const updated = await prisma.businessProfile.upsert({
    where:  { businessId: business.id },
    create: { businessId: business.id, aiSummary: summary, aiSummaryUpdatedAt: new Date() },
    update: { aiSummary: summary, aiSummaryUpdatedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    summary: updated.aiSummary,
    aiSummaryUpdatedAt: updated.aiSummaryUpdatedAt?.toISOString() ?? null,
  });
}
