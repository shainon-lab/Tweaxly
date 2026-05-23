import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// GET - list all upload batches for the current business
export async function GET() {
  const { business } = await requireBusiness();
  const batches = await prisma.uploadBatch.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactions: true } } },
  });
  return NextResponse.json({ batches });
}

// DELETE - remove a specific upload batch and ALL its transactions.
// Cascade is implicit: Transaction.uploadBatch is onDelete:SetNull, so we
// explicitly delete the transactions first, then the batch.
export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const owned = await prisma.uploadBatch.findFirst({
    where: { id, businessId: business.id },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Delete the transactions first so the data is fully removed (not just orphaned).
  const txnsDeleted = await prisma.transaction.deleteMany({
    where: { uploadBatchId: id, businessId: business.id },
  });
  await prisma.uploadBatch.delete({ where: { id } });

  // Clean any duplicate groups that no longer have associated transactions.
  await prisma.duplicateGroup.deleteMany({
    where: { businessId: business.id, transactions: { none: {} } },
  });

  return NextResponse.json({
    ok: true,
    deletedTransactions: txnsDeleted.count,
  });
}
