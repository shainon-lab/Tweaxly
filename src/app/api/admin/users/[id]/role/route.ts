// PATCH /api/admin/users/[id]/role
//   body: { role: "user" | "admin" }
//
// Change a user's system role. Super-admin only.
//
// Guard rails:
//   - Target user must exist
//   - Target user's current role must not be 'super_admin' (super
//     admin is untouchable from this surface)
//   - New role must be 'user' or 'admin' (we don't promote to
//     super_admin via UI - that's a deliberate manual DB op)
//   - Caller cannot demote themselves (you can't lock yourself out)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const ALLOWED_TARGET_ROLES = new Set(["user", "admin"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) return auth.response;

  let body: { role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body.role || !ALLOWED_TARGET_ROLES.has(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, systemRole: true },
  });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (target.systemRole === "super_admin") {
    return NextResponse.json(
      { error: "super_admin_protected", message: "The super admin's role can't be changed from this surface." },
      { status: 403 }
    );
  }
  if (target.id === auth.user.id) {
    return NextResponse.json(
      { error: "self_demote_blocked", message: "You can't change your own role." },
      { status: 403 }
    );
  }
  if (target.systemRole === body.role) {
    return NextResponse.json({ ok: true, role: body.role, unchanged: true });
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { systemRole: body.role },
  });

  await recordAudit({
    actorUserId: auth.user.id,
    action: "user.role_change",
    targetBusinessId: null,
    metadata: {
      targetUserId: target.id,
      targetEmail: target.email,
      from: target.systemRole,
      to: body.role,
    },
    request: req,
  });

  return NextResponse.json({ ok: true, role: body.role });
}
