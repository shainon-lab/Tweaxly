// Admin · Coupons. Dense list with status filter + create button.
// Each row links to the detail/edit page; redemption counts and
// dates are right on the row so admins can scan campaign health
// without opening every coupon.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { summariseCoupon } from "@/lib/billing";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function couponStatus(c: { disabled: boolean; startsAt: Date | null; expiresAt: Date | null; maxRedemptions: number | null; usedCount: number }): {
  label: string; tone: "good" | "warn" | "bad" | "muted";
} {
  const now = new Date();
  if (c.disabled)                                              return { label: "Disabled",    tone: "muted" };
  if (c.expiresAt && c.expiresAt < now)                        return { label: "Expired",     tone: "muted" };
  if (c.startsAt  && c.startsAt  > now)                        return { label: "Scheduled",   tone: "warn"  };
  if (c.maxRedemptions != null && c.usedCount >= c.maxRedemptions)
                                                               return { label: "Maxed out",   tone: "muted" };
  return { label: "Active", tone: "good" };
}

const STATUS_CLASS: Record<"good" | "warn" | "bad" | "muted", string> = {
  good:  "text-good   border-good/30   bg-good/5",
  warn:  "text-warn   border-warn/30   bg-warn/5",
  bad:   "text-bad    border-bad/30    bg-bad/5",
  muted: "text-slate-400 border-line   bg-ink-900/40",
};

export default async function CouponsListPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ disabled: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy:      { select: { name: true, email: true } },
      _count:         { select: { redemptions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Coupons</h1>
          <p className="text-xs text-slate-400 mt-1">
            Promo codes for discounts, AI credit grants, and trial extensions.
            Coupon redemptions go through the standard billing ledger - so credits
            granted via a coupon are auditable just like a paid grant.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
        >
          + New coupon
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-8 text-center">
          <div className="text-slate-200 font-medium">No coupons yet</div>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Coupons unlock four kinds of rewards: percentage discount, fixed-amount discount,
            bonus AI credits, or trial-extension days. Create one to give a customer a credit
            grant, an early-access discount, or a beta-tester bonus.
          </p>
          <Link
            href="/admin/coupons/new"
            className="inline-block mt-4 text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          >
            Create your first coupon
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/80 text-left text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Reward</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Created by</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = couponStatus(c);
                return (
                  <tr key={c.id} className="border-t border-line/40 hover:bg-ink-900/30 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/coupons/${c.id}`} className="text-slate-100 font-mono font-semibold hover:text-white">
                        {c.code}
                      </Link>
                      {c.internalNote ? (
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{c.internalNote}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {summariseCoupon(c)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_CLASS[status.tone]}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">
                      {c.usedCount.toLocaleString()}
                      {c.maxRedemptions != null ? <span className="text-slate-500"> / {c.maxRedemptions}</span> : null}
                      <span className="text-[11px] text-slate-500"> · {c._count.redemptions} redemption{c._count.redemptions === 1 ? "" : "s"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {c.startsAt || c.expiresAt
                        ? `${fmtDate(c.startsAt)} → ${fmtDate(c.expiresAt)}`
                        : <span className="text-slate-500">always</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.createdBy.name ?? c.createdBy.email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/coupons/${c.id}`} className="text-xs text-accent hover:underline">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
