// POST /api/auth/reset
//
//   body: form-encoded { token, password, confirmPassword }
//   on success: 303 → /login?reset=1
//   on failure: 303 → /reset-password?token=...&err=<code>
//
// Validation pipeline (server-side, not just UI):
//   1. token present, exists in DB, not expired, not used
//   2. password === confirmPassword
//   3. password passes isValidPassword (≥ 6 chars)
//
// On success:
//   - bcrypt the new password
//   - update User.passwordHash
//   - mark this token usedAt = now()
//   - invalidate any OTHER outstanding tokens for the same user (single-
//     use already, but a second active token would let an attacker who
//     just compromised the first one try again — wipe them)
//   - destroy any active session in the cookie (don't auto-login;
//     spec calls for "redirect the user to login" with success msg)

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashResetToken, isValidPassword } from "@/lib/passwordReset";
import { checkRateLimit, ipFromRequest } from "@/lib/rateLimit";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(req: NextRequest, token: string, err: string) {
  return NextResponse.redirect(
    new URL(`/reset-password?token=${encodeURIComponent(token)}&err=${err}`, req.url),
    { status: 303 }
  );
}

export async function POST(req: NextRequest) {
  // Rate-limit redemption attempts per IP — slows brute force on a
  // leaked token guess. Liberal: 10 per 15 min.
  const ip = ipFromRequest(req);
  const limited = checkRateLimit({
    key: `reset:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  if (!token) {
    return NextResponse.redirect(new URL("/forgot-password", req.url), { status: 303 });
  }
  if (password !== confirmPassword) return back(req, token, "mismatch");
  if (!isValidPassword(password)) return back(req, token, "weak");

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!row) return back(req, token, "invalid");
  if (row.usedAt) return back(req, token, "used");
  if (row.expiresAt.getTime() < Date.now()) return back(req, token, "expired");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate every OTHER outstanding token for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  // Destroy any active session the user might have in the browser, so
  // the redirect takes them to a fresh login with the new password.
  const res = NextResponse.redirect(new URL("/login?reset=1", req.url), { status: 303 });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.destroy();
  return res;
}
