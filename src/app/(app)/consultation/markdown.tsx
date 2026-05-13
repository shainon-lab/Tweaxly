// Minimal markdown-ish renderer shared by the live Chat view and the
// Chat history accordion. Handles ###, **bold**, _italic_, > blockquote,
// and paragraphs separated by blank lines. Sufficient for advisor output.

import React from "react";

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
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
    } else {
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

export function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  const flushPara = () => {
    if (buf.length) {
      blocks.push(
        <p key={blocks.length} className="text-sm leading-relaxed text-slate-200">
          {inline(buf.join(" "))}
        </p>,
      );
      buf = [];
    }
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
