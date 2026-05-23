"use client";

// Tiny client context so the BellButton (mounted inside the Sidebar)
// can trigger the NotificationCenter (mounted at the AppLayout root).
//
// Why: the Sidebar uses Tailwind's `transform` class for its mobile
// slide animation. A non-`none` transform creates a containing block
// for `position: fixed` descendants - so anything fixed-positioned
// inside the Sidebar gets clipped to the sidebar's 256px column.
// Mounting NotificationCenter outside the Sidebar avoids that trap.

import { createContext, useCallback, useContext, useState } from "react";

interface NotificationCenterCtx {
  open:     boolean;
  unread:   number;
  show:     () => void;
  hide:     () => void;
  setUnread: (n: number) => void;
}

const Ctx = createContext<NotificationCenterCtx | null>(null);

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const [open,   setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);
  const show = useCallback(() => setOpen(true),  []);
  const hide = useCallback(() => setOpen(false), []);
  return (
    <Ctx.Provider value={{ open, unread, show, hide, setUnread }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotificationCenter(): NotificationCenterCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotificationCenter must be used inside NotificationCenterProvider");
  return v;
}
