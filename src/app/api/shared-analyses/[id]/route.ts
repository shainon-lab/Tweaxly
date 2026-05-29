import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// PATCH /api/shared-analyses/[id]
//   Toggle the `isActive` flag on an existing share. Used by the
//   management table to disable a link without losing analytics and,
//   if needed, to re-enable a previously disabled (not yet expired)
//   one. Body: { isActive: boolean }.
//
//   Scoped to the current workspace - a user from a different
//   workspace can't reach a share owned by another business even
//   if they guess the id, because the where-clause forces both
//   id AND businessId.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { business } = await requireBusiness();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null) as { isActive?: unknown } | null;
  if (!body || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive_required" }, { status: 400 });
  }

  // Lookup-then-update so we can return a clean 404 instead of a
  // generic Prisma not-found error.
  const existing = await prisma.sharedAnalysis.findFirst({
    where:  { id, businessId: business.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.sharedAnalysis.update({
    where: { id },
    data:  { isActive: body.isActive },
    select: {
      id:        true,
      isActive:  true,
      expiresAt: true,
    },
  });

  return NextResponse.json({
    id:        updated.id,
    isActive:  updated.isActive,
    expiresAt: updated.expiresAt.toISOString(),
  });
}

// DELETE /api/shared-analyses/[id]
//   Permanently remove a share. We delete the row outright rather
//   than soft-delete because (a) `isActive=false` is already the
//   "keep history, kill access" pattern, and (b) the snapshot can
//   be megabytes - keeping deleted rows around is wasteful.
//   Scoped to the current workspace via the where-clause.
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { business } = await requireBusiness();
  const { id } = await ctx.params;

  const existing = await prisma.sharedAnalysis.findFirst({
    where:  { id, businessId: business.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.sharedAnalysis.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
