"use client";

// Account → Notifications. Per-user × per-business settings for
// Real-Time Business Alerts (Phase 1).
//
//   • Workspace picker at the top (settings are scoped per business)
//   • General delivery channels (push / in-app / email)
//   • Per-category toggles
//   • Sensitivity selector
//   • Quiet hours + daily limit
//   • "Send test alert" button to verify desktop push works end-to-end
//
// Push is Premium-only - Free workspaces see the toggle locked with
// an UpgradeModal trigger.

import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingBar from "@/components/LoadingBar";
import UpgradeTriggerButton from "@/components/billing/UpgradeTriggerButton";
import {
  ALERT_CATEGORIES, SENSITIVITY_OPTIONS,
  type AlertCategory, type AlertSensitivity,
} from "@/lib/alerts/types";
import type { WorkspaceCardData } from "../workspaces/WorkspaceCard";

interface Prefs {
  pushEnabled:        boolean;
  inAppEnabled:       boolean;
  emailEnabled:       boolean;
  categories:         Record<string, boolean>;
  sensitivity:        AlertSensitivity;
  quietHoursEnabled:  boolean;
  quietHoursStart:    string | null;
  quietHoursEnd:      string | null;
  quietHoursTimezone: string | null;
  criticalBypass:     boolean;
  dailyLimit:         number;
}

// Helper: URL-safe-base64 → Uint8Array (Web Push subscribe API wants
// the VAPID public key in that exact shape).
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationsPane({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  // Workspaces selector: default to the current one (the only entry
  // with isCurrent=true on the WorkspaceCardData array).
  const initialBiz = workspaces.find((w) => w.isCurrent) ?? workspaces[0];
  const [businessId, setBusinessId] = useState<string>(initialBiz?.id ?? "");

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [prefs,    setPrefs]    = useState<Prefs | null>(null);
  const [premium,  setPremium]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  // Detect browser support + current permission on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Load prefs whenever the user picks a different workspace.
  const loadPrefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/alerts/preferences");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't load preferences.");
        return;
      }
      setPrefs(data.prefs);
      setPremium(!!data.premium);
    } finally {
      setLoading(false);
    }
  }, []);
  // The API resolves the workspace from the session cookie; if the
  // user changes the selector we POST a workspace switch first.
  useEffect(() => {
    if (!businessId) return;
    if (initialBiz && initialBiz.id === businessId) {
      void loadPrefs();
      return;
    }
    (async () => {
      await fetch("/api/businesses/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body:   JSON.stringify({ businessId }),
      }).catch(() => {});
      await loadPrefs();
    })();
  }, [businessId, loadPrefs, initialBiz]);

  // ── Push enable / disable flow ──────────────────────────────────
  const [pushBusy, setPushBusy] = useState(false);

  async function enablePush() {
    setPushBusy(true);
    setError(null);
    try {
      if (permission === "unsupported") {
        setError("This browser doesn't support desktop push notifications.");
        return;
      }
      // 1. Ask the OS / browser for permission if needed.
      let perm = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== "granted") {
        setError("Desktop notifications are disabled in your browser. You'll still receive alerts inside Tweaxly.");
        await patchPrefs({ pushEnabled: false });
        return;
      }
      // 2. Pull the VAPID public key from the server.
      const vapidRes = await fetch("/api/alerts/vapid-key");
      const vapid    = await vapidRes.json();
      if (!vapidRes.ok || !vapid.publicKey) {
        setError("Push isn't enabled on this server yet. Contact support@tweaxly.com.");
        return;
      }
      // 3. Register the SW + subscribe.
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // The TS lib's narrow BufferSource type rejects Uint8Array<ArrayBufferLike>
        // here even though it works at runtime. Cast through unknown.
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey) as unknown as BufferSource,
      });
      // 4. Persist the subscription server-side.
      const subRaw = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const reqRes = await fetch("/api/alerts/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body:   JSON.stringify({
          endpoint:  subRaw.endpoint,
          keys:      subRaw.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!reqRes.ok) {
        const d = await reqRes.json().catch(() => ({} as { message?: string }));
        setError(d.message ?? "Couldn't register your device. Try again.");
        return;
      }
      await patchPrefs({ pushEnabled: true });
    } catch (e) {
      console.error("[notifications] enable push failed", e);
      setError("Couldn't enable push notifications. Try again in a moment.");
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    setPushBusy(true);
    setError(null);
    try {
      // Unsubscribe at the browser level + tell the server to forget.
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        try { await sub.unsubscribe() } catch { /* best-effort */ }
        await fetch("/api/alerts/subscriptions", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      await patchPrefs({ pushEnabled: false });
    } finally {
      setPushBusy(false);
    }
  }

  async function patchPrefs(partial: Partial<Prefs>) {
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/alerts/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body:   JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't save.");
        return;
      }
      setPrefs(data.prefs);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setError(null);
    const res = await fetch("/api/alerts/test", { method: "POST" });
    const data = await res.json().catch(() => ({} as { message?: string; sent?: number }));
    if (!res.ok) {
      setError(data.message ?? "Could not send test.");
      return;
    }
    if (data.sent === 0) {
      setError("No device subscriptions yet - enable push above first.");
    }
  }

  function toggleCategory(key: AlertCategory) {
    if (!prefs) return;
    const next = { ...prefs.categories, [key]: !prefs.categories[key] };
    void patchPrefs({ categories: next });
  }

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone }
    catch { return null }
  }, []);

  if (loading || !prefs) {
    return (
      <div className="card">
        <LoadingBar label="Loading your notification preferences…" />
      </div>
    );
  }

  const pushLocked = !premium;

  return (
    <div className="space-y-6">
      {/* Workspace picker */}
      {workspaces.length > 1 ? (
        <div className="card">
          <div className="font-medium mb-1">Workspace</div>
          <div className="text-xs text-slate-400 mb-3">
            Notification settings are saved per workspace - pick the one to configure.
          </div>
          <select
            className="input max-w-md"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      ) : null}

      {/* General delivery */}
      <div className="card">
        <div className="font-medium mb-1">General</div>
        <div className="text-xs text-slate-400 mb-4">
          Choose which channels carry alerts. Desktop push delivers in real time;
          in-app notifications always appear in the Notification Center.
        </div>

        <div className="space-y-3">
          <Toggle
            label="Desktop push notifications"
            helper={
              permission === "unsupported"
                ? "Not supported in this browser."
                : permission === "denied"
                ? "Blocked in browser settings. Re-enable in your browser to use this."
                : pushLocked
                ? "Pro feature - Free workspaces see alerts inside Tweaxly only."
                : "Receive real-time alerts even when Tweaxly isn't open."
            }
            value={prefs.pushEnabled}
            disabled={permission === "unsupported" || pushLocked || pushBusy}
            // The toggle itself flips state via enablePush() so the
            // browser permission + subscription flow runs together.
            onChange={(v) => v ? enablePush() : disablePush()}
            trailing={pushLocked ? (
              <UpgradeTriggerButton
                feature="Real-Time Business Alerts"
                benefits={[
                  "Desktop push notifications when critical signals fire",
                  "Custom business monitors with severity routing",
                  "Quiet hours, daily limit and per-category controls",
                  "Plus everything else on Pro",
                ]}
                className="text-xs px-3 py-1 rounded-md border border-accent/40 text-accent hover:bg-accent-soft transition"
              >
                Upgrade →
              </UpgradeTriggerButton>
            ) : (
              prefs.pushEnabled ? (
                <button
                  type="button"
                  onClick={sendTest}
                  className="text-xs px-3 py-1 rounded-md border border-line text-slate-200 hover:text-white hover:border-slate-500 transition"
                >
                  Send test alert
                </button>
              ) : null
            )}
          />
          <Toggle
            label="In-app notifications"
            helper="The bell-icon Notification Center in the top nav (always available)."
            value={prefs.inAppEnabled}
            onChange={(v) => patchPrefs({ inAppEnabled: v })}
          />
          <Toggle
            label="Email fallback notifications"
            helper="Critical alerts go to your account email when push isn't available."
            value={prefs.emailEnabled}
            onChange={(v) => patchPrefs({ emailEnabled: v })}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="font-medium mb-1">Notification categories</div>
        <div className="text-xs text-slate-400 mb-4">
          Choose which kinds of alerts you want to hear about. Critical signals
          (cash flow risk, severe drops) always fire regardless of category toggles.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALERT_CATEGORIES.map((c) => {
            const on = !!prefs.categories[c.value];
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCategory(c.value as AlertCategory)}
                className={`text-left px-4 py-3 rounded-lg border transition ${
                  on
                    ? "border-accent/50 bg-accent-soft/15"
                    : "border-line bg-ink-950/40 hover:border-accent/30 hover:bg-ink-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{c.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-snug">{c.helper}</div>
                  </div>
                  <div className={`shrink-0 mt-0.5 w-9 h-5 rounded-full transition ${on ? "bg-accent" : "bg-ink-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${on ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sensitivity */}
      <div className="card">
        <div className="font-medium mb-1">Sensitivity</div>
        <div className="text-xs text-slate-400 mb-4">
          How proactive should Tweaxly be? Recommended: Balanced.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SENSITIVITY_OPTIONS.map((s) => {
            const on = prefs.sensitivity === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => patchPrefs({ sensitivity: s.value as AlertSensitivity })}
                className={`text-left px-4 py-3 rounded-lg border transition ${
                  on
                    ? "border-accent/60 bg-accent-soft/20 text-white"
                    : "border-line bg-ink-950/40 text-slate-300 hover:border-accent/40 hover:bg-ink-900/60"
                }`}
              >
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{s.helper}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="card">
        <div className="font-medium mb-1">Quiet hours</div>
        <div className="text-xs text-slate-400 mb-4">
          Non-critical alerts wait until the window ends.
          {detectedTz ? <> Detected timezone: <span className="text-slate-200">{detectedTz}</span>.</> : null}
        </div>
        <Toggle
          label="Enable quiet hours"
          value={prefs.quietHoursEnabled}
          onChange={(v) => patchPrefs({ quietHoursEnabled: v, quietHoursTimezone: detectedTz ?? prefs.quietHoursTimezone })}
        />
        {prefs.quietHoursEnabled ? (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Quiet starts</label>
                <input
                  type="time"
                  className="input"
                  value={prefs.quietHoursStart ?? "22:00"}
                  onChange={(e) => patchPrefs({ quietHoursStart: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Quiet ends</label>
                <input
                  type="time"
                  className="input"
                  value={prefs.quietHoursEnd ?? "07:00"}
                  onChange={(e) => patchPrefs({ quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4">
              <Toggle
                label="Critical alerts bypass quiet hours"
                helper="Cash-flow risk + forecast negative-balance warnings ring through even during quiet hours."
                value={prefs.criticalBypass}
                onChange={(v) => patchPrefs({ criticalBypass: v })}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Daily limit */}
      <div className="card">
        <div className="font-medium mb-1">Daily limit</div>
        <div className="text-xs text-slate-400 mb-4">
          The dispatcher will never deliver more than this many notifications per
          day for this workspace. Excess alerts collapse into a single summary.
        </div>
        <input
          type="number"
          min={1}
          max={100}
          className="input max-w-[100px] tabular-nums"
          value={prefs.dailyLimit}
          onChange={(e) => {
            const n = Math.max(1, Math.min(100, Number(e.target.value) || 1));
            patchPrefs({ dailyLimit: n });
          }}
        />
      </div>

      {error ? <div className="text-sm text-bad">{error}</div> : null}
      {saving ? <div className="text-xs text-slate-500">Saving…</div> : null}
      {savedFlash ? <div className="text-xs text-good">Saved ✓</div> : null}
    </div>
  );
}

function Toggle({
  label, helper, value, onChange, disabled, trailing,
}: {
  label:    string;
  helper?:  string;
  value:    boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition ${value ? "bg-accent" : "bg-ink-700"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        aria-pressed={value}
        aria-label={label}
      >
        <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${value ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-100">{label}</div>
        {helper ? <div className="text-xs text-slate-400 mt-0.5 leading-snug">{helper}</div> : null}
      </div>
      {trailing ? <div className="shrink-0 sm:ml-auto">{trailing}</div> : null}
    </div>
  );
}
