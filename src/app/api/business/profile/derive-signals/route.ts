// POST /api/business/profile/derive-signals
//
// Runs the Smart Evolution enrichment pass for the current
// workspace. Detectors look at trailing months + averages + top
// vendors/categories + forecast, write the resulting observations to
// BusinessProfile.derivedSignals, and timestamp lastDerivedAt for
// staleness checks. Called by the "Refresh patterns" button in
// Settings + lazily on dashboard load when signals are >7 days old.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { enrichDerivedSignals } from "@/lib/businessProfileEnrichment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { business } = await requireBusiness();
  try {
    const { signals, mode } = await enrichDerivedSignals(business.id);
    return NextResponse.json({ signals, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "enrich_failed";
    console.error("[derive-signals] failed", { businessId: business.id, message });
    return NextResponse.json({ error: "enrich_failed", message }, { status: 500 });
  }
}
