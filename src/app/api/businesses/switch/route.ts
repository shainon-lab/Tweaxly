// POST /api/businesses/switch
//   body: { businessId: string }
//
// Sets session.currentBusinessId after verifying the caller has an
// active membership in the target business. Never trust the client's
// businessId - the membership check is the security boundary.
//
// Side effects:
//   - If the caller is a super_admin currently impersonating, the
//     impersonation is cleared (switching workspaces is an explicit
//     user action; we don't want to silently keep impersonating).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.businessId) {
    return NextResponse.json({ error: "missing_businessId" }, { status: 400 });
  }

  const membership = await prisma.businessMembership.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: body.businessId } },
    select: { status: true, business: { select: { id: true, name: true, status: true } } },
  });
  if (!membership || membership.status !== "active") {
    return NextResponse.json({ error: "no_access" }, { status: 403 });
  }
  if (membership.business.status === "suspended") {
    return NextResponse.json({ error: "business_suspended" }, { status: 403 });
  }

  const session = await getSession();
  session.currentBusinessId = membership.business.id;
  // Clear impersonation when explicitly switching workspaces.
  session.impersonatingBusinessId = undefined;
  session.impersonationAllowWrites = undefined;
  await session.save();

  return NextResponse.json({ ok: true, businessId: membership.business.id, name: membership.business.name });
}
