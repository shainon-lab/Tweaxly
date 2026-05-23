// Deterministic date parsing for the Bank Statement Import Wizard.
//
// Why this exists: `new Date(str)` is locale-dependent and silently picks
// MM/DD vs DD/MM. For financial imports a single misread row can move
// thousands of dollars to the wrong month. The wizard never auto-commits
// — it shows the user 5–10 sample dates and asks them to pick the format
// before we touch their data. This module is the engine behind that step.
//
// Two responsibilities:
//   1. parseDateWithFormat(value, format) → Date | null
//      Strict parser keyed by an exact format string (one of DATE_FORMATS).
//      Rejects impossible dates like "31/04/2026".
//   2. suggestDateFormat(samples) → which format(s) fit the file's data
//      and whether the choice is ambiguous (e.g. all values have day ≤ 12).

export type DateFormat =
  | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY/MM/DD"
  | "DD-MM-YYYY" | "MM-DD-YYYY" | "YYYY-MM-DD"
  | "DD.MM.YYYY" | "MM.DD.YYYY" | "YYYY.MM.DD"
  | "DD/MM/YY"   | "MM/DD/YY";

export const DATE_FORMATS: DateFormat[] = [
  "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD",
  "DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD",
  "DD.MM.YYYY", "MM.DD.YYYY", "YYYY.MM.DD",
  "DD/MM/YY",   "MM/DD/YY",
];

// Map a format string to (separator, ordered tokens).
function decompose(fmt: DateFormat): { sep: string; tokens: ("DD" | "MM" | "YYYY" | "YY")[] } {
  const sep = fmt.includes("/") ? "/" : fmt.includes("-") ? "-" : ".";
  const tokens = fmt.split(sep) as ("DD" | "MM" | "YYYY" | "YY")[];
  return { sep, tokens };
}

// Strict parser. Returns null on:
//   - empty / non-string / wrong number of parts
//   - non-numeric pieces
//   - month not in 1..12
//   - day not valid for that month/year (handles leap years via Date roundtrip)
export function parseDateWithFormat(value: unknown, fmt: DateFormat): Date | null {
  if (value == null) return null;
  // XLSX cellDates: true gives us a Date directly — accept it.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;

  // Allow either / - . as separators (some files mix them); decompose by the
  // canonical separator of the chosen format but split the value on any of
  // the three so "03-04-2026" parses under DD/MM/YYYY too. The format is
  // still authoritative about token *order* — only the punctuation is loose.
  const parts = raw.split(/[\/\-.]/).map((s) => s.trim());
  const { tokens } = decompose(fmt);
  if (parts.length !== tokens.length) return null;

  let day = 0, month = 0, year = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    const piece = parts[i];
    if (!/^\d+$/.test(piece)) return null;
    const n = Number(piece);
    if (tk === "DD")        day = n;
    else if (tk === "MM")   month = n;
    else if (tk === "YYYY") { if (piece.length !== 4) return null; year = n; }
    else if (tk === "YY")   { if (piece.length !== 2) return null; year = n < 50 ? 2000 + n : 1900 + n; }
  }

  if (month < 1 || month > 12) return null;
  if (day < 1   || day > 31)   return null;
  if (year < 1900 || year > 2100) return null;

  // Round-trip via Date.UTC to validate day-vs-month (handles leap years and
  // 31-day vs 30-day months correctly).
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

// Long-form preview for the wizard: "3 April 2026".
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function formatDateLong(d: Date): string {
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Per-format fit on a sample. `parsed` = how many produced a valid Date;
// `total` = how many non-empty sample values were tried; `definitelyFits`
// = at least one sample disambiguated this format vs. the alternatives
// (e.g. a value with day > 12 rules in DD/MM and rules out MM/DD).
export type FormatFit = { format: DateFormat; parsed: number; total: number; definitelyFits: boolean };

export function scoreFormat(samples: unknown[], fmt: DateFormat): FormatFit {
  let parsed = 0;
  let total = 0;
  let definitelyFits = false;
  const { tokens } = decompose(fmt);
  for (const s of samples) {
    if (s == null || s === "") continue;
    total++;
    const d = parseDateWithFormat(s, fmt);
    if (!d) continue;
    parsed++;
    // Disambiguating signal: in DD-first formats, day > 12 means it CAN'T
    // be confused with an MM-first format. Symmetric on the MM side.
    const raw = s instanceof Date ? "" : String(s).trim();
    const parts = raw.split(/[\/\-.]/).map((p) => Number(p));
    if (parts.length === tokens.length) {
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "DD" && parts[i] > 12) definitelyFits = true;
        if (tokens[i] === "MM" && parts[i] > 12) {
          // Month part > 12 is invalid — parseDateWithFormat already
          // returned null above, so we never get here. Listed for clarity.
        }
      }
    }
  }
  return { format: fmt, parsed, total, definitelyFits };
}

// Look at the data and recommend a format. Strategy:
//   1. Score every format against the samples.
//   2. Keep candidates that parse 100% of non-empty samples.
//   3. If exactly one candidate parses all samples AND at least one sample
//      disambiguates → suggest it confidently (ambiguous = false).
//   4. If multiple candidates parse all samples and none stands out → pick
//      a sensible default (prefer DD-first since it's the global majority)
//      and mark ambiguous = true. The wizard surfaces the warning.
//   5. If no candidate parses everything → suggest the best fit and let
//      validation flag the misses.
export function suggestDateFormat(samples: unknown[]): {
  suggested: DateFormat;
  ambiguous: boolean;
  candidates: FormatFit[];
} {
  const scored = DATE_FORMATS.map((f) => scoreFormat(samples, f));
  // No data at all → harmless default; ambiguous flag is meaningless here.
  const totals = scored.find((s) => s.total > 0);
  if (!totals) return { suggested: "YYYY-MM-DD", ambiguous: false, candidates: scored };

  const fullFits = scored.filter((s) => s.total > 0 && s.parsed === s.total);
  const disambiguating = fullFits.filter((s) => s.definitelyFits);

  if (disambiguating.length === 1) {
    return { suggested: disambiguating[0].format, ambiguous: false, candidates: scored };
  }
  if (fullFits.length === 1) {
    // Only one format parses everything; even without DD>12 signal that's
    // a confident pick (e.g. "YYYY-MM-DD" alone fits).
    return { suggested: fullFits[0].format, ambiguous: false, candidates: scored };
  }
  if (fullFits.length > 1) {
    // Multiple work. Prefer DD-first as the global default; the user is
    // shown the warning and the preview so they can flip to MM-first.
    const ddFirst = fullFits.find((s) => s.format.startsWith("DD"));
    return {
      suggested: ddFirst?.format ?? fullFits[0].format,
      ambiguous: true,
      candidates: scored,
    };
  }
  // Nothing parses 100% — return whatever parsed the most.
  const best = scored.reduce((b, s) => (s.parsed > b.parsed ? s : b), scored[0]);
  return { suggested: best.format, ambiguous: true, candidates: scored };
}

// Convenience: rewrite a row's date cell to ISO YYYY-MM-DD so the server-
// side parseDate() has zero ambiguity. Used by the wizard right before
// posting to /api/upload/commit. Bad values are passed through untouched
// so the existing per-row validation still surfaces them.
export function toIsoDate(value: unknown, fmt: DateFormat): unknown {
  const d = parseDateWithFormat(value, fmt);
  if (!d) return value;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
