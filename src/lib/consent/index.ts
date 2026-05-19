// Barrel export for the consent module.

export { ConsentProvider, useConsent } from "./provider";
export { default as ConsentBanner } from "./Banner";
export { default as PreferencesModal } from "./PreferencesModal";
export { default as PreferencesLink } from "./PreferencesLink";
export { CONSENT_INIT_SCRIPT } from "./init-script";

export {
  registerProvider, unregisterProvider, listProviders, isProviderLoaded,
} from "./registry";
export type { TrackingProvider } from "./registry";

export {
  CONSENT_VERSION, POLICY_VERSION, COOKIE_NAME, STORAGE_KEY,
  isGranted, isFresh,
} from "./types";
export type {
  ConsentState, ConsentCategory, OptionalCategory,
} from "./types";
