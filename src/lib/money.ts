// Money helpers — every site that does arithmetic on monetary amounts
// MUST go through this module. JS Float arithmetic is fine for the
// kinds of summation we do at SMB scale (no transaction-grade reads
// or writes in the hot path), but every result that lands on a tile,
// table, or export should pass through `roundMoney()` so we never
// surface things like `$1234.5600000001`.
//
// Why we don't (yet) migrate Prisma `Float` → `Decimal`:
// - Touching every `amount: Float` column means rewriting reads /
//   writes across the entire app and re-validating reports.
// - Practical impact at SMB scale is small (no float-drift issues
//   observed in production data so far).
// Tracked as a deferred initiative in docs/financial-data-integrity.md.
// Until then, this module is the single discipline.

// Banker's rounding (round-half-to-even) — the IEEE 754 default and
// the rule used by GAAP/IFRS for financial reporting. Avoids the
// systematic upward bias of round-half-up.
export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const floor  = Math.floor(scaled);
  const diff   = scaled - floor;
  // Half: tie-break toward even.
  if (Math.abs(diff - 0.5) < 1e-9) {
    return (floor % 2 === 0 ? floor : floor + 1) / factor;
  }
  return Math.round(scaled) / factor;
}

// Sum a list of monetary amounts, normalizing each on the way in so
// the running total never accumulates float drift.
export function sumMoney(amounts: Iterable<number>, decimals = 2): number {
  let total = 0;
  for (const a of amounts) {
    if (!Number.isFinite(a)) continue;
    total = roundMoney(total + a, decimals);
  }
  return total;
}

// Multiply two monetary factors (e.g. amount * exchange rate) with a
// rounding pass at the end.
export function multiplyMoney(a: number, b: number, decimals = 2): number {
  return roundMoney(a * b, decimals);
}

// Divide one monetary amount by another (e.g. for ratios). Returns 0
// on divide-by-zero rather than NaN/Infinity so callers don't have to
// guard every site.
export function divideMoney(a: number, b: number, decimals = 4): number {
  if (!b || !Number.isFinite(b)) return 0;
  return roundMoney(a / b, decimals);
}

// True when |a - b| is below the tolerance for monetary equality.
// Use this for reconciliation checks: snapshot vs raw aggregate
// comparisons should not flag a 0.001 drift as a mismatch.
export function moneyEqual(a: number, b: number, tolerance = 0.01): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tolerance;
}

// Smallest representable amount for the given currency. Used for
// "is this effectively zero" checks (treat 0.0099 as 0 for USD).
export function isZero(value: number, tolerance = 0.005): boolean {
  return Math.abs(value) <= tolerance;
}
