// Server-only helpers for Secure Analysis Sharing. Kept in a
// separate file from sharedAnalyses.ts so the shared constants there
// (expiry buckets, source-type list, URL builder) can be imported
// from "use client" components without webpack tripping on the
// `node:crypto` import below.

import "server-only";
import { randomBytes } from "node:crypto";

// 32 random bytes (256 bits) base64url-encoded - same shape as the
// unsubscribe / email-verification tokens elsewhere in the codebase
// so security review only has to look at one pattern. The token IS
// the secret: anyone who has it can view the share subject to
// expiry + password.
const SHARE_TOKEN_BYTES = 32;
export function generateShareToken(): string {
  return randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}
