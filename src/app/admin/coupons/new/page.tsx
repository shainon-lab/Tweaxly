// Admin · Coupons · New. Single-page form that creates a coupon via
// POST /api/admin/coupons. Renders the value-field label dynamically
// based on the chosen kind (percent / cents / credits / days) so the
// admin can't enter an obviously-wrong value.

import Link from "next/link";
import { CouponForm } from "../CouponForm";

export const dynamic = "force-dynamic";

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="text-xs text-slate-400 hover:text-slate-200 transition">← Coupons</Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">New coupon</h1>
        <p className="text-xs text-slate-400 mt-1">
          Create a promo code. The code is case-insensitive at redemption time
          but admins typically save them in uppercase for readability.
        </p>
      </div>
      <CouponForm mode="create" />
    </div>
  );
}
