# Accessibility — Known Limitations

This file tracks areas of the product that **do not yet fully conform** to the accessibility targets stated in our public Accessibility Statement and the per-component checklist. Each entry is intentional disclosure — fixes should still be planned.

The Israeli accessibility regulations (and most international frameworks) expect us to publicly acknowledge limitations and provide a contact route for accessibility requests. That contact is **accessibility@tweaxly.com**.

---

## Component-level audit not yet complete

The infrastructure layer (provider, widget, CSS, skip links, statement page) is in place, but the per-component audit and remediation of every authenticated screen is an ongoing effort. The following areas have **not yet been individually audited and remediated** against the checklist:

| Area | What is still pending |
|------|-----------------------|
| Dashboard / Quick Overview | KPI cards: ensure label/value/trend exposed in readable text; charts need text summaries. |
| Business Signals | Signal cards + side panel: focus trap on open, focus return on close, severity not by color alone. |
| Forecast / Scenarios | Charts: provide alternative tabular form; scenario builder forms need full label / error pass. |
| Consultation / Chat | Live-region announcement of new AI messages; conversation list keyboard nav. |
| Data upload | Drag-and-drop has keyboard equivalent; status announcements during upload. |
| Account / Settings | Forms: required-field markings, error wiring via `aria-describedby`. |
| Billing | Forms + checkout flow keyboard-walk needed. |
| Onboarding wizard | Multi-step focus management between steps. |
| Admin panel (Customer 360) | Tables: sortable columns need `aria-sort`; row actions need labels. |

These will be remediated incrementally against the checklist in `accessibility-checklist.md` and logged in `accessibility-audit-log.md`.

---

## Color and contrast

A full per-token audit of the dark palette has not yet been completed. Specific known suspects:

- `text-slate-500` body text on `bg-ink-900` backgrounds may not consistently pass 4.5:1.
- Some brand-purple accents (`#a78bfa`) on dark gradients in the marketing site may fall under 3:1 for non-text UI contrast at certain opacities.
- The teal "good" indicator on dark cards has not been verified at every usage.

Users who need stronger contrast can opt into **High Contrast**, **Dark+**, or **Light+** in the accessibility widget — those modes are independently engineered to pass AA.

---

## Third-party content and integrations

We cannot guarantee the accessibility of:

- **Stripe Checkout / Stripe Elements** — payment provider UI rendered in their iframe; outside our control. Stripe publishes its own accessibility commitments.
- **Bank / accounting integrations** — content rendered from third-party APIs (transaction descriptors, vendor names, OCR'd invoices) inherits whatever quality the source provides.
- **Embedded analytics dashboards** (e.g., recharts internals) — we wrap them with accessible labels but the chart-rendering internals are third-party DOM.
- **AI-generated content** — formatting of large language model output (Markdown tables, bullet structures) can occasionally produce non-ideal screen reader rendering when the model emits non-standard structures.

---

## User-uploaded content

We do not modify content uploaded by users (CSVs, attachments, business names, transaction memos). If a user uploads a CSV with non-readable column names or imagery, the displayed result will inherit that. We surface this content within accessible containers and labels but cannot make the source content itself conformant.

---

## Automated testing

The following automated tooling is **not yet wired into CI**:

- axe-core / @axe-core/react.
- eslint-plugin-jsx-a11y in build pipeline.
- Lighthouse a11y gating on PR.

These are tracked as follow-up work. Manual review against the checklist is the current process.

---

## Reporting an issue

If you encounter an accessibility issue or need assistance using the platform:

- Email: **accessibility@tweaxly.com**
- We aim to acknowledge accessibility requests within 5 business days.

We treat accessibility issues as first-class bugs and prioritize them accordingly.
