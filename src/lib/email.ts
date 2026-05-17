// Email sender — wraps Resend with a graceful console-log fallback so
// the password-reset flow is testable in dev without any env vars.
//
// Required env (production):
//   RESEND_API_KEY  — your Resend API key
//   EMAIL_FROM      — e.g. "Tweaxly <noreply@tweaxly.com>"
//
// If either is missing, sendEmail() logs the payload to the server
// console and returns ok:true so callers can keep operating.

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Tweaxly <noreply@tweaxly.com>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log(
      "\n[email:dev-fallback] RESEND_API_KEY not set — would have sent:\n" +
        `  to:      ${input.to}\n` +
        `  subject: ${input.subject}\n` +
        `  text:    ${input.text}\n`
    );
    return { ok: true };
  }
  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (result.error) {
      console.error("Resend send failed:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend send threw:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown_error" };
  }
}
