// POST /api/transactions/[id]/fx-override
//
// Body: { rate: number, note?: string }
//
// Manually overrides the exchange rate on a single transaction.
// The provided rate is persisted to the ExchangeRate cache under
// source="manual" so subsequent imports for the same (currency pair,
// transaction date) inherit it, and the transaction itself is
// recalculated with the new rate. Stamps manualRateOverride=true and
// rateFetchStatus="manual".

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setManualRate } from "@/lib/fx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  let body: { rate?: unknown; note?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const rate = Number(body.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return NextResponse.json({ error: "rate must be a positive number" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  const txn = await prisma.transaction.findFirst({
    where: { id, businessId: business.id },
    select: {
      id: true, originalAmount: true, originalCurrency: true,
      baseCurrency: true, amount: true, currency: true,
      transactionDate: true,
    },
  });
  if (!txn) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Fallbacks for transactions imported before multi-currency support
  // — assume they were already in the business base currency.
  const orig = txn.originalAmount ?? txn.amount;
  const origCcy = (txn.originalCurrency ?? txn.currency ?? business.currency).toUpperCase();
  const base = (txn.baseCurrency ?? business.currency).toUpperCase();

  if (origCcy === base) {
    return NextResponse.json({
      error: "Transaction is already in the base currency — no rate to override.",
    }, { status: 400 });
  }

  // Persist the manual rate so it's reusable for sibling transactions
  // sharing the same currency pair + date.
  await setManualRate({
    baseCurrency:  base,
    quoteCurrency: origCcy,
    rate,
    rateDate:      txn.transactionDate,
  });

  const converted = orig * rate;
  const updated = await prisma.transaction.update({
    where: { id: txn.id },
    data: {
      amount: converted,
      originalAmount: orig,
      originalCurrency: origCcy,
      baseCurrency: base,
      exchangeRate: rate,
      exchangeRateDate: txn.transactionDate,
      exchangeRateSource: "manual",
      conversionMethod: "manual_fixed",
      isConverted: true,
      manualRateOverride: true,
      manualRateNote: note,
      rateFetchStatus: "manual",
    },
  });

  return NextResponse.json({ ok: true, transaction: updated });
}
