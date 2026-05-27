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
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={parts.length} className="font-semibold text-slate-100">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("_")) {
      parts.push(
        <em key={parts.length} className="text-slate-400">
          {tok.slice(1, -1)}
        </em>,
      );
    } else {
      // Single-asterisk italic. Renders the same as the underscore
      // variant; we strip the markers so users never see literal *.
      parts.push(
        <em key={parts.length} className="text-slate-400">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
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
