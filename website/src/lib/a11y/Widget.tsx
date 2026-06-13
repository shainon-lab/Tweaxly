"use client";

// Floating accessibility widget. Renders a brand-styled FAB that opens
// a modal dialog with every preference. The dialog is purpose-built
// (not a generic Headless UI dependency) so we control focus trapping,
// keyboard handling, and ARIA wiring directly.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useA11y } from "./provider";
import type { A11yPrefs, ContrastMode, FontScale, CursorSize } from "./types";

const FONT_STEPS: FontScale[] = [100, 110, 125, 150, 175, 200];

const CONTRAST_OPTIONS: { id: ContrastMode; label: string }[] = [
  { id: "default",     label: "Default" },
  { id: "high",        label: "High" },
  { id: "dark-high",   label: "Dark+" },
  { id: "light-high",  label: "Light+" },
  { id: "monochrome",  label: "Mono" },
  { id: "invert",      label: "Invert" },
];

const CURSOR_OPTIONS: { id: CursorSize; label: string }[] = [
  { id: "default", label: "S" },
  { id: "large",   label: "M" },
  { id: "xlarge",  label: "L" },
];

export default function AccessibilityWidget() {
  const { prefs, set, reset } = useA11y();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const fabRef    = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Reading guide / mask handlers - driven by pointer.
  useEffect(() => {
    if (!prefs.readingGuide && !prefs.readingMask) return;

    let guide: HTMLDivElement | null = null;
    let mask:  HTMLDivElement | null = null;

    if (prefs.readingGuide) {
      guide = document.createElement("div");
      guide.className = "a11y-reading-guide";
      guide.setAttribute("aria-hidden", "true");
      document.body.appendChild(guide);
    }
    if (prefs.readingMask) {
      mask = document.createElement("div");
      mask.className = "a11y-reading-mask";
      mask.setAttribute("aria-hidden", "true");
      document.body.appendChild(mask);
    }

    const onMove = (e: MouseEvent) => {
      if (guide) guide.style.top = `${e.clientY}px`;
      if (mask)  mask.style.setProperty("--top", `${e.clientY - 80}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      guide?.remove();
      mask?.remove();
    };
  }, [prefs.readingGuide, prefs.readingMask]);

  // Focus trap + return focus on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    // Move focus into the dialog on the first interactive element.
    const first = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusables || focusables.length === 0) return;
      const f0 = focusables[0];
      const fN = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === f0) { e.preventDefault(); fN.focus(); }
      else if (!e.shiftKey && document.activeElement === fN) { e.preventDefault(); f0.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const onBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setOpen(false);
  }, []);

  const stepFont = useCallback((dir: 1 | -1) => {
    const idx = FONT_STEPS.indexOf(prefs.fontScale);
    const next = FONT_STEPS[Math.max(0, Math.min(FONT_STEPS.length - 1, idx + dir))];
    set("fontScale", next);
  }, [prefs.fontScale, set]);

  const Toggle = useMemo(() => function Toggle({
    label, k,
  }: { label: string; k: BooleanKeys }) {
    const checked = !!prefs[k];
    return (
      <div className="a11y-row">
        <span className="label">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className="a11y-switch"
          onClick={() => set(k, !checked as never)}
          aria-label={label}
        />
      </div>
    );
  }, [prefs, set]);

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="a11y-fab"
        aria-label="Open accessibility options"
        aria-expanded={open}
        aria-controls="a11y-dialog"
        onClick={() => setOpen((v) => !v)}
        title="Accessibility options"
      >
        <AccessibilityGlyph />
      </button>

      {open ? (
        <>
          <div className="a11y-backdrop" onClick={onBackdrop} aria-hidden="true" />
          <div
            ref={dialogRef}
            id="a11y-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="a11y-dialog"
            onClick={onBackdrop}
          >
            <header>
              <h2 id={titleId}>Accessibility options</h2>
              <div className="a11y-header-actions">
                <button
                  type="button"
                  className="a11y-header-reset"
                  onClick={() => reset()}
                  title="Reset all accessibility settings to default"
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="a11y-close"
                  aria-label="Close accessibility options"
                  onClick={() => setOpen(false)}
                >
                  <CloseGlyph />
                </button>
              </div>
            </header>

            <div className="a11y-body">
              {/* TEXT SIZE */}
              <div className="a11y-section">
                <h3 className="a11y-section-title">Text size</h3>
                <div className="a11y-row">
                  <span className="label">Scale</span>
                  <div className="a11y-stepper" role="group" aria-label="Text size">
                    <button
                      type="button"
                      aria-label="Decrease text size"
                      onClick={() => stepFont(-1)}
                      disabled={prefs.fontScale === FONT_STEPS[0]}
                    >−</button>
                    <span className="value" aria-live="polite">{prefs.fontScale}%</span>
                    <button
                      type="button"
                      aria-label="Increase text size"
                      onClick={() => stepFont(1)}
                      disabled={prefs.fontScale === FONT_STEPS[FONT_STEPS.length - 1]}
                    >+</button>
                  </div>
                </div>
                <Toggle label="Readable font"     k="readableFont" />
                <Toggle label="Dyslexia-friendly font" k="dyslexiaFont" />
                <Toggle label="Wider letter spacing"   k="letterSpacing" />
                <Toggle label="Looser line height"     k="lineHeight" />
              </div>

              {/* COLOR / CONTRAST */}
              <div className="a11y-section">
                <h3 className="a11y-section-title">Color &amp; contrast</h3>
                <div className="a11y-row">
                  <span className="label">Mode</span>
                  <div className="a11y-segmented" role="group" aria-label="Contrast mode">
                    {CONTRAST_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={prefs.contrast === o.id}
                        onClick={() => set("contrast", o.id)}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
                <Toggle label="Highlight links"     k="highlightLinks" />
                <Toggle label="Highlight headings"  k="highlightHeads" />
              </div>

              {/* MOTION */}
              <div className="a11y-section">
                <h3 className="a11y-section-title">Motion &amp; reading</h3>
                <Toggle label="Pause animations"    k="pauseAnimations" />
                <Toggle label="Reduce motion"       k="reduceMotion" />
                <Toggle label="Stop flashing"       k="noFlashing" />
                <Toggle label="Reading guide bar"   k="readingGuide" />
                <Toggle label="Reading mask"        k="readingMask" />
              </div>

              {/* NAVIGATION */}
              <div className="a11y-section">
                <h3 className="a11y-section-title">Navigation</h3>
                <Toggle label="Always-visible focus" k="enhancedFocus" />
                <Toggle label="Keyboard navigation mode" k="keyboardMode" />
                <Toggle label="Larger clickable areas" k="largerTargets" />
                <div className="a11y-row">
                  <span className="label">Cursor size</span>
                  <div className="a11y-segmented" role="group" aria-label="Cursor size">
                    {CURSOR_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={prefs.bigCursor === o.id}
                        onClick={() => set("bigCursor", o.id)}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="a11y-section">
                <button
                  type="button"
                  className="a11y-reset"
                  onClick={() => {
                    if (window.confirm("Reset all accessibility settings to default?")) reset();
                  }}
                >
                  Reset all accessibility settings
                </button>
              </div>
            </div>

            <footer>
              <a href="/accessibility" className="a11y-statement-link">
                Accessibility Statement
              </a>
              <span className="sr-only-a11y">Press Escape to close.</span>
            </footer>
          </div>
        </>
      ) : null}
    </>
  );
}

// Helper type - keys of A11yPrefs whose value is boolean.
type BooleanKeys = {
  [K in keyof A11yPrefs]: A11yPrefs[K] extends boolean ? K : never
}[keyof A11yPrefs];

function AccessibilityGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2" fill="currentColor"/>
      <path
        d="M3.5 8.5h17M9 22l3-8 3 8M9 14h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
