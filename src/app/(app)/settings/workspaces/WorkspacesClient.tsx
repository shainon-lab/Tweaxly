"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2, LogOut, Pencil } from "lucide-react";

type Workspace = {
  membershipId: string;
  role: string;
  joinedAt: string | null;
  isCurrent: boolean;
  business: {
    id: string;
    name: string;
    plan: string;
    status: string;
    createdAt: string;
    isOwner: boolean;
    memberCount: number;
    transactionCount: number;
  };
};

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

export function WorkspacesClient({ workspaces, currentBusinessId }: {
  workspaces: Workspace[];
  currentBusinessId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function switchTo(id: string) {
    if (id === currentBusinessId) return;
    await fetch("/api/businesses/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    window.location.assign("/dashboard");
  }

  async function rename(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const res = await fetch(`/api/businesses/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (!res.ok) { setError("Rename failed"); return; }
    setEditingId(null);
    refresh();
  }

  async function leave(id: string, name: string) {
    if (!confirm(`Leave "${name}"? You won't be able to access this workspace until you're re-invited.`)) return;
    setError(null);
    const res = await fetch(`/api/businesses/${id}/leave`, { method: "POST" });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      setError(t.message ?? "Leave failed");
      return;
    }
    // If we just left the current workspace, send the user home.
    if (id === currentBusinessId) {
      window.location.assign("/dashboard");
      return;
    }
    refresh();
  }

  async function destroy(id: string, name: string, txCount: number) {
    const confirmText = window.prompt(
      `Permanently delete "${name}"?\n\nThis cascade-deletes ${txCount.toLocaleString()} transaction(s), uploads, employees, forecasts, and every member. There is no undo.\n\nType the workspace name to confirm:`
    );
    if (confirmText !== name) {
      if (confirmText !== null) alert("Name didn't match - deletion cancelled.");
      return;
    }
    setError(null);
    const res = await fetch(`/api/businesses/${id}?confirm=delete`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    if (id === currentBusinessId) {
      window.location.assign("/dashboard");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-slate-400">
          {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} under your account.
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition inline-flex items-center gap-1.5"
        >
          <Plus size={14} strokeWidth={2} /> Create new workspace
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">{error}</div>
      ) : null}

      <div className="space-y-3">
        {workspaces.map((w) => (
          <div key={w.membershipId} className={`rounded-xl border bg-ink-900/40 p-5 ${w.isCurrent ? "border-accent/50" : "border-line"}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                {editingId === w.business.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input text-base font-semibold"
                    />
                    <button type="button" onClick={() => rename(w.business.id)} className="btn-primary text-xs">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="text-lg font-semibold text-slate-100">{w.business.name}</div>
                    {w.isCurrent ? (
                      <span className="text-[10px] pill-accent inline-flex items-center gap-1"><Check size={10} strokeWidth={2.5} /> Current</span>
                    ) : null}
                    <span className={`${STATUS_PILL[w.business.status] ?? "pill"} text-[10px]`}>{w.business.status}</span>
                    <span className="text-[10px] pill">{w.business.plan}</span>
                    {w.business.isOwner ? <span className="text-[10px] pill">Owner</span> : <span className="text-[10px] pill">{w.role.replace("_", " ")}</span>}
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  {w.business.memberCount} member{w.business.memberCount === 1 ? "" : "s"}
                  <span className="mx-2 text-slate-700">·</span>
                  {w.business.transactionCount.toLocaleString()} transaction{w.business.transactionCount === 1 ? "" : "s"}
                  <span className="mx-2 text-slate-700">·</span>
                  created {new Date(w.business.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {!w.isCurrent ? (
                  <button
                    type="button"
                    onClick={() => switchTo(w.business.id)}
                    disabled={pending}
                    className="text-xs px-3 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
                  >
                    Switch to →
                  </button>
                ) : null}
                {w.role === "account_admin" ? (
                  <button
                    type="button"
                    onClick={() => { setEditingId(w.business.id); setEditName(w.business.name); }}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition inline-flex items-center gap-1.5"
                    title="Rename workspace"
                  >
                    <Pencil size={12} strokeWidth={2} /> Rename
                  </button>
                ) : null}
                {!w.business.isOwner ? (
                  <button
                    type="button"
                    onClick={() => leave(w.business.id, w.business.name)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-line text-slate-300 hover:text-bad hover:border-bad/50 transition inline-flex items-center gap-1.5"
                    title="Leave workspace"
                  >
                    <LogOut size={12} strokeWidth={2} /> Leave
                  </button>
                ) : null}
                {w.business.isOwner ? (
                  <button
                    type="button"
                    onClick={() => destroy(w.business.id, w.business.name, w.business.transactionCount)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-line text-slate-400 hover:text-bad hover:border-bad/50 transition inline-flex items-center gap-1.5"
                    title="Delete workspace (owner only)"
                  >
                    <Trash2 size={12} strokeWidth={2} /> Delete
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-4 text-xs text-slate-500">
        <div className="text-slate-300 font-medium mb-1">Invitations & ownership transfer</div>
        Inviting members by email and transferring ownership aren&apos;t wired up yet -
        coming with the next admin/invite milestone. For now, every workspace has
        exactly one owner (its creator), and additional members can be added by the
        super_admin only.
      </div>

      {createOpen ? <CreateWorkspaceDialog onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, industry: industry || undefined, country: country || undefined }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = `Create failed (${res.status})`;
        try { msg = JSON.parse(t).error ?? msg; } catch { /* keep */ }
        setError(msg);
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-md">
        <div className="mb-4">
          <div className="text-lg font-semibold text-slate-100">New workspace</div>
          <div className="text-sm text-slate-400 mt-1">
            Belongs to your account. No new login required.
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Business name *</label>
            <input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Side Co." />
          </div>
          <div>
            <label className="label">Business type <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, Retail, Agency" />
          </div>
          <div>
            <label className="label">Country <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
          </div>
          {error ? <div className="text-sm text-bad">{error}</div> : null}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button type="button" disabled={!name.trim() || busy} onClick={submit} className="btn-primary text-sm disabled:opacity-50">
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}
