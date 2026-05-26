"use client";

// Single component that decides how (or whether) to render the
// accessibility widget across the app's surfaces:
//
//   - Public / auth surfaces (everything OUTSIDE /dashboard, /settings,
//     /account, /forecast, /consultation, etc.) → FAB mode, same as
//     the marketing site would do.
//   - Logged-in app surfaces (anything under /(app)) → controlled mode
//     when the user has enabled the widget toggle in Account Settings
//     → Accessibility; otherwise the widget is fully absent (no FAB,
//     no dialog mounted) so the workspace stays clean and
//     productivity-focused.
//
// The choice is path-based because the root layout wraps both the
// auth flow (/login, /register, /setup, /onboarding) and the app
// shell. We sniff the path on the client to avoid a server/client
// hydration mismatch around localStorage.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AccessibilityWidget from "./Widget";
import { onA11yWidgetToggle, readA11yWidgetEnabled } from "./visibilityStore";

// Path prefixes that count as "inside the app" — anything matching
// gets the controlled-mode widget (or no widget at all). Keep this in
// sync with the (app) route group in src/app/(app)/.
const APP_PATH_PREFIXES = [
  "/dashboard", "/signals", "/business-signals",
  "/forecast", "/workforce", "/employees",
  "/consultation",
  "/data", "/data-log", "/data-flow",
  "/manual-data", "/sources", "/transactions", "/integration",
  "/insights", "/report", "/notifications",
  "/settings", "/account", "/workspaces",
  "/rules", "/admin",
];

function isAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AccessibilityWidgetGate() {
  const pathname = usePathname();
  const inApp = isAppPath(pathname);

  // Re-evaluate when the user toggles the preference in Account
  // Settings → Accessibility (or any other tab that flips the store).
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(readA11yWidgetEnabled());
    return onA11yWidgetToggle(({ enabled }) => setEnabled(enabled));
  }, []);

  // Auth / public surfaces keep the existing FAB-on-by-default
  // behavior — nothing inside the app gating story.
  if (!inApp) return <AccessibilityWidget mode="fab" />;

  // Inside the app: only mount the (controlled) widget when the user
  // has explicitly opted in via Account Settings. When OFF, the
  // widget is fully absent — no DOM, no listeners, no sidebar item.
  if (!enabled) return null;
  return <AccessibilityWidget mode="controlled" />;
}
