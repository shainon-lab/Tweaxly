// GET /api/billing/transactions
//   Returns the credit-transaction ledger for the current business,
//   newest first. Authenticated; restricted to the requesting
//   business's own data.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { getRecentTransactions } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { business } = await requireBusiness();
  const url   = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const rows  = await getRecentTransactions(business.id, limit);

  return NextResponse.json({
    transactions: rows.map((r) => ({
      id:           r.id,
      delta:        r.delta,
      kind:         r.kind,
      reason:       r.reason,
      balanceAfter: r.balanceAfter,
      expiresAt:    r.expiresAt?.toISOString() ?? null,
      createdAt:    r.createdAt.toISOString(),
    })),
  });
}
