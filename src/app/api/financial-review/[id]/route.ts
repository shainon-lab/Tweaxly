import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/financial-review/[id] - fetch one review (workspace-scoped).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  const review = await prisma.financialReview.findFirst({
    where: { id, businessId: business.id },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found in this workspace." }, { status: 404 });
  }
  return NextResponse.json({ review });
}

// DELETE /api/financial-review/[id] - remove a review (workspace-scoped).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  await prisma.financialReview.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
