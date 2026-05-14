import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessContext, recommendProactive } from "@/lib/advisor";

export const runtime = "nodejs";

// Maximum signals shown at one time in the Business Signals box.
const MAX_VISIBLE = 5;
// "Don't show again" suppression window.
const MUTE_DAYS = 7;

function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  // Fisher-Yates partial shuffle — picks `n` items uniformly without bias.
  const a = arr.slice();
  for (let i = a.length - 1; i > a.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(a.length - n);
}

// GET — return the most-recent active batch (no regeneration)
export async function GET() {
  const { business } = await requireBusiness();
  const recs = await prisma.recommendation.findMany({
    where: { businessId: business.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ recommendations: recs });
}

// POST — refresh: regenerate the full pool, filter out currently-muted signals,
// shuffle, take a random sample up to MAX_VISIBLE, and persist as the new
// active set.
export async function POST(_req: NextRequest) {
  const { business } = await requireBusiness();
  const ctx = await buildBusinessContext(business.id);
  const pool = await recommendProactive(business.id, ctx);

  const mutedRows = await prisma.mutedSignal.findMany({
    where: { businessId: business.id, mutedUntil: { gt: new Date() } },
  });
  const mutedKeys = new Set(mutedRows.map((m) => m.signalKey));
  const eligible = pool.filter((r) => !mutedKeys.has(r.signalKey));

  // Keep the highest-severity items in priority, then fill the rest with a
  // random sample so the user sees variety on each refresh. Severity order:
  // bad → warn → info → good.
  const order: Record<string, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  const sorted = [...eligible].sort((a, b) => order[a.level] - order[b.level] || b.impact - a.impact);
  // Always include any "bad" signals first (they're rare and important).
  const required = sorted.filter((r) => r.level === "bad").slice(0, MAX_VISIBLE);
  const remaining = sorted.filter((r) => r.level !== "bad");
  const need = Math.max(0, MAX_VISIBLE - required.length);
  const sample = pickRandom(remaining, need);
  const chosen = [...required, ...sample];

  await prisma.$transaction([
    prisma.recommendation.deleteMany({
      where: { businessId: business.id, status: "active" },
    }),
    prisma.recommendation.createMany({
      data: chosen.map((r) => ({
        businessId: business.id,
        level: r.level,
        // The Prisma table predates the observation/interpretation/recommendation
        // split, so we collapse them back into title + detail for persistence.
        // The table is currently unused by the UI; if we ever wire it back up,
        // migrate the schema first.
        title: r.observation,
        detail: `${r.interpretation}\n\nRecommended action: ${r.recommendation}`,
        impact: r.impact,
        category: r.category,
        signalKey: r.signalKey,
        payload: r.payload ? JSON.stringify(r.payload) : null,
        status: "active",
      })),
    }),
  ]);
  const recs = await prisma.recommendation.findMany({
    where: { businessId: business.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ recommendations: recs });
}

// PATCH — per-row action. Supported `action` values:
//   "dismiss"       (default) — mark active recommendation as dismissed
//   "applied"                 — mark active recommendation as applied
//   "mute"                    — suppress this signal kind for MUTE_DAYS;
//                               also dismisses the current row.
export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const action: string =
    b.action === "mute" ? "mute" :
    b.status === "applied" ? "applied" :
    "dismissed";

  if (action === "mute") {
    const rec = await prisma.recommendation.findFirst({
      where: { id: b.id, businessId: business.id },
    });
    if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (rec.signalKey) {
      const mutedUntil = new Date(Date.now() + MUTE_DAYS * 24 * 60 * 60 * 1000);
      // Upsert so re-muting the same signal extends the window rather than
      // erroring on the unique constraint.
      await prisma.mutedSignal.upsert({
        where: { businessId_signalKey: { businessId: business.id, signalKey: rec.signalKey } },
        update: { mutedUntil },
        create: { businessId: business.id, signalKey: rec.signalKey, mutedUntil },
      });
    }
    await prisma.recommendation.updateMany({
      where: { id: b.id, businessId: business.id },
      data: { status: "dismissed" },
    });
    return NextResponse.json({ ok: true, muted: true });
  }

  await prisma.recommendation.updateMany({
    where: { id: b.id, businessId: business.id },
    data: { status: action },
  });
  return NextResponse.json({ ok: true });
}
