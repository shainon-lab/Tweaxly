// Email channel for Real-Time Business Alerts. Wraps the shared
// `sendEmail()` helper with a simple, severity-coloured HTML template.
// The dispatcher decides WHEN to call this (per-monitor channels +
// critical fallback); this module only owns the rendering + sending.

import { sendEmail } from "../email";
import type { AlertSeverity } from "./types";

const APP_URL = process.env.APP_URL ?? "https://app.tweaxly.com";

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical:  "Critical",
  important: "Important",
  info:      "Notice",
};

const SEVERITY_COLOUR: Record<AlertSeverity, string> = {
  critical:  "#ef4444", // bad
  important: "#f59e0b", // warn
  info:      "#a78bfa", // accent
};

export async function sendAlertEmail(input: {
  to:           string;
  businessName: string;
  severity:     AlertSeverity;
  title:        string;
  body:         string;
  deepLink:     string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const url   = input.deepLink && input.deepLink.startsWith("/")
    ? `${APP_URL}${input.deepLink}`
    : (input.deepLink ?? `${APP_URL}/account?tab=notifications`);
  const label = SEVERITY_LABEL[input.severity];
  const colour = SEVERITY_COLOUR[input.severity];

  const subject = `${label} · ${input.businessName} · ${input.title}`;
  const text = [
    `${label} alert for ${input.businessName}`,
    "",
    input.title,
    input.body,
    "",
    `Open: ${url}`,
    "",
    "Manage notifications: " + `${APP_URL}/account?tab=notifications`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a1428;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${colour};font-weight:600;margin-bottom:8px;">
      ${label} · ${escapeHtml(input.businessName)}
    </div>
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#fff;line-height:1.25;">
      ${escapeHtml(input.title)}
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#cbd5e1;margin:0 0 20px 0;">
      ${escapeHtml(input.body)}
    </p>
    <a href="${escapeHtml(url)}"
       style="display:inline-block;background:${colour};color:#0a1428;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">
      Open in Tweaxly →
    </a>
    <p style="font-size:11px;line-height:1.5;color:#64748b;margin:32px 0 0 0;">
      You're receiving this because ${escapeHtml(input.businessName)} has email alerts on.
      <a href="${APP_URL}/account?tab=notifications" style="color:#94a3b8;">Manage notifications</a>.
    </p>
  </div>
</body></html>`.trim();

  return sendEmail({ to: input.to, subject, text, html });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
