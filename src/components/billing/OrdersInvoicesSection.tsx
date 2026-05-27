"use client";

// Orders & Invoices section under Billing & Products.
//
// Renders the customer's billing history (every PolarOrder across the
// workspaces they can see) and exposes a per-row "Download invoice"
// action that proxies through our backend so the Polar API key + raw
// invoice URLs never reach the browser.
//
// States:
//   - loading: skeleton
//   - empty:   empty-state copy
//   - error:   inline error + retry
//   - ready:   table

import { useEffect, useState } from "react";

interface Order {
  id:               string;
  polarOrderId:     string;
  polarOrderNumber: string | null;
  workspaceId:      string | null;
  workspaceName:    string;
  productName:      string | null;
  productType:      string;
  purchaseType:     string;
  creditsAmount:    number | null;
  amountCents:      number;
  currency:         string;
  status:           string;
  invoiceNumber:    string | null;
  invoiceGenerated: boolean;
  createdAt:        string;
}

interface ApiResponse {
  orders: Order[];
}

// Display labels for purchaseType. Mapped to short badges in the
// table; unknown values render as-is so future additions surface
// without code changes (only the styling defaults).
const PURCHASE_LABEL: Record<string, string> = {
  new_subscription:   "NEW",
  renewal:            "RENEWAL",
  upgrade:            "UPGRADE",
  downgrade:          "DOWNGRADE",
  credits_purchase:   "CREDITS",
  one_time_purchase:  "ONE-TIME",
};

const PURCHASE_TONE: Record<string, string> = {
  new_subscription:   "bg-brand-purple/15 text-brand-purple border-brand-purple/30",
  renewal:            "bg-accent/15 text-accent border-accent/30",
  upgrade:            "bg-good/15 text-good border-good/30",
  downgrade:          "bg-warn/15 text-warn border-warn/30",
  credits_purchase:   "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  one_time_purchase:  "bg-slate-500/15 text-slate-300 border-slate-400/30",
};

const STATUS_TONE: Record<string, string> = {
  paid:               "text-good",
  pending:            "text-warn",
  refunded:           "text-slate-400",
  partially_refunded: "text-slate-400",
  void:               "text-bad",
};

function fmtMoneyCents(cents: number, currency: string): string {
  // The wider app uses whole-dollar formatting, but invoices need
  // sub-dollar precision for renewals + custom-pack prices. Use the
  // locale-default fraction digits so $14.00 and $14.99 both render
  // sensibly.
  try {
    return new Intl.NumberFormat("en-US", {
      style:    "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function OrdersInvoicesSection() {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [orders,   setOrders]   = useState<Order[]>([]);
  // Per-row download state - keyed by our PolarOrder.id.
  const [downloading, setDownloading] = useState<Record<string, "loading" | "generating" | "error">>({});
  const [rowMessage,  setRowMessage]  = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/orders");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Couldn't load billing history.");
      } else {
        const data: ApiResponse = await res.json();
        setOrders(data.orders);
      }
    } catch {
      setError("Network error - check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() }, []);

  async function downloadInvoice(orderId: string) {
    setDownloading((s) => ({ ...s, [orderId]: "loading" }));
    setRowMessage((s) => ({ ...s, [orderId]: "" }));
    try {
      const res  = await fetch(`/api/billing/orders/${orderId}/invoice`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 202 && data.status === "generating") {
        setDownloading((s) => ({ ...s, [orderId]: "generating" }));
        setRowMessage((s) => ({ ...s, [orderId]: "Generating, retry in a few seconds." }));
        return;
      }
      if (!res.ok || !data.url) {
        setDownloading((s) => ({ ...s, [orderId]: "error" }));
        setRowMessage((s) => ({ ...s, [orderId]: data.message ?? "Couldn't load invoice." }));
        return;
      }
      // window.open works for desktop + mobile; the browser handles
      // the PDF MIME type natively (download or in-tab preview).
      window.open(data.url, "_blank", "noopener,noreferrer");
      setDownloading((s) => { const n = { ...s }; delete n[orderId]; return n });
    } catch {
      setDownloading((s) => ({ ...s, [orderId]: "error" }));
      setRowMessage((s) => ({ ...s, [orderId]: "Network error." }));
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Orders &amp; Invoices</h2>
          <p className="mt-1 text-xs text-slate-400">
            Every subscription renewal and credit purchase across your workspaces.
            Download the Polar invoice PDF for any row below.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-[11px] px-2.5 py-1 rounded-md border border-line text-slate-300 hover:bg-ink-700/40 transition disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}{" "}
          <button onClick={load} className="underline ml-2">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-ink-900/40 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line/60 bg-ink-950/30 px-4 py-8 text-center">
          <p className="text-sm text-slate-300">No billing history yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Your subscriptions and credit purchases will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-line overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-ink-900/95 backdrop-blur text-left text-[10px] uppercase tracking-wider text-slate-400 sticky top-14 z-10">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Invoice #</th>
                <th className="px-3 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const state = downloading[o.id];
                const msg   = rowMessage[o.id];
                const badgeCls = PURCHASE_TONE[o.purchaseType] ?? PURCHASE_TONE.one_time_purchase;
                const statusCls = STATUS_TONE[o.status] ?? "text-slate-300";
                return (
                  <tr key={o.id} className="border-t border-line/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                    <td className="px-3 py-2 text-slate-300 max-w-[12rem] truncate" title={o.workspaceName}>
                      {o.workspaceName}
                    </td>
                    <td className="px-3 py-2 text-slate-300 max-w-[14rem] truncate" title={o.productName ?? ""}>
                      {o.productName ?? " - "}
                      {o.creditsAmount ? (
                        <span className="ml-1 text-slate-500">({o.creditsAmount.toLocaleString()} credits)</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-semibold tracking-wider ${badgeCls}`}>
                        {PURCHASE_LABEL[o.purchaseType] ?? o.purchaseType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-200 whitespace-nowrap">
                      {fmtMoneyCents(o.amountCents, o.currency)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap capitalize ${statusCls}`}>
                      {o.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap font-mono text-[10px]">
                      {o.invoiceNumber ?? " - "}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(o.id)}
                        disabled={state === "loading" || state === "generating"}
                        className="text-[11px] px-2 py-1 rounded-md border border-accent/40 text-accent hover:bg-accent/10 transition disabled:opacity-60"
                      >
                        {state === "loading"    ? "Loading…"
                         : state === "generating" ? "Generating…"
                         : o.invoiceGenerated     ? "Download PDF"
                         :                          "Generate invoice"}
                      </button>
                      {msg ? (
                        <div className={`mt-1 text-[10px] ${state === "error" ? "text-bad" : "text-slate-400"}`}>
                          {msg}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
