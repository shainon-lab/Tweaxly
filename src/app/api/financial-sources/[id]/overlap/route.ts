// Overlap check for the guided upload flow. Given a source + a period
// (single month OR an inclusive YYYY-MM..YYYY-MM range), report which
// existing active batches already cover any month inside that period.
// The wizard uses this to surface the "Replace existing data?" warning.

import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const YM_RE = /^\d{4}-\d{2}$/;

function ymToNum(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const periodStart = sp.get("periodStart") ?? "";
  const periodEnd   = sp.get("periodEnd")   ?? periodStart;
  if (!YM_RE.test(periodStart) || !YM_RE.test(periodEnd)) {
    return NextResponse.json({ error: "periodStart and periodEnd must be YYYY-MM." }, { status: 400 });
  }
  const owned = await prisma.financialSource.findFirst({
    where: { id, businessId: business.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Source not found." }, { status: 404 });

  const reqStart = ymToNum(periodStart);
  const reqEnd   = ymToNum(periodEnd);

  // SQLite/Postgres-portable overlap: existing.periodStart <= reqEnd AND
  // existing.periodEnd >= reqStart. Both periods are inclusive YYYY-MM.
  const batches = await prisma.uploadBatch.findMany({
    where: {
      businessId: business.id,
      financialSourceId: id,
      status: "active",
      periodStart: { lte: periodEnd },
      periodEnd:   { gte: periodStart },
    },
    select: {
      id: true,
      filename: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute the exact overlapping months for each batch so the warning
  // can say "Jan, Feb and Mar already covered" instead of just listing
  // batch IDs.
  const overlapsByBatch = batches.map((b) => {
    const bStart = ymToNum(b.periodStart!);
    const bEnd   = ymToNum(b.periodEnd ?? b.periodStart!);
    const lo = Math.max(reqStart, bStart);
    const hi = Math.min(reqEnd,   bEnd);
    const months: string[] = [];
    for (let n = lo; n <= hi; n++) {
      const y = Math.floor(n / 12);
      const m = (n % 12) + 1;
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
    return {
      id: b.id,
      filename: b.filename,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      transactionCount: b._count.transactions,
      overlappingMonths: months,
      createdAt: b.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    hasOverlap: overlapsByBatch.length > 0,
    batches: overlapsByBatch,
  });
}
