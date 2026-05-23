"use client";

// Bell icon for the top of the sidebar / app chrome. Polls the
// unread count every ~30s while mounted; clicking opens the
// NotificationCenter side panel.
//
// The actual NotificationCenter is mounted at the AppLayout root
// (see NotificationCenterMount) so it escapes the Sidebar's
// `transform` containing block. This bell just toggles + reflects
// the unread count via NotificationCenterContext.

import { useCallback, useEffect } from "react";
import { Bell as BellIcon } from "lucide-react";
import { useNotificationCenter } from "./NotificationCenterContext";

const POLL_MS = 30_000;

export default function BellButton({ className }: { className?: string }) {
  const { show, unread, setUnread } = useNotificationCenter();

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/alerts/inbox/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.unread === "number") setUnread(data.unread);
    } catch { /* best-effort */ }
  }, [setUnread]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(t);
  }, [refresh]);

  return (
    <button
      type="button"
      onClick={show}
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-ink-700 transition ${className ?? ""}`}
    >
      <BellIcon size={16} strokeWidth={1.75} className="pointer-events-none" />
      {unread > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-bad text-[10px] font-semibold text-white inline-flex items-center justify-center"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  );
}
