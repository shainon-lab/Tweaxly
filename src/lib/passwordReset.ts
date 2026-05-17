// Password-reset token helpers.
//
// Threat model:
//   - DB leak shouldn't grant account takeover → store hashes, not the
//     raw token.
//   - Replay attacks shouldn't work → mark token usedAt on first use.
//   - Stale tokens shouldn't work → expiresAt window of 60 minutes.
//   - Timing attacks on email enumeration shouldn't reveal whether an
//     email exists → caller always returns the neutral message.
//
// Token format: 32 random bytes, URL-safe base64 (≈ 43 chars).
// Hash: SHA-256 hex (64 chars). Plenty for a single-use token; we
// rotate on first use so collision resistance >> cracking resistance
// is fine here.

import crypto from "node:crypto";

export const TOKEN_TTL_MINUTES = 60;
export const PASSWORD_MIN_LENGTH = 6;

export function generateResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && pw.length >= PASSWORD_MIN_LENGTH;
}
