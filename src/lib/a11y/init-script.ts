// Inline script run before first paint so contrast/font preferences
// don't flash. Mirrors the subset of preferences that have the biggest
// FOUC impact — full state syncs once the React provider mounts.

export const A11Y_INIT_SCRIPT = `
(function(){try{
  var raw = localStorage.getItem('tweaxly:a11y:v1');
  if (!raw) return;
  var p = JSON.parse(raw);
  var h = document.documentElement;
  if (p.contrast)      h.dataset.a11yContrast      = p.contrast;
  if (p.readableFont)  h.dataset.a11yReadableFont  = 'on';
  if (p.dyslexiaFont)  h.dataset.a11yDyslexiaFont  = 'on';
  if (p.letterSpacing) h.dataset.a11yLetterSpacing = 'on';
  if (p.lineHeight)    h.dataset.a11yLineHeight    = 'on';
  if (p.highlightLinks)h.dataset.a11yLinks         = 'on';
  if (p.highlightHeads)h.dataset.a11yHeads         = 'on';
  if (p.pauseAnimations)h.dataset.a11yPauseAnims   = 'on';
  if (p.reduceMotion)  h.dataset.a11yReduceMotion  = 'on';
  if (p.largerTargets) h.dataset.a11yLargerTargets = 'on';
  if (p.enhancedFocus) h.dataset.a11yFocus         = 'on';
  if (p.keyboardMode)  h.dataset.a11yKeyboard      = 'on';
  if (p.bigCursor)     h.dataset.a11yBigCursor     = p.bigCursor;
  if (p.fontScale)     h.style.setProperty('--a11y-font-scale', String(p.fontScale/100));
}catch(e){}})();
`;
