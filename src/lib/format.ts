// Money formatters. Across the entire app, money is rendered as whole
// dollars - no decimals, ever. KPI tiles, signal cards, dashboards,
// reports, and tables all share this convention so the eye never has
// to parse ".00". The underlying numbers stay precise; only the
// display layer rounds.

export function fmtMoney(value: number, currency = "USD") {
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

// Alias retained for callers that semantically asked for the
// "headline / whole-dollar" form. Behaviour now identical to fmtMoney
// since the app-wide rule is no decimals.
export const fmtMoneyWhole = fmtMoney;

// Alias retained for tables that previously asked for to-the-cent
// precision. The underlying number is still precise; only the display
// rounds. Single source of truth for money formatting now.
export const fmtMoneyExact = fmtMoney;

export function fmtMoneySigned(value: number, currency = "USD") {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${fmtMoney(Math.abs(value), currency)}`;
}

export function fmtPct(value: number) {
  if (!isFinite(value)) return "-";
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
