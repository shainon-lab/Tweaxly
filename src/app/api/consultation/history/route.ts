// Delete a single consultation history entry - defined as a user
// message plus its immediately-following assistant message in the
// same thread. Identified by the user message id, since that's what
// the history list uses for selection.

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

  // Confirm the user-message belongs to this business and is a user
  // message (you can't delete an assistant message standalone).
  const userMsg = await prisma.consultationMessage.findFirst({
    where: { id, role: "user", consultation: { businessId: business.id } },
  });
  if (!userMsg) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Find the next assistant message in the same thread (the one that
  // answered this question). It's the closest assistant message
  // created after the user message in the same consultation.
  const pairedAssistant = await prisma.consultationMessage.findFirst({
    where: {
      consultationId: userMsg.consultationId,
      role: "assistant",
      createdAt: { gt: userMsg.createdAt },
    },
    orderBy: { createdAt: "asc" },
  });

  const idsToDelete = [userMsg.id];
  if (pairedAssistant) idsToDelete.push(pairedAssistant.id);

  await prisma.consultationMessage.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  // If the consultation thread is now empty, garbage-collect it.
  const remaining = await prisma.consultationMessage.count({
    where: { consultationId: userMsg.consultationId },
  });
  if (remaining === 0) {
    await prisma.consultation.deleteMany({
      where: { id: userMsg.consultationId, businessId: business.id },
    });
  }

  return NextResponse.json({ ok: true, deleted: idsToDelete.length });
}
