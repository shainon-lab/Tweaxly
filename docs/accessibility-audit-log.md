# Accessibility Audit Log

Running log of accessibility audits, issues found, and fixes applied. Every audit should add a new section dated and signed by the reviewer.

---

## 2026-05-19 — Initial accessibility system landed

**Reviewer:** Shai (with AI assist)
**Scope:** Marketing website + product app foundation.

### Implemented
| Area | Change | Severity addressed |
|------|--------|--------------------|
| Both apps | `AccessibilityProvider` + persisted prefs (`tweaxly:a11y:v1`) | n/a (infra) |
| Both apps | Pre-paint init script to avoid FOUC for contrast / font-scale | medium |
| Both apps | Skip link before `<main>` on every layout | high |
| Both apps | `<main id="main-content">` landmark on every top-level page | high |
| Both apps | Global accessibility widget (FAB + dialog) | n/a (feature) |
| Widget | Focus trap, Escape close, focus return on close, `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | high |
| Widget | All controls labeled (`aria-label`, `role="switch"`, `aria-pressed`, `aria-checked`) | high |
| CSS | Contrast modes (High / Dark+ / Light+ / Monochrome / Invert) | high |
| CSS | Font scale 100–200% via `--a11y-font-scale` on rem-based sizes | high |
| CSS | Pause animations + reduce motion overrides | medium |
| CSS | Highlight links / headings, letter spacing, line height | medium |
| CSS | Enhanced focus + keyboard-mode focus rings | high |
| CSS | Larger hit targets (≥44px) toggle | medium |
| CSS | Cursor size toggle (S/M/L) via inline-SVG cursors | low |
| CSS | Reading guide bar + reading mask | low |
| Content | Accessibility Statement updated with WCAG 2.2 AA language + toolbar description | n/a |
| Footer | Accessibility link in website footer alongside Terms / Privacy | medium |

### Related — Consent Management Platform landed

Separate from the accessibility scope but shipped in the same window:

| Area | Change |
|------|--------|
| Both apps | CMP module at `lib/consent/` (provider, registry, GCM v2, storage, banner, modal, footer trigger). |
| Both apps | Pre-paint init script sets GCM v2 defaults to denied before any tracking script can fire. |
| Cookie | `tweaxly_consent` scoped to `.tweaxly.com`; 13-month expiry; base64-JSON payload with `consentVersion`, `policyVersion`, `consentTimestamp`, `region`, `source`. |
| Website | Footer "Privacy Preferences" link reopens preferences modal at any time. |
| Docs | `docs/consent-management.md` covers architecture, GCM v2 mapping, integration recipe, audit fields, regional hooks. |

### Outstanding (tracked in `accessibility-known-limitations.md`)
- Component-level audits across the SaaS app (dashboard, signals, forecast, chat, billing, admin) — landmarks/labels/keyboard flows need a per-screen sweep.
- Automated tooling (axe-core integration, eslint-plugin-jsx-a11y) not yet wired into CI.
- Color-contrast pass across the dark palette has not been fully audited against AA targets — some `text-slate-500` body uses on `bg-ink-900` may be borderline at 4.5:1.
- Charts (recharts) do not yet expose accessible text summaries / data-table alternatives.
- AI chat live-region announcement not yet wired.
