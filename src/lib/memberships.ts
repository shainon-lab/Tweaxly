// Workspace memberships + invitations.
//
// One module owns the rules so the Settings UI, the API routes, the
// /invite/[token] acceptance page, and any future Slack/webhook
// notifications can call the same primitives instead of each
// re-implementing role checks + plan caps.

import { randomBytes, createHash } from "node:crypto";
import { prisma } from "./db";
import { getPlanLimits, isUnderQuota } from "./billing/plans";
import { getEffectivePlan } from "./billing/entitlements";
import { sendEmail } from "./email";

// Roles surfaced through the invitation flow. "owner" is reserved
// (set once at workspace creation, never offered as an invite role).
export type MembershipRole = "owner" | "admin" | "viewer";

export const INVITABLE_ROLES: ReadonlyArray<Exclude<MembershipRole, "owner">> = ["admin", "viewer"];

const INVITATION_TOKEN_BYTES = 32;
const INVITATION_TTL_MS      = 7 * 24 * 60 * 60 * 1000; // 7 days

// Map legacy role values from before the invitations system to the
// new role vocabulary so old rows still render in the Members table.
export function normalizeRole(raw: string | null | undefined): MembershipRole {
  if (raw === "owner")  return "owner";
  if (raw === "admin")  return "admin";
  if (raw === "viewer") return "viewer";
  // Legacy: "account_admin" was the original creator role; "user"
  // was the catch-all for invited collaborators that never shipped.
  if (raw === "account_admin") return "owner";
  return "admin";
}

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

// ── Listing ─────────────────────────────────────────────────────────

export async function listMembers(businessId: string) {
  const rows = await prisma.businessMembership.findMany({
    where:   { businessId, status: { in: ["active", "suspended"] } },
    include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((m) => ({
    id:        m.id,
    userId:    m.userId,
    email:     m.user.email,
    name:      m.user.name,
    avatarUrl: m.user.avatarUrl,
    role:      normalizeRole(m.role),
    status:    m.status as "active" | "suspended",
    joinedAt:  m.joinedAt?.toISOString() ?? null,
  }));
}

export async function listPendingInvitations(businessId: string) {
  // Auto-expire pending rows past their TTL on every read - simpler
  // than a cron sweep and the cap-check counts pending rows so a
  // stale row would otherwise inflate the count forever.
  await prisma.businessInvitation.updateMany({
    where: { businessId, status: "pending", expiresAt: { lt: new Date() } },
    data:  { status: "expired" },
  });
  const rows = await prisma.businessInvitation.findMany({
    where:   { businessId, status: "pending" },
    include: { invitedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((i) => ({
    id:           i.id,
    email:        i.email,
    role:         normalizeRole(i.role),
    invitedAt:    i.createdAt.toISOString(),
    expiresAt:    i.expiresAt.toISOString(),
    invitedBy:    i.invitedBy.name ?? i.invitedBy.email,
  }));
}

// ── Cap check ──────────────────────────────────────────────────────

// Counts toward the plan's `members` quota: every non-removed
// membership PLUS every pending invitation. Suspended memberships
// also count because they reactivate automatically on re-upgrade.
export async function countMembersAgainstCap(businessId: string): Promise<number> {
  const [memberCount, pendingCount] = await Promise.all([
    prisma.businessMembership.count({
      where: { businessId, status: { in: ["active", "suspended"] } },
    }),
    prisma.businessInvitation.count({
      where: { businessId, status: "pending" },
    }),
  ]);
  return memberCount + pendingCount;
}

export type CapCheck =
  | { ok: true }
  | { ok: false; reason: "limit_reached"; used: number; cap: number | "unlimited" }
  | { ok: false; reason: "free_plan"; cap: number };

// Pro-plan gate + cap check. Returns the result so the caller can
// surface a specific error (e.g. "upgrade to invite", "limit reached").
export async function canInviteMore(businessId: string): Promise<CapCheck> {
  const effective = await getEffectivePlan(businessId);
  if (effective.plan === "free") {
    return { ok: false, reason: "free_plan", cap: getPlanLimits("free").members === "unlimited" ? Infinity : (getPlanLimits("free").members as number) };
  }
  const limit = getPlanLimits(effective.plan).members;
  const used  = await countMembersAgainstCap(businessId);
  if (!isUnderQuota(used, limit)) {
    return { ok: false, reason: "limit_reached", used, cap: limit };
  }
  return { ok: true };
}

// ── Invitations ─────────────────────────────────────────────────────

export type CreateInvitationResult =
  | { ok: true; invitation: { id: string; email: string; role: MembershipRole; expiresAt: string }; token: string }
  | { ok: false; reason: "already_member" | "already_pending" | "invalid_email" | "invalid_role" | "limit_reached" | "free_plan" };

// Creates a pending invitation and returns the plaintext token. The
// hash gets stored; the plaintext lands ONLY in the invitation email
// + the accept URL. Caller is responsible for sending the email.
export async function createInvitation(args: {
  businessId: string;
  email:      string;
  role:       Exclude<MembershipRole, "owner">;
  invitedByUserId: string;
}): Promise<CreateInvitationResult> {
  const cap = await canInviteMore(args.businessId);
  if (!cap.ok) return { ok: false, reason: cap.reason };

  const email = args.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: "invalid_email" };
  }
  if (!INVITABLE_ROLES.includes(args.role)) {
    return { ok: false, reason: "invalid_role" };
  }

  // Already an active/suspended member of THIS workspace?
  const existingMember = await prisma.businessMembership.findFirst({
    where: {
      businessId: args.businessId,
      status:     { in: ["active", "suspended"] },
      user:       { email },
    },
    select: { id: true },
  });
  if (existingMember) return { ok: false, reason: "already_member" };

  // Pending invite already?
  const existingInvite = await prisma.businessInvitation.findFirst({
    where: { businessId: args.businessId, email, status: "pending" },
    select: { id: true },
  });
  if (existingInvite) return { ok: false, reason: "already_pending" };

  const plain     = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashToken(plain);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const inv = await prisma.businessInvitation.create({
    data: {
      businessId:      args.businessId,
      email,
      role:            args.role,
      invitedByUserId: args.invitedByUserId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    ok: true,
    invitation: {
      id:        inv.id,
      email:     inv.email,
      role:      args.role,
      expiresAt: inv.expiresAt.toISOString(),
    },
    token: plain,
  };
}

export async function cancelInvitation(invitationId: string, businessId: string) {
  return prisma.businessInvitation.updateMany({
    where: { id: invitationId, businessId, status: "pending" },
    data:  { status: "cancelled" },
  });
}

// ── Acceptance ──────────────────────────────────────────────────────

export type AcceptResult =
  | { ok: true; businessId: string; role: MembershipRole }
  | { ok: false; reason: "invalid_token" | "expired" | "email_mismatch" | "already_used" };

// Looks up the invitation by token. Returns enough metadata for the
// /invite/[token] page to preview the invite + decide whether to
// route the visitor to login or signup.
export async function getInvitationByToken(plainToken: string) {
  if (!plainToken) return null;
  const tokenHash = hashToken(plainToken);
  const inv = await prisma.businessInvitation.findUnique({
    where:   { tokenHash },
    include: {
      business:  { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!inv) return null;
  return {
    id:        inv.id,
    email:     inv.email,
    role:      normalizeRole(inv.role),
    status:    inv.status as "pending" | "accepted" | "cancelled" | "expired",
    expiresAt: inv.expiresAt.toISOString(),
    business:  { id: inv.business.id, name: inv.business.name },
    invitedBy: inv.invitedBy.name ?? inv.invitedBy.email,
  };
}

// Validates the token and the user's email, creates (or reactivates)
// a BusinessMembership, and marks the invitation accepted. Caller
// has already authenticated the user.
export async function acceptInvitation(plainToken: string, userId: string, userEmail: string): Promise<AcceptResult> {
  const tokenHash = hashToken(plainToken);
  const inv = await prisma.businessInvitation.findUnique({ where: { tokenHash } });
  if (!inv)                          return { ok: false, reason: "invalid_token" };
  if (inv.status !== "pending")      return { ok: false, reason: "already_used" };
  if (inv.expiresAt < new Date()) {
    await prisma.businessInvitation.update({ where: { id: inv.id }, data: { status: "expired" } });
    return { ok: false, reason: "expired" };
  }
  if (inv.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }

  const role = normalizeRole(inv.role);

  // Use upsert in case the user was previously a member then removed
  // and re-invited (we'd be reactivating an existing row).
  await prisma.$transaction([
    prisma.businessMembership.upsert({
      where: { userId_businessId: { userId, businessId: inv.businessId } },
      create: {
        userId,
        businessId: inv.businessId,
        role,
        status:     "active",
        invitedBy:  inv.invitedByUserId,
        invitedAt:  inv.createdAt,
        joinedAt:   new Date(),
      },
      update: {
        role,
        status:    "active",
        joinedAt:  new Date(),
      },
    }),
    prisma.businessInvitation.update({
      where: { id: inv.id },
      data:  { status: "accepted", acceptedAt: new Date(), acceptedByUserId: userId },
    }),
  ]);

  return { ok: true, businessId: inv.businessId, role };
}

// ── Members ─────────────────────────────────────────────────────────

export async function removeMember(businessId: string, userId: string) {
  // Soft-remove: keep the row for audit history; just flip the
  // status. The workspace switcher filters on status: "active".
  return prisma.businessMembership.updateMany({
    where: { businessId, userId, role: { not: "owner" } },
    data:  { status: "removed" },
  });
}

export async function changeMemberRole(businessId: string, userId: string, role: Exclude<MembershipRole, "owner">) {
  if (!INVITABLE_ROLES.includes(role)) throw new Error("invalid_role");
  return prisma.businessMembership.updateMany({
    where: { businessId, userId, role: { not: "owner" } },
    data:  { role },
  });
}

// ── Email helper ────────────────────────────────────────────────────

export function buildInvitationUrl(token: string): string {
  const base = process.env.APP_URL ?? "https://app.tweaxly.com";
  return `${base.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
}

export async function sendInvitationEmail(args: {
  to:           string;
  inviterName:  string | null;
  workspaceName: string;
  role:         MembershipRole;
  token:        string;
}): Promise<{ ok: boolean; error?: string }> {
  const url      = buildInvitationUrl(args.token);
  const inviter  = args.inviterName ? args.inviterName : "Someone on your team";
  const roleText = args.role === "admin" ? "Admin" : "Viewer";
  const subject  = `${inviter} invited you to ${args.workspaceName} on Tweaxly`;

  const text = [
    `Hi,`,
    ``,
    `${inviter} invited you to join the "${args.workspaceName}" workspace on Tweaxly as ${roleText}.`,
    ``,
    `Accept the invitation:`,
    url,
    ``,
    `This invitation expires in 7 days. If you didn't expect this email you can safely ignore it.`,
    ``,
    `- The Tweaxly team`,
  ].join("\n");

  const html = renderInvitationHtml({ url, inviter, workspace: args.workspaceName, role: roleText });

  return sendEmail({ to: args.to, subject, text, html });
}

function renderInvitationHtml(args: { url: string; inviter: string; workspace: string; role: string }): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Tweaxly workspace invitation</title></head>
<body style="margin:0;padding:0;background:#0a1428;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e7eaf0;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;font-weight:700;font-size:24px;letter-spacing:0.5px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);-webkit-background-clip:text;background-clip:text;color:transparent;">TWEAXLY</div>
  </div>
  <div style="background:rgba(17,20,27,0.92);border:1px solid #272c3a;border-radius:16px;padding:32px 28px;line-height:1.6;">
    <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;">You're invited to a Tweaxly workspace</h1>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">${args.inviter} added you to <span style="color:#ffffff;">${args.workspace}</span> as <span style="color:#A78BFA;">${args.role}</span>.</p>
    <p style="margin:0 0 24px;color:#e7eaf0;font-size:14px;">Click the button below to accept the invitation. If your email isn't already linked to a Tweaxly account, you'll be guided through a quick signup first.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${args.url}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:linear-gradient(90deg,#A78BFA 0%,#22D3EE 100%);color:#0a1428;font-weight:600;text-decoration:none;font-size:15px;">Accept Invitation</a>
    </div>
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;">Or paste this link into your browser:<br/><a href="${args.url}" style="color:#A78BFA;word-break:break-all;">${args.url}</a></p>
    <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This invitation expires in 7 days. If you didn't expect this email you can safely ignore it.</p>
  </div>
  <p style="margin:24px 0 0;text-align:center;color:#475569;font-size:12px;">The Tweaxly team</p>
</div>
</body></html>`;
}
