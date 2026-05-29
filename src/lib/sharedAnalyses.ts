// Helpers for the Secure Analysis Sharing feature.
//
// The actual storage + read of SharedAnalysis rows lives in the API
// routes (`/api/shared-analyses/...`) and the public viewer
// (`/share/[token]/...` — Phase 2). This module is the single place
// to look up:
//   - the canonical token format + URL builder
//   - the allowed expiration buckets the create form exposes
//   - the allowed sourceType strings
// so adding a new source surface or rotating the URL shape is one
// edit rather than a sweep.

import { randomBytes } from "node:crypto";

// User-facing expiry choices on the Share modal. Stored on
// SharedAnalysis.expiresAt as an absolute timestamp; the bucket the
// user picked is not persisted (we only care about the cutoff).
export const SHARE_EXPIRY_HOURS = {
  "24h": 24,
  "7d":  24 * 7,
  "30d": 24 * 30,
} as const;
export type ShareExpiryKey = keyof typeof SHARE_EXPIRY_HOURS;
export const DEFAULT_SHARE_EXPIRY: ShareExpiryKey = "7d";

// Every source surface that can be snapshotted. Adding a new one
// (e.g. "report") means appending it here and teaching the relevant
// UI to call the create API with that sourceType.
export const SHARE_SOURCE_TYPES = [
  "consultation",
  "signal",
  "forecast_explanation",
  "insight",
] as const;
export type ShareSourceType = (typeof SHARE_SOURCE_TYPES)[number];
export function isShareSourceType(v: unknown): v is ShareSourceType {
  return typeof v === "string"
    && (SHARE_SOURCE_TYPES as readonly string[]).includes(v);
}

// 32 random bytes (256 bits) base64url-encoded — same shape as the
// unsubscribe / email-verification tokens elsewhere in the codebase
// so security review only has to look at one pattern. The token IS
// the secret: anyone who has it can view the share subject to
// expiry + password.
const SHARE_TOKEN_BYTES = 32;
export function generateShareToken(): string {
  return randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}

// Canonical URL the create response hands back to the caller. Reads
// SHARE_BASE_URL from env so previews and production point at the
// right host; falls back to a same-origin relative path so dev still
// works without configuration.
export function buildShareUrl(token: string): string {
  const base = process.env.SHARE_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/share/${token}`;
  return `/share/${token}`;
}
