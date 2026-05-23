"use client";

// Renders the NotificationCenter at the AppLayout root, OUTSIDE the
// Sidebar's transform containing block. Reads open/close state from
// NotificationCenterContext (driven by the BellButton).

import { useCallback } from "react";
import NotificationCenter from "./NotificationCenter";
import { useNotificationCenter } from "./NotificationCenterContext";

export default function NotificationCenterMount() {
  const { open, hide, setUnread } = useNotificationCenter();

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts/inbox/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.unread === "number") setUnread(data.unread);
    } catch { /* best-effort */ }
  }, [setUnread]);

  return (
    <NotificationCenter
      open={open}
      onClose={hide}
      onChangedUnread={refreshUnread}
    />
  );
}
