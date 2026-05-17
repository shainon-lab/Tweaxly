// Register as a POST Route Handler. Mirrors /api/auth/login — see that
// file for why we don't use a server action for these mutations.

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
  const name = String(form.get("name") ?? "").trim() || null;

  const errUrl = new URL("/register?err=1", req.url);
  const dupeUrl = new URL("/register?err=exists", req.url);

  if (!email || password.length < 6) {
    return NextResponse.redirect(errUrl, { status: 303 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(dupeUrl, { status: 303 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  // Auto-promote the seeded super-admin email on first signup so the
  // operator account can immediately reach /admin without a manual
  // SQL update.
  const SUPER_ADMIN_EMAIL = "shainon@gmail.com";
  const systemRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : "user";
  const user = await prisma.user.create({
    data: { email, passwordHash, name, systemRole },
  });

  const res = NextResponse.redirect(new URL("/setup", req.url), { status: 303 });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.userId = user.id;
  session.email = user.email;
  await session.save();
  return res;
}
