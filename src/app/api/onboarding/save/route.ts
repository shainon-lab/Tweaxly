// POST /api/onboarding/save
//   body: { businessName, currency, country?, fiscalStartMonth? }
//
// Persists the business basics collected by the trimmed onboarding
// wizard and stamps onboardedAt to mark the wizard complete. Stage /
// payroll / goals / Business DNA moved out of the critical path  - 
// users can fill those in later via Settings without blocking entry.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { isRegionCode } from "@/lib/regions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { business } = await requireBusiness();

  let body: {
    businessName?: string;
    currency?: string;
    country?: string;
    fiscalStartMonth?: number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if (body.businessName && body.businessName.trim()) {
    data.name = body.businessName.trim().slice(0, 120);
  }
  if (body.currency && /^[A-Z]{3}$/.test(body.currency)) {
    data.currency = body.currency;
  }
  if (body.country && isRegionCode(body.country)) {
    data.country = body.country;
  }
  if (typeof body.fiscalStartMonth === "number" && body.fiscalStartMonth >= 1 && body.fiscalStartMonth <= 12) {
    data.fiscalStartMonth = body.fiscalStartMonth;
  }

  data.onboardedAt = new Date();

  await prisma.business.update({
    where: { id: business.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
