import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
  email?: string;
  currentBusinessId?: string;
  // ──────────────────────────────────────────────────────────────────
  // Impersonation - only super_admin users can set these. When set,
  // requireBusiness() resolves to impersonatingBusinessId instead of
  // the user's own business; queries scope to the impersonated tenant.
  //
  // Writes are blocked by default during impersonation. The super_admin
  // can flip impersonationAllowWrites=true via a dedicated route if
  // they explicitly need to modify customer data (rare, audited).
  // ──────────────────────────────────────────────────────────────────
  impersonatingBusinessId?: string;
  impersonationAllowWrites?: boolean;
};

// Fail loudly if the secret isn't provided in production - we used to
// silently fall back to a hardcoded string, which means anyone who
// reads this file could forge sessions on a misconfigured deploy.
// Local dev keeps a dev-only fallback so contributors aren't forced
// to set an env var to run the app.
const SESSION_SECRET = (() => {
  const fromEnv = process.env.SESSION_PASSWORD;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_PASSWORD environment variable is required (>= 32 chars) in production",
    );
  }
  // 32+ chars - iron-session requires this length minimum.
  return "ai-cfo-mvp-development-only-fallback-not-for-production-use";
})();

export const sessionOptions: SessionOptions = {
  password:   SESSION_SECRET,
  cookieName: "ai_cfo_session",
  cookieOptions: {
    // HttpOnly: cookie never readable from document.cookie - protects
    // against XSS-based session theft.
    httpOnly: true,
    // Secure: only sent over HTTPS in production.
    secure: process.env.NODE_ENV === "production",
    // SameSite=Lax: blocks the cookie on most cross-site requests
    // (CSRF defense) while still allowing normal top-level navigation
    // from external sites (e.g. links from email back into the app).
    sameSite: "lax",
    // Restrict the cookie to root so subpaths don't accidentally
    // exclude it.
    path: "/",
    // Bound session lifetime to 7 days. iron-session's default is also
    // 14 days, but making it explicit means a future iron-session
    // upgrade can't silently change our security posture. Reauth flow
    // (login) issues a fresh cookie with a fresh expiry.
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  const store = cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}
