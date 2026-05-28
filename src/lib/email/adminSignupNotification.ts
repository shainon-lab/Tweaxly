// Fire-and-forget admin notification sent on every new account signup
// (email/password + Google OAuth). Called inline from the two register
// paths so admins see new signups land in info@tweaxly.com in real time.
//
// Excludes:
//   - super_admin accounts (internal team)
//   - any email on @tweaxly.com
//   - any address / @domain listed in ADMIN_NOTIFICATION_EXCLUDE
//
// Never throws - the caller wraps in .catch(console.error) too, but
// even a thrown promise here can't block signup because we're invoked
// after the user / business transaction has committed.

import { sendEmail } from "@/lib/email";

interface SignupNotificationInput {
  user: {
    id:     string;
    email:  string;
    name:   string | null;
    region: string | null;
    systemRole: string;
  };
  business: {
    id:   string;
    name: string;
  } | null;
  method: "email_password" | "google";
}

const RAW_EXCLUDES = (process.env.ADMIN_NOTIFICATION_EXCLUDE ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const EXCLUDE_DOMAINS = new Set<string>(["tweaxly.com"]);
const EXCLUDE_EMAILS  = new Set<string>();
for (const e of RAW_EXCLUDES) {
  if (e.startsWith("@")) EXCLUDE_DOMAINS.add(e.slice(1));
  else                   EXCLUDE_EMAILS.add(e);
}

function isExcluded(email: string, systemRole: string): boolean {
  if (systemRole === "super_admin") return true;
  const lower = email.toLowerCase();
  if (EXCLUDE_EMAILS.has(lower)) return true;
  const domain = lower.split("@")[1] ?? "";
  return EXCLUDE_DOMAINS.has(domain);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendAdminSignupNotification(input: SignupNotificationInput): Promise<void> {
  const { user, business, method } = input;
  if (isExcluded(user.email, user.systemRole)) return;

  const recipient = process.env.ADMIN_NOTIFICATION_RECIPIENT ?? "info@tweaxly.com";
  const baseUrl   = process.env.APP_URL ?? "https://app.tweaxly.com";
  const accountLink = business ? `${baseUrl}/admin/accounts/${business.id}` : null;

  const fields: Array<[string, string]> = [
    ["Name",          user.name ?? "—"],
    ["Email",         user.email],
    ["Country",       user.region ?? "—"],
    ["Workspace",     business?.name ?? "—"],
    ["Account ID",    user.id],
    ["Signup method", method === "google" ? "Google" : "Email / password"],
  ];

  const subject = `🚀 New Tweaxly signup: ${user.name ?? user.email}`;

  const text = [
    subject,
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    accountLink ? `Open account in admin: ${accountLink}` : "",
  ].filter(Boolean).join("\n");

  const html = renderHtml({ subject, fields, accountLink });

  const res = await sendEmail({ to: recipient, subject, text, html });
  if (!res.ok) {
    console.error(`[admin-signup-notification] send failed for ${user.email}:`, res.error);
  }
}

function renderHtml(args: {
  subject:     string;
  fields:      Array<[string, string]>;
  accountLink: string | null;
}): string {
  const rows = args.fields.map(([k, v]) =>
    `<tr>
       <td style="padding:6px 14px 6px 0;color:#94a3b8;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
       <td style="padding:6px 0;color:#e7eaf0;font-size:13px;word-break:break-word;">${escapeHtml(v)}</td>
     </tr>`
  ).join("");

  const button = args.accountLink
    ? `<div style="margin-top:22px;"><a href="${args.accountLink}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);color:#0a1428;font-weight:600;text-decoration:none;font-size:13px;">Open account in admin</a></div>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(args.subject)}</title></head>
<body style="margin:0;padding:0;background:#0a1428;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#e7eaf0;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;font-weight:700;font-size:20px;letter-spacing:0.5px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);-webkit-background-clip:text;background-clip:text;color:transparent;">TWEAXLY</div>
    <div style="font-size:10px;color:#64748b;letter-spacing:0.18em;text-transform:uppercase;margin-top:2px;">Admin · New signup</div>
  </div>
  <div style="background:rgba(17,20,27,0.92);border:1px solid #272c3a;border-radius:16px;border-top:3px solid #A78BFA;padding:24px 28px;line-height:1.6;">
    <h1 style="margin:0 0 18px;font-size:18px;color:#ffffff;line-height:1.4;">${escapeHtml(args.subject)}</h1>
    <table style="border-collapse:collapse;width:100%;">${rows}</table>
    ${button}
  </div>
  <p style="margin:18px 0 0;text-align:center;color:#475569;font-size:11px;">Tweaxly admin notification</p>
</div>
</body></html>`;
}
