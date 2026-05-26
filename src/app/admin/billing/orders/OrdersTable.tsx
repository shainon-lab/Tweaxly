"use client";

// Admin Orders table. Paginated + debounced email search. Reads from
// /api/admin/billing/orders (server reads local PolarOrder rows; no
// Polar API calls during page load).
//
// Per-row "Invoice" action proxies through the admin invoice endpoint
// which talks to Polar server-side - same UX states as the customer
// table (loading → generating → ready / error).

import { useEffect, useMemo, useState } from "react";

interface Order {
  id:                 string;
  polarOrderId:       string;
  polarOrderNumber:   string | null;
  polarCustomerId:    string | null;
  polarCustomerEmail: string | null;
  workspaceId:        string | null;
  workspaceName:      string;
  productName:        string | null;
  productType:        string;
  purchaseType:       string;
  creditsAmount:      number | null;
  amountCents:        number;
  currency:           string;
  status:             string;
  invoiceNumber:      string | null;
  invoiceGenerated:   boolean;
  createdAt:          string;
}

interface Pagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

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
  try {
    return new Intl.NumberFormat("en-US", {
      style:    "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit",  minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function OrdersTable() {
  const [search,     setSearch]     = useState("");
  const [debounced,  setDebounced]  = useState("");
  const [page,       setPage]       = useState(1);
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [downloading, setDownloading] = useState<Record<string, "loading" | "generating" | "error">>({});
  const [rowMessage,  setRowMessage]  = useState<Record<string, string>>({});

  // Debounce email search (300ms). Avoids pummelling the server while
  // the admin is mid-type.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const queryStr = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    params.set("page",  String(page));
    params.set("limit", "50");
    return params.toString();
  }, [debounced, page]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/billing/orders?${queryStr}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Couldn't load orders.");
        return;
      }
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch {
      setError("Network error - check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [queryStr]);

  async function downloadInvoice(orderId: string) {
    setDownloading((s) => ({ ...s, [orderId]: "loading" }));
    setRowMessage((s) => ({ ...s, [orderId]: "" }));
    try {
      const res  = await fetch(`/api/admin/billing/orders/${orderId}/invoice`);
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
      window.open(data.url, "_blank", "noopener,noreferrer");
      setDownloading((s) => { const n = { ...s }; delete n[orderId]; return n });
    } catch {
      setDownloading((s) => ({ ...s, [orderId]: "error" }));
      setRowMessage((s) => ({ ...s, [orderId]: "Network error." }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer email…"
          className="flex-1 min-w-[20rem] max-w-md text-sm px-3 py-2 rounded-md border border-line bg-ink-900/40 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <div className="text-xs text-slate-400">
          {pagination.total.toLocaleString()} order{pagination.total === 1 ? "" : "s"}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error} <button onClick={load} className="underline ml-2">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-ink-900/40 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line/60 bg-ink-950/30 px-4 py-8 text-center">
          <p className="text-sm text-slate-300">
            {debounced ? `No orders match "${debounced}".` : "No orders yet."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            New orders land here automatically once Polar fires its webhook.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-line overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-ink-900/60 text-left text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Order #</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const state    = downloading[o.id];
                  const msg      = rowMessage[o.id];
                  const badgeCls = PURCHASE_TONE[o.purchaseType] ?? PURCHASE_TONE.one_time_purchase;
                  const statusCls = STATUS_TONE[o.status] ?? "text-slate-300";
                  return (
                    <tr key={o.id} className="border-t border-line/40">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[10px] whitespace-nowrap" title={o.polarOrderId}>
                        {o.invoiceNumber ?? o.polarOrderNumber ?? o.polarOrderId.slice(0, 10) + "…"}
                      </td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                      <td className="px-3 py-2 text-slate-300 max-w-[14rem] truncate" title={o.polarCustomerEmail ?? ""}>
                        {o.polarCustomerEmail ?? " - "}
                        {o.polarCustomerId ? (
                          <div className="text-[9px] text-slate-500 font-mono truncate" title={o.polarCustomerId}>
                            {o.polarCustomerId.slice(0, 14)}…
                          </div>
                        ) : null}
                      </td>
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
                           :                          "Generate"}
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

          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-2 py-1 rounded-md border border-line hover:bg-ink-700/40 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2 py-1 rounded-md border border-line hover:bg-ink-700/40 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
