// POST /api/auth/resend-verification
//
// Requires an authenticated session. Generates a fresh token (which
// invalidates any previous token on the user), sends the welcome
// email again, and audits the send.
//
// Rate-limited server-side via checkResendAllowed:
//   - 60-second cooldown between sends (per-user)
//   - max 10 sends per 24 hours (per-user, counted from auditLog)
//
// Frontend mirrors the cooldown but never trusts that; this endpoint
// is the authoritative gate.

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  checkResendAllowed,
  generateAndStoreVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/verification";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();

  // No-op for already-verified users. Return 200 so the UI's resend
  // button doesn't appear broken when called on stale state.
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true, email: true, name: true },
  });
  if (!fresh) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  if (fresh.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const gate = await checkResendAllowed(user.id);
  if (!gate.ok) {
    if (gate.reason === "too_soon") {
      return NextResponse.json(
        { error: "too_soon", retryAfterSec: gate.retryAfterSec },
        { status: 429 },
      );
    }
    if (gate.reason === "daily_cap_exceeded") {
      return NextResponse.json(
        { error: "daily_cap_exceeded", cap: gate.cap },
        { status: 429 },
      );
    }
  }

  const token = await generateAndStoreVerificationToken(user.id);
  const result = await sendVerificationEmail({
    to:    fresh.email,
    name:  fresh.name,
    token,
  });
  await recordAudit({
    actorUserId: user.id,
    action:      "auth.verification_email_sent",
    metadata:    { trigger: "resend", ok: result.ok, error: result.error ?? null },
    request:     req,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "send_failed", message: result.error ?? "Email delivery failed." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
