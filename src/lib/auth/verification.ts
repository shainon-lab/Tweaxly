// Email-verification helpers.
//
// Token lifecycle:
//   1. signup / resend → generateAndStoreVerificationToken() creates
//      a cryptographically random 32-byte token, hashes it with
//      SHA-256, persists the hash + 24h expiry on the User row, and
//      returns the unhashed token for inclusion in the email link.
//      Any previous token on that user is invalidated (overwritten).
//   2. user clicks link with the unhashed token in the URL.
//   3. consumeVerificationToken() hashes the incoming token and
//      compares against the stored hash within the validity window.
//      On success, marks emailVerified + clears the token fields so
//      the link is single-use.
//
// The plaintext token NEVER touches the database. A database leak
// alone can't be used to verify accounts.

import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../db";
import { sendEmail } from "../email";

const TOKEN_BYTES        = 32;          // 256 bits of entropy
const TOKEN_TTL_MS       = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000;   // 60-second resend cooldown

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildVerifyUrl(token: string): string {
  // APP_URL is the canonical public origin (https://app.tweaxly.com on
  // prod, http://localhost:3000 in dev via .env.local). The /auth/
  // verify-email page hands the token straight to the API.
  const base = process.env.APP_URL ?? "https://app.tweaxly.com";
  return `${base.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export type ResendCheckResult =
  | { ok: true }
  | { ok: false; reason: "too_soon"; retryAfterSec: number }
  | { ok: false; reason: "daily_cap_exceeded"; cap: number };

const DAILY_RESEND_CAP = 10;

// Server-side rate-limit guard. The frontend mirrors the 60s timer
// but never trusts that; this is the authoritative check.
export async function checkResendAllowed(userId: string): Promise<ResendCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerificationSentAt: true, email: true },
  });
  if (!user) return { ok: true };

  if (user.emailVerificationSentAt) {
    const elapsed = Date.now() - user.emailVerificationSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "too_soon",
        retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  // 24h cap. We use the audit log so this never needs new columns and
  // a deletion of the user's row doesn't reset the counter (a future
  // anti-abuse improvement; today we just check audit history).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentInLast24h = await prisma.auditLog.count({
    where: {
      actorUserId: userId,
      action:      "auth.verification_email_sent",
      createdAt:   { gte: since },
    },
  });
  if (sentInLast24h >= DAILY_RESEND_CAP) {
    return { ok: false, reason: "daily_cap_exceeded", cap: DAILY_RESEND_CAP };
  }
  return { ok: true };
}

// Generates a token, stores its hash + expiry on the user, returns
// the plaintext token. Callers send the token in the email body.
// Overwrites any previous token (invalidates old emails).
export async function generateAndStoreVerificationToken(userId: string): Promise<string> {
  const plain = randomBytes(TOKEN_BYTES).toString("base64url");
  const hash  = hashToken(plain);
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      emailVerificationSentAt:    new Date(),
    },
  });
  return plain;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "already_verified" };

// Validates the plaintext token from the URL, marks the user
// verified, and clears the token fields so the link is single-use.
export async function consumeVerificationToken(plainToken: string): Promise<ConsumeResult> {
  if (!plainToken || typeof plainToken !== "string") return { ok: false, reason: "invalid" };
  const hash = hashToken(plainToken);
  const user = await prisma.user.findFirst({
    where: { emailVerificationTokenHash: hash },
    select: {
      id: true,
      emailVerified: true,
      emailVerificationExpiresAt: true,
    },
  });
  if (!user) return { ok: false, reason: "invalid" };
  if (user.emailVerified) return { ok: false, reason: "already_verified" };
  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified:              new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });
  return { ok: true, userId: user.id };
}

// Renders the welcome / verification email + dispatches via Resend.
// Falls back to the email module's dev-console mode when RESEND is
// unconfigured. Best-effort; errors are returned but never thrown.
export async function sendVerificationEmail(args: {
  to:    string;
  name?: string | null;
  // Plaintext token (NOT the hash) - lands in the link only.
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const verifyUrl = buildVerifyUrl(args.token);
  const subject   = "Welcome to Tweaxly - Verify Your Email";
  const greeting  = args.name ? `Hi ${args.name},` : "Hi,";

  // No em-dashes anywhere in the body (platform voice rule).
  const text = [
    greeting,
    "",
    "Thanks for joining Tweaxly.",
    "",
    "You're one step away from turning your business data into live insights, forecasts, AI-powered recommendations, and actionable business signals.",
    "",
    "Verify your email to activate your account and unlock all platform capabilities:",
    "",
    verifyUrl,
    "",
    "This link expires in 24 hours. If you didn't sign up for Tweaxly, you can safely ignore this email.",
    "",
    "- The Tweaxly team",
  ].join("\n");

  const html = renderVerificationEmailHtml({ verifyUrl, greeting });

  return sendEmail({
    to: args.to,
    subject,
    text,
    html,
  });
}

function renderVerificationEmailHtml({ verifyUrl, greeting }: { verifyUrl: string; greeting: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Verify your email</title>
<style>
  body { margin: 0; padding: 0; background: #0a1428; }
  .wrap { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #e7eaf0; line-height: 1.6; }
</style>
</head>
<body>
<div class="wrap" style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;font-weight:700;font-size:24px;letter-spacing:0.5px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);-webkit-background-clip:text;background-clip:text;color:transparent;">
      TWEAXLY
    </div>
  </div>
  <div style="background:rgba(17,20,27,0.92);border:1px solid #272c3a;border-radius:16px;padding:32px 28px;">
    <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#ffffff;">Welcome to Tweaxly</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Your AI Business Pulse starts here.</p>
    <p style="margin:0 0 16px;color:#e7eaf0;">${greeting}</p>
    <p style="margin:0 0 16px;color:#e7eaf0;">Thanks for joining Tweaxly.</p>
    <p style="margin:0 0 16px;color:#e7eaf0;">You're one step away from turning your business data into live insights, forecasts, AI-powered recommendations, and actionable business signals.</p>
    <p style="margin:0 0 28px;color:#e7eaf0;">Verify your email to activate your account and unlock all platform capabilities.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);color:#0a1428;font-weight:600;text-decoration:none;font-size:15px;">
        Verify My Email
      </a>
    </div>
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.5;">
      Or paste this link into your browser:<br />
      <a href="${verifyUrl}" style="color:#A78BFA;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="margin:16px 0 0;color:#64748b;font-size:12px;">
      This link expires in 24 hours. If you didn't sign up for Tweaxly, you can safely ignore this email.
    </p>
  </div>
  <p style="margin:24px 0 0;text-align:center;color:#475569;font-size:12px;">
    The Tweaxly team
  </p>
</div>
</body>
</html>`;
}
