// GET /api/account/access-logs
//
// Returns a unified feed of access events for the currently signed-in
// user, surfaced on Account → Access Logs. Merges two sources:
//
//   1. LoginAttempt rows (every sign-in, success or failure)
//   2. AuditLog rows where actorUserId = user OR
//      targetBusinessId is one of the user's workspaces
//
// Sorted desc by createdAt, capped at 100 entries — the table is for
// recent-activity scanning, not deep history exploration.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 100;

type Entry = {
  id:        string;
  action:    string;
  createdAt: string;
  metadata:  Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  businessId:   string | null;
  businessName: string | null;
};

export async function GET() {
  const user = await requireUser();

  // Workspaces the user has access to — their owned businesses + any
  // active memberships. Used both for the auditLog scope and to attach
  // a friendly business name to each entry.
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { memberships: { some: { userId: user.id, status: "active" } } },
      ],
    },
    select: { id: true, name: true },
  });
  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));
  const businessIds = businesses.map((b) => b.id);

  const [loginRows, auditRows] = await Promise.all([
    prisma.loginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { actorUserId: user.id },
          ...(businessIds.length > 0 ? [{ targetBusinessId: { in: businessIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
  ]);

  const merged: Entry[] = [];

  for (const r of loginRows) {
    merged.push({
      id:        `login_${r.id}`,
      action:    r.success ? "auth.login" : "auth.login_failed",
      createdAt: r.createdAt.toISOString(),
      metadata:  { email: r.email, success: r.success },
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      businessId:   null,
      businessName: null,
    });
  }

  for (const r of auditRows) {
    let meta: Record<string, unknown> | null = null;
    if (r.metadata) {
      try { meta = JSON.parse(r.metadata); } catch { meta = { raw: r.metadata }; }
    }
    merged.push({
      id:        `audit_${r.id}`,
      action:    r.action,
      createdAt: r.createdAt.toISOString(),
      metadata:  meta,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      businessId:   r.targetBusinessId,
      businessName: r.targetBusinessId ? businessNameById.get(r.targetBusinessId) ?? null : null,
    });
  }

  merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ entries: merged.slice(0, LIMIT) });
}
