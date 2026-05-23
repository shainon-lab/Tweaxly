// POST /api/business/profile/generate-summary
//
// Rebuilds the "About Your Business" paragraph from the current
// profile fields + the live business snapshot. Always returns the
// fresh text (and persists it server-side). Used by the Regenerate
// button + by the wizard at onboarding completion.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { generateBusinessSummary, getBusinessProfile, isProfileSubstantive } from "@/lib/businessProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { business } = await requireBusiness();
  const profile = await getBusinessProfile(business.id);
  if (!isProfileSubstantive(profile)) {
    return NextResponse.json({
      error:   "profile_too_thin",
      message: "Fill in industry + at least one business model before generating the summary.",
    }, { status: 400 });
  }
  try {
    const { summary, mode } = await generateBusinessSummary(business.id);
    return NextResponse.json({ summary, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "generate_failed";
    console.error("[generate-summary] failed", { businessId: business.id, message });
    return NextResponse.json({ error: "generate_failed", message }, { status: 500 });
  }
}
