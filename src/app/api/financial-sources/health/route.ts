// Import Health Score — single percentage summarising how much of the
// expected (source × month) coverage matrix is actually uploaded.
// Powers the widget on /sources and the compact tile on /dashboard.
//
// Score = uploaded_cells / expected_cells, where expected_cells iterates
// every active source from its startMonth through the previous full
// month (we don't count the current in-progress month, since the user
// reasonably hasn't uploaded it yet).

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function ymToNum(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
}
function numToYm(n: number): string {
  const y = Math.floor(n / 12);
  const m = (n % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
function previousFullYm(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const { business } = await requireBusiness();
  const [sources, batches] = await Promise.all([
    prisma.financialSource.findMany({
      where: { businessId: business.id, status: "active" },
      orderBy: { name: "asc" },
    }),
    prisma.uploadBatch.findMany({
      where: {
        businessId: business.id,
        status: "active",
        financialSourceId: { not: null },
        periodStart: { not: null },
      },
      select: { financialSourceId: true, periodStart: true, periodEnd: true },
    }),
  ]);

  if (sources.length === 0) {
    return NextResponse.json({
      percent:        null,
      totalExpected:  0,
      totalUploaded:  0,
      sourcesCount:   0,
      previousMonth:  previousFullYm(),
      gaps:           [],
    });
  }

  // Index uploaded (sourceId, ym) pairs.
  const uploaded = new Set<string>();
  for (const b of batches) {
    if (!b.financialSourceId || !b.periodStart) continue;
    const startN = ymToNum(b.periodStart);
    const endN   = ymToNum(b.periodEnd ?? b.periodStart);
    for (let n = startN; n <= endN; n++) {
      uploaded.add(`${b.financialSourceId}|${numToYm(n)}`);
    }
  }

  const prevYM = previousFullYm();
  const prevN  = ymToNum(prevYM);

  let totalExpected = 0;
  let totalUploaded = 0;
  type Gap = { sourceId: string; sourceName: string; missingMonths: string[] };
  const gaps: Gap[] = [];

  for (const s of sources) {
    const startN = ymToNum(s.startMonth);
    if (startN > prevN) continue; // source isn't expected yet
    const missing: string[] = [];
    for (let n = startN; n <= prevN; n++) {
      const ym = numToYm(n);
      totalExpected++;
      const key = `${s.id}|${ym}`;
      if (uploaded.has(key)) totalUploaded++;
      else missing.push(ym);
    }
    if (missing.length > 0) {
      gaps.push({ sourceId: s.id, sourceName: s.name, missingMonths: missing });
    }
  }

  // Surface the most recent missing months per gap first — those are the
  // ones the owner most likely cares about catching up on.
  for (const g of gaps) g.missingMonths.sort((a, b) => b.localeCompare(a));
  // And put the worst-covered sources at the top of the list.
  gaps.sort((a, b) => b.missingMonths.length - a.missingMonths.length);

  const percent = totalExpected === 0 ? null : Math.round((totalUploaded / totalExpected) * 100);

  return NextResponse.json({
    percent,
    totalExpected,
    totalUploaded,
    sourcesCount: sources.length,
    previousMonth: prevYM,
    gaps,
  });
}
