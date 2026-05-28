"use client";

// Compact promote / demote affordance per user row. Super admin only;
// the server already enforces that, this is convenience UX so the
// affordance never appears for accounts the caller can't change.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

export function UserRoleEditor({
  userId,
  currentRole,
  email,
}: {
  userId: string;
  currentRole: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeTo(next: "user" | "admin") {
    const verb = next === "admin" ? "promote" : "demote";
    if (!(await notify.confirm({ title: `${verb === "promote" ? "Promote" : "Demote"} user?`, body: `${verb === "promote" ? "Promote" : "Demote"} ${email} to ${next}?`, confirmLabel: verb === "promote" ? "Promote" : "Demote", danger: verb === "demote" }))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        setError(t.message ?? `${verb} failed`);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      {error ? <span className="text-[10px] text-bad">{error}</span> : null}
      {currentRole === "user" ? (
        <button
          type="button"
          disabled={busy || pending}
          onClick={() => changeTo("admin")}
          className="text-[11px] px-2.5 py-1 rounded-md border border-good/40 bg-good/10 text-good hover:bg-good/20 transition disabled:opacity-50"
          title="Promote to admin"
        >
          Promote → admin
        </button>
      ) : currentRole === "admin" ? (
        <button
          type="button"
          disabled={busy || pending}
          onClick={() => changeTo("user")}
          className="text-[11px] px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-bad hover:border-bad/50 transition disabled:opacity-50"
          title="Demote to regular user"
        >
          Demote → user
        </button>
      ) : null}
    </div>
  );
}
