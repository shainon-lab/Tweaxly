"use client";

// Accessibility provider. Holds the user's a11y preferences, persists
// them to localStorage, and mirrors them onto <html> as data-a11y-*
// attributes so the global CSS in a11y.css can apply visual changes
// without any per-component re-renders.
//
// The reason we set data attributes on <html> (not className) is that
// it composes cleanly with the existing data-theme="light|dark" toggle
// - both can coexist and CSS can target them together.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { A11Y_STORAGE_KEY, DEFAULT_PREFS, type A11yPrefs } from "./types";

interface A11yCtx {
  prefs: A11yPrefs;
  set:   <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => void;
  reset: () => void;
}

const Ctx = createContext<A11yCtx | null>(null);

function applyToHtml(prefs: A11yPrefs) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.dataset.a11yContrast       = prefs.contrast;
  html.dataset.a11yReadableFont   = prefs.readableFont    ? "on" : "off";
  html.dataset.a11yDyslexiaFont   = prefs.dyslexiaFont    ? "on" : "off";
  html.dataset.a11yLetterSpacing  = prefs.letterSpacing   ? "on" : "off";
  html.dataset.a11yLineHeight     = prefs.lineHeight      ? "on" : "off";
  html.dataset.a11yLinks          = prefs.highlightLinks  ? "on" : "off";
  html.dataset.a11yHeads          = prefs.highlightHeads  ? "on" : "off";
  html.dataset.a11yPauseAnims     = prefs.pauseAnimations ? "on" : "off";
  html.dataset.a11yReduceMotion   = prefs.reduceMotion    ? "on" : "off";
  html.dataset.a11yNoFlash        = prefs.noFlashing      ? "on" : "off";
  html.dataset.a11yReadingGuide   = prefs.readingGuide    ? "on" : "off";
  html.dataset.a11yReadingMask    = prefs.readingMask     ? "on" : "off";
  html.dataset.a11yLargerTargets  = prefs.largerTargets   ? "on" : "off";
  html.dataset.a11yBigCursor      = prefs.bigCursor;
  html.dataset.a11yFocus          = prefs.enhancedFocus   ? "on" : "off";
  html.dataset.a11yKeyboard       = prefs.keyboardMode    ? "on" : "off";
  // Font scale is a CSS variable so any rem-based size cascades.
  html.style.setProperty("--a11y-font-scale", String(prefs.fontScale / 100));
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Start from defaults; hydrate from storage on mount. The brief flash
  // is unavoidable without an inline pre-paint script - we add one in
  // RootLayout to handle the most disruptive prefs (contrast + font).
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      // Escape hatch: visiting any page with ?a11yreset (or #a11yreset)
      // wipes the stored preferences and returns everything to default -
      // works even if a setting (e.g. Pause animations) has hidden the
      // widget itself. The URL is cleaned afterwards.
      const loc = window.location;
      const wantsReset =
        new URLSearchParams(loc.search).has("a11yreset") ||
        loc.hash.toLowerCase() === "#a11yreset";
      if (wantsReset) {
        localStorage.removeItem(A11Y_STORAGE_KEY);
        applyToHtml(DEFAULT_PREFS);
        setPrefs(DEFAULT_PREFS);
        const clean = loc.pathname +
          loc.search.replace(/([?&])a11yreset(=[^&]*)?(&|$)/, "$1").replace(/[?&]$/, "");
        window.history.replaceState(null, "", clean || "/");
        hydrated.current = true;
        return;
      }

      const raw = localStorage.getItem(A11Y_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch { /* ignore corrupt storage */ }
    hydrated.current = true;
  }, []);

  // Mirror prefs onto <html> + persist on every change.
  useEffect(() => {
    applyToHtml(prefs);
    if (!hydrated.current) return;  // skip the initial defaults write
    try { localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)); }
    catch { /* quota/private mode - non-fatal */ }
  }, [prefs]);

  const set = useCallback<A11yCtx["set"]>((key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  const value = useMemo<A11yCtx>(() => ({ prefs, set, reset }), [prefs, set, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useA11y() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useA11y must be used inside <AccessibilityProvider>");
  return v;
}
