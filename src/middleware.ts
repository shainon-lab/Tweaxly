// Two jobs, both on the request edge:
//
// 1. Set strict security headers on every response (CSP with a
//    per-request nonce, X-Frame-Options, X-Content-Type-Options,
//    Referrer-Policy, HSTS, Permissions-Policy). The nonce is also
//    pushed into the request headers as `x-nonce` so server
//    components (layout.tsx, etc.) can stamp it onto their inline
//    <script> tags - that's what lets the theme / consent / a11y
//    boot scripts run without enabling 'unsafe-inline'.
//
// 2. Global write-block during super_admin impersonation: whenever
//    the session has `impersonatingBusinessId` set but
//    `impersonationAllowWrites` is NOT true, any state-changing
//    request to /api/* is rejected with a 403. Defense-in-depth on
//    top of per-route blockWriteDuringImpersonation() so a future
//    route added by an engineer who forgets the per-route check
//    still respects the read-only posture.
//    Allowed during impersonation regardless of write mode:
//      - GET / HEAD / OPTIONS (read-only)
//      - /api/admin/* (impersonation control surface itself)
//      - /api/auth/*  (login/logout/register - not customer data)

import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// 16 bytes of cryptographic randomness, base64-encoded. The Web
// Crypto API is available in the Edge runtime.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";

  // `'strict-dynamic'` means: trust scripts launched by a nonce'd
  // script and ignore the host-allow list. This is the modern,
  // strict pattern. `'unsafe-inline'` is included as a fallback for
  // older browsers that don't understand `'strict-dynamic'` - they
  // will use 'unsafe-inline' instead. Modern browsers see
  // 'strict-dynamic' and ignore 'unsafe-inline'.
  //
  // `'unsafe-eval'` is allowed in dev only because Next's dev
  // bundler uses eval(); production builds don't need it.
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https:",
  ].filter(Boolean).join(" ");

  // style-src 'unsafe-inline' is required by Next/font's injected
  // <style> tags and by many UI libraries; it's substantially less
  // dangerous than script-src 'unsafe-inline' (you can't run code
  // via CSS in any modern browser).
  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https: wss:`,
    `frame-src 'self' https:`,
    `media-src 'self' blob:`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    // Disallow being framed by any other origin - clickjacking
    // defense. Pairs with the X-Frame-Options header for legacy
    // browsers.
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

function attachSecurityHeaders(res: NextResponse, nonce: string): void {
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  // Modern browsers respect frame-ancestors in CSP, but legacy
  // ones (and some embedded webviews) still only check X-Frame-Options.
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  // 1 year HSTS, include subdomains. Skipping `preload` so we can
  // back out without browser-vendor coordination.
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
}

export async function middleware(req: NextRequest) {
  const nonce = generateNonce();
  // Propagate the nonce to downstream handlers via a request header
  // so layout.tsx can read it via `headers().get('x-nonce')`.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const path = req.nextUrl.pathname;
  const isMutatingApi =
    !SAFE_METHODS.has(req.method)
    && path.startsWith("/api/")
    && !path.startsWith("/api/admin/")
    && !path.startsWith("/api/auth/");

  if (isMutatingApi) {
    // Impersonation write-block path - need to read session to decide.
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (session.impersonatingBusinessId && !session.impersonationAllowWrites) {
      const blocked = NextResponse.json(
        {
          error: "writes_disabled_during_impersonation",
          message:
            "Writes are blocked while viewing this account as Super Admin. Enable write mode from the impersonation banner to proceed.",
        },
        { status: 403 },
      );
      attachSecurityHeaders(blocked, nonce);
      return blocked;
    }
    attachSecurityHeaders(res, nonce);
    return res;
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  attachSecurityHeaders(res, nonce);
  return res;
}

// Run on every request that isn't a static asset. Excluding
// `/_next/static`, `/_next/image`, common static file extensions and
// `favicon` keeps middleware off the hot path for bundle/image traffic.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|js|css|woff|woff2|map)$).*)",
  ],
};
