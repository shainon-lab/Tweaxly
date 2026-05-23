import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trashTransactions } from "@/lib/trash";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();
  const body = await req.json() as { ids: string[]; action: string; categoryId?: string; value?: boolean; note?: string; reason?: string };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "no ids" }, { status: 400 });
  }
  const where = { businessId: business.id, id: { in: body.ids } };
  switch (body.action) {
    case "setCategory":
      if (!body.categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
      // Verify category belongs to business.
      const cat = await prisma.category.findFirst({ where: { id: body.categoryId, businessId: business.id } });
      if (!cat) return NextResponse.json({ error: "bad category" }, { status: 400 });
      await prisma.transaction.updateMany({ where, data: { categoryId: body.categoryId } });
      break;
    case "toggleOneTime":
      await prisma.transaction.updateMany({ where, data: { isOneTime: !!body.value } });
      break;
    case "toggleRecurring":
      await prisma.transaction.updateMany({ where, data: { isRecurring: !!body.value } });
      break;
    case "toggleExcluded":
      await prisma.transaction.updateMany({ where, data: { isExcludedFromPnl: !!body.value } });
      break;
    case "markIgnore":
      // Mark as "not calculated" with an optional reason. Setting value=false
      // un-ignores them and clears the note.
      if (body.value === false) {
        await prisma.transaction.updateMany({ where, data: { isExcludedFromPnl: false, excludeNote: null } });
      } else {
        await prisma.transaction.updateMany({
          where,
          data: {
            isExcludedFromPnl: true,
            excludeNote: typeof body.note === "string" && body.note.trim().length > 0 ? body.note.trim() : null,
          },
        });
      }
      break;
    case "dismissDup": {
      const txns = await prisma.transaction.findMany({ where, select: { duplicateGroupId: true } });
      const groupIds = Array.from(new Set(
        txns.map((t) => t.duplicateGroupId).filter((g): g is string => !!g)
      ));
      await prisma.transaction.updateMany({
        where,
        data: { isDuplicateCandidate: false, duplicateGroupId: null },
      });
      for (const gid of groupIds) {
        const remaining = await prisma.transaction.count({
          where: { duplicateGroupId: gid, isDuplicateCandidate: true },
        });
        if (remaining === 0) {
          await prisma.duplicateGroup.update({ where: { id: gid }, data: { status: "dismissed" } });
        }
      }
      break;
    }
    case "trash": {
      // Move every selected row to the recycle bin. Soft-delete +
      // create one TrashBatch tying them together so the restore
      // log is a single entry. Optional reason becomes the batch
      // label in the trash UI.
      const result = await trashTransactions({
        businessId: business.id,
        userId:     user.id,
        txnIds:     body.ids,
        reason:     body.reason ?? null,
      });
      return NextResponse.json({ ok: true, batchId: result.batchId, trashed: result.trashed });
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
