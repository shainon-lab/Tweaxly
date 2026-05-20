"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TriggeredAlert } from "@/lib/notificationsEval";
import NotificationsClient from "@/app/(app)/notifications/NotificationsClient";

type RuleRow = {
  id: string;
  metric: string;
  categoryId: string | null;
  categoryName: string | null;
  direction: string;
  thresholdType: string;
  thresholdValue: number;
  period: string;
  label: string | null;
  enabled: boolean;
  createdAt: string;
};

type CategoryRow = { id: string; name: string; kind: string };

const LEVEL_PILL: Record<TriggeredAlert["level"], string> = {
  good: "pill-good",
  warn: "pill-warn",
  bad:  "pill-bad",
  info: "pill-accent",
};

function relTime(d: Date | string | null): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function fmtTimestamp(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ThresholdAlertsBox({
  alerts,
  totalRules = 0,
  enabledRules = 0,
  rules = [],
  categories = [],
  currency = "USD",
}: {
  alerts: TriggeredAlert[];
  totalRules?: number;
  enabledRules?: number;
  rules?: RuleRow[];
  categories?: CategoryRow[];
  currency?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // "Monitor Events" toggle - when open, the full notification-rule
  // manager renders inline below the alerts card. Replaces the previous
  // "Manage notifications" Link to /notifications.
  const [eventsOpen, setEventsOpen] = useState(false);

  // Split into "New" (unacknowledged) and "Previous" (read but still firing).
  // Newest first by firstFiredAt within each section.
  const sortByFirstFired = (a: TriggeredAlert, b: TriggeredAlert) =>
    (b.firstFiredAt?.valueOf() ?? 0) - (a.firstFiredAt?.valueOf() ?? 0);
  const newAlerts      = alerts.filter((a) => a.acknowledgedAt == null).sort(sortByFirstFired);
  const previousAlerts = alerts.filter((a) => a.acknowledgedAt != null)
    .sort((a, b) => (b.acknowledgedAt?.valueOf() ?? 0) - (a.acknowledgedAt?.valueOf() ?? 0));
  const hasAny = alerts.length > 0;

  function refresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setRefreshing(false), 600);
    });
  }

  async function markRead(ruleId: string) {
    setBusyId(ruleId);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId, action: "ack" }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  function renderAlert(a: TriggeredAlert, opts: { showMarkRead: boolean }) {
    return (
      <div
        key={a.ruleId}
        className={`flex items-start gap-3 border-l-2 pl-3 py-2 ${
          opts.showMarkRead ? "border-bad/40" : "border-line"
        }`}
      >
        <span className={LEVEL_PILL[a.level]}>{a.level}</span>
        {/* Read-state tag: red Unread for new rows, green Read for the
            ones the user has acknowledged. */}
        {opts.showMarkRead ? (
          <span className="pill-bad shrink-0">Unread</span>
        ) : (
          <span className="pill-good shrink-0">Read</span>
        )}
        <div className="min-w-0 flex-1">
          <div className={`font-medium text-sm ${opts.showMarkRead ? "text-slate-100" : "text-slate-300"}`}>
            {a.headline}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{a.detail}</div>
          {/* New rows: just the appearance date. Previous rows: both -
              when it appeared and when it was marked read, side by side. */}
          {opts.showMarkRead ? (
            a.firstFiredAt ? (
              <div className="text-[11px] text-slate-500 mt-1" title={fmtTimestamp(a.firstFiredAt)}>
                Appeared {relTime(a.firstFiredAt)} · {fmtTimestamp(a.firstFiredAt)}
              </div>
            ) : null
          ) : (
            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {a.firstFiredAt ? (
                <span title={fmtTimestamp(a.firstFiredAt)}>
                  Appeared {relTime(a.firstFiredAt)} · {fmtTimestamp(a.firstFiredAt)}
                </span>
              ) : null}
              {a.acknowledgedAt ? (
                <span title={fmtTimestamp(a.acknowledgedAt)}>
                  Read {relTime(a.acknowledgedAt)} · {fmtTimestamp(a.acknowledgedAt)}
                </span>
              ) : null}
            </div>
          )}
        </div>
        {opts.showMarkRead ? (
          <button
            type="button"
            className="text-xs text-slate-300 hover:text-white border border-line rounded-md px-2 py-1 shrink-0 disabled:opacity-50"
            disabled={busyId === a.ruleId || pending}
            onClick={() => markRead(a.ruleId)}
          >
            {busyId === a.ruleId ? "Marking…" : "Mark as read"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
    <div className={`card mb-0 flex flex-col min-h-[280px] ${newAlerts.length > 0 ? "border-bad/40" : ""}`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {newAlerts.length > 0 ? (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-bad text-white text-[11px] font-bold leading-none"
              title={`${newAlerts.length} unread alert${newAlerts.length === 1 ? "" : "s"}`}
              aria-label={`${newAlerts.length} unread alerts`}
            >
              {newAlerts.length > 99 ? "99+" : newAlerts.length}
            </span>
          ) : null}
          <span className="text-base font-medium">Notifications Alerts</span>
          {newAlerts.length > 0 ? (
            <span className="text-xs text-slate-400">{newAlerts.length} new</span>
          ) : hasAny ? (
            <span className="text-xs text-slate-400">{previousAlerts.length} previous</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={eventsOpen ? "btn-ghost" : "btn-primary"}
            onClick={() => setEventsOpen((v) => !v)}
            aria-expanded={eventsOpen}
            title={eventsOpen ? "Hide the rule editor" : "Add or edit notification rules"}
          >
            {eventsOpen ? "Hide Monitor Events" : "Set Monitor Events"}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-line text-slate-300 hover:text-white hover:bg-ink-700 transition disabled:opacity-50"
            disabled={refreshing || pending}
            onClick={refresh}
            title="Re-evaluate threshold rules"
            aria-label="Re-evaluate threshold rules"
          >
            <RefreshIcon spinning={refreshing || pending} />
          </button>
        </div>
      </div>

      {hasAny ? (
        <div className="space-y-4">
          {/* New section */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
              New {newAlerts.length > 0 ? `· ${newAlerts.length}` : ""}
            </div>
            {newAlerts.length === 0 ? (
              <div className="text-xs text-slate-500 italic">
                Everything has been read. The badge is cleared.
              </div>
            ) : (
              <div className="space-y-2">
                {newAlerts.map((a) => renderAlert(a, { showMarkRead: true }))}
              </div>
            )}
          </div>

          {/* Previous section */}
          {previousAlerts.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
                Previous · {previousAlerts.length}
              </div>
              <div className="space-y-2">
                {previousAlerts.map((a) => renderAlert(a, { showMarkRead: false }))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          {totalRules === 0 ? (
            <>
              <div className="text-base font-medium text-slate-100 mb-2">No notifications set yet</div>
              <div className="text-sm text-slate-400 max-w-md leading-relaxed mb-4">
                You haven&apos;t set up any threshold notifications. Add your first one to get alerted when revenue, expenses, net profit, or any category crosses a limit (e.g. revenue drops 10% MoM, expenses rise above $5,000 QoQ).
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setEventsOpen(true)}
              >
                Set up your first notification
              </button>
            </>
          ) : enabledRules === 0 ? (
            <>
              <div className="text-sm font-medium text-slate-200 mb-1">No active notifications</div>
              <div className="text-xs text-slate-400 max-w-xs">
                You have {totalRules} notification{totalRules === 1 ? "" : "s"} configured, but none are enabled right now.{" "}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => setEventsOpen(true)}
                >
                  Enable a notification →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-200 mb-1">All clear</div>
              <div className="text-xs text-slate-400 max-w-xs">
                You have {enabledRules} active notification{enabledRules === 1 ? "" : "s"} - none have crossed their threshold yet.{" "}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => setEventsOpen(true)}
                >
                  View notifications →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>

    {/* Monitor Events - the notification-rule manager. Toggled inline
        below the alerts card so the user can add/edit/disable rules
        without leaving the Monitor sub-tab. */}
    {eventsOpen ? (
      <div className="mt-6 card border-accent/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-semibold text-slate-100">Monitor Events</div>
            <div className="text-xs text-slate-400">
              Pick the metrics you want watched and what should trigger a notification.
            </div>
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-200"
            onClick={() => setEventsOpen(false)}
            aria-label="Close Monitor Events"
          >
            ✕ Hide
          </button>
        </div>
        <NotificationsClient
          currency={currency}
          initialRules={rules}
          categories={categories}
        />
      </div>
    ) : null}
    </>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
