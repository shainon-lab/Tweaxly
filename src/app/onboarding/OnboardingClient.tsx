"use client";

// Adaptive onboarding wizard. The whole experience is a single client
// component so transitions stay snappy (no full page reloads between
// steps). Saves once at the end via /api/onboarding/save, then sends
// the user to /manual-data (Import Your Business Data).

import { useState } from "react";
import { ArrowRight, Sparkles, Building2, TrendingUp, Target, FileSpreadsheet } from "lucide-react";
import Logo from "@/components/Logo";
import { REGIONS } from "@/lib/regions";

type Business = {
  id: string;
  name: string;
  currency: string;
  country: string | null;
  industry: string | null;
  businessFormat: string | null;
  businessStage: string | null;
  hasAnnualReports: boolean | null;
  paysSalaries: boolean | null;
  goals: string | null;
};

type Stage = "new" | "growing" | "established";
type Format = "sole_prop" | "llc" | "partnership" | "other";

const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: "sole_prop",   label: "Sole Proprietor / Freelancer", hint: "It's just you." },
  { value: "llc",         label: "LLC / Company",                hint: "Registered legal entity." },
  { value: "partnership", label: "Partnership",                  hint: "Two or more owners." },
];

const STAGES: { value: Stage; title: string; hint: string }[] = [
  { value: "new",         title: "New Business",         hint: "No annual financial reports yet." },
  { value: "growing",     title: "Growing Business",     hint: "Existing activity with some financial history." },
  { value: "established", title: "Established Business", hint: "Multiple years of financial activity and reports." },
];

const GOALS: { value: string; label: string }[] = [
  { value: "profitability", label: "Improve profitability" },
  { value: "expenses",      label: "Control expenses" },
  { value: "cashflow",      label: "Forecast cash flow" },
  { value: "trends",        label: "Understand business trends" },
  { value: "growth",        label: "Prepare for growth" },
  { value: "certainty",     label: "Reduce uncertainty" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "CAD", "AUD", "INR", "JPY", "CHF", "BRL", "MXN", "SGD"];

type Form = {
  businessName: string;
  businessFormat: Format | "";
  currency: string;
  country: string;
  industry: string;
  businessStage: Stage | "";
  hasAnnualReports: boolean | null;
  paysSalaries: boolean | null;
  goals: string[];
};

export function OnboardingClient({
  business,
  detectedCountry,
}: {
  business: Business;
  detectedCountry: string | null;
}) {
  const [form, setForm] = useState<Form>({
    businessName:     business.name,
    businessFormat:   (business.businessFormat as Format | null) ?? "",
    currency:         business.currency || "USD",
    country:          business.country ?? detectedCountry ?? "",
    industry:         business.industry ?? "",
    businessStage:    (business.businessStage as Stage | null) ?? "",
    hasAnnualReports: business.hasAnnualReports,
    paysSalaries:     business.paysSalaries,
    goals:            business.goals ? business.goals.split(",").filter(Boolean) : [],
  });

  // Steps:
  //   0 welcome
  //   1 basics
  //   2 stage
  //   3 financial history (skipped if stage='new')
  //   4 payroll
  //   5 goals
  //   6 wrap → demo or save
  const [step, setStep] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adaptive: New Business skips financial history.
  function nextStep() {
    setError(null);
    let next = step + 1;
    if (next === 3 && form.businessStage === "new") next = 4;
    setStep(next);
  }
  function prevStep() {
    setError(null);
    let next = step - 1;
    if (next === 3 && form.businessStage === "new") next = 2;
    setStep(Math.max(0, next));
  }

  function toggleGoal(g: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g],
    }));
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName:     form.businessName,
          businessFormat:   form.businessFormat || undefined,
          currency:         form.currency,
          country:          form.country || undefined,
          industry:         form.industry || undefined,
          businessStage:    form.businessStage || undefined,
          hasAnnualReports: form.hasAnnualReports,
          paysSalaries:     form.paysSalaries,
          goals:            form.goals,
        }),
      });
      if (!res.ok) { setError("Couldn't save your answers. Try again."); setBusy(false); return; }
      // Chain into the Business DNA wizard before showing the manual-
      // data step. Both wizards are short (~2 min each); together
      // they form the new onboarding spine. The DNA wizard
      // self-redirects to /dashboard on completion, so after this
      // chain the user lands on the dashboard.
      window.location.assign("/onboarding/business-profile");
    } catch {
      setError("Network error - check your connection.");
      setBusy(false);
    }
  }

  // Build the visible step list (so progress dots reflect adaptive skip).
  const visibleSteps = form.businessStage === "new" ? [1, 2, 4, 5] : [1, 2, 3, 4, 5];
  const visibleIndex = visibleSteps.indexOf(step);

  // Validation per step → controls Continue enablement.
  const canContinue: boolean =
    step === 1 ? form.businessName.trim().length > 0 :
    step === 2 ? !!form.businessStage :
    step === 3 ? form.hasAnnualReports !== null :
    step === 4 ? form.paysSalaries !== null :
    step === 5 ? form.goals.length > 0 :
                 true;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-tweaxly pt-8 pb-4 flex items-center justify-between">
        <Logo size="md" showTagline />
        {step > 0 ? (
          <div className="flex items-center gap-1.5">
            {visibleSteps.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i <= visibleIndex ? "bg-brand-purple w-8" : "bg-line w-4"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : null}
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          {error ? (
            <div className="mb-4 rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">{error}</div>
          ) : null}

          {step === 0 ? <Welcome onStart={() => setStep(1)} busy={busy} /> : null}

          {step === 1 ? (
            <StepShell
              icon={<Building2 size={20} strokeWidth={1.75} />}
              eyebrow="01 · Business basics"
              title="Tell us about your business."
              subtitle="We use this to label currency, dates, and regional benchmarks."
            >
              <div className="space-y-4">
                <Field label="Business name">
                  <input
                    className="input"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    autoFocus
                  />
                </Field>
                <Field label="Business type">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {FORMATS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setForm({ ...form, businessFormat: f.value })}
                        className={`rounded-lg border p-3 text-left transition ${
                          form.businessFormat === f.value
                            ? "border-brand-purple bg-accent-soft/30"
                            : "border-line hover:border-slate-500"
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-100">{f.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{f.hint}</div>
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Currency">
                    <select
                      className="input"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Country">
                    <select
                      className="input"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="">-</option>
                      {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Industry">
                  <input
                    className="input"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. Digital Agency, SaaS, Retail"
                  />
                </Field>
              </div>
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell
              icon={<TrendingUp size={20} strokeWidth={1.75} />}
              eyebrow="02 · Business stage"
              title="What stage is your business currently in?"
              subtitle="We tailor the signals and forecast tone to where you actually are."
            >
              <div className="space-y-2">
                {STAGES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({ ...form, businessStage: s.value })}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      form.businessStage === s.value
                        ? "border-brand-purple bg-accent-soft/30"
                        : "border-line hover:border-slate-500"
                    }`}
                  >
                    <div className="text-base font-medium text-slate-100">{s.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.hint}</div>
                  </button>
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell
              icon={<FileSpreadsheet size={20} strokeWidth={1.75} />}
              eyebrow="03 · Financial history"
              title="Do you have an annual financial report available?"
              subtitle="Uploading annual reports improves forecasting accuracy and long-term analysis."
            >
              <YesNo
                value={form.hasAnnualReports}
                onChange={(v) => setForm({ ...form, hasAnnualReports: v })}
              />
            </StepShell>
          ) : null}

          {step === 4 ? (
            <StepShell
              icon={<Building2 size={20} strokeWidth={1.75} />}
              eyebrow={form.businessStage === "new" ? "03 · Payroll structure" : "04 · Payroll structure"}
              title="Does your business currently pay salaries?"
              subtitle="If you pay yourself a salary, select 'Yes'."
            >
              <YesNo
                value={form.paysSalaries}
                onChange={(v) => setForm({ ...form, paysSalaries: v })}
              />
            </StepShell>
          ) : null}

          {step === 5 ? (
            <StepShell
              icon={<Target size={20} strokeWidth={1.75} />}
              eyebrow={form.businessStage === "new" ? "04 · Business goals" : "05 · Business goals"}
              title="What would you like to improve most?"
              subtitle="Pick anything that resonates - we'll personalize Quick Overview, Signals, and Consultation around these."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => toggleGoal(g.value)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      form.goals.includes(g.value)
                        ? "border-brand-purple bg-accent-soft/30 text-slate-100"
                        : "border-line text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <span className="font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
            </StepShell>
          ) : null}

          {step > 0 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="btn-ghost text-sm"
                disabled={step <= 1 || busy}
              >
                ← Back
              </button>
              {step === 5 ? (
                <button
                  type="button"
                  onClick={finish}
                  disabled={!canContinue || busy}
                  className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Finish setup"}
                  {busy ? null : <ArrowRight size={14} strokeWidth={2} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinue}
                  className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Welcome({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-soft/30 border border-brand-purple/30 mb-6">
        <Sparkles size={28} strokeWidth={1.5} className="text-brand-purple" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">Welcome to Tweaxly</h1>
      <p className="mt-3 text-base text-slate-300 max-w-md mx-auto">
        AI-powered business intelligence for modern business owners.
      </p>
      <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
        Connect your business activity and start receiving business signals,
        forecasts, and AI-powered consultation.
      </p>

      <div className="mt-8 flex items-center justify-center">
        <button
          type="button"
          onClick={onStart}
          disabled={busy}
          className="btn-primary text-base px-6 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Start setup
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="mt-6 text-xs text-slate-500 max-w-sm mx-auto">
        Takes about 5 minutes. No credit card required - the Free plan is
        forever; upgrade only when you need more.
      </div>
    </div>
  );
}

function StepShell({
  icon, eyebrow, title, subtitle, children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-brand-purple mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-brand-purple/30 bg-accent-soft/30 text-brand-purple">
          {icon}
        </span>
        {eyebrow}
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50 leading-tight">{title}</h2>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-lg border p-5 text-center transition ${
          value === true ? "border-brand-purple bg-accent-soft/30 text-slate-100" : "border-line text-slate-300 hover:border-slate-500"
        }`}
      >
        <div className="text-lg font-semibold">Yes</div>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-lg border p-5 text-center transition ${
          value === false ? "border-brand-purple bg-accent-soft/30 text-slate-100" : "border-line text-slate-300 hover:border-slate-500"
        }`}
      >
        <div className="text-lg font-semibold">No</div>
      </button>
    </div>
  );
}
