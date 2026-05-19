// Inline pre-paint script that:
//
// 1. Installs window.dataLayer and a window.gtag shim BEFORE any
//    tracking script can load. This is the GCM v2 contract — the
//    default consent must be set before gtag.js initializes, or GA
//    will start with implicit "granted" on first hit.
//
// 2. Defaults every advertising / analytics signal to "denied". Only
//    security_storage (which is functionally always on) is granted.
//
// 3. Adds a `data-consent="given|needed"` attribute to <html> so the
//    layout can avoid layout-shift by deciding whether to render the
//    banner placeholder.
//
// We intentionally inline this rather than loading a separate JS file
// so it executes in the head, synchronously, before paint.

export const CONSENT_INIT_SCRIPT = `
(function(){try{
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  // GCM v2 default — denied for everything except security.
  // wait_for_update lets any GA tag pause briefly to receive the
  // 'update' once the user makes their choice on this page load.
  gtag('consent', 'default', {
    ad_storage:              'denied',
    analytics_storage:       'denied',
    ad_user_data:            'denied',
    ad_personalization:      'denied',
    personalization_storage: 'denied',
    functionality_storage:   'granted',
    security_storage:        'granted',
    wait_for_update:         500
  });

  // Look at the existing cookie to figure out whether to immediately
  // emit the user's prior decision. If we wait for React mount, GCM
  // shows 'denied' for a few ms on every page load even for users who
  // already opted in.
  var raw = null;
  try {
    var m = document.cookie.match(/(?:^|;\\s*)tweaxly_consent=([^;]+)/);
    if (m) raw = JSON.parse(atob(decodeURIComponent(m[1])));
  } catch (e) {}
  if (raw && raw.consentVersion === '1.0' && raw.policyVersion === '2026-05-19') {
    var yn = function(b){ return b ? 'granted' : 'denied'; };
    gtag('consent', 'update', {
      analytics_storage:       yn(!!raw.analytics),
      ad_storage:              yn(!!raw.marketing),
      ad_user_data:            yn(!!raw.marketing),
      ad_personalization:      yn(!!raw.marketing),
      personalization_storage: yn(!!raw.personalization)
    });
    document.documentElement.dataset.consent = 'given';
  } else {
    document.documentElement.dataset.consent = 'needed';
  }
}catch(e){}})();
`;
