// Tweaxly methodology - "Track → Evaluate → Analyze → eXecute →
// Lead → Yield". This is a brand framework that lives alongside
// the slogan ("Your AI Business Pulse"), not as an acronym for
// the company name. Used as supporting messaging on the homepage
// and the /features hub - never as the primary value prop.
//
// Visual design notes:
//   • Horizontal six-step flow on lg+; vertical stack on mobile.
//   • Steps connected by a thin gradient line (purple → teal).
//   • Each step: a soft dot, the word, a single-line microcopy.
//   • Hover lifts and glows the word + dot - subtle, premium.
//   • The X in "eXecute" is rendered with the brand gradient to
//     visually echo the SplitX in the Tweaxly logo.

interface Step {
  word:     string;
  sub:      string;
  // Index (0-based) of the character in `word` to render with the
  // brand gradient. Only set for "eXecute" so the X echoes the
  // logo's SplitX.
  hlIndex?: number;
}

const STEPS: Step[] = [
  { word: "Track",    sub: "Monitor your business live" },
  { word: "Evaluate", sub: "Understand what changed" },
  { word: "Analyze",  sub: "Reveal hidden patterns" },
  { word: "eXecute",  sub: "Take action faster", hlIndex: 1 },
  { word: "Lead",     sub: "Make confident decisions" },
  { word: "Yield",    sub: "Improve business outcomes" },
];

interface BrandFlowProps {
  // Optional eyebrow above the flow. Defaults to "The Tweaxly methodology".
  eyebrow?: string;
  // Optional H2-style headline. Defaults to a balanced phrase.
  headline?: string;
  // When true, render with a `<h2>` headline; when false, a `<p>` so the
  // flow doesn't introduce a competing heading on pages that already
  // own their H2 hierarchy.
  asSection?: boolean;
}

export default function BrandFlow({
  eyebrow  = "The Tweaxly methodology",
  headline = "Six steps from raw financial data to better business outcomes.",
  asSection = true,
}: BrandFlowProps) {
  const Heading = asSection ? "h2" : "p";
  return (
    <section
      aria-labelledby="brand-flow-heading"
      className="container-wide py-16 lg:py-24"
    >
      <div className="max-w-3xl mb-10 lg:mb-12">
        <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
          {eyebrow}
        </div>
        <Heading
          id="brand-flow-heading"
          className={
            asSection
              ? "text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15] text-[color:var(--color-ink-strong)]"
              : "text-lg text-slate-700 leading-relaxed"
          }
        >
          {headline}
        </Heading>
      </div>

      {/* The flow.
          On lg+ it's six columns in a row, connected by a thin
          gradient line that runs across the dot strip. On mobile,
          columns collapse to a vertical list and the connecting
          line is hidden (visually noisy in a stack). */}
      <ol className="brand-flow-list relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-y-8 gap-x-4 lg:gap-x-2">
        {STEPS.map((s, i) => (
          <li key={s.word} className="brand-flow-step relative">
            {/* Connecting line - only between steps on lg+. */}
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="brand-flow-line hidden lg:block"
              />
            ) : null}

            {/* Dot */}
            <span
              aria-hidden="true"
              className="brand-flow-dot"
            />

            {/* Word */}
            <div className="brand-flow-word mt-4 text-lg sm:text-xl font-semibold tracking-tight text-[color:var(--color-ink-strong)]">
              {renderWordWithHighlight(s.word, s.hlIndex)}
            </div>

            {/* Microcopy */}
            <div className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-[14rem]">
              {s.sub}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Render the word with a single character highlighted using the
// brand gradient. Used so "eXecute" gets a gradient X that echoes
// the SplitX in the Tweaxly logo.
function renderWordWithHighlight(word: string, hlIndex: number | undefined) {
  if (hlIndex == null) return word;
  return (
    <>
      {word.slice(0, hlIndex)}
      <span className="gradient-text">{word[hlIndex]}</span>
      {word.slice(hlIndex + 1)}
    </>
  );
}
