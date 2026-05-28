"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
  invitedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

const ROLES  = ["account_admin", "user", "viewer", "accountant"];
const STATUS_PILL: Record<string, string> = {
  active:   "pill-good",
  invited:  "pill-accent",
  disabled: "pill-bad",
};

function fmtRel(s: string | null) {
  if (!s) return "never";
  const ms = Date.now() - new Date(s).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function MembersTable({
  businessId,
  ownerId,
  members,
}: {
  businessId: string;
  ownerId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function update(memberId: string, patch: { role?: string; status?: string }) {
    setError(null);
    const res = await fetch(`/api/admin/accounts/${businessId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { setError("Update failed"); return; }
    startTransition(() => router.refresh());
  }

  async function disable(memberId: string, isOwner: boolean) {
    if (isOwner) {
      notify.alert("Can't disable the account owner. Transfer ownership first, or suspend the entire account.");
      return;
    }
    if (!(await notify.confirm({ title: "Disable member?", body: "Disable this member's access to the account? They'll be signed out and can't log back in until re-enabled.", confirmLabel: "Disable", danger: true }))) return;
    await update(memberId, { status: "disabled" });
  }

  return (
    <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
      {error ? <div className="px-4 py-2 text-xs text-bad bg-bad/10 border-b border-bad/40">{error}</div> : null}
      <table className="w-full text-sm">
        <thead className="bg-ink-900/80 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="text-left px-4 py-3">User</th>
            <th className="text-left px-4 py-3">Role</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Joined</th>
            <th className="text-left px-4 py-3">Last login</th>
            <th className="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {members.map((m) => {
            const isOwner = m.userId === ownerId;
            return (
              <tr key={m.id} className="hover:bg-ink-800/60 transition">
                <td className="px-4 py-3">
                  <div className="text-slate-100 text-sm flex items-center gap-2">
                    {m.name ?? m.email}
                    {isOwner ? <span className="text-[10px] pill-accent">Owner</span> : null}
                  </div>
                  <div className="text-xs text-slate-500">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.role}
                    disabled={pending || isOwner}
                    onChange={(e) => update(m.id, { role: e.target.value })}
                    className="input text-xs py-1 pr-7"
                  >
                    {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`${STATUS_PILL[m.status] ?? "pill"} text-[10px]`}>{m.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : (m.invitedAt ? `invited ${fmtRel(m.invitedAt)}` : new Date(m.createdAt).toLocaleDateString())}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{fmtRel(m.lastLoginAt)}</td>
                <td className="px-4 py-3 text-right">
                  {m.status === "disabled" ? (
                    <button
                      type="button"
                      onClick={() => update(m.id, { status: "active" })}
                      disabled={pending}
                      className="text-xs text-accent hover:text-white transition disabled:opacity-50"
                    >
                      Re-enable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => disable(m.id, isOwner)}
                      disabled={pending || isOwner}
                      className="text-xs text-slate-400 hover:text-bad transition disabled:opacity-30"
                      title={isOwner ? "Owner cannot be disabled here" : "Disable this member"}
                    >
                      Disable
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-line">
        Invitation flow not yet implemented - new members today join via existing memberships only.
      </div>
    </div>
  );
}
