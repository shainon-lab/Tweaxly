"use client";

// Row-level actions for the admin Shared Analyses table. Open links
// to the public viewer in a new tab; Disable / Re-enable / Delete
// hit the same PATCH/DELETE endpoints the per-workspace Account
// pane uses, so an admin override goes through the canonical write
// path rather than touching the DB directly.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Power, PowerOff, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

export default function AdminSharedAnalysisActions({
  id,
  url,
  isActive,
  expired,
}: {
  id:       string;
  // Same shape returned by buildShareUrl() server-side - absolute when
  // SHARE_BASE_URL is set, same-origin relative otherwise.
  url:      string;
  isActive: boolean;
  expired:  boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "toggle" | "delete">(null);
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function toggleActive(nextActive: boolean) {
    setBusy("toggle");
    try {
      const res = await fetch(`/api/admin/shared-analyses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        notify.alert(`Couldn't update share: HTTP ${res.status}`);
        return;
      }
      refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteShare() {
    const ok = await notify.confirm({
      title:        "Delete this share link?",
      body:         "The link will stop working immediately and the snapshot + analytics will be removed. This can't be undone.",
      confirmLabel: "Delete",
      danger:       true,
    });
    if (!ok) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/shared-analyses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify.alert(`Couldn't delete share: HTTP ${res.status}`);
        return;
      }
      refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 flex-wrap justify-end">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-accent hover:border-accent/60 transition inline-flex items-center gap-1.5"
        title="Open public viewer"
      >
        <ExternalLink size={12} strokeWidth={2} />
        Open
      </a>
      {isActive ? (
        <button
          type="button"
          onClick={() => toggleActive(false)}
          disabled={busy === "toggle" || expired}
          className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-warn hover:border-warn/60 transition inline-flex items-center gap-1.5 disabled:opacity-50"
          title="Disable share"
        >
          <PowerOff size={12} strokeWidth={2} />
          {busy === "toggle" ? "…" : "Disable"}
        </button>
      ) : !expired ? (
        <button
          type="button"
          onClick={() => toggleActive(true)}
          disabled={busy === "toggle"}
          className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-good hover:border-good/60 transition inline-flex items-center gap-1.5 disabled:opacity-50"
          title="Re-enable share"
        >
          <Power size={12} strokeWidth={2} />
          {busy === "toggle" ? "…" : "Re-enable"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={deleteShare}
        disabled={busy === "delete"}
        className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-400 hover:text-bad hover:border-bad/60 transition inline-flex items-center gap-1.5 disabled:opacity-50"
        title="Delete share"
      >
        <Trash2 size={12} strokeWidth={2} />
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
