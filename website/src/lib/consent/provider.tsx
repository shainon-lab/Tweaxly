"use client";

// Consent provider. Holds the current ConsentState, exposes the API
// to update it, and dispatches changes to:
//   - storage (cookie + localStorage)
//   - the tracking-provider registry (load/unload scripts)
//   - Google Consent Mode v2 (gtag update)
//
// The banner / modal subscribe via the useConsent() hook. The footer
// link calls the openPreferences() trigger to re-prompt at any time.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import {
  type ConsentCategory, type ConsentState,
  CONSENT_VERSION, POLICY_VERSION,
  defaultDeniedState, allGrantedState, rejectNonEssentialState, isFresh,
} from "./types";
import { readConsent, writeConsent } from "./storage";
import { applyConsent } from "./registry";
import { pushGcmUpdate } from "./gcm";

export type UpdateInput = Partial<Pick<ConsentState,
  "analytics" | "marketing" | "personalization"
>>;

interface ConsentCtx {
  state:           ConsentState | null;  // null = no decision yet
  hasDecided:      boolean;
  isPrefsOpen:     boolean;
  acceptAll:       () => void;
  rejectNonEssential: () => void;
  updateCategories:(input: UpdateInput, source?: ConsentState["source"]) => void;
  openPreferences: () => void;
  closePreferences:() => void;
  withdrawAll:     () => void;
  // Used by the banner to know whether to show itself.
  needsBanner:     boolean;
}

const Ctx = createContext<ConsentCtx | null>(null);

interface Props {
  children: React.ReactNode;
  // Optional — if the server already knows the user's region from a
  // CDN header, pass it down so the first persisted record includes it.
  region?: string | null;
}

export function ConsentProvider({ children, region = null }: Props) {
  const [state, setState] = useState<ConsentState | null>(null);
  const [isPrefsOpen, setPrefsOpen] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from cookie/storage on mount. If the existing record is
  // stale (versions changed), treat as no decision and re-prompt.
  useEffect(() => {
    const stored = readConsent();
    if (isFresh(stored)) {
      setState(stored);
      // Re-apply to the registry on every mount so scripts get
      // injected into freshly loaded pages.
      void applyConsent(stored!);
    }
    hydrated.current = true;
  }, []);

  // Persist + propagate on every change.
  useEffect(() => {
    if (!hydrated.current || !state) return;
    writeConsent(state);
    void applyConsent(state);
    pushGcmUpdate(state);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.consent = "given";
    }
  }, [state]);

  const commit = useCallback((next: ConsentState) => {
    setState({ ...next, region: next.region ?? region });
  }, [region]);

  const acceptAll          = useCallback(() => { commit(allGrantedState(region)); setPrefsOpen(false); }, [commit, region]);
  const rejectNonEssential = useCallback(() => { commit(rejectNonEssentialState(region)); setPrefsOpen(false); }, [commit, region]);
  const withdrawAll        = useCallback(() => commit(rejectNonEssentialState(region)), [commit, region]);

  const updateCategories = useCallback<ConsentCtx["updateCategories"]>(
    (input, source = "custom") => {
      const base: ConsentState = state ?? defaultDeniedState(region);
      commit({
        ...base,
        analytics:       input.analytics       ?? base.analytics,
        marketing:       input.marketing       ?? base.marketing,
        personalization: input.personalization ?? base.personalization,
        consentTimestamp: new Date().toISOString(),
        consentVersion:   CONSENT_VERSION,
        policyVersion:    POLICY_VERSION,
        source,
      });
    },
    [state, commit, region]
  );

  const value = useMemo<ConsentCtx>(() => ({
    state,
    hasDecided:  !!state,
    isPrefsOpen,
    acceptAll,
    rejectNonEssential,
    updateCategories,
    openPreferences:  () => setPrefsOpen(true),
    closePreferences: () => setPrefsOpen(false),
    withdrawAll,
    needsBanner: hydrated.current ? !state : false,
  }), [state, isPrefsOpen, acceptAll, rejectNonEssential, updateCategories, withdrawAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConsent must be used inside <ConsentProvider>");
  return v;
}

// Type-only re-export so consumers don't need to import from ./types.
export type { ConsentCategory, ConsentState };
