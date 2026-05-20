// Google Consent Mode v2 helper.
//
// GCM v2 wants two events: a default state (set BEFORE gtag.js loads -
// see init-script.ts), and an update event after the user makes a
// decision. We split this into two functions so the init script can
// emit the default and the provider can emit the update.
//
// Signals:
//   ad_storage           - cookies for ads/conversion
//   analytics_storage    - cookies for analytics (GA4)
//   ad_user_data         - sending user data to Google for ads
//   ad_personalization   - personalized advertising
//   security_storage     - always granted (necessary)
//   functionality_storage / personalization_storage - feature & preference cookies

import type { ConsentState } from "./types";

type GcmSignalValue = "granted" | "denied";

interface GcmConsentObject {
  ad_storage:               GcmSignalValue;
  analytics_storage:        GcmSignalValue;
  ad_user_data:             GcmSignalValue;
  ad_personalization:       GcmSignalValue;
  security_storage:         GcmSignalValue;
  functionality_storage:    GcmSignalValue;
  personalization_storage:  GcmSignalValue;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function stateToGcm(state: ConsentState): GcmConsentObject {
  const yn = (b: boolean): GcmSignalValue => (b ? "granted" : "denied");
  return {
    security_storage:        "granted",                 // necessary, always on
    functionality_storage:   yn(state.necessary),       // language / locale prefs
    personalization_storage: yn(state.personalization), // adaptive UI prefs
    analytics_storage:       yn(state.analytics),
    ad_storage:              yn(state.marketing),
    ad_user_data:            yn(state.marketing),
    ad_personalization:      yn(state.marketing),
  };
}

// Push a 'consent' / 'update' event into dataLayer. The init script
// has already pushed the 'default' = all denied. This update is what
// the user's decision turns into.
export function pushGcmUpdate(state: ConsentState): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const gcm = stateToGcm(state);
  // Use the function-style gtag if present, otherwise push directly.
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", gcm);
  } else {
    window.dataLayer.push(["consent", "update", gcm]);
  }
}
