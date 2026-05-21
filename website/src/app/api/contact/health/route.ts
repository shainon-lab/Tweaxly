// GET /api/contact/health
// Non-sensitive diagnostic for the contact form's Resend wiring.
// Reports whether the RESEND_API_KEY env var is visible to the
// running serverless function + what TO/FROM addresses are
// configured. The key itself is never exposed - we only report
// presence + length so the user can spot a missing/empty var.
//
// Delete this endpoint once the form is confirmed working.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.RESEND_API_KEY ?? "";
  return NextResponse.json({
    hasResendKey: key.length > 0,
    keyLength:    key.length,
    keyStartsWith: key.length > 0 ? key.slice(0, 3) : "",
    from:         process.env.CONTACT_FROM_EMAIL ?? "no-reply@tweaxly.com",
    to:           process.env.CONTACT_TO_EMAIL   ?? "info@tweaxly.com",
    nodeEnv:      process.env.NODE_ENV ?? "unknown",
  });
}
