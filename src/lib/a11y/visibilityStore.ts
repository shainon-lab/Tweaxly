// Visibility store for the accessibility widget inside the logged-in
// application.
//
// The marketing website + the unauthenticated auth flow (login,
// register, setup, onboarding) keep the floating widget on by default.
// The internal app surface (/dashboard, /settings, etc.) defaults to
// the widget being OFF and exposes a per-user toggle in Account
// Settings → Accessibility. When the toggle is ON, the widget renders
// as a sidebar nav item instead of a floating button.
//
// Persistence is per-browser via localStorage. A future enhancement
// (when we add server-side user preferences for a11y) can replace the
// localStorage layer without changing call sites.

const STORAGE_KEY = "a11yWidgetEnabled";
const EVENT_NAME  = "tweaxly-a11y-widget-toggled";

export type A11yWidgetState = {
  // True when the user has opted in to the accessibility widget in the
  // app. Default false per the onboarding-data spec.
  enabled: boolean;
};

export function readA11yWidgetEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setA11yWidgetEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  // Broadcast so any mounted listener can react without a reload.
  window.dispatchEvent(new CustomEvent<A11yWidgetState>(EVENT_NAME, {
    detail: { enabled: value },
  }));
}

// Subscribe to toggle changes. Returns an unsubscribe function.
export function onA11yWidgetToggle(
  handler: (state: A11yWidgetState) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = (e: Event) => handler((e as CustomEvent<A11yWidgetState>).detail);
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}

// Programmatically request the controlled widget dialog to open. The
// Widget component listens for this event when running in
// `mode="controlled"` (sidebar-driven, no FAB).
const OPEN_EVENT = "tweaxly-a11y-widget-open";

export function requestA11yWidgetOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onA11yWidgetOpenRequest(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
