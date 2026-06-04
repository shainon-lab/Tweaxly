import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Share a Financial Review via a public, unguessable link. Intentionally
// NOT plan-gated for now - available to free users on this tab. Only a
// workspace member can create/revoke a share (requireBusiness); anyone
// with the resulting link can then view a read-only copy with no auth at
// /share/financial-review/<token>.

function shareUrl(req: NextRequest, token: string): string {
  const base =
    process.env.SHARE_BASE_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    req.nextUrl.origin;
  return `${base}/share/financial-review/${token}`;
}

// POST - enable sharing (idempotent: reuses the existing token).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;

  const review = await prisma.financialReview.findFirst({
    where: { id, businessId: business.id },
    select: { id: true, status: true, shareToken: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found in this workspace." }, { status: 404 });
  }
  if (review.status !== "complete") {
    return NextResponse.json({ error: "Only a completed review can be shared." }, { status: 400 });
  }

  let token = review.shareToken;
  if (!token) {
    token = randomBytes(24).toString("base64url");
    await prisma.financialReview.update({
      where: { id: review.id },
      data: { shareToken: token, sharedAt: new Date() },
    });
  }

  return NextResponse.json({ token, url: shareUrl(req, token) });
}

// DELETE - revoke sharing (the link stops working immediately).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  await prisma.financialReview.updateMany({
    where: { id, businessId: business.id },
    data: { shareToken: null, sharedAt: null },
  });
  return NextResponse.json({ ok: true });
}
