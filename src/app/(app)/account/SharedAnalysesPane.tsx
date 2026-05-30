"use client";

// Account → Shared Analyses tab.
//
// Lists every secure share link the user's current workspace has
// created, newest first. Each row shows the share's title (from the
// snapshot meta), source type, created/expires dates, view count,
// and a status pill (active / expired / disabled). Row actions:
//
//   - Copy        copies the URL to clipboard
//   - Disable     PATCH isActive:false  (link returns "expired"
//                 immediately, analytics preserved)
//   - Re-enable   PATCH isActive:true   (only when still within
//                 expiry; expired rows never offer this)
//   - Delete      DELETE the row outright (confirmation required;
//                 snapshot + analytics gone for good)
//
// Workspace scope: the list reflects the *currently active*
// workspace via the same requireBusiness() gate the create API
// uses. Multi-workspace owners see different lists in different
// workspaces - the header note makes that explicit.

import { useEffect, useState, useTransition } from "react";
import { Copy, Check, Trash2, Eye, Power, PowerOff } from "lucide-react";
import { notify } from "@/lib/notify";

type ShareRow = {
  id:               string;
  sourceType:       string;
  sourceId:         string;
  // snapshotMeta is opaque Json from the API. We pull `title` off it
  // for display; everything else just round-trips.
  snapshotMeta:     { title?: string; question?: string; year?: number | null } | null;
  token:            string;
  url:              string;
  hasPassword:      boolean;
  expiresAt:        string;
  isActive:         boolean;
  viewCount:        number;
  firstViewedAt:    string | null;
  lastViewedAt:     string | null;
  createdAt:        string;
  createdByUser:    { id: string; email: string; name: string | null } | null;
  status:           "active" | "expired" | "disabled";
};

const SOURCE_LABEL: Record<string, string> = {
  consultation:         "Consultation",
  signal:               "Signal",
  forecast_explanation: "Forecast",
  insight:              "Insight",
};

export default function SharedAnalysesPane() {
  const [shares, setShares] = useState<ShareRow[] | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setShares(null);
    setError(null);
    fetch("/api/shared-analyses")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => { if (!cancelled) setShares((d.shares as ShareRow[]) ?? []); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load shares."); });
    return () => { cancelled = true };
  }, [reloadKey]);

  function refresh() {
    startTransition(() => setReloadKey((k) => k + 1));
  }

  // Render states
  if (error) {
    return (
      <div className="card">
        <div className="t-body text-bad">Could not load shared analyses: {error}</div>
        <button type="button" className="btn-ghost mt-3" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  }
  if (shares == null) {
    return (
      <div className="card">
        <div className="t-body text-slate-400">Loading shared analyses…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="t-body text-slate-400">
        Secure read-only links you&apos;ve created from this workspace.
        Recipients view the snapshot without a Tweaxly account.
      </div>

      {shares.length === 0 ? (
        <div className="card text-center py-12">
          <div className="t-card text-slate-200">No shared analyses yet</div>
          <div className="t-body text-slate-400 mt-2">
            Click <span className="font-medium">Share</span> on any AI answer,
            signal, forecast explanation or insight to create your first link.
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Analysis</th>
                <th>Type</th>
                <th>Created</th>
                <th>Expires</th>
                <th className="text-right">Views</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shares.map((s) => (
                <ShareRowComponent
                  key={s.id}
                  row={s}
                  onChanged={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShareRowComponent({
  row,
  onChanged,
}: {
  row: ShareRow;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<null | "toggle" | "delete">(null);
  const [copied, setCopied] = useState(false);

  const title =
    (row.snapshotMeta && typeof row.snapshotMeta.title === "string" && row.snapshotMeta.title) ||
    (row.snapshotMeta && typeof row.snapshotMeta.question === "string" && row.snapshotMeta.question) ||
    "Shared analysis";

  const expired = row.status === "expired";

  async function copyLink() {
    // url may be relative when SHARE_BASE_URL is unset; resolve
    // against window.location.origin so the clipboard always gets a
    // full, paste-able URL.
    const absolute = row.url.startsWith("http")
      ? row.url
      : `${window.location.origin}${row.url}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this link", absolute);
    }
  }

  async function toggleActive(nextActive: boolean) {
    setBusy("toggle");
    try {
      const res = await fetch(`/api/shared-analyses/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        notify.alert(`Couldn't update share: HTTP ${res.status}`);
        return;
      }
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function deleteShare() {
    const ok = await notify.confirm({
      title:        "Delete this share link?",
      body:         "The link will stop working immediately and all view analytics will be removed. This can't be undone.",
      confirmLabel: "Delete",
      danger:       true,
    });
    if (!ok) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/shared-analyses/${encodeURIComponent(row.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify.alert(`Couldn't delete share: HTTP ${res.status}`);
        return;
      }
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <tr>
      <td className="text-slate-200 max-w-[320px]">
        <div className="t-body truncate" title={title}>{title}</div>
        {row.hasPassword ? (
          <div className="t-meta uppercase tracking-wide text-slate-500 mt-1">
            Password-protected
          </div>
        ) : null}
      </td>
      <td className="text-slate-300">
        <span className="pill">{SOURCE_LABEL[row.sourceType] ?? row.sourceType}</span>
      </td>
      <td className="text-slate-300 t-meta">
        {new Date(row.createdAt).toLocaleDateString()}
      </td>
      <td className="text-slate-300 t-meta">
        {new Date(row.expiresAt).toLocaleDateString()}
      </td>
      <td className="text-right text-slate-300 tabular-nums">
        <div className="inline-flex items-center gap-1.5 t-body">
          <Eye size={12} strokeWidth={1.75} aria-hidden="true" />
          {row.viewCount}
        </div>
        {row.lastViewedAt ? (
          <div className="t-meta text-slate-500 mt-0.5">
            last {new Date(row.lastViewedAt).toLocaleDateString()}
          </div>
        ) : null}
      </td>
      <td>
        <StatusPill status={row.status} />
      </td>
      <td className="text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1 flex-wrap justify-end">
          {/* Copy is always available - even on disabled / expired
              rows so the user can grab the URL for record-keeping. */}
          <button
            type="button"
            onClick={copyLink}
            className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-slate-100 hover:border-slate-500 transition inline-flex items-center gap-1.5"
            title="Copy link"
          >
            {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {/* Disable / re-enable. Re-enable is only offered when the
              link is still within its expiry window - past that, the
              public viewer would still show expired regardless. */}
          {row.isActive ? (
            <button
              type="button"
              onClick={() => toggleActive(false)}
              disabled={busy === "toggle" || expired}
              className="t-meta px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-warn hover:border-warn/60 transition inline-flex items-center gap-1.5 disabled:opacity-50"
              title="Disable this share"
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
              title="Re-enable this share"
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
            title="Delete this share"
          >
            <Trash2 size={12} strokeWidth={2} />
            {busy === "delete" ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: "active" | "expired" | "disabled" }) {
  if (status === "active") {
    return <span className="pill-good">Active</span>;
  }
  if (status === "expired") {
    return <span className="pill-warn">Expired</span>;
  }
  return <span className="pill">Disabled</span>;
}
