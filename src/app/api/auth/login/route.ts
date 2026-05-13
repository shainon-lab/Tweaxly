// Login as a POST Route Handler instead of a Server Action.
//
// Why: when we used `"use server"` action + iron-session.save() + redirect()
// on Vercel, the action intermittently crashed with "Connection closed" —
// iron-session writes the cookie via `cookies().set()` and Next.js's
// response stream sometimes races with the synchronous `redirect()`.
// A Route Handler returns a regular NextResponse with Set-Cookie headers,
// which has no streaming-state ambiguity.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");

  // Build the redirect response up front; we'll attach the session cookie
  // to it before returning.
  const successUrl = new URL("/", req.url);
  const failureUrl = new URL("/login?err=1", req.url);

  if (!email || !password) {
    return NextResponse.redirect(failureUrl, { status: 303 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(failureUrl, { status: 303 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(failureUrl, { status: 303 });
  }

  const res = NextResponse.redirect(successUrl, { status: 303 });
  // Bind iron-session to *this* response — Set-Cookie lands on the redirect
  // we're about to return, no streaming-state surprises.
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.userId = user.id;
  session.email = user.email;
  await session.save();
  return res;
}
