// Brand-philosophy block - the same six-step methodology as
// BrandFlow, but rendered as a vertical "how we think" list with
// short imperative sentences. Sits near the bottom of the homepage
// so the methodology bookends the page: introduced as a visual
// flow after the explainer, restated as a philosophy before the
// final CTA.

interface Line { lead: string; tail: string; hlIndex?: number }

const LINES: Line[] = [
  { lead: "Track",    tail: " your business." },
  { lead: "Evaluate", tail: " performance." },
  { lead: "Analyze",  tail: " trends." },
  { lead: "eXecute",  tail: " smarter decisions.", hlIndex: 1 },
  { lead: "Lead",     tail: " with confidence." },
  { lead: "Yield",    tail: " better outcomes." },
];

export default function BrandPhilosophy() {
  return (
    <section
      aria-labelledby="how-tweaxly-works"
      className="container-wide py-20 lg:py-24"
    >
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start max-w-6xl">
        <div className="lg:col-span-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-4">
            How Tweaxly works
          </div>
          <h2
            id="how-tweaxly-works"
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-white"
          >
            One methodology, end to end.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
            Six steps from raw financial data to better business outcomes -
            the philosophy behind every signal, forecast and conversation
            inside the platform.
          </p>
        </div>

        <ul className="lg:col-span-7 space-y-3 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.3] text-white">
          {LINES.map((l) => (
            <li key={l.lead}>
              <span className="text-white">
                {renderLead(l.lead, l.hlIndex)}
              </span>
              <span className="text-slate-400">{l.tail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function renderLead(word: string, hlIndex: number | undefined) {
  if (hlIndex == null) return word;
  return (
    <>
      {word.slice(0, hlIndex)}
      <span className="gradient-text">{word[hlIndex]}</span>
      {word.slice(hlIndex + 1)}
    </>
  );
}
