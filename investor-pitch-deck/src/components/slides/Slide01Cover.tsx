import Logo from "../Logo";

export default function Slide01Cover({ total }: { total: number }) {
  return (
    <section
      id="slide-1"
      className="slide relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(70% 70% at 50% 50%, rgba(124,92,250,0.12) 0%, transparent 70%), radial-gradient(60% 60% at 20% 90%, rgba(34,211,238,0.10) 0%, transparent 70%), radial-gradient(60% 60% at 90% 10%, rgba(79,125,255,0.10) 0%, transparent 70%)",
      }}
    >
      <header className="absolute top-0 left-0 right-0 px-8 md:px-16 py-6 flex items-center justify-between">
        <div /> {/* logo lives in the body for the cover */}
        <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono">
          01 / {String(total).padStart(2, "0")}
        </div>
      </header>

      <div className="container-deck flex-1 flex flex-col justify-center">
        <div className="label-eyebrow mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Investor pitch · 2026
        </div>
        <Logo size="xl" className="mb-8" />
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-ink-900 leading-[1.02] max-w-4xl">
          Business clarity for{" "}
          <span className="gradient-text">smarter decisions</span>.
        </h1>
        <p className="mt-6 text-xl text-ink-600 max-w-2xl">
          AI-powered financial intelligence for small and medium businesses.
        </p>

        <div className="mt-16 flex items-center gap-8">
          <SoftFlow />
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 px-8 md:px-16 py-6 flex items-center justify-between text-xs text-ink-500">
        <div>tweaxly.com</div>
        <div>AI Business Intelligence for Smarter Decisions</div>
      </footer>
    </section>
  );
}

// Subtle abstract flow visual — 3 brand-gradient curves that suggest data
// streams converging.
function SoftFlow() {
  return (
    <svg viewBox="0 0 600 80" className="w-full max-w-2xl text-ink-300" aria-hidden>
      <defs>
        <linearGradient id="cover-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c5cfa" />
          <stop offset="50%" stopColor="#4f7dff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M0 60 Q150 0 300 40 T600 30" fill="none" stroke="url(#cover-g)" strokeWidth="2" />
      <path d="M0 70 Q150 20 300 50 T600 40" fill="none" stroke="url(#cover-g)" strokeOpacity="0.6" strokeWidth="2" />
      <path d="M0 50 Q150 10 300 30 T600 20" fill="none" stroke="url(#cover-g)" strokeOpacity="0.3" strokeWidth="2" />
    </svg>
  );
}
