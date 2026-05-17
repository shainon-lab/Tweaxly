"use client";

// Client-side controls on the account detail page: status changer,
// impersonation entry. All POSTs go to /api/admin routes that re-check
// super_admin server-side.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUSES: { value: string; label: string }[] = [
  { value: "active",    label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "demo",      label: "Demo" },
  { value: "test",      label: "Test" },
];

export function AccountActions({
  businessId,
  businessName,
  status,
}: {
  businessId: string;
  businessName: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(next: string) {
    if (next === status) return;
    setError(null);
    const res = await fetch(`/api/admin/accounts/${businessId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setError("Status update failed");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function impersonate() {
    setError(null);
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId, allowWrites: false }),
    });
    if (!res.ok) {
      setError("Impersonation failed");
      return;
    }
    // Drop into the customer view. The persistent banner in the (app)
    // layout signals the impersonation state.
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => changeStatus(e.target.value)}
          className="input text-sm py-1.5 pr-8"
          aria-label="Account status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={impersonate}
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          title={`View ${businessName} as customer`}
        >
          View as customer →
        </button>
      </div>
      {error ? <div className="text-xs text-bad">{error}</div> : null}
    </div>
  );
}
