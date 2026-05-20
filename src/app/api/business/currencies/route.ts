// GET /api/business/currencies
//
// Returns the business's base currency and the set of currencies
// auto-detected from existing transactions (with a row count for
// each), so the Settings → Currency section can show "what we've
// seen in your data" without asking the user to define currency
// lists manually.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { business } = await requireBusiness();

  // Group by originalCurrency where set, fall back to currency for
  // pre-multi-currency rows. We use raw SQL with COALESCE to merge
  // the two columns into one canonical bucket per currency.
  const rows = await prisma.$queryRaw<Array<{ currency: string; count: bigint }>>`
    SELECT
      COALESCE("originalCurrency", "currency") AS currency,
      COUNT(*)::bigint                          AS count
    FROM "Transaction"
    WHERE "businessId" = ${business.id}
    GROUP BY COALESCE("originalCurrency", "currency")
    ORDER BY count DESC
  `;

  const detected = rows.map((r) => ({
    currency: (r.currency ?? "").toUpperCase(),
    count: Number(r.count),
  })).filter((r) => r.currency.length > 0);

  return NextResponse.json({
    baseCurrency: business.currency,
    detected,
  });
}
