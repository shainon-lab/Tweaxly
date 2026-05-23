// Shared helpers for marketing-consent + communication-preferences
// audit logging. Both the register endpoint and the
// Communication Preferences settings API call into this so the audit
// trail is recorded consistently no matter where consent changes.

import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Db } from "./db";

// Policy version this consent was given against. Bumped any time the
// Privacy Policy text materially changes - aligned with the consent
// management platform's POLICY_VERSION on the marketing site.
export const MARKETING_POLICY_VERSION = "2026-05-19";

export type MarketingChannel =
  | "marketingEmails"
  | "marketingSMS"
  | "productAnnouncements"
  | "newsletter";

export const MARKETING_CHANNELS: MarketingChannel[] = [
  "marketingEmails", "marketingSMS", "productAnnouncements", "newsletter",
];

export interface MarketingConsentUpdate {
  marketingEmails?:      boolean;
  marketingSMS?:         boolean;
  productAnnouncements?: boolean;
  newsletter?:           boolean;
}

export interface MarketingAudit {
  source: "signup" | "settings" | "import" | "unsubscribe";
  ipAddress?: string | null;
}

// Generate a stable, opaque unsubscribe token. 32 bytes = 64 hex chars
// - safely fits in a URL and is impractical to brute force.
export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Apply an opt-in/opt-out change atomically. Pass any subset of the
// channel booleans you want to update; omitted channels are left
// untouched. Stamps the audit fields, generates an unsubscribe token
// lazily if the user is opting *in* and doesn't have one yet.
export async function updateMarketingPreferences(
  prisma: Db,
  userId: string,
  update: MarketingConsentUpdate,
  audit: MarketingAudit
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unsubscribeToken: true, email: true },
  });
  if (!user) throw new Error("user_not_found");

  const grantingAny = Object.values(update).some((v) => v === true);

  const data: Prisma.UserUpdateInput = {
    ...update,
    marketingConsentTimestamp: new Date(),
    marketingConsentSource:    audit.source,
    marketingConsentIp:        audit.ipAddress ?? null,
    marketingPolicyVersion:    MARKETING_POLICY_VERSION,
  };
  if (grantingAny && !user.unsubscribeToken) {
    data.unsubscribeToken = generateUnsubscribeToken();
  }

  await prisma.user.update({ where: { id: userId }, data });
}

// Record a per-channel suppression entry. Called by the one-click
// unsubscribe endpoint so that even if a user later flips the channel
// back on, the campaign sender can choose to honour the suppression
// (standard anti-spam practice).
export async function suppressEmail(
  prisma: Db,
  email: string,
  channel: string,
  reason: "user_unsubscribe" | "bounce" | "complaint" | "admin",
  source?: string,
): Promise<void> {
  await prisma.emailSuppression.upsert({
    where: { email_channel: { email, channel } },
    update: { reason, source: source ?? null },
    create: { email, channel, reason, source: source ?? null },
  });
}

// Convenience: read which marketing channels are currently enabled
// for a user. Returned as the same shape the settings UI uses.
export function channelStateOf(user: {
  marketingEmails: boolean;
  marketingSMS: boolean;
  productAnnouncements: boolean;
  newsletter: boolean;
}): Record<MarketingChannel, boolean> {
  return {
    marketingEmails:      user.marketingEmails,
    marketingSMS:         user.marketingSMS,
    productAnnouncements: user.productAnnouncements,
    newsletter:           user.newsletter,
  };
}

// True iff at least one marketing channel is currently enabled - used
// to decide whether to issue an unsubscribe token at signup.
export function hasAnyMarketing(u: ReturnType<typeof channelStateOf>): boolean {
  return Object.values(u).some(Boolean);
}
