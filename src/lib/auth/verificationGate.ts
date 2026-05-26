// Server-side enforcement of the email-verification rules.
//
// Two gates:
//
//   requireEmailVerified(user)
//     Hard gate. Blocks regardless of when the user signed up. Used
//     on premium / outbound / billing surfaces:
//       - AI consultations
//       - billing checkouts (upgrade + credit packs)
//       - exports
//       - integration activation
//       - team invites / notifications
//
//   requireEmailVerifiedOrWithinGrace(user)
//     Soft gate. Allowed during the 72-hour grace period (so users
//     can complete onboarding + bring their data in before
//     verifying), then blocked. Used on:
//       - upload commit
//       - manual-entry writes
//       - any "fill the workspace with data" write
//
// Both return a structured shape so the API route can either short-
// circuit with NextResponse.json({error:…},{status:403}) or surface
// the same code through GraphQL/etc. in the future. The shape is
// stable so the client modal knows what to render.
//
// Audit log: every gate firing writes auth.access_blocked_unverified
// with the gate name + surface so we can spot abusive patterns.

import { recordAudit } from "../audit";

export const GRACE_PERIOD_MS = 72 * 60 * 60 * 1000; // 72 hours

export type VerificationGateResult =
  | { ok: true }
  | {
      ok: false;
      // "unverified"           - user never verified + outside grace doesn't apply (strict gate)
      // "unverified_restricted" - user never verified AND past grace period
      reason: "unverified" | "unverified_restricted";
      gracePeriodMs: number;
      gracePeriodEndsAt: string;
    };

type GateUser = {
  id:            string;
  emailVerified: Date | null;
  createdAt:     Date;
};

function gracePeriodEnd(user: GateUser): Date {
  return new Date(user.createdAt.getTime() + GRACE_PERIOD_MS);
}

function isWithinGrace(user: GateUser): boolean {
  if (user.emailVerified) return false;
  return Date.now() < gracePeriodEnd(user).getTime();
}

// Strict gate: any unverified user fails, even if still in the
// grace window. Use this for AI / billing / outbound / premium.
export async function requireEmailVerified(
  user: GateUser,
  surface: string,
): Promise<VerificationGateResult> {
  if (user.emailVerified) return { ok: true };
  await recordAudit({
    actorUserId: user.id,
    action:      "auth.access_blocked_unverified",
    metadata:    { gate: "strict", surface },
  });
  const restricted = !isWithinGrace(user);
  return {
    ok: false,
    reason: restricted ? "unverified_restricted" : "unverified",
    gracePeriodMs: GRACE_PERIOD_MS,
    gracePeriodEndsAt: gracePeriodEnd(user).toISOString(),
  };
}

// Soft gate: unverified is fine until grace period elapses, then
// blocked. Use this for uploads / manual writes / "data ingest" surfaces.
export async function requireEmailVerifiedOrWithinGrace(
  user: GateUser,
  surface: string,
): Promise<VerificationGateResult> {
  if (user.emailVerified) return { ok: true };
  if (isWithinGrace(user)) return { ok: true };
  await recordAudit({
    actorUserId: user.id,
    action:      "auth.access_blocked_unverified",
    metadata:    { gate: "grace", surface },
  });
  return {
    ok: false,
    reason: "unverified_restricted",
    gracePeriodMs: GRACE_PERIOD_MS,
    gracePeriodEndsAt: gracePeriodEnd(user).toISOString(),
  };
}

// Read-only derivation for the layout - so the EmailVerificationBanner
// knows whether to render its warn variant (still in grace) or its
// stronger "restricted" variant (past grace). Pure function, no DB
// read, no audit side effect.
export function gracePeriodStatus(user: GateUser): {
  verified:        boolean;
  withinGrace:    boolean;
  gracePeriodEnd: string;
} {
  return {
    verified:        !!user.emailVerified,
    withinGrace:    isWithinGrace(user),
    gracePeriodEnd: gracePeriodEnd(user).toISOString(),
  };
}
