// Monthly coverage matrix. For each active source × each month from the
// source's startMonth through the current month, report whether at least
// one active UploadBatch covers that month. The UI renders this as a
// sources × months grid with ✅ / ❌ cells.

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
function currentYm(): string {
  const d = new Date();
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
      select: {
        id: true,
        financialSourceId: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
        filename: true,
      },
    }),
  ]);

  // Determine the full month axis: earliest startMonth across all sources
  // to the current month, inclusive. Capped at 36 months to keep the
  // grid manageable on the UI.
  const nowN = ymToNum(currentYm());
  let earliest = nowN;
  for (const s of sources) earliest = Math.min(earliest, ymToNum(s.startMonth));
  const start = Math.max(earliest, nowN - 35);
  const months: string[] = [];
  for (let n = start; n <= nowN; n++) months.push(numToYm(n));

  // Index batches by (sourceId, ym).
  const cells: Record<string, Record<string, { batches: number; filenames: string[] }>> = {};
  for (const b of batches) {
    if (!b.financialSourceId || !b.periodStart) continue;
    const startN = ymToNum(b.periodStart);
    const endN   = ymToNum(b.periodEnd ?? b.periodStart);
    for (let n = startN; n <= endN; n++) {
      const ym = numToYm(n);
      if (!cells[b.financialSourceId]) cells[b.financialSourceId] = {};
      const entry = cells[b.financialSourceId][ym] ??= { batches: 0, filenames: [] };
      entry.batches++;
      if (entry.filenames.length < 3) entry.filenames.push(b.filename);
    }
  }

  return NextResponse.json({
    months,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      currency: s.currency,
      last4: s.last4,
      startMonth: s.startMonth,
      cells: months.map((ym) => {
        const entry = cells[s.id]?.[ym];
        const inWindow = ymToNum(ym) >= ymToNum(s.startMonth);
        if (!inWindow) return { ym, status: "out_of_window" as const };
        if (!entry)    return { ym, status: "missing" as const };
        return {
          ym,
          status: "uploaded" as const,
          batches: entry.batches,
          filenames: entry.filenames,
        };
      }),
    })),
  });
}
