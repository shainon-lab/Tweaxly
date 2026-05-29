// GET /api/cron/signals-weekly
//
// Vercel-Cron-driven weekly re-evaluation. Runs every Monday at
// 13:00 UTC (per vercel.json) and re-runs the signal evaluator for
// every workspace that has at least one transaction. Zero AI credits
// for every workspace - this is platform behaviour, the spec says
// "weekly re-evaluation does not consume AI credits".
//
// Bounded by BATCH_SIZE so a multi-thousand-workspace run never
// dominates a single function invocation. Workspaces are processed
// in oldest-evaluated-first order so the long tail still gets
// regular updates.
//
// Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateSignals } from "@/lib/signals/evaluator";
import { dispatchSignalNotifications } from "@/lib/signals/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 200;

function authOk(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Workspaces with at least one transaction. Below-threshold workspaces
  // would produce zero signals anyway; skip them to keep the run lean.
  const candidates = await prisma.business.findMany({
    where:   { transactions: { some: {} } },
    select:  { id: true },
    take:    BATCH_SIZE,
  });

  const results: Array<{ businessId: string; created: number; updated: number; resolved: number; written: number }> = [];

  for (const b of candidates) {
    try {
      const diff = await evaluateSignals(b.id);
      const out  = await dispatchSignalNotifications(b.id, diff);
      results.push({
        businessId: b.id,
        created:    diff.created.length,
        updated:    diff.updated.length,
        resolved:   diff.resolved.length,
        written:    out.written,
      });
    } catch (err) {
      console.error(`[cron:signals-weekly] failed business=${b.id}`, err);
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    summary: {
      created:  results.reduce((a, r) => a + r.created, 0),
      updated:  results.reduce((a, r) => a + r.updated, 0),
      resolved: results.reduce((a, r) => a + r.resolved, 0),
      notificationsWritten: results.reduce((a, r) => a + r.written, 0),
    },
  });
}
