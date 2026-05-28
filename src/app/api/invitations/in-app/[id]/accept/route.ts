// POST /api/invitations/in-app/[id]/accept
//
// In-app variant of the token-based accept route. The user is already
// logged in, the invitation id comes from the bell notification or
// the Members & Access "Incoming invitations" list, and the email
// match is enforced server-side (same primitive used by the email
// flow).

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { acceptInvitationById } from "@/lib/memberships";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const result = await acceptInvitationById(id, user.id, user.email);
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
    metadata:         { role: result.role, channel: "in_app" },
    request:          req,
  });

  return NextResponse.json({ ok: true, businessId: result.businessId, role: result.role });
}
