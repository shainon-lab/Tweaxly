// scripts/generate-vapid.ts
//
// One-shot helper that prints a fresh VAPID key pair for Web Push.
// Run once per environment; paste the two values into Vercel as
// VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (Production scope). Also add
// VAPID_SUBJECT="mailto:support@tweaxly.com" (or any owner contact
// URL/mailto - required by the spec).
//
// Run:
//   npx tsx scripts/generate-vapid.ts

import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VAPID keys generated.\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT="mailto:support@tweaxly.com"`);
console.log("\nPaste these into Vercel (Production) and redeploy.");
console.log("Treat VAPID_PRIVATE_KEY like a password - never commit it.");
