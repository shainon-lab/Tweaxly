// POST /api/businesses/[id]/leave
//
// Removes the caller from a workspace. Owners can't leave their own
// workspace - they must either transfer ownership (future feature) or
// delete the workspace outright.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (business.ownerId === user.id) {
    return NextResponse.json(
      { error: "owner_cannot_leave", message: "Owners can't leave their own workspace. Transfer ownership or delete the workspace instead." },
      { status: 400 }
    );
  }

  await prisma.businessMembership.deleteMany({
    where: { userId: user.id, businessId: params.id },
  });

  const session = await getSession();
  if (session.currentBusinessId === params.id) {
    session.currentBusinessId = undefined;
    await session.save();
  }
  return NextResponse.json({ ok: true });
}
