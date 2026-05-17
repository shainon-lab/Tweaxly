// POST /api/admin/impersonate
//   body: { businessId: string, allowWrites?: boolean }
//   - super_admin only
//   - sets session.impersonatingBusinessId
//   - writes an audit log entry
//
// POST /api/admin/impersonate/exit
//   - clears impersonation state
//   - writes an audit log entry
//
// POST /api/admin/impersonate/allow-writes
//   body: { allow: boolean }
//   - toggles session.impersonationAllowWrites
//   - super_admin only AND must already be impersonating

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) return auth.response;

  let body: { businessId?: string; allowWrites?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.businessId || typeof body.businessId !== "string") {
    return NextResponse.json({ error: "missing_businessId" }, { status: 400 });
  }

  const target = await prisma.business.findUnique({
    where: { id: body.businessId },
    select: { id: true, name: true, status: true },
  });
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await getSession();
  session.impersonatingBusinessId = target.id;
  session.impersonationAllowWrites = !!body.allowWrites;
  await session.save();

  await recordAudit({
    actorUserId: auth.user.id,
    action: "impersonation.enter",
    targetBusinessId: target.id,
    metadata: {
      businessName: target.name,
      businessStatus: target.status,
      allowWrites: !!body.allowWrites,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, businessId: target.id, name: target.name });
}
