// Change the current user's password. POST { currentPassword, newPassword }.
// Verifies the current password against the stored hash, then updates the
// hash to the new password. No session invalidation — the user stays
// logged in.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 },
    );
  }
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const ok = await bcrypt.compare(currentPassword, fresh.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 },
    );
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });
  return NextResponse.json({ ok: true });
}
