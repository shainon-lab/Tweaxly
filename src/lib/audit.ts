// Audit-log helper. Writes one row to AuditLog with the acting user,
// target account (when applicable), structured metadata, and the
// caller's IP / user agent if available.
//
// Best-effort: a failure here never blocks the caller - audit logging
// should never break user actions. If logging fails, we swallow.
//
// Never include secrets, passwords, tokens, or full bodies. Metadata
// should be small structured fields the operator can act on.

import { prisma } from "./db";

export type AuditAction =
  | "impersonation.enter"
  | "impersonation.exit"
  | "impersonation.allow_writes"
  | "impersonation.deny_writes"
  | "account.status_change"
  | "account.viewed"
  // Surfaced on the user's Account → Access Logs feed:
  | "auth.logout"
  | "data.upload"
  | "source.created"
  | "billing.subscription_created"
  | "billing.subscription_updated"
  | "billing.subscription_canceled";

export async function recordAudit(input: {
  actorUserId: string;
  action: AuditAction | string;
  targetBusinessId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    if (input.request) {
      // x-forwarded-for is set by Vercel + most reverse proxies. Fall
      // back to remote-addr-style headers when not present.
      const fwd = input.request.headers.get("x-forwarded-for");
      ipAddress = fwd ? fwd.split(",")[0]!.trim() : input.request.headers.get("x-real-ip");
      userAgent = input.request.headers.get("user-agent");
    }
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetBusinessId: input.targetBusinessId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}
