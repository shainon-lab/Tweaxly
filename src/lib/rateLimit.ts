// Tiny in-memory rate limiter - IP-keyed token bucket. Sufficient for
// blocking obvious abuse on auth endpoints (forgot password, reset).
// In a serverless / multi-instance deployment each lambda has its own
// memory, so this is best-effort rather than airtight. Swap for
// Vercel KV / Upstash if you need cross-instance correctness.
//
// Usage:
//   const limited = checkRateLimit({ key: ipFromReq(req), limit: 5,
//                                     windowMs: 15 * 60 * 1000 });
//   if (limited) return NextResponse.json({...}, { status: 429 });

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cur = buckets.get(input.key);
  if (!cur || now >= cur.resetAt) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true };
  }
  if (cur.count >= input.limit) {
    return { ok: false, retryAfterSec: Math.ceil((cur.resetAt - now) / 1000) };
  }
  cur.count += 1;
  return { ok: true };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
