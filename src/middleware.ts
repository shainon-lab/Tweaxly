// Global write-block during super_admin impersonation.
//
// Whenever the session has impersonatingBusinessId set but
// impersonationAllowWrites is NOT true, any state-changing request to
// /api/* is rejected with a 403. This is a defense-in-depth layer on
// top of per-route blockWriteDuringImpersonation() - it covers every
// mutation by default so a future route added by an engineer who
// forgets to add the per-route check still respects the read-only
// posture.
//
// Allowed during impersonation regardless of write mode:
//   - GET / HEAD / OPTIONS (read-only)
//   - /api/admin/* (impersonation control surface itself)
//   - /api/auth/* (login/logout/register - not customer data)

import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(req: NextRequest) {
  // Only inspect mutating API requests.
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return NextResponse.next();
  if (path.startsWith("/api/admin/")) return NextResponse.next();
  if (path.startsWith("/api/auth/"))  return NextResponse.next();

  // Build a no-op response we can pair the session with; iron-session
  // needs a Response object for cookie I/O even if we don't write back.
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.impersonatingBusinessId) return res;
  if (session.impersonationAllowWrites) return res;

  return NextResponse.json(
    {
      error: "writes_disabled_during_impersonation",
      message:
        "Writes are blocked while viewing this account as Super Admin. Enable write mode from the impersonation banner to proceed.",
    },
    { status: 403 }
  );
}

export const config = {
  // Only run on API routes - page rendering is read-only by definition.
  matcher: ["/api/:path*"],
};
