// Register as a POST Route Handler. Mirrors /api/auth/login — see that
// file for why we don't use a server action for these mutations.
//
// Onboarding contract: signup creates User + Business + the owner's
// account_admin membership in one transaction, using default finance
// settings (USD, no VAT, January fiscal year). The user lands on
// /dashboard immediately — no /setup detour. Currency / fiscal year /
// VAT are configurable later in Settings → Business profile.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim() || null;
  const businessName = String(form.get("businessName") ?? "").trim();

  const errUrl = new URL("/register?err=1", req.url);
  const dupeUrl = new URL("/register?err=exists", req.url);

  if (!email || password.length < 6 || !businessName) {
    return NextResponse.redirect(errUrl, { status: 303 });
  }

  // Case-insensitive dupe check (User.email @unique is the final safety
  // net; this just gives a nicer pre-write error message).
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.redirect(dupeUrl, { status: 303 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Auto-promote the seeded super-admin email on first signup.
  const SUPER_ADMIN_EMAIL = "shainon@gmail.com";
  const systemRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : "user";

  let user;
  let business;
  try {
    // Single transaction: a half-created account (user without business)
    // would route through /setup, which the new onboarding is supposed
    // to skip. Either everything lands or nothing does.
    const result = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, passwordHash, name, systemRole },
      });
      const b = await tx.business.create({
        data: {
          ownerId: u.id,
          name: businessName,
          // Defaults per spec:
          currency: "USD",
          fiscalStartMonth: 1,
          vatEnabled: false,
          vatRate: 0,
          categories: {
            create: DEFAULT_CATEGORIES.map((c) => ({
              name: c.name, kind: c.kind, isOneTime: !!c.isOneTime,
            })),
          },
          memberships: {
            create: { userId: u.id, role: "account_admin", joinedAt: new Date() },
          },
        },
      });
      return { u, b };
    });
    user = result.u;
    business = result.b;
  } catch (err: unknown) {
    // P2002 — race with another concurrent signup on the same email.
    if (
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.redirect(dupeUrl, { status: 303 });
    }
    throw err;
  }

  // Drop the new user into the adaptive onboarding wizard, which
  // ends by routing them to /manual-data (Import Your Business Data)
  // or seeds a demo workspace if they pick 'Explore Demo Business'.
  const res = NextResponse.redirect(new URL("/onboarding", req.url), { status: 303 });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.userId = user.id;
  session.email = user.email;
  session.currentBusinessId = business.id;
  await session.save();
  return res;
}
