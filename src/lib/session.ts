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

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_PASSWORD ??
    "ai-cfo-mvp-fallback-secret-change-this-please-in-prod",
  cookieName: "ai_cfo_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const store = cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}
