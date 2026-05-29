import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasFeature, getEffectivePlan } from "@/lib/billing";
import {
  SHARE_EXPIRY_HOURS,
  type ShareExpiryKey,
  isShareSourceType,
  buildShareUrl,
} from "@/lib/sharedAnalyses";
import { generateShareToken } from "@/lib/sharedAnalyses.server";

export const runtime = "nodejs";

// POST /api/shared-analyses
//   Create a new share link. Caller is the surface (Consultation,
//   Signal card, Forecast explainer, Insight card) - it knows what
//   to snapshot, so it passes the rendered payload + meta directly
//   rather than asking the server to re-derive them from a sourceId.
//   That keeps each surface in control of "what does sharing X look
//   like" without the API needing to special-case every source.
//
// Body:
//   {
//     sourceType:      "consultation" | "signal" | "forecast_explanation" | "insight",
//     sourceId:        string,           // for traceability + admin
//     snapshotContent: object,           // the renderable payload
//     snapshotMeta:    object,           // title, question, currency, askedAt, ...
//     expiry:          "24h" | "7d" | "30d",
//     password?:       string            // optional gate
//   }
//
// Returns 201 with { id, token, url, expiresAt }.
export async function POST(req: NextRequest) {
  const { business, user } = await requireBusiness();

  // Entitlement gate. shareAnalyses is on for Pro at launch but the
  // check is generic so a future tier swap is a one-line edit in
  // plans.ts and zero edits here.
  const eff = await getEffectivePlan(business.id);
  if (eff.readOnly) {
    return NextResponse.json({
      error:   "read_only",
      message: "This workspace is in read-only mode. Reactivate the subscription to share analyses.",
      plan:    eff.plan,
    }, { status: 402 });
  }
  if (!(await hasFeature(business.id, "shareAnalyses"))) {
    return NextResponse.json({
      error:   "feature_unavailable",
      message: "Secure analysis sharing is available on Pro. Upgrade to unlock it for everyone on the workspace.",
      plan:    eff.plan,
      feature: "shareAnalyses",
    }, { status: 402 });
  }

  const body = await req.json().catch(() => null) as {
    sourceType?:      unknown;
    sourceId?:        unknown;
    snapshotContent?: unknown;
    snapshotMeta?:    unknown;
    expiry?:          unknown;
    password?:        unknown;
  } | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  if (!isShareSourceType(body.sourceType)) {
    return NextResponse.json({ error: "invalid_source_type" }, { status: 400 });
  }
  const sourceId = String(body.sourceId ?? "").trim();
  if (!sourceId) return NextResponse.json({ error: "source_id_required" }, { status: 400 });

  // snapshotContent must be a non-empty object - we don't render any
  // user-visible content from sourceId at view time, so an empty
  // snapshot would mean a dead share link.
  if (!body.snapshotContent || typeof body.snapshotContent !== "object" || Array.isArray(body.snapshotContent)) {
    return NextResponse.json({ error: "snapshot_required" }, { status: 400 });
  }
  if (!body.snapshotMeta || typeof body.snapshotMeta !== "object" || Array.isArray(body.snapshotMeta)) {
    return NextResponse.json({ error: "snapshot_meta_required" }, { status: 400 });
  }

  const expiryKey = body.expiry as ShareExpiryKey;
  const hours = SHARE_EXPIRY_HOURS[expiryKey];
  if (!hours) {
    return NextResponse.json({ error: "invalid_expiry" }, { status: 400 });
  }
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  // Optional password. Hashed with bcrypt - same library + cost
  // factor as user account passwords elsewhere in the codebase.
  // Plaintext is never persisted or echoed back.
  let passwordHash: string | null = null;
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 4) {
      return NextResponse.json({ error: "password_too_short" }, { status: 400 });
    }
    passwordHash = await bcrypt.hash(body.password, 10);
  }

  // Token uniqueness: extremely improbable to collide with 256-bit
  // entropy, but the unique index forces a retry rather than a 500.
  // Bounded loop just in case.
  let token = "";
  let created: { id: string; token: string; expiresAt: Date } | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    token = generateShareToken();
    try {
      created = await prisma.sharedAnalysis.create({
        data: {
          businessId:      business.id,
          createdByUserId: user.id,
          sourceType:      body.sourceType,
          sourceId,
          snapshotContent: body.snapshotContent as Prisma.InputJsonValue,
          snapshotMeta:    body.snapshotMeta as Prisma.InputJsonValue,
          token,
          passwordHash,
          expiresAt,
        },
        select: { id: true, token: true, expiresAt: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }
  if (!created) {
    return NextResponse.json({ error: "token_collision" }, { status: 500 });
  }

  return NextResponse.json({
    id:        created.id,
    token:     created.token,
    url:       buildShareUrl(created.token),
    expiresAt: created.expiresAt.toISOString(),
  }, { status: 201 });
}

// GET /api/shared-analyses
//   List every share the current workspace has created, newest
//   first. Drives the management table in Account / Workspace
//   Settings (Phase 5). The list intentionally never exposes
//   `snapshotContent` - that field can be megabytes and is only
//   needed by the public viewer.
export async function GET() {
  const { business } = await requireBusiness();

  const rows = await prisma.sharedAnalysis.findMany({
    where:   { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: {
      id:              true,
      sourceType:      true,
      sourceId:        true,
      snapshotMeta:    true,
      token:           true,
      passwordHash:    true,   // mapped to a boolean below
      expiresAt:       true,
      isActive:        true,
      viewCount:       true,
      firstViewedAt:   true,
      lastViewedAt:    true,
      createdAt:       true,
      createdByUser:   { select: { id: true, email: true, name: true } },
    },
  });

  const now = Date.now();
  const shares = rows.map((r) => ({
    id:               r.id,
    sourceType:       r.sourceType,
    sourceId:         r.sourceId,
    snapshotMeta:     r.snapshotMeta,
    token:            r.token,
    url:              buildShareUrl(r.token),
    hasPassword:      r.passwordHash != null,
    expiresAt:        r.expiresAt.toISOString(),
    isActive:         r.isActive,
    viewCount:        r.viewCount,
    firstViewedAt:    r.firstViewedAt?.toISOString() ?? null,
    lastViewedAt:     r.lastViewedAt?.toISOString() ?? null,
    createdAt:        r.createdAt.toISOString(),
    createdByUser:    r.createdByUser,
    // Status derives from isActive + expiry so the UI doesn't
    // recompute it. "expired" wins over "disabled" because once
    // the cutoff passes a re-enable would still be a no-op.
    status:
      r.expiresAt.getTime() < now ? "expired"
      : !r.isActive               ? "disabled"
      : "active",
  }));

  return NextResponse.json({ shares });
}
