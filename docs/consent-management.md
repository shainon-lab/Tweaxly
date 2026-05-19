# Consent Management Platform (CMP)

Production-grade consent infrastructure shipped across both the marketing site and the authenticated product app.

- **Module locations:** `website/src/lib/consent/` and `src/lib/consent/` (kept in sync).
- **Persistence:** cookie `tweaxly_consent` (canonical) + `localStorage` mirror.
- **Cookie scope:** `.tweaxly.com` in production so the user's choice is shared between `tweaxly.com` (marketing) and `app.tweaxly.com` (product). Host-only on `localhost` and preview URLs.
- **Cookie expiry:** 13 months (GDPR best practice).
- **Versioning:** `consentVersion` and `policyVersion` are baked into the stored record. Bump them to force re-prompt.
- **Google Consent Mode v2:** Default-denied state is set BEFORE first paint by the inline init script. Update events are pushed when the user makes a choice.

---

## 1. Architecture

```
ConsentProvider                 ← React context, holds state, propagates changes
   ├── storage (cookie + LS)    ← canonical persistence
   ├── registry                 ← TrackingProvider entries (GA, Meta, etc.)
   └── gcm                      ← Google Consent Mode v2 update dispatch

CONSENT_INIT_SCRIPT             ← inline <head> script:
                                   • installs dataLayer + gtag()
                                   • sets GCM v2 defaults = denied
                                   • reads existing cookie and emits update
                                   • sets <html data-consent="given|needed">

ConsentBanner                   ← bottom banner (renders when needsBanner)
PreferencesModal                ← full preferences dialog (a11y modal)
PreferencesLink                 ← inline trigger for footers / settings
```

## 2. Categories

| Key              | Always on | Examples                                              |
|------------------|-----------|-------------------------------------------------------|
| `necessary`      | yes       | auth, session, CSRF, locale, accessibility prefs      |
| `analytics`      | no        | GA4, heatmaps, performance monitoring                 |
| `marketing`      | no        | Meta Pixel, Google Ads, LinkedIn, TikTok, remarketing |
| `personalization`| no        | adaptive onboarding, AI optimization, preference store|

`necessary` is typed as a literal `true` in `ConsentState` so the type system itself prevents disabling it.

## 3. Adding a new tracking provider

The registry is the only place you should integrate a tracking script.

```ts
// app/_tracking/ga.client.ts (example)
"use client";
import { useEffect } from "react";
import { registerProvider } from "@/lib/consent";

export function RegisterGA() {
  useEffect(() => {
    registerProvider({
      id: "ga4",
      name: "Google Analytics 4",
      category: "analytics",
      load: () => {
        if (document.getElementById("ga4-script")) return;
        const s = document.createElement("script");
        s.id = "ga4-script";
        s.async = true;
        s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
        document.head.appendChild(s);
        window.gtag?.("js", new Date());
        window.gtag?.("config", "G-XXXXXXX");
      },
      unload: () => {
        // Best-effort: drop the script tag. Cookies are already
        // suppressed by GCM update — analytics_storage=denied.
        document.getElementById("ga4-script")?.remove();
      },
    });
  }, []);
  return null;
}
```

Then mount `<RegisterGA />` once inside `ConsentProvider`. The provider's `applyConsent` runs on every consent change and will call `load()` only when the category is granted, and `unload()` only when it's withdrawn.

### Rules

- **Never inline a third-party `<script src>` for analytics/marketing.** It bypasses the gate. Always go through `registerProvider`.
- **`load()` may run multiple times** in dev/HMR — guard with `document.getElementById` or a module-scoped flag.
- **`unload()` is best-effort.** Cookies the script already wrote are not removed automatically; deletion is the script's responsibility (or the user's via browser settings). The GCM `update` event signals subsequent calls that storage is denied — Google-family tags self-throttle from that point on.

## 4. Google Consent Mode v2 signals

The init script declares default-denied for:

- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`
- `personalization_storage`

And default-granted for:

- `security_storage`
- `functionality_storage`

When the user makes a choice, the `pushGcmUpdate(state)` call maps:

| Category granted   | Signal flipped to `granted`                                         |
|--------------------|---------------------------------------------------------------------|
| `analytics`        | `analytics_storage`                                                 |
| `marketing`        | `ad_storage`, `ad_user_data`, `ad_personalization`                  |
| `personalization`  | `personalization_storage`                                           |

`wait_for_update: 500` is set in the default so any GA tag that loads in those first 500ms will pause until the update arrives — important on first-decision pageloads.

## 5. Consent withdrawal

Three entry points:

1. **Footer link** — `<PreferencesLink>` opens the modal anywhere.
2. **Anywhere in the app** — call `const { openPreferences } = useConsent()` and trigger from a settings page.
3. **Programmatic withdrawal** — `useConsent().withdrawAll()` reverts to "reject non-essential".

The modal lets the user re-grant or further restrict. Save persists immediately.

## 6. Audit trail / logging

Each persisted record contains:

- `consentTimestamp` — ISO 8601, set at decision time
- `consentVersion` — the CMP schema version
- `policyVersion` — the Privacy Policy version the user consented against
- `region` — ISO 3166 country code from the CDN at decision time
- `source` — `"accept-all" | "reject-non-essential" | "custom" | "imported"`

This is the audit record. For server-side logging you can read the cookie in any API route or server component (`cookies().get("tweaxly_consent")`) and write it to your audit store.

## 7. Regional architecture

The schema is region-aware (`state.region`) so per-region gating can be layered on. For example, a future check:

```ts
// pseudo: only auto-show the banner inside EEA/UK
const REQUIRES_OPT_IN = new Set(["DE", "FR", "IT", "ES", "GB", /* … */]);
const needsExplicitConsent = state?.region && REQUIRES_OPT_IN.has(state.region);
```

`needsExplicitConsent` would flip the default UX: outside the EEA you might show a slimmer notice rather than a blocking banner. The provider doesn't enforce this today — it always shows the banner — but the data is captured.

## 8. Versioning policy

Bump `CONSENT_VERSION` in `types.ts` when you add/rename/remove a category. Bump `POLICY_VERSION` when the Privacy Policy text materially changes. Any stale record fails the `isFresh` check and the banner re-prompts.

Aligned default: `POLICY_VERSION = "2026-05-19"` (matches the `Last Updated` date on `/privacy`).

## 9. Accessibility

- Banner uses `role="dialog"` with `aria-labelledby` + `aria-describedby`; `aria-modal="false"` because it doesn't trap.
- Preferences modal uses `role="dialog"` + `aria-modal="true"`; focus moves in on open, traps within, returns to trigger on close. ESC closes.
- Category toggles use `role="switch"` + `aria-checked`. Locked (necessary) toggles use `disabled` + a visible "Always active" pill.
- All buttons have visible focus rings; the focus ring color (`#a78bfa`) passes 3:1 against the dark surface.

## 10. Testing checklist

Before any deploy that touches the consent system:

- [ ] First visit shows the banner. Reject Non-Essential closes it and the cookie is written with `marketing: false, analytics: false, personalization: false`.
- [ ] Accept All closes the banner and the cookie reflects all three granted.
- [ ] Reopen via footer link — the modal shows current state correctly.
- [ ] Toggling a category and clicking Save updates the cookie immediately.
- [ ] Inspect `window.dataLayer` — the last entry is a `consent`/`update` with values matching the user's choice.
- [ ] Cookie value is base64-decodable into JSON with current versions.
- [ ] Bump `POLICY_VERSION` in a test — banner reappears on next page load.
- [ ] Modal is keyboard-only operable (Tab, Shift+Tab, ESC, Enter on buttons).
- [ ] Screen reader announces dialog title on open.
- [ ] No GA/Meta/Ads request fires in DevTools Network until the user grants analytics/marketing.
