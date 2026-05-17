import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Resolve the redirect target against the request URL so the logout
// redirect always points at the same host the user is browsing —
// works under localhost, Vercel previews, custom domains, and tunnels
// without needing NEXT_PUBLIC_BASE_URL to be set. Status 303 forces
// the browser to follow with GET regardless of the original method.
export async function POST(req: Request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}

export async function GET(req: Request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
