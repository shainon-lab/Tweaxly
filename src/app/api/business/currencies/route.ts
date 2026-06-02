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
import { resolveCurrencyCode, currencyDisplayLabel } from "@/lib/currencies";

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

  // Normalize each raw label (code / name / symbol) to its ISO code and
  // merge the counts, so "EURO", "€" and "EUR" collapse into one Euro (€)
  // row. Unrecognized labels keep their raw uppercased form. The base
  // currency is dropped (everything is already normalized to it).
  const baseCode = resolveCurrencyCode(business.currency) ?? business.currency.toUpperCase();

  const merged = new Map<string, { currency: string; code: string | null; count: number }>();
  for (const r of rows) {
    const raw = (r.currency ?? "").trim();
    if (!raw) continue;
    const code = resolveCurrencyCode(raw);
    if (code && code === baseCode) continue; // already the base currency
    const key = code ?? raw.toUpperCase();
    const count = Number(r.count);
    const existing = merged.get(key);
    if (existing) {
      existing.count += count;
    } else {
      merged.set(key, {
        currency: code ? currencyDisplayLabel(code) : raw.toUpperCase(),
        code,
        count,
      });
    }
  }

  const detected = [...merged.values()].sort((a, b) => b.count - a.count);

  return NextResponse.json({
    baseCurrency: business.currency,
    detected,
  });
}
