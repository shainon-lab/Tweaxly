// Empty-state wrapper used on every workspace page where having zero
// transactions makes the real content meaningless (dashboard,
// forecast, insights, consultation, business signals).
//
// Mirrors the LockedOverlay "blurred-feature behind, CTA card on top"
// pattern used for Pro-only gates - except here the children are
// synthetic preview content (mock KPI cards, mock chart, mock signal
// cards, etc.) so the user gets a sense of what the page WILL show
// once they upload data, plus the "Upload your bank transactions"
// CTA centred on top.

import BankIntelligenceEmptyState from "./BankIntelligenceEmptyState";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Sparkles, AlertTriangle, MessageCircle } from "lucide-react";

type Surface = "dashboard" | "forecast" | "insights" | "consultation" | "signals";

export default function EmptyDataPreview({ surface }: { surface: Surface }) {
  return (
    <div className="relative">
      {/* Blurred mock preview - shows the user what the page will look
          like once they have data, without misrepresenting the
          numbers (the gentle blur signals "this is sample"). */}
      <div
        aria-hidden="true"
        className="blur-sm opacity-60 select-none pointer-events-none"
      >
        <SurfacePreview surface={surface} />
      </div>

      {/* Real CTA card, centred on top. Same component used elsewhere
          on the platform so the upload prompt stays consistent. */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 sm:pt-20 px-4 sm:px-6">
        <div className="max-w-2xl w-full">
          <BankIntelligenceEmptyState surface={surface === "signals" ? undefined : surface} />
        </div>
      </div>
    </div>
  );
}

// ── Per-surface mock content ───────────────────────────────────────

function SurfacePreview({ surface }: { surface: Surface }) {
  switch (surface) {
    case "dashboard":     return <DashboardPreview />;
    case "forecast":      return <ForecastPreview />;
    case "insights":      return <InsightsPreview />;
    case "consultation":  return <ConsultationPreview />;
    case "signals":       return <SignalsPreview />;
  }
}

function DashboardPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Monthly Revenue" value="$48,200" delta="+12.4%" trend="up" icon={<TrendingUp size={14} />} />
        <KpiCard label="Monthly Expenses" value="$32,150" delta="+3.1%" trend="down" icon={<TrendingDown size={14} />} />
        <KpiCard label="Net Income" value="$16,050" delta="+22.8%" trend="up" icon={<BarChart3 size={14} />} />
        <KpiCard label="Cash Position" value="$94,800" delta="+8.2%" trend="up" icon={<Wallet size={14} />} />
      </div>
      <SparklineCard title="Revenue trend · last 6 months" />
      <div className="grid md:grid-cols-2 gap-3">
        <ListCard
          title="Top vendors"
          rows={[
            ["Stripe", "$8,420"],
            ["AWS", "$2,140"],
            ["Slack", "$960"],
            ["Notion", "$320"],
          ]}
        />
        <ListCard
          title="Recent categories"
          rows={[
            ["Software", "$3,860"],
            ["Payroll", "$22,400"],
            ["Marketing", "$4,800"],
            ["Office", "$1,210"],
          ]}
        />
      </div>
    </div>
  );
}

function ForecastPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label="Projected revenue · 3mo" value="$152,800" delta="+9.4%" trend="up" icon={<TrendingUp size={14} />} />
        <KpiCard label="Projected expenses · 3mo" value="$98,300" delta="+2.1%" trend="down" icon={<TrendingDown size={14} />} />
        <KpiCard label="Projected cash · 3mo" value="$148,500" delta="+18.5%" trend="up" icon={<Wallet size={14} />} />
      </div>
      <SparklineCard title="Cash flow forecast · next 6 months" tall />
    </div>
  );
}

function InsightsPreview() {
  return (
    <div className="space-y-4">
      <SparklineCard title="Revenue vs. expenses · monthly" tall />
      <div className="grid md:grid-cols-2 gap-3">
        <ListCard
          title="Top growing categories"
          rows={[
            ["Software", "+38.2%"],
            ["Marketing", "+24.6%"],
            ["Travel", "+18.3%"],
          ]}
        />
        <ListCard
          title="Top shrinking categories"
          rows={[
            ["Office supplies", "-14.1%"],
            ["Subscriptions", "-9.8%"],
            ["Professional fees", "-6.2%"],
          ]}
        />
      </div>
    </div>
  );
}

function ConsultationPreview() {
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          <Sparkles size={12} /> AI Advisor
        </div>
        <Bubble who="user" body="How long can our cash support the business at this pace?" />
        <Bubble who="ai" body="Based on the last 90 days you're netting about $16K per month with $94K in the bank. At the current spending level, your cash could support the business for roughly 18 months. The biggest swing factor is Stripe revenue - it's growing about 12% compared to last month, but Marketing spend is up 24%; if marketing keeps climbing, that 18 months tightens by about 3." />
        <Bubble who="user" body="What should I cut first?" />
        <Bubble who="ai" body="Three subscriptions in your Software category haven't been touched in 60+ days - canceling them would save ~$340/month with no impact. After that I'd review Marketing channels with sub-1.0 ROAS before touching headcount." />
      </div>
    </div>
  );
}

function SignalsPreview() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <SignalCard
          tone="bad"
          title="Marketing spend up 24% with no revenue lift"
          body="Apr marketing rose to $4,800 from $3,870 in Mar. Revenue from new customers held flat - ROAS dropped from 2.1x to 1.6x."
        />
        <SignalCard
          tone="warn"
          title="Stripe payouts arriving 2.4 days slower"
          body="Average settlement window stretched from 1.8 days to 4.2 days over the last 30 days. Worth confirming with Stripe before month-end."
        />
        <SignalCard
          tone="good"
          title="Recurring revenue up 12.4% compared to last month"
          body="Stripe subscription revenue grew $4,180 vs. last month. Customer churn held below 2.1% - the lift is from upsells, not new logos."
        />
        <SignalCard
          tone="info"
          title="3 duplicate vendors in your expense data"
          body={'"AWS", "AWS Inc." and "Amazon Web Services" are likely the same vendor. Merging will improve category roll-ups.'}
        />
        <SignalCard
          tone="bad"
          title="Net margin trending down 4 months in a row"
          body="Net margin slid from 38% in Jan to 33% in Apr. Driven primarily by Payroll growth outpacing Revenue growth."
        />
        <SignalCard
          tone="warn"
          title="Quarterly tax estimate looks short"
          body="At the current pace, set-aside for Q2 estimated taxes is ~$2,400 below the projected liability."
        />
      </div>
    </div>
  );
}

// ── Small skeleton primitives ──────────────────────────────────────

function KpiCard({
  label, value, delta, trend, icon,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon:  React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
        <span>{label}</span>
        <span className={trend === "up" ? "text-good" : "text-bad"}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-white tabular-nums">{value}</div>
      <div className={`mt-1 text-xs font-medium ${trend === "up" ? "text-good" : "text-bad"}`}>
        {delta} vs. last month
      </div>
    </div>
  );
}

function SparklineCard({ title, tall = false }: { title: string; tall?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">{title}</div>
      <svg viewBox="0 0 600 200" className={`w-full ${tall ? "h-56" : "h-32"}`} aria-hidden="true">
        <defs>
          <linearGradient id="edpGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="edpFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#A78BFA" stopOpacity="0.25" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,170 L60,150 L120,160 L180,120 L240,130 L300,90 L360,100 L420,70 L480,60 L540,50 L600,40 L600,200 L0,200 Z" fill="url(#edpFill)" />
        <path d="M0,170 L60,150 L120,160 L180,120 L240,130 L300,90 L360,100 L420,70 L480,60 L540,50 L600,40" stroke="url(#edpGrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">{title}</div>
      <ul className="divide-y divide-line/40">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-200 truncate">{k}</span>
            <span className="text-slate-300 tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ who, body }: { who: "user" | "ai"; body: string }) {
  return who === "user" ? (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl bg-accent-soft text-accent px-3.5 py-2 text-sm leading-relaxed">
        {body}
      </div>
    </div>
  ) : (
    <div className="flex justify-start items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-accent-soft inline-flex items-center justify-center text-accent shrink-0">
        <MessageCircle size={14} />
      </div>
      <div className="max-w-[80%] rounded-2xl border border-line bg-ink-900/60 text-slate-200 px-3.5 py-2 text-sm leading-relaxed">
        {body}
      </div>
    </div>
  );
}

function SignalCard({
  tone, title, body,
}: {
  tone: "bad" | "warn" | "good" | "info";
  title: string;
  body:  string;
}) {
  const palette = tone === "bad" ? { chip: "bg-bad/15 text-bad border-bad/40", icon: <AlertTriangle size={12} /> }
                : tone === "warn" ? { chip: "bg-warn/15 text-warn border-warn/40", icon: <AlertTriangle size={12} /> }
                : tone === "good" ? { chip: "bg-good/15 text-good border-good/40", icon: <TrendingUp size={12} /> }
                : { chip: "bg-accent-soft text-accent border-accent/40", icon: <Sparkles size={12} /> };
  return (
    <div className="card flex flex-col gap-2">
      <div className={`inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider font-semibold ${palette.chip}`}>
        {palette.icon}
        {tone === "bad" ? "Critical" : tone === "warn" ? "Attention" : tone === "good" ? "Positive" : "Insight"}
      </div>
      <div className="text-sm font-semibold text-white leading-snug">{title}</div>
      <div className="text-xs text-slate-300 leading-relaxed">{body}</div>
    </div>
  );
}
