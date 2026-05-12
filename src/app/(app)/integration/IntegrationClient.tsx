"use client";
import { useState } from "react";
import Link from "next/link";

type Provider = {
  id: string;
  name: string;
  category: "payments" | "banking" | "accounting" | "ecommerce";
  description: string;
  // Short, plain-text "logo" (avoids needing image assets in MVP).
  logo: string;
  // Provider-specific export instructions for the manual fallback.
  exportTip: string;
};

const PROVIDERS: Provider[] = [
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    description: "Payment, subscription, and payout transactions.",
    logo: "S",
    exportTip:
      "From Stripe Dashboard → Payments → Export, download a CSV of completed payments and refunds.",
  },
  {
    id: "paypal",
    name: "PayPal",
    category: "payments",
    description: "Sales, fees, and refunds across PayPal accounts.",
    logo: "P",
    exportTip:
      "From PayPal → Activity → Statements, download the monthly transactions CSV (not the PDF).",
  },
  {
    id: "square",
    name: "Square",
    category: "payments",
    description: "In-person and online payments + processing fees.",
    logo: "▢",
    exportTip:
      "From Square Dashboard → Reports → Transactions, export to CSV with itemized fees.",
  },
  {
    id: "plaid",
    name: "Plaid (bank connections)",
    category: "banking",
    description:
      "Connect any of 12,000+ banks and pull account-level transactions.",
    logo: "≡",
    exportTip:
      "Most banks let you export a transaction CSV from your statement page. Use it as Financial Activity in Manual Data.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    description: "Sync your books, vendors, and chart of accounts.",
    logo: "Q",
    exportTip:
      "From QuickBooks → Reports → Transaction List by Date, export as CSV.",
  },
  {
    id: "xero",
    name: "Xero",
    category: "accounting",
    description: "Sync transactions, contacts, and tracking categories.",
    logo: "X",
    exportTip:
      "From Xero → Accounting → Reports → Account Transactions, export as CSV.",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "ecommerce",
    description: "Order revenue, refunds, and platform fees.",
    logo: "🛍",
    exportTip:
      "From Shopify Admin → Orders → Export, choose 'All transactions' and CSV format.",
  },
];

const CATEGORY_LABEL: Record<Provider["category"], string> = {
  payments: "Payments",
  banking: "Banking",
  accounting: "Accounting",
  ecommerce: "E-commerce",
};

export default function IntegrationClient() {
  const [active, setActive] = useState<Provider | null>(null);
  const [emailNotify, setEmailNotify] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function open(p: Provider) {
    setActive(p);
    setEmailNotify("");
    setSubmitted(false);
  }

  function close() {
    setActive(null);
    setEmailNotify("");
    setSubmitted(false);
  }

  function submitInterest() {
    // For MVP we don't actually persist the email — we'd hook this up to a
    // real waitlist/notification backend when the integration ships.
    setSubmitted(true);
  }

  // Group providers by category for display
  const byCategory = PROVIDERS.reduce<Record<string, Provider[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <span className="pill-accent shrink-0 mt-0.5">heads-up</span>
          <div className="text-sm text-slate-200 leading-relaxed">
            <span className="font-medium">Direct integrations are on the roadmap.</span>{" "}
            We're wiring up OAuth and per-provider sync. In the meantime, every provider below has a clean export-to-CSV path —{" "}
            <Link href="/manual-data" className="text-accent hover:underline">
              import from the Manual Data tab
            </Link>{" "}
            and the data flows into your dashboard, forecast, and consultation just like an integrated source would.
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(byCategory) as Provider["category"][]).map((cat) => (
          <div key={cat}>
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              {CATEGORY_LABEL[cat]}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {byCategory[cat].map((p) => (
                <button
                  key={p.id}
                  onClick={() => open(p)}
                  className="card text-left hover:border-accent transition cursor-pointer flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-ink-700 flex items-center justify-center text-lg font-semibold text-accent">
                      {p.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-400">
                        {CATEGORY_LABEL[p.category]}
                      </div>
                    </div>
                    <span className="pill-warn shrink-0">Coming soon</span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed">
                    {p.description}
                  </div>
                  <div className="text-xs text-accent mt-auto">
                    Connect →
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={close}
        >
          <div
            className="card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-md bg-ink-700 flex items-center justify-center text-xl font-semibold text-accent">
                {active.logo}
              </div>
              <div>
                <div className="text-base font-semibold">
                  Connect to {active.name}
                </div>
                <div className="text-xs text-slate-400">
                  {CATEGORY_LABEL[active.category]} integration
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-300 mb-4 leading-relaxed">
              <span className="font-medium">Direct {active.name} sync isn't live yet.</span>{" "}
              We're working on OAuth and a polling worker so transactions land here automatically. Want to be the first to know when it ships?
            </div>

            {submitted ? (
              <div className="card-tight border-good/40 bg-good/5 text-sm text-slate-200 mb-4">
                Got it — we'll let you know when {active.name} integration ships.
              </div>
            ) : (
              <div className="mb-4">
                <label className="label">Notify me when {active.name} ships</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="email"
                    placeholder="you@company.com"
                    value={emailNotify}
                    onChange={(e) => setEmailNotify(e.target.value)}
                  />
                  <button
                    className="btn-primary"
                    disabled={!emailNotify.includes("@")}
                    onClick={submitInterest}
                  >
                    Notify me
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-line pt-4 mt-2">
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                In the meantime
              </div>
              <div className="text-sm text-slate-300 mb-2 leading-relaxed">
                {active.exportTip}
              </div>
              <Link
                href="/manual-data"
                className="btn-ghost inline-block"
                onClick={close}
              >
                Open Manual Data → Bulk upload
              </Link>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn-ghost" onClick={close}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
