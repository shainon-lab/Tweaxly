// Web Push helper. Wraps `web-push` so callers don't have to think
// about VAPID config every send. Three public functions:
//
//   getVapidPublicKey()  - safe to expose to the client; returns ""
//                          when VAPID isn't configured yet so the UI
//                          can show "not yet enabled" instead of crashing.
//   isPushConfigured()   - true when both VAPID env keys are set.
//   sendPushToUser()     - dispatches a notification to every
//                          PushSubscription row for a user. Cleans up
//                          410 Gone subscriptions automatically.

import webpush from "web-push";
import { prisma } from "../db";

let _configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (_configured !== null) return _configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const prv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT;
  if (!pub || !prv) { _configured = false; return false }
  try {
    webpush.setVapidDetails(sub ?? "mailto:support@tweaxly.com", pub, prv);
    _configured = true;
    return true;
  } catch (err) {
    console.error("[push] setVapidDetails failed", err);
    _configured = false;
    return false;
  }
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

export interface PushPayload {
  title:    string;
  body:     string;
  // Deep-link the Service Worker will navigate to on click. Optional
  // (e.g. an informational notification with no specific target).
  url?:     string;
  // Optional severity tag - the SW uses it to choose the icon /
  // tag so identical alerts replace each other in the tray.
  severity?: "critical" | "important" | "info";
  // Free-form data the SW can forward to analytics later.
  tag?:     string;
}

export interface SendResult {
  sent:     number;
  pruned:   number;   // 404/410 subscriptions we cleaned up
  failed:   number;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<SendResult> {
  if (!ensureConfigured()) return { sent: 0, pruned: 0, failed: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, pruned: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0, pruned = 0, failed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.authKey },
        },
        body,
      );
      sent++;
      await prisma.pushSubscription.update({
        where: { id: s.id },
        data:  { lastSeenAt: new Date() },
      }).catch(() => { /* best-effort */ });
    } catch (err) {
      // 404 / 410 = subscription is dead at the push service; clean
      // it up so we don't keep trying every send forever.
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        pruned++;
      } else {
        failed++;
        console.error("[push] send failed", { endpoint: s.endpoint.slice(0, 40) + "…", statusCode, err });
      }
    }
  }));
  return { sent, pruned, failed };
}
