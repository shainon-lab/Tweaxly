// POST /api/onboarding/save
//   body: { businessName, businessFormat, currency, country, industry,
//           businessStage, hasAnnualReports?, paysSalaries?, goals[] }
//
// Persists every field collected by the adaptive onboarding wizard
// onto the user's current Business, and stamps onboardedAt to mark
// the wizard complete. Goals are stored as a comma-joined string in
// Business.goals; downstream readers split on comma.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { isRegionCode } from "@/lib/regions";

const ALLOWED_STAGES  = new Set(["new", "growing", "established"]);
const ALLOWED_FORMATS = new Set(["sole_prop", "llc", "partnership", "other"]);
const ALLOWED_GOALS = new Set([
  "profitability", "expenses", "cashflow", "trends", "growth", "certainty",
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { business } = await requireBusiness();

  let body: {
    businessName?: string;
    businessFormat?: string;
    currency?: string;
    country?: string;
    industry?: string;
    businessStage?: string;
    hasAnnualReports?: boolean | null;
    paysSalaries?: boolean | null;
    goals?: string[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if (body.businessName && body.businessName.trim()) {
    data.name = body.businessName.trim().slice(0, 120);
  }
  if (body.businessFormat && ALLOWED_FORMATS.has(body.businessFormat)) {
    data.businessFormat = body.businessFormat;
  }
  if (body.currency && /^[A-Z]{3}$/.test(body.currency)) {
    data.currency = body.currency;
  }
  if (body.country && isRegionCode(body.country)) {
    data.country = body.country;
  }
  if (body.industry && typeof body.industry === "string") {
    const v = body.industry.trim();
    data.industry = v ? v.slice(0, 80) : null;
  }
  if (body.businessStage && ALLOWED_STAGES.has(body.businessStage)) {
    data.businessStage = body.businessStage;
  }
  if (body.hasAnnualReports === true || body.hasAnnualReports === false) {
    data.hasAnnualReports = body.hasAnnualReports;
  }
  if (body.paysSalaries === true || body.paysSalaries === false) {
    data.paysSalaries = body.paysSalaries;
  }
  if (Array.isArray(body.goals)) {
    const cleaned = body.goals
      .filter((g): g is string => typeof g === "string" && ALLOWED_GOALS.has(g));
    data.goals = cleaned.length ? cleaned.join(",") : null;
  }

  data.onboardedAt = new Date();

  await prisma.business.update({
    where: { id: business.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
