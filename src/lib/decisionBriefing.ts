// Decision Briefing - turns a raw consultation response (narrative
// content + optional structured payload) into a scannable executive
// briefing with five sections:
//
//   1. Executive Takeaway   - the single most important conclusion
//   2. Decision Anchors     - lightweight scan points (savings target,
//                             best option, highest impact, growth risk,
//                             timing implications)
//   3. AI Reasoning         - the narrative prose, with the option
//                             paragraphs stripped so they don't
//                             duplicate the Strategic Paths section
//   4. Strategic Paths      - each option, ranked into primary /
//                             high-impact / low-impact tiers with
//                             visible coverage of the target
//   5. Risks & Tradeoffs    - collected from each option's tradeoff
//                             text plus any warning callouts in the
//                             narrative
//
// Works for savings-style answers (where payload.horizons is populated)
// AND for free-form answers where only content exists - in that case
// the briefing degrades gracefully: takeaway is the first sentence,
// the rest of the narrative becomes the reasoning, and the structured
// sections collapse out.

export type SavingsOption = {
  title: string;
  monthlySavings: number;
  annualSavings: number;
  tradeoff: string;
  items: { label: string; amount: number; note?: string }[];
};

export type HorizonBlock = {
  label: string;
  months: number;
  monthlyTarget: number;
  totalTarget: number;
  options: SavingsOption[];
};

export type OptionPayload = { horizons?: HorizonBlock[] };

export type DecisionAnchor = {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad" | "neutral";
};

export type PathTier = "primary" | "high_impact" | "low_impact";

export type StrategicPath = {
  tier: PathTier;
  horizonLabel: string;
  horizonMonths: number;
  horizonMonthlyTarget: number;
  option: SavingsOption;
  coveragePct: number; // 0..1
};

export type RiskNote = {
  label: string;
  text: string;
  tone: "warn" | "bad" | "neutral";
};

export type DecisionBriefing = {
  takeaway: { headline: string; subhead?: string } | null;
  anchors: DecisionAnchor[];
  reasoning: string;
  paths: StrategicPath[];
  risks: RiskNote[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function buildDecisionBriefing(
  content: string,
  payloadJson: string | null,
  currency: string,
): DecisionBriefing {
  const payload = parsePayload(payloadJson);
  const horizons = payload.horizons ?? [];

  if (horizons.length === 0) {
    return buildFreeformBriefing(content);
  }

  // Savings-style briefing. Build from the structured horizons.
  const allPaths = rankPaths(horizons);
  const anchors = buildSavingsAnchors(horizons, allPaths, currency);
  const takeaway = buildSavingsTakeaway(horizons, allPaths);
  const reasoning = stripOptionParagraphs(content, horizons);
  const risks = buildRisks(horizons, content);

  return { takeaway, anchors, reasoning, paths: allPaths, risks };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parsePayload(json: string | null): OptionPayload {
  if (!json) return {};
  try { return JSON.parse(json) as OptionPayload; } catch { return {}; }
}

function fmtMoneyShort(value: number, currency: string): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const sym = currencySymbol(currency);
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000)    return `${sign}${sym}${Math.round(abs / 1000)}K`;
  if (abs >= 1_000)     return `${sign}${sym}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

function currencySymbol(ccy: string): string {
  if (ccy === "USD") return "$";
  if (ccy === "EUR") return "€";
  if (ccy === "GBP") return "£";
  if (ccy === "ILS") return "₪";
  if (ccy === "JPY") return "¥";
  return `${ccy} `;
}

// Sort the horizons' options into tiers. Within each horizon:
//   - Primary: the option whose title starts with "Recommended"; if
//     none, the highest-impact option.
//   - High-impact: any non-primary option with monthly savings ≥ 60%
//     of the max within that horizon.
//   - Low-impact: everything else.
function rankPaths(horizons: HorizonBlock[]): StrategicPath[] {
  const out: StrategicPath[] = [];
  for (const h of horizons) {
    if (h.options.length === 0) continue;
    const maxMonthly = Math.max(...h.options.map((o) => o.monthlySavings));
    const primaryIdx =
      h.options.findIndex((o) => /^recommended/i.test(o.title)) !== -1
        ? h.options.findIndex((o) => /^recommended/i.test(o.title))
        : h.options.findIndex((o) => o.monthlySavings === maxMonthly);

    h.options.forEach((o, i) => {
      let tier: PathTier;
      if (i === primaryIdx) tier = "primary";
      else if (o.monthlySavings >= maxMonthly * 0.6) tier = "high_impact";
      else tier = "low_impact";
      const coverage = h.totalTarget > 0
        ? (o.monthlySavings * h.months) / h.totalTarget
        : 0;
      out.push({
        tier,
        horizonLabel: h.label,
        horizonMonths: h.months,
        horizonMonthlyTarget: h.monthlyTarget,
        option: o,
        coveragePct: Math.max(0, Math.min(1, coverage)),
      });
    });
  }
  return out;
}

function buildSavingsTakeaway(
  horizons: HorizonBlock[],
  paths: StrategicPath[],
): { headline: string; subhead?: string } | null {
  const primary = paths.find((p) => p.tier === "primary");
  if (!primary) return null;
  const h = horizons[0];
  const headline = /^recommended/i.test(primary.option.title)
    ? `Take the ${primary.option.title.toLowerCase()} path.`
    : `Lead with ${primary.option.title}.`;
  const coverage = Math.round(primary.coveragePct * 100);
  const subhead =
    coverage >= 90
      ? `Covers the full ${h.label.toLowerCase()} target on its own.`
      : coverage >= 50
        ? `Covers ~${coverage}% of the ${h.label.toLowerCase()} target - combine with one more lever to close the gap.`
        : `Covers ~${coverage}% of the ${h.label.toLowerCase()} target on its own - you'll need to stack it with another path to close the gap.`;
  return { headline, subhead };
}

function buildSavingsAnchors(
  horizons: HorizonBlock[],
  paths: StrategicPath[],
  currency: string,
): DecisionAnchor[] {
  const anchors: DecisionAnchor[] = [];
  const h = horizons[0];
  if (!h) return anchors;

  anchors.push({
    label: "Savings Target",
    value: `${fmtMoneyShort(h.totalTarget, currency)} over ${h.months}mo`,
    tone: "neutral",
  });

  const primary = paths.find((p) => p.tier === "primary");
  if (primary) {
    anchors.push({
      label: "Best Balance",
      value: primary.option.title,
      tone: "good",
    });
  }

  // Highest impact = option with largest monthly savings within the
  // first horizon (different from the primary recommendation when
  // the primary is a "Recommended mix").
  const byImpact = paths
    .filter((p) => p.horizonLabel === h.label)
    .sort((a, b) => b.option.monthlySavings - a.option.monthlySavings);
  const top = byImpact[0];
  if (top && (!primary || top.option.title !== primary.option.title)) {
    anchors.push({
      label: "Highest Impact",
      value: top.option.title,
      tone: "warn",
    });
  }

  // Growth risk - derived from any option whose tradeoff explicitly
  // talks about acquisition, growth, or revenue slowdown.
  const growthOption = h.options.find((o) =>
    /acquisition|slow new|revenue dip|new-customer|hurt growth/i.test(o.tradeoff),
  );
  if (growthOption) {
    anchors.push({
      label: "Growth Risk",
      value: `${growthOption.title} may slow acquisition`,
      tone: "warn",
    });
  }

  // Timing - derived from the headcount option's tradeoff (the one
  // that typically mentions "weeks" before savings materialize).
  const timingOption = h.options.find((o) => /\d+\s*[–-]\s*\d+\s*weeks?/i.test(o.tradeoff));
  if (timingOption) {
    const m = timingOption.tradeoff.match(/(\d+\s*[–-]\s*\d+\s*weeks?)/i);
    if (m) {
      anchors.push({
        label: "Payroll Timing",
        value: `${m[1]} to materialize`,
        tone: "neutral",
      });
    }
  }

  return anchors.slice(0, 5);
}

function buildRisks(horizons: HorizonBlock[], content: string): RiskNote[] {
  const risks: RiskNote[] = [];
  // Per-option tradeoffs.
  for (const h of horizons) {
    for (const o of h.options) {
      if (!o.tradeoff) continue;
      const tone: RiskNote["tone"] =
        /risk|hurt|slow|disrupt|delay|materialize|severance|backfill|productivity gap/i.test(o.tradeoff)
          ? "warn"
          : "neutral";
      risks.push({ label: o.title, text: o.tradeoff, tone });
    }
  }
  // Any warning callout in the narrative - typically prefixed with ⚠
  // or "Over the X horizon..." short-of-target text.
  const warnLines = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) =>
      /^⚠/.test(line) ||
      /^over\s+(the\s+)?\w+,?\s+the\s+strongest\s+single\s+strategy/i.test(line) ||
      /short of the/i.test(line),
    );
  for (const line of warnLines) {
    risks.push({
      label: "Coverage warning",
      text: line.replace(/^⚠\s*/, "").trim(),
      tone: "bad",
    });
  }
  return risks;
}

// Strip the inline option paragraphs from the narrative so the
// "AI Reasoning" prose doesn't duplicate what the Strategic Paths
// section already renders.
function stripOptionParagraphs(content: string, horizons: HorizonBlock[]): string {
  if (horizons.length === 0) return content;
  const optionTitles = new Set<string>();
  for (const h of horizons) {
    for (const o of h.options) optionTitles.add(o.title);
  }
  // Each option paragraph in the current advisor output starts with
  // **Option Title** - at the head of a line. Split on double-newline
  // paragraphs and drop any that start with one of the option titles.
  const paragraphs = content.split(/\n\n+/);
  const kept = paragraphs.filter((p) => {
    const stripped = p.trim();
    for (const title of optionTitles) {
      if (
        stripped.startsWith(`**${title}**`) ||
        stripped.startsWith(title + " -") ||
        stripped.startsWith(title + "-")
      ) {
        return false;
      }
    }
    return true;
  });
  // Also strip the warning callout - it lives under "Risks & Tradeoffs".
  const withoutWarnings = kept.filter((p) => !/^⚠/.test(p.trim()));
  // Also strip the trailing disclaimer about "ranked cost data only".
  const withoutDisclaimer = withoutWarnings.filter(
    (p) => !/built on ranked cost data only/i.test(p),
  );
  return withoutDisclaimer.join("\n\n").trim();
}

// Strip markdown syntax that has no business showing in a plain-text
// surface (the Executive Takeaway renders as a normal <div>, not
// through renderMarkdown - so things like "### " or "**bold**" come
// through verbatim unless we sand them off here).
function stripMarkdownSyntax(s: string): string {
  return s
    // Drop ATX heading prefixes ("#", "##", "###", up to "######").
    .replace(/^#{1,6}\s+/, "")
    // **bold** → bold
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    // _italic_ → italic
    .replace(/_([^_]+)_/g, "$1")
    // *italic* → italic (single-asterisk variant the advisor sometimes
    // emits even though we don't render it elsewhere).
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

function buildFreeformBriefing(content: string): DecisionBriefing {
  // When there's no structured payload we still produce a briefing
  // shape: pull the first sentence as the takeaway headline, keep
  // the rest as reasoning, and leave the structured sections empty.
  const trimmed = content.trim();
  if (!trimmed) {
    return { takeaway: null, anchors: [], reasoning: "", paths: [], risks: [] };
  }
  // Match the first sentence followed by trailing whitespace. Slicing
  // by the match length (instead of split → slice → join) preserves
  // the original paragraph breaks in `rest`, so the History viewer's
  // renderMarkdown still gets `\n\n`-separated paragraphs to work
  // with and doesn't have to reconstruct rhythm from a flattened
  // one-liner.
  const m = trimmed.match(/^([^.!?]+[.!?])(\s+|$)/);
  if (!m) {
    return {
      takeaway: { headline: stripMarkdownSyntax(trimmed) },
      anchors: [],
      reasoning: "",
      paths: [],
      risks: [],
    };
  }
  const first = stripMarkdownSyntax(m[1]);
  const rest  = trimmed.slice(m[0].length).trim();
  return {
    takeaway: { headline: first },
    anchors: [],
    reasoning: rest,
    paths: [],
    risks: [],
  };
}
