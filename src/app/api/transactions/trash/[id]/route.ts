// POST   /api/transactions/trash/[id]   → restore the batch (un-trash
//                                          every transaction in it)
// DELETE /api/transactions/trash/[id]   → permanently purge NOW
//                                          (bypasses the 30-day wait)

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { restoreBatch, purgeBatch } from "@/lib/trash";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  const result = await restoreBatch({ businessId: business.id, batchId: id });
  return NextResponse.json({ ok: true, ...result });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  const result = await purgeBatch({ businessId: business.id, batchId: id });
  return NextResponse.json({ ok: true, ...result });
}
