import Logo from "../Logo";

export default function Slide16Vision({ total }: { total: number }) {
  return (
    <section
      id="slide-16"
      className="slide relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(70% 70% at 50% 50%, rgba(124,92,250,0.10) 0%, transparent 70%), radial-gradient(60% 60% at 20% 90%, rgba(34,211,238,0.10) 0%, transparent 70%), radial-gradient(60% 60% at 90% 10%, rgba(79,125,255,0.10) 0%, transparent 70%)",
      }}
    >
      <header className="absolute top-0 left-0 right-0 px-8 md:px-16 py-6 flex items-center justify-between">
        <Logo size="md" />
        <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono">
          16 / {String(total).padStart(2, "0")}
        </div>
      </header>

      <div className="container-deck flex-1 flex flex-col justify-center">
        <div className="label-eyebrow mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Long-term vision
        </div>

        <h2 className="text-4xl md:text-7xl font-semibold tracking-tight text-ink-900 leading-[1.05] max-w-5xl">
          Every SMB should have access to{" "}
          <span className="gradient-text">CFO-level intelligence</span>.
        </h2>

        <p className="mt-8 text-xl md:text-2xl text-ink-600 max-w-3xl leading-relaxed">
          Tweaxly becomes the operating intelligence layer for modern businesses — the way every owner reads, predicts, and decides on their company&apos;s future.
        </p>

        <div className="mt-16 flex items-center gap-6">
          <Logo size="lg" />
          <div className="text-base text-ink-500">
            AI financial intelligence for modern businesses.
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 px-8 md:px-16 py-6 flex items-center justify-between text-xs text-ink-500">
        <div>tweaxly.com</div>
        <div>Thank you</div>
      </footer>
    </section>
  );
}
