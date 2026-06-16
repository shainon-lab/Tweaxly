// Mockup of the product's AI Consultation surface. Shows a user
// question, a structured AI response with Reasoning / Answer /
// Next steps, and a row of suggested follow-up questions.

export function ConsultationMock() {
  return (
    <div className="glass product-dark p-5 sm:p-6 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple anim-pulse-soft" />
          <span className="uppercase tracking-wider font-medium text-slate-300">Advisory</span>
          <span className="text-slate-600">·</span>
          <span>Reading your latest numbers</span>
        </div>
        <span className="text-[10px] text-slate-500 tabular-nums">claude-opus-4.7</span>
      </div>

      {/* User message - right aligned */}
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-purple/15 border border-brand-purple/30 px-4 py-2.5 text-sm text-slate-100">
          Why did profitability drop in April?
        </div>
      </div>

      {/* AI response - left aligned, structured */}
      <div className="rounded-2xl rounded-tl-sm border border-line bg-ink-900/60 px-4 py-4 flex flex-col gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-brand-purple font-medium mb-1">Reasoning</div>
          <div className="text-slate-300 leading-relaxed">
            Revenue held flat month-over-month, but two cost lines moved together:
            <span className="text-slate-100 font-medium"> Stripe Atlas +38%</span> and
            <span className="text-slate-100 font-medium"> contractor hours +21%</span>. That's the entire margin compression.
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-brand-purple font-medium mb-1">Answer</div>
          <div className="text-slate-100 leading-relaxed">
            Net margin dropped from <span className="font-semibold tabular-nums">28.1% → 21.4%</span> because of a vendor spike on Stripe Atlas
            and a one-time contractor burst. Recurring base is unchanged.
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-brand-purple font-medium mb-1">Next steps</div>
          <ul className="text-slate-300 leading-relaxed space-y-1 list-disc list-inside marker:text-brand-purple/60">
            <li>Audit the Stripe Atlas line for one-time setup vs. recurring.</li>
            <li>Confirm the contractor burst was project-bound and won't repeat.</li>
            <li>If both hold, May margin recovers to 26–28% without action.</li>
          </ul>
        </div>
      </div>

      {/* Suggested follow-ups */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          "What changed in payroll?",
          "What happens if I hire 2 engineers?",
          "Which expense category is growing fastest?",
        ].map((q) => (
          <button
            key={q}
            className="text-[11px] px-3 py-1.5 rounded-full border border-line bg-ink-900/60 text-slate-300 hover:text-white hover:border-brand-purple/40 transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
