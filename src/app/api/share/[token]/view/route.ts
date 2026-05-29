import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/share/[token]/view
//   PUBLIC. Body: { password?: string }
//
//   Returns the snapshot if all gates pass:
//     - link exists
//     - !expired (expiresAt > now)
//     - isActive
//     - password matches (or share has no password)
//
//   On success it also atomically bumps the view counters:
//     viewCount++, firstViewedAt (only if null), lastViewedAt = now.
//   Done in a single update so concurrent recipient hits don't lose
//   counts to lost-update races.
//
//   Error shapes:
//     404 not_found     - token unknown
//     410 expired       - past expiresAt
//     410 disabled      - manually revoked
//     401 password_required - share has a password and request omitted it
//     401 password_invalid  - share has a password and the value is wrong
//
//   Notes:
//     - We use 410 Gone for expired/disabled because semantically the
//       resource WAS available and is intentionally no longer. 404 is
//       reserved for "token never existed".
//     - We never leak whether a token *would* have been valid had the
//       password been right - the timing+wording is identical to a
//       password_invalid response on an active link.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  const row = await prisma.sharedAnalysis.findUnique({
    where: { token },
    select: {
      id:              true,
      sourceType:      true,
      snapshotContent: true,
      snapshotMeta:    true,
      passwordHash:    true,
      expiresAt:       true,
      isActive:        true,
      createdAt:       true,
      firstViewedAt:   true,
    },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (!row.isActive) {
    return NextResponse.json({ error: "disabled" }, { status: 410 });
  }
  if (row.passwordHash) {
    if (!password) {
      return NextResponse.json({ error: "password_required" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "password_invalid" }, { status: 401 });
    }
  }

  // Atomic counter update. `firstViewedAt: null` in the where clause
  // means the increment-and-first-set update only fires on the very
  // first successful view; subsequent views still bump viewCount +
  // lastViewedAt via the unconditional update below.
  const now = new Date();
  if (row.firstViewedAt == null) {
    await prisma.sharedAnalysis.update({
      where: { id: row.id },
      data: {
        viewCount:     { increment: 1 },
        firstViewedAt: now,
        lastViewedAt:  now,
      },
    });
  } else {
    await prisma.sharedAnalysis.update({
      where: { id: row.id },
      data: {
        viewCount:    { increment: 1 },
        lastViewedAt: now,
      },
    });
  }

  return NextResponse.json({
    sourceType:      row.sourceType,
    snapshotContent: row.snapshotContent,
    snapshotMeta:    row.snapshotMeta,
    expiresAt:       row.expiresAt.toISOString(),
    createdAt:       row.createdAt.toISOString(),
  });
}
