// POST /api/invitations/[token]/accept
//
// Accepts a pending workspace invitation for the currently logged-in
// user. The acceptance flow already authenticated the user (or sent
// them through signup); this endpoint just turns the token + user
// pair into a BusinessMembership row.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { acceptInvitation } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser();

  const result = await acceptInvitation(token, user.id, user.email);
  if (!result.ok) {
    const status =
      result.reason === "invalid_token"  ? 404 :
      result.reason === "expired"        ? 410 :
      result.reason === "already_used"   ? 409 :
      result.reason === "email_mismatch" ? 403 :
      400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  await recordAudit({
    actorUserId:      user.id,
    action:           "membership.invitation_accepted",
    targetBusinessId: result.businessId,
    metadata:         { role: result.role },
    request:          req,
  });

  return NextResponse.json({ ok: true, businessId: result.businessId, role: result.role });
}
