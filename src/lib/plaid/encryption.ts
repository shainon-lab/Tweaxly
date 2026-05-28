// AES-256-GCM encryption for Plaid access tokens. The plaintext token
// is sensitive bearer credential - if it leaks, anyone can pull a
// workspace's bank data without going back through Plaid Link. We
// never store it in plaintext at rest.
//
// Wire format: <iv-hex>:<authTag-hex>:<ciphertext-hex>
//   iv         12 bytes (GCM standard)
//   authTag    16 bytes
//   ciphertext variable
//
// Master key is provided via PLAID_TOKEN_ENCRYPTION_KEY as a 64-char
// hex string (= 256 bits). Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO    = "aes-256-gcm";
const IV_LEN  = 12;
const TAG_LEN = 16;

function loadKey(): Buffer {
  const raw = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("PLAID_TOKEN_ENCRYPTION_KEY is not set");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("PLAID_TOKEN_ENCRYPTION_KEY must be 64 hex chars (256 bits)");
  }
  return Buffer.from(raw, "hex");
}

export function encryptAccessToken(plaintext: string): string {
  const key = loadKey();
  const iv  = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

export function decryptAccessToken(payload: string): string {
  const key = loadKey();
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("malformed encrypted token");
  const [ivHex, tagHex, ctHex] = parts;
  const iv  = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ct  = Buffer.from(ctHex, "hex");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("malformed encrypted token");
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
