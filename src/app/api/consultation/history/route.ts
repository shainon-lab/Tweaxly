// Delete a consultation history entry. Each history row is now a whole
// thread, so `id` is the consultation id and we remove the entire
// conversation (all of its messages) in one go.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Confirm the consultation belongs to this business before deleting.
  const owned = await prisma.consultation.findFirst({
    where: { id, businessId: business.id },
  });
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.consultationMessage.deleteMany({ where: { consultationId: id } });
  await prisma.consultation.deleteMany({ where: { id, businessId: business.id } });

  return NextResponse.json({ ok: true });
}
