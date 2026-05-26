// GET /api/auth/google/start
//
// Kicks off the Google OAuth flow. Generates a CSRF state token,
// stores it in a short-lived httpOnly cookie, and 302s the user to
// Google's consent screen. The callback endpoint validates the
// state cookie on return.
//
// Public route - no session required (this is for both signin and
// signup). The button on /login and /register both hit this URL.

import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  generateOAuthState,
  getGoogleConfig,
} from "@/lib/auth/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE  = "google_oauth_state";
const STATE_MAX_AGE = 600; // 10 minutes - more than enough for the consent screen

export async function GET(req: NextRequest) {
  const cfg = getGoogleConfig();
  if (!cfg) {
    // Misconfigured environment - bounce the user back to /login
    // with an obvious error tag. We never want to crash the page.
    return NextResponse.redirect(new URL("/login?err=google_unavailable", req.url), { status: 303 });
  }
  const state = generateOAuthState();
  const url   = buildAuthorizeUrl(cfg, state);
  const res   = NextResponse.redirect(url, { status: 303 });
  // httpOnly so JS can't read it; sameSite=lax so it survives the
  // OAuth bounce (Google → us); secure on prod via Next's auto-detect.
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/api/auth/google",
    maxAge:   STATE_MAX_AGE,
  });
  return res;
}
