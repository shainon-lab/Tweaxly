// Consent Management Platform — shared types.
//
// Keep this file dependency-free; it's imported by server code
// (the cookies() reader in Next layouts) and client code (provider,
// banner, modal, registry) alike.

export type ConsentCategory =
  | "necessary"        // always on — auth, security, accessibility, locale
  | "analytics"        // GA, heatmaps, performance monitoring
  | "marketing"        // Meta Pixel, Google Ads, LinkedIn, TikTok
  | "personalization"; // AI optimization, adaptive recommendations

export type OptionalCategory = Exclude<ConsentCategory, "necessary">;

export interface ConsentState {
  necessary:        true;        // typed as literal — never disable-able
  analytics:        boolean;
  marketing:        boolean;
  personalization:  boolean;
  // Versioning lets us re-prompt users when categories or policy
  // material changes. Bump CONSENT_VERSION whenever we add/rename a
  // category; bump POLICY_VERSION when the Privacy Policy text changes
  // in a material way.
  consentVersion:   string;
  policyVersion:    string;
  consentTimestamp: string;      // ISO 8601 — when the user gave consent
  region:           string | null; // ISO 3166 country code if we know it
  // Tracks how the user landed on this state — useful for the audit
  // trail (did they Accept All, Reject Non-Essential, or hand-pick?).
  source:           "accept-all" | "reject-non-essential" | "custom" | "imported";
}

export const CONSENT_VERSION = "1.0";

// Bump this any time the Privacy Policy text materially changes so
// previously consented users get re-prompted. Currently aligned with
// the last-updated date on /privacy.
export const POLICY_VERSION  = "2026-05-19";

export const COOKIE_NAME    = "tweaxly_consent";
export const STORAGE_KEY    = "tweaxly:consent:v1";
// 13-month expiry — GDPR best-practice ceiling for consent records
// before re-prompting. Stored in seconds for the Set-Cookie header.
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 395;

export function defaultDeniedState(region: string | null = null): ConsentState {
  return {
    necessary:        true,
    analytics:        false,
    marketing:        false,
    personalization:  false,
    consentVersion:   CONSENT_VERSION,
    policyVersion:    POLICY_VERSION,
    consentTimestamp: new Date().toISOString(),
    region,
    source:           "custom",
  };
}

export function allGrantedState(region: string | null = null): ConsentState {
  return {
    ...defaultDeniedState(region),
    analytics:       true,
    marketing:       true,
    personalization: true,
    source:          "accept-all",
  };
}

export function rejectNonEssentialState(region: string | null = null): ConsentState {
  return {
    ...defaultDeniedState(region),
    source: "reject-non-essential",
  };
}

// Used by the registry — returns true iff the category is granted.
export function isGranted(s: ConsentState, c: ConsentCategory): boolean {
  return s[c] === true;
}

// True when the stored state is still valid against current versions.
// A stale record is treated as "no decision yet" and re-prompts.
export function isFresh(s: ConsentState | null): boolean {
  if (!s) return false;
  return s.consentVersion === CONSENT_VERSION && s.policyVersion === POLICY_VERSION;
}
