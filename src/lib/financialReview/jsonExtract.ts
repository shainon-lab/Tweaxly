import "server-only";

// Robustly pull a single JSON object out of a model response.
//
// Models wrap structured output in a ```json ... ``` fence, but the
// fence can be missing or unbalanced when the response is cut off at the
// token ceiling. Order of attempts:
//   1. A complete ```json ... ``` (or ``` ... ```) fenced block.
//   2. The substring from the first "{" to the last "}" - recovers
//      complete JSON even when the closing fence was never written.
//   3. Whatever remains after stripping a leading opening fence.
// Genuinely truncated JSON still won't parse; the caller handles that.
export function extractJsonText(text: string): string {
  const t = text.trim();

  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const stripped = t.replace(/^```(?:json)?\s*/i, "");
  const start = stripped.indexOf("{");
  if (start === -1) return stripped.trim();
  const end = stripped.lastIndexOf("}");
  if (end > start) return stripped.slice(start, end + 1).trim();
  return stripped.slice(start).trim();
}

// Parse a model's JSON response, tolerating a missing/unbalanced fence.
// Throws a clear, caller-friendly error when the JSON is genuinely
// incomplete (almost always an output-token truncation).
export function parseModelJson(raw: string, opts?: { truncated?: boolean; engine?: string }): unknown {
  const engine = opts?.engine ?? "engine";
  if (!raw.trim()) throw new Error(`The ${engine} returned an empty response.`);
  const sanitized = raw.replace(/—/g, " - "); // voice rule: no em dashes
  const jsonText = extractJsonText(sanitized);
  try {
    return JSON.parse(jsonText);
  } catch {
    if (opts?.truncated) {
      throw new Error(
        "This analysis was too large to complete in a single pass. Try uploading one statement at a time (for example the profit & loss and the balance sheet separately).",
      );
    }
    throw new Error(`The ${engine} returned a response that could not be read. Please try again.`);
  }
}
