// GET /api/auth/verify-email?token=<plaintext>
//
// Endpoint hit by the link in the welcome email. Validates the token
// against the SHA-256 hash stored on the user, marks emailVerified
// (timestamp) on success, clears the token + expiry so the link is
// single-use, and redirects to /account/verified (success) or
// /auth/verify-email?status=<error> (failure) so the client page can
// render the right state.
//
// The link is GET because email clients pre-fetch links sometimes,
// but token-consume is still idempotent: a successful verification
// nulls the hash, so a duplicate hit returns "already_verified" and
// the user lands on the same success page.

import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/auth/verification";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url   = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const result = await consumeVerificationToken(token);

  if (result.ok) {
    // Audit success so the Account → Access Logs feed reflects it.
    await recordAudit({
      actorUserId: result.userId,
      action:      "auth.email_verified",
      request:     req,
    });
    return NextResponse.redirect(new URL("/account/verified", req.url), { status: 303 });
  }

  // Failures route back to the client page with a status hint so it
  // can render "expired" / "invalid" / "already verified" copy. The
  // token never appears in the redirect.
  const failUrl = new URL("/auth/verify-email", req.url);
  failUrl.searchParams.set("status", result.reason);
  return NextResponse.redirect(failUrl, { status: 303 });
}
