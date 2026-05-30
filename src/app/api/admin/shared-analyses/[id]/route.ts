import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSuperApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Cross-tenant variants of /api/shared-analyses/[id]. Same writes,
// no workspace scope check — used by /admin/shared-analyses so a
// super-admin can revoke or delete any share without being a member
// of the owning workspace.
//
// Both routes intentionally call the public-facing helper functions
// where possible so the admin path stays the canonical write path
// rather than a parallel implementation that could drift.

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrSuperApi();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null) as { isActive?: unknown } | null;
  if (!body || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive_required" }, { status: 400 });
  }

  const existing = await prisma.sharedAnalysis.findUnique({
    where:  { id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.sharedAnalysis.update({
    where: { id },
    data:  { isActive: body.isActive },
    select: { id: true, isActive: true, expiresAt: true },
  });
  return NextResponse.json({
    id:        updated.id,
    isActive:  updated.isActive,
    expiresAt: updated.expiresAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrSuperApi();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const existing = await prisma.sharedAnalysis.findUnique({
    where:  { id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.sharedAnalysis.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
