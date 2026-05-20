// Shape of the accessibility preferences persisted in localStorage and
// reflected on <html data-a11y-*="..."> attributes so CSS can pick them
// up without a re-render. Keep this file tiny and dependency-free -
// it's imported by both server and client code.

export type ContrastMode  = "default" | "high" | "dark-high" | "light-high" | "monochrome" | "invert";
export type FontScale     = 100 | 110 | 125 | 150 | 175 | 200;  // %
export type CursorSize    = "default" | "large" | "xlarge";

export interface A11yPrefs {
  fontScale:        FontScale;     // text size %
  contrast:         ContrastMode;  // color/contrast filter
  readableFont:     boolean;       // override to a high-legibility sans
  dyslexiaFont:     boolean;       // OpenDyslexic-style fallback
  letterSpacing:    boolean;       // wider tracking
  lineHeight:       boolean;       // looser leading
  highlightLinks:   boolean;       // underline + outline every <a>
  highlightHeads:   boolean;       // outline every <h1..h6>
  pauseAnimations:  boolean;       // hard-stop animations
  reduceMotion:     boolean;       // motion: reduce equivalent
  noFlashing:       boolean;       // suppress blink/flash classes
  readingGuide:     boolean;       // horizontal bar follows cursor
  readingMask:      boolean;       // dims everything except a strip
  largerTargets:    boolean;       // min-44px hit targets
  bigCursor:        CursorSize;    // larger custom cursor
  enhancedFocus:    boolean;       // thicker, brand-colored focus ring
  keyboardMode:     boolean;       // show focus outlines on every focus
}

export const DEFAULT_PREFS: A11yPrefs = {
  fontScale:       100,
  contrast:        "default",
  readableFont:    false,
  dyslexiaFont:    false,
  letterSpacing:   false,
  lineHeight:      false,
  highlightLinks:  false,
  highlightHeads:  false,
  pauseAnimations: false,
  reduceMotion:    false,
  noFlashing:      false,
  readingGuide:    false,
  readingMask:     false,
  largerTargets:   false,
  bigCursor:       "default",
  enhancedFocus:   false,
  keyboardMode:    false,
};

export const A11Y_STORAGE_KEY = "tweaxly:a11y:v1";
