// Tweaxly Service Worker - Real-Time Business Alerts (Phase 1).
//
// Two responsibilities for now:
//   1. Receive Web Push payloads dispatched from the server and
//      surface them as native desktop notifications.
//   2. On click, focus an existing Tweaxly tab and navigate it to
//      the deep-link the alert carried (or open a new tab if none
//      is open).
//
// Caching, offline behaviour and other PWA features are intentionally
// not added here - this SW exists solely to power push.

const ICON_URL = "/icon.svg";

self.addEventListener("install", (event) => {
  // Activate as soon as the new SW is installed so notifications start
  // working without requiring a tab reload.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "Tweaxly", body: event.data.text() }; }

  const title = payload.title || "Tweaxly";
  const opts = {
    body:    payload.body || "",
    icon:    ICON_URL,
    badge:   ICON_URL,
    // Tag groups identical alerts in the OS tray so a refire replaces
    // (rather than stacks) the previous one. Severity-tagged when no
    // explicit tag was provided.
    tag:     payload.tag || `tweaxly-${payload.severity || "info"}`,
    // For critical alerts, ask the OS to keep the toast visible until
    // the user dismisses it - this is the "ring through" behaviour the
    // dispatcher relies on for cash-flow / forecast warnings.
    requireInteraction: payload.severity === "critical",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Prefer focusing an already-open Tweaxly tab and navigating it.
    for (const client of all) {
      try {
        if ("focus" in client && "navigate" in client) {
          await client.focus();
          await client.navigate(target);
          return;
        }
      } catch { /* fall through to openWindow */ }
    }
    await self.clients.openWindow(target);
  })());
});
