"use client";

// Live Plaid connections panel. Shows every linked bank for this
// workspace + balances + last sync time + status, with a single
// "Connect bank account" CTA that opens Plaid Link. Sync, refresh,
// and disconnect actions are all routed through the server-side
// /api/integrations/plaid/* endpoints - the frontend never sees
// access_tokens or Plaid secrets.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { Banknote, Building2, RefreshCw, Trash2, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";

interface PlaidAccount {
  id:               string;
  name:             string;
  type:             string;
  last4:            string | null;
  currency:         string;
  currentBalance:   number | null;
  availableBalance: number | null;
}

interface PlaidConnection {
  id:                  string;
  institutionName:     string | null;
  status:              "connected" | "syncing" | "error" | "disconnected";
  lastError:           string | null;
  lastSyncCompletedAt: string | null;
  createdAt:           string;
  accounts:            PlaidAccount[];
}

const POLL_MS = 3500;

export default function PlaidPanel() {
  const [linkToken, setLinkToken]   = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [connections, setConnections]   = useState<PlaidConnection[]>([]);
  const [busyId, setBusyId]             = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // Pull the current connections list. Called on mount, after Link
  // success, and on every poll tick while any connection is still
  // in "syncing" state.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/plaid/connections", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch { /* best-effort */ }
  }, []);

  // Mint a link token lazily so we don't burn one on every page load.
  const ensureLinkToken = useCallback(async () => {
    if (linkToken || tokenLoading) return;
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res = await fetch("/api/integrations/plaid/link-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.detail ?? data.error ?? "Could not start the bank connection. Please try again.");
        return;
      }
      setLinkToken(data.linkToken);
    } catch {
      setTokenError("Network error - check your connection and try again.");
    } finally {
      setTokenLoading(false);
    }
  }, [linkToken, tokenLoading]);

  // Initial fetch + start polling while any connection is syncing.
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const syncing = connections.some((c) => c.status === "syncing");
    if (syncing && pollRef.current === null) {
      pollRef.current = window.setInterval(refresh, POLL_MS);
    } else if (!syncing && pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connections, refresh]);

  const onPlaidSuccess = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    try {
      const res = await fetch("/api/integrations/plaid/exchange-token", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({
          publicToken,
          institution: metadata.institution
            ? { id: metadata.institution.institution_id, name: metadata.institution.name }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await notify.alert({
          title: "Couldn't link this bank",
          body:  data.detail ?? data.error ?? "Plaid returned an error. Please try a different institution or contact support.",
        });
        return;
      }
      // Reset the link token so a subsequent Connect re-mints one,
      // and refresh the connections list.
      setLinkToken(null);
      await refresh();
    } catch {
      await notify.alert({
        title: "Couldn't link this bank",
        body:  "Network error - check your connection and try again.",
      });
    }
  }, [refresh]);

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => { setLinkToken(null); },
  });

  // When a link token gets minted AND plaidReady becomes true, open
  // the Plaid modal automatically (user already clicked Connect).
  // Gated together with onConnectClick - this effect stays harmless
  // while linkToken is always null. Restore by un-gating onConnectClick.
  useEffect(() => {
    if (linkToken && plaidReady) openPlaidLink();
  }, [linkToken, plaidReady, openPlaidLink]);

  async function onConnectClick() {
    // ── GATE: the real Plaid Link flow is held back until the
    //    workspace owner is ready to add sandbox credentials. To
    //    re-enable, replace the body with `await ensureLinkToken();`
    //    The rest of the panel (usePlaidLink, onPlaidSuccess, polling,
    //    refresh / disconnect, connection rows) stays in place.
    await notify.alert({
      title: "Bank connections - coming soon",
      body:  "We're putting the finishing touches on secure bank connections through Plaid. This will let you link any of 12,000+ banks read-only and have transactions flow straight into Tweaxly. You'll see it appear here as soon as it's live.",
    });
  }

  async function onRefreshClick(conn: PlaidConnection) {
    if (busyId) return;
    setBusyId(conn.id);
    try {
      const res = await fetch("/api/integrations/plaid/sync", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ connectionId: conn.id }),
      });
      if (!res.ok) {
        await notify.alert("Couldn't start the refresh. Please try again.");
        return;
      }
      // Server flips status to "syncing" - our poller picks it up.
      setConnections((prev) => prev.map((c) => c.id === conn.id ? { ...c, status: "syncing" } : c));
    } finally {
      setBusyId(null);
    }
  }

  async function onDisconnectClick(conn: PlaidConnection) {
    if (busyId) return;
    const ok = await notify.confirm({
      title: "Disconnect this bank?",
      body:  `Disconnect ${conn.institutionName ?? "this institution"}? Tweaxly will stop importing new transactions. Historical data already imported stays.`,
      confirmLabel: "Disconnect",
      cancelLabel:  "Keep connected",
      danger:       true,
    });
    if (!ok) return;
    setBusyId(conn.id);
    try {
      const res = await fetch("/api/integrations/plaid/disconnect", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ connectionId: conn.id }),
      });
      if (!res.ok) {
        await notify.alert("Couldn't disconnect. Please try again.");
        return;
      }
      setConnections((prev) => prev.filter((c) => c.id !== conn.id));
    } finally {
      setBusyId(null);
    }
  }

  const hasConnections = connections.length > 0;

  return (
    <section className="card mb-6 overflow-hidden">
      <div className="flex items-start gap-4 flex-wrap">
        <span className="shrink-0 inline-flex w-11 h-11 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <Banknote size={20} strokeWidth={1.5} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-semibold text-slate-100">Bank connections</h2>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-good/40 bg-good/15 text-good font-semibold inline-flex items-center gap-1">
              <Lock size={10} /> Read-only · Sandbox
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300 leading-relaxed max-w-2xl">
            Securely connect a bank account through Plaid. Tweaxly only reads transactions and balances - we never store your credentials and we never move money.
          </p>
        </div>
        <button
          type="button"
          onClick={onConnectClick}
          disabled={tokenLoading}
          className="btn-primary text-sm shrink-0 inline-flex items-center gap-2 disabled:opacity-50"
        >
          {tokenLoading ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
          {hasConnections ? "Connect another bank" : "Connect bank account"}
        </button>
      </div>

      {tokenError ? (
        <div className="mt-4 rounded-md border border-bad/40 bg-bad/10 px-3 py-2.5 text-xs text-bad">
          {tokenError}
        </div>
      ) : null}

      {hasConnections ? (
        <div className="mt-5 space-y-3">
          {connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              busy={busyId === conn.id}
              onRefresh={() => onRefreshClick(conn)}
              onDisconnect={() => onDisconnectClick(conn)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-line/60 bg-ink-900/30 px-4 py-5 text-sm text-slate-300 leading-relaxed">
          <span className="font-medium text-slate-100">No banks connected yet.</span>{" "}
          Use Connect bank account above to securely link your first account through Plaid. Transactions flow into your dashboard, forecast, and AI consultation immediately.
        </div>
      )}
    </section>
  );
}

// ── Connection row ──────────────────────────────────────────────────

function ConnectionRow({
  conn, busy, onRefresh, onDisconnect,
}: {
  conn:         PlaidConnection;
  busy:         boolean;
  onRefresh:    () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-900/40 px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 size={16} className="text-slate-400 shrink-0" />
          <div className="text-sm font-medium text-slate-100 truncate">
            {conn.institutionName ?? "Linked institution"}
          </div>
          <StatusBadge status={conn.status} />
        </div>
        <div className="text-[11px] text-slate-500 ml-auto shrink-0">
          {conn.lastSyncCompletedAt
            ? `Last sync ${relTime(conn.lastSyncCompletedAt)}`
            : "Awaiting first sync"}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy || conn.status === "syncing"}
          title="Refresh data"
          aria-label="Refresh data"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-ink-700 transition disabled:opacity-40"
        >
          <RefreshCw size={14} className={conn.status === "syncing" ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={busy}
          title="Disconnect"
          aria-label="Disconnect"
          className="p-1.5 rounded-md text-slate-400 hover:text-bad hover:bg-bad/10 transition disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {conn.status === "error" && conn.lastError ? (
        <div className="mt-2 text-[11px] text-bad inline-flex items-center gap-1.5">
          <AlertTriangle size={11} /> {humanizePlaidError(conn.lastError)}
        </div>
      ) : null}

      {conn.accounts.length > 0 ? (
        <ul className="mt-3 divide-y divide-line/40">
          {conn.accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="text-slate-100 truncate">{a.name}</div>
                <div className="text-[11px] text-slate-500 capitalize">
                  {a.type.replace(/_/g, " ")}
                  {a.last4 ? ` · ••${a.last4}` : ""}
                </div>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <div className="text-slate-100">
                  {fmtMoney(a.currentBalance, a.currency)}
                </div>
                {a.availableBalance != null && a.availableBalance !== a.currentBalance ? (
                  <div className="text-[10px] text-slate-500">avail {fmtMoney(a.availableBalance, a.currency)}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : conn.status === "syncing" ? (
        <div className="mt-3 text-xs text-slate-400 inline-flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> Loading accounts and recent transactions…
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: PlaidConnection["status"] }) {
  const palette =
    status === "connected" ? { cls: "border-good/40 bg-good/15 text-good",  label: "Connected" }
  : status === "syncing"   ? { cls: "border-accent/40 bg-accent-soft text-accent", label: "Syncing" }
  : status === "error"     ? { cls: "border-bad/40 bg-bad/15 text-bad",     label: "Needs attention" }
  :                          { cls: "border-line bg-ink-700 text-slate-300", label: "Disconnected" };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${palette.cls}`}>
      {palette.label}
    </span>
  );
}

function fmtMoney(n: number | null, ccy: string): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ${ccy}`;
  }
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function humanizePlaidError(raw: string): string {
  // Strip Plaid's machine codes from anything we surface to the user.
  const lower = raw.toLowerCase();
  if (lower.includes("item_login_required")) return "Your bank needs you to sign in again. Click Refresh to re-link.";
  if (lower.includes("rate_limit"))          return "Too many requests just now - try again in a minute.";
  if (lower.includes("institution_down"))    return "Your bank is temporarily unavailable. We'll keep retrying.";
  return "Something went wrong syncing this bank. Please try again or reconnect.";
}
