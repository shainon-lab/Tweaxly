// GET /api/cron/admin-new-account-notifications
//
// Vercel-Cron-driven background job. Runs every minute, finds every
// User whose account was created >= 10 minutes ago but who has NOT
// been admin-notified yet, gathers their context, and sends a single
// email to ADMIN_NOTIFICATION_RECIPIENT (default: info@tweaxly.com).
//
// One email per account. Subject signals verification status. If the
// send fails the User row keeps adminNotificationSentAt=null + records
// the latest error string so the next tick retries.
//
// Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; we
// also accept the same header for manual debugging. Without CRON_SECRET
// set, the endpoint refuses to run (no public scheduling surface).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELAY_MS         = 10 * 60 * 1000;
const BATCH_SIZE       = 25;
const ADMIN_RECIPIENT  = process.env.ADMIN_NOTIFICATION_RECIPIENT ?? "info@tweaxly.com";
// Comma-separated email list + "@domain" entries treated as suffix
// matches. Always includes the @tweaxly.com domain so internal team
// accounts never trigger admin notifications.
const RAW_EXCLUDES = (process.env.ADMIN_NOTIFICATION_EXCLUDE ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const EXCLUDE_DOMAINS = new Set<string>(["tweaxly.com"]);
const EXCLUDE_EMAILS  = new Set<string>();
for (const e of RAW_EXCLUDES) {
  if (e.startsWith("@")) EXCLUDE_DOMAINS.add(e.slice(1));
  else                   EXCLUDE_EMAILS.add(e);
}

function isExcluded(email: string, systemRole: string): boolean {
  const lower = email.toLowerCase();
  if (EXCLUDE_EMAILS.has(lower)) return true;
  const domain = lower.split("@")[1] ?? "";
  if (EXCLUDE_DOMAINS.has(domain)) return true;
  // super_admin = internal team flag - never spam ourselves about
  // our own seed accounts.
  if (systemRole === "super_admin") return true;
  return false;
}

function fmtDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m} minute${m === 1 ? "" : "s"} ${s} second${s === 1 ? "" : "s"}`;
}

function authOk(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // refuse to run without a configured secret
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DELAY_MS);

  // Pull a bounded batch so a backlog after downtime doesn't all
  // attempt to send in a single invocation.
  const pending = await prisma.user.findMany({
    where: {
      adminNotificationSentAt: null,
      createdAt:               { lt: cutoff },
    },
    orderBy: { createdAt: "asc" },
    take:    BATCH_SIZE,
  });

  const results: Array<{ userId: string; status: string; error?: string }> = [];

  for (const u of pending) {
    if (isExcluded(u.email, u.systemRole)) {
      // Mark as "sent" so we never re-evaluate this user. Records
      // the exclusion in the error column for traceability.
      await prisma.user.update({
        where: { id: u.id },
        data:  {
          adminNotificationSentAt: new Date(),
          adminNotificationError:  "excluded:internal_or_test",
        },
      });
      results.push({ userId: u.id, status: "excluded" });
      continue;
    }

    // Gather context for the email body.
    const [primaryBiz, txnCount, firstTxn] = await Promise.all([
      prisma.business.findFirst({
        where:   { ownerId: u.id },
        orderBy: { createdAt: "asc" },
        select:  { id: true, name: true, onboardedAt: true },
      }),
      // Most users have exactly one workspace; this counts uploads
      // across every workspace they own so a multi-workspace account
      // still reports first-upload accurately.
      prisma.transaction.count({ where: { business: { ownerId: u.id } } }),
      prisma.transaction.findFirst({
        where:   { business: { ownerId: u.id } },
        orderBy: { createdAt: "asc" },
        select:  { createdAt: true },
      }),
    ]);

    const verified  = u.emailVerified != null;
    const signupMethod = u.googleId ? "Google" : "email / password";
    const baseUrl   = process.env.APP_URL ?? "https://app.tweaxly.com";
    const accountUrl   = primaryBiz ? `${baseUrl}/admin/accounts/${primaryBiz.id}` : null;
    const workspaceUrl = accountUrl; // admin URL is keyed by businessId

    const verificationDelay = (() => {
      if (verified && u.emailVerified) {
        const delta = u.emailVerified.getTime() - u.createdAt.getTime();
        return `Verified after: ${fmtDuration(delta)}`;
      }
      return "Not verified after 10 minutes";
    })();

    const subject = verified
      ? "🚀 New Tweaxly account — verified"
      : "⚠️ New Tweaxly account — not verified after 10 minutes";

    const fields: Array<[string, string]> = [
      ["Email",              u.email],
      ["Account ID",         u.id],
      ["Workspace",          primaryBiz ? `${primaryBiz.name} (${primaryBiz.id})` : "Not created yet"],
      ["Signup method",      signupMethod],
      ["Region / locale",    u.region ? `${u.region} · ${u.preferredLanguage}` : u.preferredLanguage],
      ["Created at",         u.createdAt.toISOString()],
      ["Email verified",     verified ? "Yes" : "No"],
      ["Verified at",        u.emailVerified ? u.emailVerified.toISOString() : "—"],
      ["Verification delay", verificationDelay],
      ["Onboarding status",  primaryBiz?.onboardedAt
        ? `Completed at ${primaryBiz.onboardedAt.toISOString()}`
        : (primaryBiz ? "Not completed" : "—")],
      ["First upload",       txnCount > 0 ? "Yes" : "No"],
      ["First upload at",    firstTxn?.createdAt ? firstTxn.createdAt.toISOString() : "—"],
      ["UTM / source",       "Not tracked"],
    ];

    const text = [
      subject,
      "",
      ...fields.map(([k, v]) => `${k}: ${v}`),
      "",
      accountUrl   ? `Open account in admin:   ${accountUrl}`   : "",
      workspaceUrl ? `Open workspace in admin: ${workspaceUrl}` : "",
    ].filter(Boolean).join("\n");

    const html = renderHtml({
      subject,
      verified,
      fields,
      accountUrl,
      workspaceUrl,
    });

    const res = await sendEmail({ to: ADMIN_RECIPIENT, subject, text, html });

    if (res.ok) {
      await prisma.user.update({
        where: { id: u.id },
        data:  {
          adminNotificationSentAt: new Date(),
          adminNotificationError:  null,
        },
      });
      results.push({ userId: u.id, status: "sent" });
    } else {
      console.error(`[admin-notify] failed for ${u.email}:`, res.error);
      await prisma.user.update({
        where: { id: u.id },
        data:  { adminNotificationError: res.error ?? "unknown_error" },
      });
      results.push({ userId: u.id, status: "failed", error: res.error });
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    results,
  });
}

function renderHtml(args: {
  subject:      string;
  verified:     boolean;
  fields:       Array<[string, string]>;
  accountUrl:   string | null;
  workspaceUrl: string | null;
}): string {
  const accentBar = args.verified ? "#3ecf8e" : "#f1b04a";
  const rows = args.fields.map(([k, v]) =>
    `<tr>
       <td style="padding:6px 14px 6px 0;color:#94a3b8;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
       <td style="padding:6px 0;color:#e7eaf0;font-size:13px;word-break:break-word;">${escapeHtml(v)}</td>
     </tr>`
  ).join("");

  const buttons = [
    args.accountUrl
      ? `<a href="${args.accountUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);color:#0a1428;font-weight:600;text-decoration:none;font-size:13px;margin-right:8px;">Open account in admin</a>`
      : "",
    args.workspaceUrl && args.workspaceUrl !== args.accountUrl
      ? `<a href="${args.workspaceUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.4);color:#A78BFA;font-weight:600;text-decoration:none;font-size:13px;">Open workspace</a>`
      : "",
  ].filter(Boolean).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${args.subject}</title></head>
<body style="margin:0;padding:0;background:#0a1428;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#e7eaf0;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;font-weight:700;font-size:20px;letter-spacing:0.5px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);-webkit-background-clip:text;background-clip:text;color:transparent;">TWEAXLY</div>
    <div style="font-size:10px;color:#64748b;letter-spacing:0.18em;text-transform:uppercase;margin-top:2px;">Admin · New account</div>
  </div>
  <div style="background:rgba(17,20,27,0.92);border:1px solid #272c3a;border-radius:16px;border-top:3px solid ${accentBar};padding:24px 28px;line-height:1.6;">
    <h1 style="margin:0 0 18px;font-size:18px;color:#ffffff;line-height:1.4;">${escapeHtml(args.subject)}</h1>
    <table style="border-collapse:collapse;width:100%;">${rows}</table>
    ${buttons ? `<div style="margin-top:22px;">${buttons}</div>` : ""}
  </div>
  <p style="margin:18px 0 0;text-align:center;color:#475569;font-size:11px;">Tweaxly admin notification · one email per account · 10-minute delay</p>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
