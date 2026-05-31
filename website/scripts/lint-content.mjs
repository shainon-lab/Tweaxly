#!/usr/bin/env node
// scripts/lint-content.mjs — Learning Center internal-linking linter.
//
// Walks every article TSX file in src/content/resources and reports
// per-file warnings when the internal link density falls below the
// GEO spec's minimum:
//
//     >= 4 internal article links
//     >= 5 glossary links
//     >= 1 category link
//
// Glossary entries (kind: "glossary") are linted with a relaxed
// floor because a glossary page is structurally smaller than an
// article and wouldn't naturally carry 4 article links.
//
// Warn-only: this script never exits non-zero. The point is to
// surface gaps so authors can backfill links over time, not to
// block ships. Wired into the website's `prebuild` script so it
// runs on every Vercel build and shows up in the build log.

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "content", "resources");

// Per-article minimum link counts. Adjust here when the spec
// changes - everything downstream reads from these constants.
const THRESHOLDS = {
  article:  { articleLinks: 4, glossaryLinks: 5, categoryLinks: 1 },
  // Glossary entries are short by design; relax the article-link
  // floor (a one-line definition can't sustain 4 inbound article
  // links naturally). Keep glossary + category floors meaningful
  // so each term still cross-references its peers.
  glossary: { articleLinks: 1, glossaryLinks: 3, categoryLinks: 1 },
};

// Skip these source files - they're either non-article registries
// or supporting code, not content to lint.
const SKIP_FILES = new Set([
  "index.ts",
  "index.tsx",
  "types.ts",
  "relations.ts",
]);

async function main() {
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  const files = entries
    .filter((d) => d.isFile() && !SKIP_FILES.has(d.name))
    .filter((d) => d.name.endsWith(".tsx") || d.name.endsWith(".ts"));

  if (files.length === 0) {
    console.log("[lint-content] no content files found");
    return;
  }

  let warnings = 0;
  let scanned  = 0;
  for (const f of files) {
    const path = join(CONTENT_DIR, f.name);
    const text = await readFile(path, "utf8");
    const isGlossary = f.name.startsWith("glossary-")
      || /\bkind:\s*["']glossary["']/.test(text);
    const counts = countLinks(text);
    const limits = isGlossary ? THRESHOLDS.glossary : THRESHOLDS.article;
    const gaps = [];
    if (counts.articleLinks  < limits.articleLinks)  gaps.push(`articles ${counts.articleLinks}/${limits.articleLinks}`);
    if (counts.glossaryLinks < limits.glossaryLinks) gaps.push(`glossary ${counts.glossaryLinks}/${limits.glossaryLinks}`);
    if (counts.categoryLinks < limits.categoryLinks) gaps.push(`categories ${counts.categoryLinks}/${limits.categoryLinks}`);
    scanned++;
    if (gaps.length === 0) continue;
    warnings++;
    console.warn(
      `[lint-content] WARN ${f.name}  (${isGlossary ? "glossary" : "article"})  ${gaps.join("  ·  ")}`
    );
  }

  if (warnings === 0) {
    console.log(`[lint-content] ${scanned} file(s) scanned, all meet link thresholds`);
  } else {
    console.warn(
      `[lint-content] ${warnings} of ${scanned} file(s) below link thresholds. Build continues - warnings only.`
    );
  }
}

// Count `/resources/...` hrefs in a TSX file and classify each as
// an article link, a glossary link, or a category link by the
// shape of the path. Plain text inside markdown / JSX is ignored;
// we only count things authors wrote as actual hyperlinks.
function countLinks(source) {
  const hrefs = [];
  // Match href="..." and href={`...`} - the two patterns authors
  // use in TSX. Single-quoted variant rare; tolerate it anyway.
  const re = /href\s*=\s*[{"'`]([^"'`}\s]+)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    hrefs.push(m[1]);
  }

  let articleLinks  = 0;
  let glossaryLinks = 0;
  let categoryLinks = 0;
  for (const h of hrefs) {
    // Internal resource links only - skip external, anchors, etc.
    if (!h.startsWith("/resources")) continue;
    const parts = h.replace(/^\/+|\/+$/g, "").split("/");
    // parts[0] === "resources", parts[1] === category, parts[2] === slug
    if (parts.length === 2) {
      // /resources/<category>
      categoryLinks++;
    } else if (parts.length >= 3) {
      // /resources/<category>/<slug> - article or glossary.
      // Glossary entries live in the business-glossary category OR
      // have slugs that start with "glossary-" inside other
      // categories.
      const cat  = parts[1];
      const slug = parts[2];
      if (cat === "business-glossary" || slug.startsWith("glossary-")) {
        glossaryLinks++;
      } else {
        articleLinks++;
      }
    }
  }
  return { articleLinks, glossaryLinks, categoryLinks };
}

main().catch((err) => {
  // Even on a script-level crash, never fail the build.
  console.warn("[lint-content] linter crashed; continuing build:", err.message);
});
