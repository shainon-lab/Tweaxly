// GET /api/admin/email-diag
//
// Super-admin-only diagnostic. Reports which Resend env vars Vercel
// actually loaded into the running build, the resolved from/APP_URL,
// and the most recent verification_email_sent audit row for the
// current user so we can see exactly what happened on the last
// Resend-email click. Never returns the API key value, only whether
// it is set.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (user.systemRole !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const lastSend = await prisma.auditLog.findFirst({
    where:   { actorUserId: user.id, action: "auth.verification_email_sent" },
    orderBy: { createdAt: "desc" },
    select:  { createdAt: true, metadata: true },
  });

  return NextResponse.json({
    env: {
      RESEND_API_KEY_APP: !!process.env.RESEND_API_KEY_APP,
      RESEND_API_KEY:     !!process.env.RESEND_API_KEY,
      EMAIL_FROM:         process.env.EMAIL_FROM ?? "(unset - falls back to Tweaxly <noreply@tweaxly.com>)",
      APP_URL:            process.env.APP_URL    ?? "(unset - falls back to https://app.tweaxly.com)",
    },
    user: {
      email:         user.email,
      emailVerified: user.emailVerified ?? null,
    },
    lastVerificationSend: lastSend ?? "(no audit row yet - resend button was never clicked or route 500'd before audit)",
  });
}
