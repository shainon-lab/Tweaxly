// Minimal markdown-ish renderer shared by the live Chat view and the
// Chat history viewer. Handles ###, **bold**, _italic_, > blockquote,
// and paragraphs separated by blank lines. Sufficient for advisor
// output.
//
// Paragraphs longer than ~50 words are auto-split at the next sentence
// boundary so neither the live consult nor the history surface ever
// renders a wall of unbroken text - the advisor sometimes ships its
// reasoning as one long paragraph and that was making the History tab
// in particular hard to read.

import React from "react";

// Soft target for paragraph length. Once a running word count crosses
// this number we break at the next period / question mark / exclamation
// mark followed by whitespace. 35 words ≈ 2-3 sentences at typical
// advisor sentence length, which keeps the History view readable
// instead of producing dense walls of text.
const PARAGRAPH_TARGET_WORDS = 35;

// Quality-metric phrases the advisor sprinkles through its prose
// ("Confidence 82% · data coverage high · forecast reliability medium").
// They're load-bearing trust signals and benefit from a splash of
// color so the eye finds them in a long paragraph. Each pattern picks
// a tone based on the value:
//   high / ≥80%  → good
//   medium / 60-79% → warn
//   low / <60%   → bad
type MetricTone = "good" | "warn" | "bad";

const METRIC_PATTERNS: {
  re: RegExp;
  classify: (captures: RegExpMatchArray) => MetricTone | null;
}[] = [
  {
    // "Confidence 82%", "confidence 82 %", etc.
    re: /\bconfidence\s+(\d{1,3})\s*%/gi,
    classify: (m) => {
      const n = parseInt(m[1], 10);
      if (!Number.isFinite(n)) return null;
      if (n >= 80) return "good";
      if (n >= 60) return "warn";
      return "bad";
    },
  },
  {
    // "data coverage high|medium|low", "coverage high|...", "forecast
    // reliability high|...", "reliability high|...".
    re: /\b(?:data\s+coverage|coverage|forecast\s+reliability|reliability)\s+(high|medium|low)\b/gi,
    classify: (m) => {
      const level = m[1].toLowerCase();
      if (level === "high")   return "good";
      if (level === "medium") return "warn";
      if (level === "low")    return "bad";
      return null;
    },
  },
];

// Scan a string for known quality-metric phrases and return their
// non-overlapping match ranges with the right tone.
function findMetricMatches(text: string): { start: number; end: number; tone: MetricTone }[] {
  const out: { start: number; end: number; tone: MetricTone }[] = [];
  for (const { re, classify } of METRIC_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tone = classify(m);
      if (tone) out.push({ start: m.index, end: m.index + m[0].length, tone });
    }
  }
  out.sort((a, b) => a.start - b.start);
  // Drop overlaps (keep the earliest match when two patterns collide).
  const filtered: typeof out = [];
  let cursor = 0;
  for (const seg of out) {
    if (seg.start < cursor) continue;
    filtered.push(seg);
    cursor = seg.end;
  }
  return filtered;
}

// Walks a string, wrapping metric-phrase ranges in tone-colored spans
// and leaving the rest as plain text nodes. Used INSIDE inline() so
// metrics get colorized whether they appear in plain text or inside an
// emphasis span.
function colorizeMetrics(text: string, keyPrefix: string): React.ReactNode[] {
  const matches = findMetricMatches(text);
  if (matches.length === 0) return [text];
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const seg = matches[i];
    if (seg.start > cursor) out.push(text.slice(cursor, seg.start));
    const cls =
      seg.tone === "good" ? "text-good font-semibold" :
      seg.tone === "warn" ? "text-warn font-semibold" :
                            "text-bad  font-semibold";
    out.push(
      <span key={`${keyPrefix}-m${i}`} className={cls}>
        {text.slice(seg.start, seg.end)}
      </span>,
    );
    cursor = seg.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match order matters - **bold** must be tried before single-*
  // italic so we don't accidentally split a `**` token into two
  // single-asterisk italics. _italic_ is the underscore variant.
  // *italic* is the single-asterisk variant the advisor often uses
  // for inline labels like *Data:* and *Important missing data:*.
  const re = /(\*\*[^*]+\*\*|_[^_]+_|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      parts.push(...colorizeMetrics(plain, `p${parts.length}`));
    }
    const tok = m[0];
    if (tok.startsWith("**")) {
      const inner = tok.slice(2, -2);
      parts.push(
        <strong key={parts.length} className="font-semibold text-slate-100">
          {colorizeMetrics(inner, `b${parts.length}`)}
        </strong>,
      );
    } else if (tok.startsWith("_")) {
      const inner = tok.slice(1, -1);
      parts.push(
        <em key={parts.length} className="text-slate-400">
          {colorizeMetrics(inner, `i${parts.length}`)}
        </em>,
      );
    } else {
      // Single-asterisk italic. Renders the same as the underscore
      // variant; we strip the markers so users never see literal *.
      const inner = tok.slice(1, -1);
      parts.push(
        <em key={parts.length} className="text-slate-400">
          {colorizeMetrics(inner, `s${parts.length}`)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) {
    const tail = text.slice(last);
    parts.push(...colorizeMetrics(tail, `t${parts.length}`));
  }
  return parts;
}

// Split a single long paragraph into smaller paragraph-sized chunks at
// sentence boundaries. Each chunk grows until its running word count
// crosses PARAGRAPH_TARGET_WORDS, at which point the NEXT sentence
// boundary closes the chunk. Returns one entry if the input is already
// short enough.
function splitLongParagraph(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.split(/\s+/).length <= PARAGRAPH_TARGET_WORDS) return [trimmed];

  // Capture sentences with their terminating punctuation. Anything
  // without a terminator at the end (e.g. trailing fragment) lands
  // in the final group.
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [trimmed];

  const out: string[] = [];
  let buf: string[] = [];
  let count = 0;
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    buf.push(s);
    count += s.split(/\s+/).length;
    if (count >= PARAGRAPH_TARGET_WORDS) {
      out.push(buf.join(" "));
      buf = [];
      count = 0;
    }
  }
  if (buf.length) out.push(buf.join(" "));
  return out;
}

export function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  const flushPara = () => {
    if (!buf.length) return;
    const joined = buf.join(" ");
    // Each "paragraph" the source emitted may itself be too long; the
    // 50-word split handles that case. Short paragraphs come back as
    // a single-element array, so the loop is safe either way.
    for (const chunk of splitLongParagraph(joined)) {
      blocks.push(
        <p key={blocks.length} className="text-sm leading-[1.7] tracking-[0.01em] text-slate-200">
          {inline(chunk)}
        </p>,
      );
    }
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushPara();
      blocks.push(
        <h3 key={blocks.length} className="text-base font-semibold mt-2 mb-1">
          {inline(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      flushPara();
      blocks.push(
        <blockquote
          key={blocks.length}
          className="border-l-2 border-accent/60 pl-3 py-1 text-sm text-slate-300 bg-accent-soft/30 rounded-r"
        >
          {inline(line.slice(2))}
        </blockquote>,
      );
    } else if (line === "") {
      flushPara();
    } else {
      buf.push(line);
    }
  }
  flushPara();
  return blocks;
}
