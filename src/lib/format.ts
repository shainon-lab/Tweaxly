// Default money format — ALWAYS shows two decimals (including ".00" on whole
// values). This is the right shape almost everywhere because totals tend to
// reconcile to the cent. The one exception is standalone stat tiles where
// the headline number reads better without cents — use fmtMoneyWhole() there.
// Always uses comma thousands separators (en-US locale).
export function fmtMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

// Whole-dollar money — no decimals, ever. For dashboard / stat tiles where
// the user just wants the headline number without cents distracting them.
export function fmtMoneyWhole(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

// Exact-to-cents money — ALWAYS shows two decimals, including ".00" for
// whole values. Use this inside tables so columns of money line up vertically
// and totals reconcile to the cent.
export function fmtMoneyExact(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function fmtMoneySigned(value: number, currency = "USD") {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${fmtMoney(Math.abs(value), currency)}`;
}

export function fmtPct(value: number) {
  if (!isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function ymToLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function todayYM() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function shiftYM(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dateToYM(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
