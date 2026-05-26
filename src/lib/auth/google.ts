// Google OAuth 2.0 helper.
//
// Minimal implementation against Google's well-known endpoints - no
// next-auth, no arctic, no extra dependencies. The iron-session
// layer that already drives the rest of the auth flow handles the
// session cookie at the end; this module only owns:
//   - building the authorize URL with a CSRF state token,
//   - exchanging the auth code for tokens,
//   - fetching the user's profile (id_token also includes the
//     claims but we hit the userinfo endpoint for clarity).
//
// Required env (Vercel Production):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   APP_URL (must match the redirect URI registered in Google Cloud)

import { randomBytes } from "node:crypto";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL     = "https://oauth2.googleapis.com/token";
const USERINFO_URL  = "https://www.googleapis.com/oauth2/v3/userinfo";
const SCOPE         = "openid email profile";

export type GoogleConfig = {
  clientId:     string;
  clientSecret: string;
  redirectUri:  string;
};

export function getGoogleConfig(): GoogleConfig | null {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl       = process.env.APP_URL ?? "https://app.tweaxly.com";
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`,
  };
}

// CSRF state token - cryptographically random + url-safe. Stored in
// a short-lived cookie on the /start call and validated on /callback.
export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function buildAuthorizeUrl(cfg: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id:     cfg.clientId,
    redirect_uri:  cfg.redirectUri,
    response_type: "code",
    scope:         SCOPE,
    state,
    // include_granted_scopes: opt-in to incremental authorization in
    // case we add scopes later (calendar, drive, etc.).
    include_granted_scopes: "true",
    // prompt: "select_account" so returning users with multiple
    // Google accounts always see the picker instead of being silently
    // signed in with the last-used one.
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token:  string;
  expires_in:    number;
  token_type:    "Bearer";
  id_token?:     string;
  refresh_token?: string;
  scope?:        string;
};

export async function exchangeCodeForTokens(
  cfg: GoogleConfig,
  code: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id:     cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri:  cfg.redirectUri,
    grant_type:    "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`google_token_exchange_failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export type GoogleProfile = {
  sub:             string; // stable Google user id
  email:           string;
  email_verified?: boolean;
  name?:           string;
  given_name?:     string;
  family_name?:    string;
  picture?:        string;
  locale?:         string;
};

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`google_userinfo_failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<GoogleProfile>;
}
