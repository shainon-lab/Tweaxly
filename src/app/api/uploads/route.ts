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
// Wrapped in $transaction so a partial failure rolls back instead of
// orphaning rows half-deleted. Errors return JSON, never an HTML page.
export async function DELETE(req: NextRequest) {
  try {
    const { business } = await requireBusiness();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const owned = await prisma.uploadBatch.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Upload not found in this workspace." }, { status: 404 });

    const txnsDeleted = await prisma.$transaction(async (tx) => {
      const del = await tx.transaction.deleteMany({
        where: { uploadBatchId: id, businessId: business.id },
      });
      await tx.uploadBatch.delete({ where: { id } });
      return del.count;
    });

    // Clean any duplicate groups left empty after the deletion. Runs outside
    // the $transaction since it's a cleanup, not a correctness requirement.
    await prisma.duplicateGroup.deleteMany({
      where: { businessId: business.id, transactions: { none: {} } },
    });

    return NextResponse.json({
      ok: true,
      deletedTransactions: txnsDeleted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delete failed";
    console.error("[/api/uploads DELETE]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
