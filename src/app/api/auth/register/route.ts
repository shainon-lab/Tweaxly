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
import {
  generateUnsubscribeToken, MARKETING_POLICY_VERSION,
} from "@/lib/communications";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim() || null;
  const businessName = String(form.get("businessName") ?? "").trim();
  const acceptTerms     = String(form.get("acceptTerms") ?? "")     === "yes";
  // Marketing consent is OPTIONAL — defaulted to false at the model
  // level, only flipped on if the user explicitly ticks the box.
  const acceptMarketing = String(form.get("acceptMarketing") ?? "") === "yes";

  const errUrl   = new URL("/register?err=1",      req.url);
  const dupeUrl  = new URL("/register?err=exists", req.url);
  const termsUrl = new URL("/register?err=terms",  req.url);

  // Terms of Service must be accepted explicitly. The UI blocks the
  // submit button until the checkbox is ticked, but we re-validate
  // server-side as the source of truth.
  if (!acceptTerms) {
    return NextResponse.redirect(termsUrl, { status: 303 });
  }

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

  // Best-effort IP capture for the marketing-consent audit record.
  // Falls back to null in environments without a proxy header.
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  // When the user opts in to marketing we flip all four channels on by
  // default — the single checkbox represents "agree to receive
  // marketing updates, promotions, newsletters, product
  // announcements, and commercial communications". Channel-level
  // granularity lives in Account → Communication Preferences.
  const marketingDefaults = acceptMarketing
    ? { marketingEmails: true, marketingSMS: true, productAnnouncements: true, newsletter: true }
    : { marketingEmails: false, marketingSMS: false, productAnnouncements: false, newsletter: false };

  let user;
  let business;
  try {
    // Single transaction: a half-created account (user without business)
    // would route through /setup, which the new onboarding is supposed
    // to skip. Either everything lands or nothing does.
    const result = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email, passwordHash, name, systemRole,
          ...marketingDefaults,
          // Stamp the audit record on every signup so we can prove
          // *when* and *how* the user expressed (or declined) consent.
          marketingConsentTimestamp: new Date(),
          marketingConsentSource:    "signup",
          marketingConsentIp:        ipAddress,
          marketingPolicyVersion:    MARKETING_POLICY_VERSION,
          // Issue an unsubscribe token only if the user opted in —
          // accounts that never granted marketing don't need one.
          unsubscribeToken: acceptMarketing ? generateUnsubscribeToken() : null,
        },
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

  // Audit the consent decisions made at signup. Both the legal
  // acceptance (always true if we got here) and the marketing opt-in
  // (true/false) are recorded so we can prove the user's choice if
  // ever challenged. Best-effort — failures here don't block signup.
  await recordAudit({
    actorUserId: user.id,
    action:      "consent.signup",
    metadata: {
      acceptTerms:           true,
      acceptMarketing,
      policyVersion:         MARKETING_POLICY_VERSION,
      marketingChannels:     marketingDefaults,
    },
    request: req,
  });

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
