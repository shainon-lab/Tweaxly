"use client";

// Notification Center side panel (Phase 2 of Real-Time Business
// Alerts). Slides in from the right when the bell is clicked. Lists
// every AlertNotification for the current user, newest first, with:
//   • Unread/read state + mark-as-read + clear
//   • Severity badge (critical/important/info)
//   • Per-severity filter and per-business filter
//   • Mark-all-read shortcut
//   • Deep-link button that navigates to the alert's stored URL
//
// State is loaded via /api/alerts/inbox and refreshed when filters
// change. The bell badge polls /api/alerts/inbox/unread-count.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X as XIcon } from "lucide-react";
import LoadingBar from "@/components/LoadingBar";

interface InboxItem {
  id:           string;
  source:       "signal" | "monitor";
  sourceKey:    string;
  category:     string;
  severity:     "critical" | "important" | "info";
  title:        string;
  body:         string;
  deepLink:     string | null;
  readAt:       string | null;
  createdAt:    string;
  businessId:   string;
  businessName: string;
}

type SeverityFilter = "all" | "critical" | "important" | "info";

const SEVERITY_STYLE: Record<InboxItem["severity"], { dot: string; chip: string; label: string }> = {
  critical:  { dot: "bg-bad",    chip: "border-bad/40 bg-bad/15 text-bad",    label: "Critical" },
  important: { dot: "bg-warn",   chip: "border-warn/40 bg-warn/15 text-warn", label: "Important" },
  info:      { dot: "bg-accent", chip: "border-accent/40 bg-accent-soft/30 text-accent", label: "Info" },
};

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationCenter({
  open, onClose, onChangedUnread,
}: {
  open:    boolean;
  onClose: () => void;
  // Called whenever the inbox state changes in a way that affects
  // the unread count (mark read, clear, refresh) so the bell badge
  // can update without polling.
  onChangedUnread?: () => void;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [items,    setItems]    = useState<InboxItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [businessId, setBusinessId] = useState<string>("all");
  // Portal target - set after mount so SSR stays clean. The Sidebar
  // ancestor uses `transform`, which traps `position: fixed` children
  // inside its 256px box; rendering into document.body escapes that.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.body) }, []);

  // Pull the inbox whenever the panel opens or filters change.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (severity !== "all")  params.set("severity", severity);
      if (businessId !== "all") params.set("businessId", businessId);
      const res = await fetch(`/api/alerts/inbox?${params.toString()}`).catch(() => null);
      if (!res || !res.ok) { setLoading(false); return }
      const data = await res.json();
      if (!cancelled) {
        setItems(data.items as InboxItem[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [open, severity, businessId]);

  // ESC closes + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const businesses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const it of items) if (!seen.has(it.businessId)) seen.set(it.businessId, it.businessName);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    await fetch(`/api/alerts/inbox/${id}`, { method: "PATCH" });
    onChangedUnread?.();
  }

  async function clearOne(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/alerts/inbox/${id}`, { method: "DELETE" });
    onChangedUnread?.();
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    await fetch("/api/alerts/inbox/read-all", { method: "POST" });
    onChangedUnread?.();
  }

  async function openAlert(n: InboxItem) {
    if (!n.readAt) void markRead(n.id);
    if (n.deepLink) router.push(n.deepLink);
    onClose();
  }

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <aside
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 h-full w-full sm:w-[440px] bg-ink-900 border-l border-line shadow-2xl shadow-black/40 overflow-hidden flex flex-col animate-[slideInRight_220ms_ease-out]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line/60 flex items-center gap-3">
          <div className="font-semibold text-white">Notifications</div>
          <button
            type="button"
            onClick={markAllRead}
            className="ml-auto text-xs text-slate-400 hover:text-slate-100 transition"
            title="Mark every notification as read"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose() }}
            aria-label="Close"
            className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-ink-700 inline-flex items-center justify-center transition"
          >
            <XIcon size={16} strokeWidth={1.75} className="pointer-events-none" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-line/60 flex items-center gap-2 flex-wrap">
          <SeverityChips value={severity} onChange={setSeverity} />
          {businesses.length > 1 ? (
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="ml-auto input py-1 text-xs max-w-[180px]"
            >
              <option value="all">All workspaces</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          ) : null}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-4"><LoadingBar label="Loading notifications…" /></div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-sm font-semibold text-slate-200 mb-1">Nothing here yet</div>
              <div className="text-xs text-slate-400 max-w-xs mx-auto">
                Alerts that fire - AI signals, your monitors, weekly summaries - land in this inbox.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line/40">
              {items.map((n) => {
                const sev = SEVERITY_STYLE[n.severity];
                const unread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    className={`px-5 py-4 ${unread ? "bg-accent-soft/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${unread ? "bg-accent" : "bg-transparent"}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap text-[10px] uppercase tracking-[0.18em] font-semibold">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${sev.chip}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} aria-hidden="true" />
                            {sev.label}
                          </span>
                          <span className="text-slate-500 normal-case tracking-normal">
                            {n.businessName} · {relTime(n.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white leading-snug">{n.title}</div>
                        <div className="text-xs text-slate-300 mt-1 leading-snug">{n.body}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {n.deepLink ? (
                            <button
                              type="button"
                              onClick={() => openAlert(n)}
                              className="text-xs font-medium px-3 py-1 rounded-md border border-accent/40 text-accent hover:bg-accent-soft hover:text-white transition"
                            >
                              Open →
                            </button>
                          ) : null}
                          {unread ? (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="text-xs text-slate-400 hover:text-slate-100 px-2 py-1 rounded transition"
                            >
                              Mark as read
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => clearOne(n.id)}
                            className="text-xs text-slate-500 hover:text-slate-200 px-2 py-1 rounded transition ml-auto"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>,
    portalTarget,
  );
}

function SeverityChips({
  value, onChange,
}: {
  value:    SeverityFilter;
  onChange: (v: SeverityFilter) => void;
}) {
  const opts: { value: SeverityFilter; label: string }[] = [
    { value: "all",       label: "All" },
    { value: "critical",  label: "Critical" },
    { value: "important", label: "Important" },
    { value: "info",      label: "Info" },
  ];
  return (
    <div className="inline-flex items-center rounded-md border border-line/60 bg-ink-950/40 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded transition ${
            value === o.value
              ? "bg-accent-soft/50 text-accent"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
