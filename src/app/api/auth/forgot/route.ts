// POST /api/auth/forgot
//
//   body: form-encoded { email }
//   response: always 303 → /forgot-password?sent=1 (neutral, regardless
//             of whether the email exists)
//
// Rate-limited by IP: 5 requests / 15 minutes.
//
// Side effects (only when the email exists):
//   - generate a single-use, hashed PasswordResetToken (60 min TTL)
//   - send the reset link via Resend (or console.log fallback)
//
// Security notes:
//   - tokens never stored in plaintext
//   - timing of the response is dominated by the email send; both
//     branches do roughly the same amount of work
//   - response body never reveals existence

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateResetToken, TOKEN_TTL_MINUTES } from "@/lib/passwordReset";
import { checkRateLimit, ipFromRequest } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Always redirect to the neutral "sent" page, regardless of outcome.
  const neutralRedirect = NextResponse.redirect(
    new URL("/forgot-password?sent=1", req.url),
    { status: 303 }
  );

  // Rate limit per IP - slows down enumeration / bulk spam.
  const ip = ipFromRequest(req);
  const limited = checkRateLimit({
    key: `forgot:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    // Still neutral on the client; just don't process this request.
    return neutralRedirect;
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  if (!email) return neutralRedirect;

  // Email is stored normalized (lowercased) at signup, but compare
  // case-insensitively to be safe.
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (user) {
    const { token, tokenHash, expiresAt } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") ?? null,
      },
    });

    // The link points back at the same host that received this request,
    // so reset works under localhost, vercel previews, and custom
    // domains alike.
    const resetUrl = new URL(`/reset-password?token=${token}`, req.url).toString();

    await sendEmail({
      to: user.email,
      subject: "Reset your Tweaxly password",
      text: [
        `Hi${user.name ? ` ${user.name}` : ""},`,
        ``,
        `You (or someone using your email) asked to reset your Tweaxly password.`,
        `Use this link to set a new one:`,
        ``,
        `  ${resetUrl}`,
        ``,
        `The link is valid for ${TOKEN_TTL_MINUTES} minutes and can be used once.`,
        `If you didn't request this, you can safely ignore this email.`,
      ].join("\n"),
      html: `
        <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
          <p>Hi${user.name ? ` ${user.name}` : ""},</p>
          <p>You (or someone using your email) asked to reset your Tweaxly password.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#7c5cfa;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Set a new password
            </a>
          </p>
          <p style="color:#64748b;font-size:13px">
            Or paste this link into your browser:<br>
            <span style="word-break:break-all">${resetUrl}</span>
          </p>
          <p style="color:#64748b;font-size:13px">
            The link is valid for ${TOKEN_TTL_MINUTES} minutes and can be used once.
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  return neutralRedirect;
}
