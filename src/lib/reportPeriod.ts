// Monthly-report period helpers. Supports three granularities — month,
// quarter, year — each represented by a stable string anchor:
//
//   month   → "YYYY-MM"           e.g. "2026-05"
//   quarter → "YYYY-Q{1..4}"      e.g. "2026-Q2"
//   year    → "YYYY"              e.g. "2026"
//
// A period resolves to an inclusive YM range usable with
// buildPeriodAggregate(). shiftPeriod() rolls back to the prior period of
// the same granularity (used to build comparison columns).

import { shiftYM, todayYM, ymToLabel } from "./format";

export type Granularity = "month" | "quarter" | "year";

export type PeriodSpec = {
  granularity: Granularity;
  anchor: string;
  fromYM: string;
  toYM: string;
  label: string;
};

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function resolvePeriod(granularity: Granularity, anchor: string): PeriodSpec {
  if (granularity === "month") {
    if (!/^\d{4}-\d{2}$/.test(anchor)) anchor = todayYM();
    return {
      granularity, anchor,
      fromYM: anchor, toYM: anchor,
      label: ymToLabel(anchor),
    };
  }
  if (granularity === "quarter") {
    const m = anchor.match(/^(\d{4})-Q([1-4])$/);
    let year: number, q: number;
    if (m) { year = Number(m[1]); q = Number(m[2]); }
    else {
      const t = todayYM().split("-").map(Number);
      year = t[0]; q = Math.ceil(t[1] / 3);
    }
    const startMonth = (q - 1) * 3 + 1;
    const fromYM = `${year}-${pad2(startMonth)}`;
    const toYM = `${year}-${pad2(startMonth + 2)}`;
    return {
      granularity, anchor: `${year}-${QUARTER_LABELS[q - 1]}`,
      fromYM, toYM,
      label: `${QUARTER_LABELS[q - 1]} ${year}`,
    };
  }
  // year
  const y = /^\d{4}$/.test(anchor) ? anchor : todayYM().slice(0, 4);
  return {
    granularity, anchor: y,
    fromYM: `${y}-01`, toYM: `${y}-12`,
    label: y,
  };
}

// Shift an anchor back by `n` whole periods of its granularity.
export function shiftPeriod(granularity: Granularity, anchor: string, n: number): string {
  if (n === 0) return anchor;
  if (granularity === "month") {
    return shiftYM(anchor, -n);
  }
  if (granularity === "quarter") {
    const m = anchor.match(/^(\d{4})-Q([1-4])$/);
    if (!m) return anchor;
    let year = Number(m[1]);
    let q = Number(m[2]);
    q -= n;
    while (q < 1) { q += 4; year -= 1; }
    while (q > 4) { q -= 4; year += 1; }
    return `${year}-${QUARTER_LABELS[q - 1]}`;
  }
  // year
  const y = /^\d{4}$/.test(anchor) ? Number(anchor) : new Date().getUTCFullYear();
  return String(y - n);
}

// Today's anchor for each granularity — used as the default.
export function defaultAnchor(granularity: Granularity): string {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  if (granularity === "month") return `${year}-${pad2(month)}`;
  if (granularity === "quarter") return `${year}-${QUARTER_LABELS[Math.ceil(month / 3) - 1]}`;
  return String(year);
}

export function isValidGranularity(g: string | undefined | null): g is Granularity {
  return g === "month" || g === "quarter" || g === "year";
}
