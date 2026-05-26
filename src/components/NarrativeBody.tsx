// Shared narrative renderer used by every long-form AI text surface
// (executive summary, business-profile paragraph, signal detail
// sections, forecast explanation, etc.).
//
// Two things every long block of prose needs on this platform:
//   1. A lead-paragraph split so the user doesn't face a wall of text.
//      The first sentence boundary at/after the 50th word becomes a
//      paragraph break; everything beyond becomes a second block.
//   2. Subtle positive letter-spacing + roomy line-height so the body
//      reads cleanly on dark backgrounds.
//
// Bold-emphasis support: any **phrase** in the source becomes a
// softly-bold span. We never split inside a **…** marker so a bolded
// fragment is never torn across paragraphs.

import type { ReactNode } from "react";

function splitNarrative(text: string): [string, string] {
  if (!text) return [text, ""];
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 50) return [trimmed, ""];

  let cursor = 0;
  let wordsCounted = 0;
  for (const w of words) {
    const idx = trimmed.indexOf(w, cursor);
    if (idx < 0) break;
    cursor = idx + w.length;
    wordsCounted++;
    if (wordsCounted >= 50) break;
  }

  let inEm = false;
  for (let i = cursor; i < trimmed.length; i++) {
    if (trimmed[i] === "*" && trimmed[i + 1] === "*") { inEm = !inEm; i++; continue; }
    if (inEm) continue;
    if (/[.!?]/.test(trimmed[i])) {
      const next = trimmed[i + 1];
      if (next === undefined || /\s/.test(next)) {
        const lead = trimmed.slice(0, i + 1).trim();
        const rest = trimmed.slice(i + 1).trim();
        return rest ? [lead, rest] : [trimmed, ""];
      }
    }
  }
  return [trimmed, ""];
}

function renderWithEmphasis(text: string): ReactNode[] {
  if (!text) return [];
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <strong key={`em-${key++}`} className="font-semibold text-slate-50">
        {m[1]}
      </strong>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function NarrativeBody({
  text,
  // Size variant. "base" matches the dashboard executive summary
  // (text-sm md:text-base). "sm" is for tighter contexts like the
  // signal detail panel sections.
  size = "base",
  // When true, the lead-paragraph split is suppressed and the text
  // renders as a single block. Useful for snippets that are already
  // short (≤ 50 words) or where the layout doesn't have vertical
  // room for two paragraphs.
  noSplit = false,
  className,
}: {
  text: string;
  size?: "base" | "sm";
  noSplit?: boolean;
  className?: string;
}) {
  if (!text) return null;
  const [lead, rest] = noSplit ? [text.trim(), ""] : splitNarrative(text);

  // Typography: positive letter-spacing + roomy line-height. Same
  // values for both size variants so the platform reads consistently.
  // Color is intentionally NOT set here so callers can pick the right
  // slate tone for their surface (slate-100 for accent, slate-200
  // for primary body, slate-300 for secondary). Callers append
  // `text-slate-XXX` via className.
  const baseCls = "leading-[1.7] tracking-[0.01em] space-y-4";
  const sizeCls = size === "sm" ? "text-sm" : "text-sm md:text-base";
  // Default to text-slate-200 only when the caller hasn't passed a
  // text-color override - keeps existing callers working.
  const hasColorOverride = !!className && /\btext-(slate|white|good|warn|bad|accent)/.test(className);
  const colorCls = hasColorOverride ? "" : "text-slate-200";
  const merged  = [baseCls, sizeCls, colorCls, className].filter(Boolean).join(" ");

  return (
    <div className={merged}>
      <p>{renderWithEmphasis(lead)}</p>
      {rest ? <p>{renderWithEmphasis(rest)}</p> : null}
    </div>
  );
}
