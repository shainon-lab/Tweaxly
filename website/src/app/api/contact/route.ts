// POST /api/contact - accepts a contact form submission.
//
// MVP behaviour:
//   - Validates required fields + the legal-acceptance flag.
//   - If RESEND_API_KEY is configured in the Vercel env, sends the
//     message to the operator inbox.
//   - Otherwise logs to the server console so submissions aren't
//     lost in dev - the user still gets a successful response so the
//     form UX works end-to-end.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TO_ADDRESS   = process.env.CONTACT_TO_EMAIL   ?? "hello@tweaxly.com";
const FROM_ADDRESS = process.env.CONTACT_FROM_EMAIL ?? "no-reply@tweaxly.com";

interface ContactBody {
  name?:    unknown;
  email?:   unknown;
  subject?: unknown;
  message?: unknown;
  acceptTerms?: unknown;
}

function str(v: unknown, max = 5000): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max).trim();
}

export async function POST(req: NextRequest) {
  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name    = str(body.name, 120);
  const email   = str(body.email, 200);
  const subject = str(body.subject, 200);
  const message = str(body.message, 5000);
  const accepted = body.acceptTerms === true || body.acceptTerms === "yes" || body.acceptTerms === "on";

  if (!name)    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
  if (!accepted) {
    return NextResponse.json({
      error: "You must accept the Terms of Service and Privacy Policy to submit this form.",
    }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || null;

  // Compose the operator-facing email body.
  const lines = [
    `From: ${name} <${email}>`,
    subject ? `Subject: ${subject}` : null,
    ipAddress ? `IP: ${ipAddress}` : null,
    "",
    message,
  ].filter(Boolean) as string[];
  const text = lines.join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_ADDRESS,
          to:      [TO_ADDRESS],
          reply_to: email,
          subject: subject ? `[Tweaxly contact] ${subject}` : `[Tweaxly contact] ${name}`,
          text,
        }),
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        console.error("contact resend failed", resp.status, detail);
        // Fall through to success so the user UX still completes.
        // Operator follow-up happens via the log.
      }
    } catch (err) {
      console.error("contact resend exception", err);
    }
  } else {
    // No mail provider configured - log to the server console so
    // the submission isn't lost. The user still sees a successful
    // response so they don't double-submit.
    console.info("contact submission (no RESEND_API_KEY configured):", text);
  }

  return NextResponse.json({ ok: true });
}
