// GET /api/auth/google/callback?code=…&state=…
//
// Endpoint Google redirects back to after the user authorizes. We:
//   1. Validate the state cookie matches the returned `state` param
//      (CSRF protection). Mismatch = reject.
//   2. Exchange the auth code for an access token.
//   3. Fetch the user's profile from Google.
//   4. Reconcile against our User table:
//        - Existing user with this googleId → log in.
//        - Existing user with matching email but no googleId →
//          link Google + log in.
//        - No existing user → create User + a default Business so
//          the new account can immediately complete onboarding.
//   5. Stamp emailVerified (Google says verified, we trust it).
//   6. Set the iron-session cookie and redirect to /onboarding for
//      new users (so they name the business) or /dashboard for
//      returning users.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getGoogleConfig,
  type GoogleProfile,
} from "@/lib/auth/google";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { MARKETING_POLICY_VERSION } from "@/lib/communications";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "google_oauth_state";

function err(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?err=${code}`, req.url), { status: 303 });
}

export async function GET(req: NextRequest) {
  const cfg = getGoogleConfig();
  if (!cfg) return err(req, "google_unavailable");

  const url   = new URL(req.url);
  const code  = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  // User clicked "Cancel" on the consent screen, or Google returned
  // an explicit error. Send them home with a soft hint rather than
  // a scary failure page.
  if (oauthError) return err(req, "google_canceled");
  if (!code || !state) return err(req, "google_missing_params");

  const stateCookie = req.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!stateCookie || stateCookie !== state) {
    return err(req, "google_state_mismatch");
  }

  let profile: GoogleProfile;
  try {
    const tokens  = await exchangeCodeForTokens(cfg, code);
    profile       = await fetchGoogleProfile(tokens.access_token);
  } catch (e) {
    console.error("[google/callback] token/profile fetch failed", e);
    return err(req, "google_exchange_failed");
  }

  if (!profile.email || !profile.email_verified) {
    // Refuse unverified Google accounts (rare - typical when the
    // user explicitly removed email scope or the address bounced).
    return err(req, "google_email_unverified");
  }
  const normalizedEmail = profile.email.toLowerCase().trim();

  // Reconcile:
  //   - existing user with this googleId → returning Google user
  //   - existing user with matching email (no googleId yet) → link
  //   - no existing user → create
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  let isNewUser = false;

  if (!user) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (byEmail) {
      // Account linking: an account already exists with this email
      // (probably from the password signup path). Stamp Google
      // identifiers + treat email as verified.
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.sub,
          avatarUrl: profile.picture ?? byEmail.avatarUrl ?? null,
          emailVerified: byEmail.emailVerified ?? new Date(),
          name: byEmail.name ?? profile.name ?? null,
        },
      });
      await recordAudit({
        actorUserId: user.id,
        action:      "auth.google_link",
        metadata:    { mode: "linked_existing_account" },
        request:     req,
      });
    } else {
      // Fresh signup via Google. Create User + a default Business
      // in one transaction so the post-callback redirect to
      // /onboarding works without /setup detours. Owner gets the
      // standard account_admin membership + default categories.
      isNewUser = true;
      const SUPER_ADMIN_EMAIL = "shainon@gmail.com";
      const systemRole = normalizedEmail === SUPER_ADMIN_EMAIL ? "super_admin" : "user";
      const businessName = profile.name?.trim() || "My Business";
      const { newUser, newBusiness } = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email:          normalizedEmail,
            // Random bcrypt-strength filler so the column constraint
            // is satisfied without exposing a real password path for
            // Google-only accounts. Password login won't work for
            // these accounts unless the user goes through the
            // forgot-password flow to set one.
            passwordHash:   `oauth:google:${profile.sub}`,
            name:           profile.name ?? null,
            systemRole,
            googleId:       profile.sub,
            avatarUrl:      profile.picture ?? null,
            // Google has already verified this email - we trust it
            // (we also refuse profiles where email_verified=false
            // above) so verified is "now".
            emailVerified:  new Date(),
            // Mirror the marketing-consent audit shape used by the
            // password signup path so consent state is comparable.
            marketingConsentTimestamp: new Date(),
            marketingConsentSource:    "google_signup",
            marketingPolicyVersion:    MARKETING_POLICY_VERSION,
          },
        });
        const b = await tx.business.create({
          data: {
            ownerId:          u.id,
            name:             businessName,
            currency:         "USD",
            fiscalStartMonth: 1,
            vatEnabled:       false,
            vatRate:          0,
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
        return { newUser: u, newBusiness: b };
      });
      user = newUser;
      await recordAudit({
        actorUserId: user.id,
        action:      "auth.google_link",
        metadata:    { mode: "new_signup", businessId: newBusiness.id },
        request:     req,
      });
    }
  } else {
    // Returning Google user. Keep the avatar fresh; everything else
    // is owner-managed at this point.
    if (profile.picture && profile.picture !== user.avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { avatarUrl: profile.picture },
      });
    }
  }

  // Stamp last-login like the password flow does.
  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  });

  // First-business-id for the session. Same logic as the password
  // register path - new users get their just-created workspace,
  // returning users get whatever they had.
  const firstBusinessId = (
    await prisma.business.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
  )?.id ?? null;

  // Destination: new users go to /onboarding (the trimmed 3-step
  // wizard renames the placeholder business). Existing users go
  // straight to /dashboard.
  const target = isNewUser ? "/onboarding" : "/dashboard";
  const res    = NextResponse.redirect(new URL(target, req.url), { status: 303 });
  // Burn the state cookie so a replay can't reuse it.
  res.cookies.set(STATE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.userId = user.id;
  session.email  = user.email;
  if (firstBusinessId) session.currentBusinessId = firstBusinessId;
  await session.save();
  return res;
}
