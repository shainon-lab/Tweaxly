import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

// Resolve the redirect target against the request URL so the logout
// redirect always points at the same host the user is browsing -
// works under localhost, Vercel previews, custom domains, and tunnels
// without needing NEXT_PUBLIC_BASE_URL to be set. Status 303 forces
// the browser to follow with GET regardless of the original method.
async function handleLogout(req: Request) {
  const session = await getSession();
  const userId = session.userId ?? null;
  session.destroy();
  if (userId) {
    await recordAudit({ actorUserId: userId, action: "auth.logout", request: req });
  }
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}

export async function POST(req: Request) {
  return handleLogout(req);
}

export async function GET(req: Request) {
  return handleLogout(req);
}
