"use client";

// Onboarding wizard — three steps, optimized for Time To First Value.
//
//   0. Welcome — what Tweaxly does, in one sentence.
//   1. Business basics — name, country, base currency, fiscal year
//      (fiscal optional, defaults to January, editable in Settings).
//   2. Data intro — "Start with your bank account." User can either
//      jump into the upload flow OR skip and enter the product. If
//      they skip, every analytics surface renders an empty-state card
//      pointing them back at the bank upload.
//
// What we removed vs the old flow: business stage, financial-history
// Y/N, payroll Y/N, goals multi-select, and the 8-step Business DNA
// wizard. Those used to be required to reach the dashboard; they're
// now post-signup polish that lives in Settings → Business Profile
// for users who want deeper personalization.

import { useState } from "react";
import { ArrowRight, Sparkles, Building2, Upload } from "lucide-react";
import Logo from "@/components/Logo";
import { REGIONS } from "@/lib/regions";

type Business = {
  id: string;
  name: string;
  currency: string;
  country: string | null;
  fiscalStartMonth: number;
};

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "CAD", "AUD", "INR", "JPY", "CHF", "BRL", "MXN", "SGD"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Form = {
  businessName: string;
  currency:     string;
  country:      string;
  fiscalStartMonth: number;
};

export function OnboardingClient({
  business,
  detectedCountry,
}: {
  business: Business;
  detectedCountry: string | null;
}) {
  const [form, setForm] = useState<Form>({
    businessName: business.name,
    currency:     business.currency || "USD",
    country:      business.country ?? detectedCountry ?? "",
    fiscalStartMonth: business.fiscalStartMonth || 1,
  });

  const [step, setStep] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persists the business basics. Always called before we leave step 1
  // so the workspace is saved even if the user bounces out of step 2.
  async function saveBasics(): Promise<boolean> {
    setError(null);
    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName:     form.businessName,
          currency:         form.currency,
          country:          form.country || undefined,
          fiscalStartMonth: form.fiscalStartMonth,
        }),
      });
      if (!res.ok) { setError("Couldn't save your business details. Try again."); return false; }
      return true;
    } catch {
      setError("Network error — check your connection.");
      return false;
    }
  }

  async function continueFromBasics() {
    setBusy(true);
    const ok = await saveBasics();
    setBusy(false);
    if (ok) setStep(2);
  }

  function goUpload() {
    // Lands them on the import flow with the onboarding banner shown.
    window.location.assign("/manual-data?onboarding=1");
  }
  function goDashboard() {
    // Skip path — enter the product, empty states will point back at upload.
    window.location.assign("/dashboard");
  }

  const visibleSteps = [1, 2];
  const visibleIndex = visibleSteps.indexOf(step);

  const canContinue: boolean =
    step === 1 ? form.businessName.trim().length > 0 && form.currency.length === 3 :
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
              subtitle="We use this to label currency, dates, and regional benchmarks. You can change any of this later in Settings."
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country">
                    <select
                      className="input"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="">—</option>
                      {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Base currency">
                    <select
                      className="input"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label={<>Fiscal year starts <span className="text-slate-500 font-normal">(optional)</span></>}>
                  <select
                    className="input"
                    value={form.fiscalStartMonth}
                    onChange={(e) => setForm({ ...form, fiscalStartMonth: Number(e.target.value) })}
                  >
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <div className="text-xs text-slate-500 mt-1">
                    Default is January. Change it any time in Settings.
                  </div>
                </Field>
              </div>
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell
              icon={<Upload size={20} strokeWidth={1.75} />}
              eyebrow="02 · First data"
              title="Start with your bank account."
              subtitle="The fastest way to start using Tweaxly is by uploading the last 3 months of transactions from your business bank account."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-line bg-ink-900/40 p-4">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Your bank account already reflects nearly all business activity: income,
                    expenses, transfers, salaries, subscriptions and credit-card payments.
                  </p>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                    You can upload additional sources later to unlock deeper analysis and
                    improve forecasting accuracy.
                  </p>
                </div>
                <div className="rounded-md border border-line/60 bg-ink-900/20 px-3 py-2 text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">Recommended:</span> 3–12 months of history.
                  <span className="text-slate-500"> · Minimum: 90 days.</span>
                </div>
              </div>
            </StepShell>
          ) : null}

          {step === 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="btn-ghost text-sm"
                disabled={busy}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={continueFromBasics}
                disabled={!canContinue || busy}
                className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Continue"}
                {busy ? null : <ArrowRight size={14} strokeWidth={2} />}
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={goDashboard}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Skip for now — I'll upload later
              </button>
              <button
                type="button"
                onClick={goUpload}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                Upload Bank Statement
                <ArrowRight size={14} strokeWidth={2} />
              </button>
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
        Tweaxly analyzes your business financial activity and turns it into forecasts,
        insights, alerts, and AI-powered recommendations.
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
        Takes about a minute. No credit card required — the Free plan is forever; upgrade only when you need more.
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

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
