import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
// Public route reached by recipients who do NOT have a Tweaxly
// session, so we must never let Next.js serve a cached payload
// across users / tokens. force-dynamic mirrors the /api/unsubscribe
// pattern already used elsewhere for public-token routes.
export const dynamic = "force-dynamic";

// GET /api/share/[token]
//   PUBLIC. Returns the lightweight metadata the public viewer needs
//   to decide what UI state to render BEFORE attempting to read the
//   snapshot:
//     - whether the link is password-protected (lock screen vs. inline)
//     - whether it's expired (show "this link has expired")
//     - whether it was manually disabled (same expired screen — we
//       intentionally do not distinguish disabled from expired in the
//       public copy, since both are "no longer available")
//     - sourceType (drives the small "Consultation answer" / "Business
//       signal" / etc. label in the header)
//     - expiresAt / createdAt (drives the "Shared on … / Expires …"
//       line in the header)
//
//   Crucially, snapshotContent and the question/title are NOT in
//   this response. A scraped token that hits this endpoint reveals
//   only "a share exists, type X, expires Y" — not the analysis.
//   Content lookup goes through POST /view, which enforces the
//   password gate and bumps the view counters.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const row = await prisma.sharedAnalysis.findUnique({
    where: { token },
    select: {
      sourceType:   true,
      passwordHash: true,
      expiresAt:    true,
      isActive:     true,
      createdAt:    true,
    },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const expired  = row.expiresAt.getTime() < Date.now();
  const disabled = !row.isActive;

  return NextResponse.json({
    requiresPassword: row.passwordHash != null,
    expired,
    disabled,
    sourceType: row.sourceType,
    expiresAt:  row.expiresAt.toISOString(),
    createdAt:  row.createdAt.toISOString(),
  });
}
