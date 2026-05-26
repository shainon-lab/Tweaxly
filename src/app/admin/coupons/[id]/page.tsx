// Admin · Coupons · Detail. Edit form + redemption history.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { summariseCoupon } from "@/lib/billing";
import { CouponForm } from "../CouponForm";
import { DeleteCouponButton } from "./DeleteCouponButton";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date): string {
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function CouponDetailPage({ params }: { params: { id: string } }) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      redemptions: {
        orderBy: { redeemedAt: "desc" },
        take: 50,
        include: {
          user:     { select: { email: true, name: true } },
          business: { select: { name: true } },
        },
      },
      _count: { select: { redemptions: true } },
    },
  });
  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <Link href="/admin/coupons" className="text-xs text-slate-400 hover:text-slate-200 transition">← Coupons</Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100 font-mono">{coupon.code}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {summariseCoupon(coupon)}
            {" · "}
            <span className="text-slate-500">created by {coupon.createdBy.name ?? coupon.createdBy.email}</span>
          </p>
        </div>
        <DeleteCouponButton id={coupon.id} canDelete={coupon._count.redemptions === 0} />
      </div>

      <CouponForm
        mode="edit"
        initial={{
          id:              coupon.id,
          code:            coupon.code,
          kind:            coupon.kind,
          value:           coupon.value,
          maxRedemptions:  coupon.maxRedemptions,
          maxPerUser:      coupon.maxPerUser,
          startsAt:        coupon.startsAt?.toISOString()  ?? null,
          expiresAt:       coupon.expiresAt?.toISOString() ?? null,
          applicablePlans: coupon.applicablePlans,
          excludedPlans:   coupon.excludedPlans,
          billingCycle:    coupon.billingCycle,
          cycleCount:      coupon.cycleCount,
          targetEmail:     coupon.targetEmail,
          internalNote:    coupon.internalNote,
          disabled:        coupon.disabled,
        }}
      />

      {/* Redemption history */}
      <div className="max-w-3xl">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Redemptions <span className="text-slate-500 font-normal">({coupon._count.redemptions})</span>
        </h2>
        {coupon.redemptions.length === 0 ? (
          <div className="text-xs text-slate-500">No redemptions yet.</div>
        ) : (
          <div className="rounded-xl border border-line overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-ink-900/80 text-left text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Business</th>
                  <th className="px-3 py-2 font-medium">Effect</th>
                </tr>
              </thead>
              <tbody>
                {coupon.redemptions.map((r) => (
                  <tr key={r.id} className="border-t border-line/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDateTime(r.redeemedAt)}</td>
                    <td className="px-3 py-2 text-slate-300">{r.user.name ?? r.user.email}</td>
                    <td className="px-3 py-2 text-slate-300">{r.business.name}</td>
                    <td className="px-3 py-2 text-slate-300">
                      {r.creditsGranted   != null ? `+${r.creditsGranted.toLocaleString()} credits` :
                       r.trialDaysGranted != null ? `+${r.trialDaysGranted} trial days` :
                       r.discountAmount   != null ? (coupon.kind === "percentage" ? `${r.discountAmount}% off` : `$${(r.discountAmount/100).toFixed(2)} off`) :
                       " - "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
