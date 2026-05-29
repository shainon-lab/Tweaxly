// POST /api/signals/refresh
//
// User-initiated refresh of the workspace's business signals. Charges
// 3 AI Credits per refresh (the same tier the pricing page already
// advertises for "deep analysis on a signal"). The automatic triggers
// (data upload / weekly cron / lifecycle action) stay free; this
// endpoint is the only path that bills.
//
// Behaviour:
//   - Pre-checks balance. If < 3 credits, returns 402 with a
//     fallback action so the UI can route to upgrade vs buy credits
//     based on plan.
//   - On success: debits credits, runs evaluateSignals (which
//     persists + diffs), runs dispatchSignalNotifications, returns
//     the diff counts so the UI can confirm what changed.
//
// Idempotency: we don't dedupe inside a 5-second window or similar -
// each successful click is one debit. The frontend's confirmation
// modal is the user-facing safeguard against accidental double-spend.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { consumeCredits, getEffectivePlan } from "@/lib/billing";
import { evaluateSignals } from "@/lib/signals/evaluator";
import { dispatchSignalNotifications } from "@/lib/signals/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_COST = 3;

export async function POST() {
  const { business } = await requireBusiness();

  // 1. Charge first so we never run the analysis without billing.
  //    consumeCredits is atomic - balance check + decrement inside one
  //    transaction.
  const charge = await consumeCredits(
    business.id,
    REFRESH_COST,
    "signal_refresh",
    { source: "manual_refresh" },
  );
  if (!charge.ok) {
    // Tell the UI WHICH fallback to show (Upgrade for Free, Buy
    // Credits for Pro). The frontend reads `fallback` to pick the
    // right modal.
    const plan = await getEffectivePlan(business.id).catch(() => null);
    const isPro = plan?.plan === "pro";
    return NextResponse.json({
      error:    charge.reason,
      cost:     REFRESH_COST,
      balance:  charge.balance,
      fallback: isPro ? "buy_credits" : "upgrade",
    }, { status: 402 });
  }

  // 2. Run the deterministic evaluator + dispatch notifications on
  //    real change events. Both are zero-cost (rule-based + DB writes
  //    only). The credit debit covers the user-initiated nature of the
  //    request, not any LLM call - there is no LLM call in this path.
  try {
    const diff = await evaluateSignals(business.id);
    const out  = await dispatchSignalNotifications(business.id, diff);
    return NextResponse.json({
      ok: true,
      balance: charge.balance,
      diff: {
        created:   diff.created.length,
        updated:   diff.updated.length,
        resolved:  diff.resolved.length,
        unchanged: diff.unchanged.length,
        active:    diff.current.length,
      },
      notificationsWritten: out.written,
    });
  } catch (err) {
    console.error(`[signals:refresh] evaluation failed business=${business.id}`, err);
    // The debit already happened. Refund inline so the user isn't
    // billed for a failed run.
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.$transaction([
        prisma.aiCreditWallet.update({
          where: { businessId: business.id },
          data:  {
            balance:          { increment: REFRESH_COST },
            lifetimeConsumed: { decrement: REFRESH_COST },
          },
        }),
        prisma.aiCreditTransaction.create({
          data: {
            businessId:   business.id,
            kind:         "adjustment",
            delta:        REFRESH_COST,
            balanceAfter: charge.balance + REFRESH_COST,
            reason:       "Refund: signal refresh failed before completion.",
          },
        }),
      ]);
    } catch (refundErr) {
      console.error(`[signals:refresh] refund failed business=${business.id}`, refundErr);
    }
    return NextResponse.json({ error: "refresh_failed" }, { status: 500 });
  }
}
