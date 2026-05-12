"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TriggeredAlert } from "@/lib/notificationsEval";

const LEVEL_PILL: Record<TriggeredAlert["level"], string> = {
  good: "pill-good",
  warn: "pill-warn",
  bad:  "pill-bad",
  info: "pill-accent",
};

export default function ThresholdAlertsBox({
  alerts,
  totalRules = 0,
  enabledRules = 0,
}: {
  alerts: TriggeredAlert[];
  totalRules?: number;
  enabledRules?: number;
}) {
  const hasAlerts = alerts.length > 0;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      // The transition flag drops naturally when the navigation finishes;
      // schedule a small delay to clear the spinner regardless of timing.
      setTimeout(() => setRefreshing(false), 600);
    });
  }

  return (
    <div className={`card mb-0 h-full flex flex-col ${hasAlerts ? "border-bad/40" : ""}`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {hasAlerts ? (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bad text-white text-[11px] font-bold">!</span>
          ) : null}
          <span className="text-base font-medium">Notifications Alerts</span>
          {hasAlerts ? (
            <span className="text-xs text-slate-400">{alerts.length} firing</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="btn-ghost">
            {hasAlerts ? "Manage notifications" : "Set notifications"}
          </Link>
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

      {hasAlerts ? (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.ruleId} className="flex items-start gap-3 border-l-2 border-bad/40 pl-3">
              <span className={LEVEL_PILL[a.level]}>{a.level}</span>
              <div className="min-w-0">
                <div className="font-medium text-sm">{a.headline}</div>
                <div className="text-xs text-slate-400 mt-0.5">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          {totalRules === 0 ? (
            <>
              <div className="text-sm font-medium text-slate-200 mb-1">No alerts firing</div>
              <div className="text-xs text-slate-400 max-w-xs">
                When a metric you&apos;re watching crosses a threshold (e.g. revenue drops 10% MoM, expenses rise above $5,000 QoQ), it&apos;ll show up here with the current value, the prior period, and the change.
                {" "}
                <Link href="/notifications" className="text-accent hover:underline">Set up your first notification →</Link>
              </div>
            </>
          ) : enabledRules === 0 ? (
            <>
              <div className="text-sm font-medium text-slate-200 mb-1">No active notifications</div>
              <div className="text-xs text-slate-400 max-w-xs">
                You have {totalRules} notification{totalRules === 1 ? "" : "s"} configured, but none are enabled right now.{" "}
                <Link href="/notifications" className="text-accent hover:underline">Enable a notification →</Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-200 mb-1">All clear</div>
              <div className="text-xs text-slate-400 max-w-xs">
                You have {enabledRules} active notification{enabledRules === 1 ? "" : "s"} — none have crossed their threshold yet.{" "}
                <Link href="/notifications" className="text-accent hover:underline">View notifications →</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
