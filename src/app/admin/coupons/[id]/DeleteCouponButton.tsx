"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

// Delete button only renders enabled when there are no redemptions
// yet. Coupons with redemption history are kept for audit; admins
// can disable them via the form instead.
export function DeleteCouponButton({ id, canDelete }: { id: string; canDelete: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onDelete() {
    if (!canDelete) return;
    if (!(await notify.confirm({ title: "Delete coupon?", body: "Delete this coupon? This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notify.alert("Delete failed");
      return;
    }
    startTransition(() => router.push("/admin/coupons"));
  }

  if (!canDelete) {
    return (
      <div className="text-[11px] text-slate-500 max-w-xs text-right">
        Can&apos;t delete a coupon with redemption history. Disable it instead.
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="text-xs px-3 py-1 rounded-md border border-bad/40 text-bad hover:bg-bad/10 hover:border-bad transition disabled:opacity-50"
    >
      Delete coupon
    </button>
  );
}
