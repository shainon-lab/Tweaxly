# Accessibility Checklist

Primary target: **WCAG 2.2 Level AA** where reasonably applicable.
Compatible with **WCAG 2.1 AA** and **WCAG 2.0 AA** principles.

This checklist tracks the core requirements for every screen we ship. Use it during PR review and before any release that touches user-facing surface area.

---

## 1. Infrastructure (one-time, in place)

- [x] Global `<AccessibilityProvider>` mounted in both app root layouts (`website/src/app/layout.tsx`, `src/app/layout.tsx`).
- [x] Preferences persist in `localStorage` under key `tweaxly:a11y:v1`.
- [x] Pre-paint init script restores contrast / font-scale / motion prefs before first paint to avoid FOUC.
- [x] Floating accessibility widget rendered globally on every page.
- [x] Skip link rendered before main content on every layout.
- [x] `<main id="main-content">` landmark exists on every top-level page.
- [x] Accessibility Statement page exists at `/accessibility` on both apps.
- [x] Footer link to `/accessibility` from website footer + widget footer.
- [x] Reduced motion media query honored (`prefers-reduced-motion: reduce`).

## 2. Per-page (apply when adding or modifying a route)

### Semantic structure
- [ ] One `<h1>` per page; heading order is logical (no skipped levels).
- [ ] Page uses `<header>`, `<nav>`, `<main id="main-content">`, `<footer>` landmarks as appropriate.
- [ ] Active navigation item uses `aria-current="page"`.
- [ ] Page `<title>` updates on route change (Next.js metadata).

### Buttons and links
- [ ] Buttons render `<button>`, links render `<a>` — no `onClick` `<div>`s.
- [ ] Every icon-only button has an `aria-label`.
- [ ] Disabled buttons set `disabled` (not just visual styling).
- [ ] Loading buttons expose `aria-busy="true"` or visible loading text.
- [ ] Tab order is logical and matches visual order.

### Forms
- [ ] Every input has an associated `<label>` (or `aria-label` if visually unlabeled).
- [ ] Required fields are marked visually AND via `required` attribute.
- [ ] Validation errors are linked to inputs with `aria-describedby`.
- [ ] On submit failure, focus moves to the first error or an error summary.
- [ ] Checkbox/radio groups use `<fieldset>` + `<legend>` when grouping is semantic.
- [ ] Password show/hide controls have an accessible label and announce state.

### Modals / drawers / panels
- [ ] Container uses `role="dialog"` (or `<dialog>`) + `aria-modal="true"` + `aria-labelledby`.
- [ ] Focus moves into the modal on open.
- [ ] Focus is trapped while open (Tab cycles within).
- [ ] Escape closes the modal.
- [ ] Focus returns to the trigger on close.
- [ ] Background is `aria-hidden` or `inert` while modal is open.

### Tables
- [ ] Uses semantic `<table><thead><tbody>` markup.
- [ ] Header cells use `<th scope="col">` or `<th scope="row">`.
- [ ] Sortable columns expose `aria-sort="ascending|descending|none"`.
- [ ] Empty, loading, and error states have accessible text alternatives.

### Charts and KPIs
- [ ] Chart has an `aria-label` or `aria-describedby` summarizing its purpose.
- [ ] Critical data is also available as a screen-reader-readable text summary or accessible table.
- [ ] Color is not the only conveyor of meaning — pair with icons or labels (↑ increase / ↓ decrease).
- [ ] KPI cards expose label, value, trend, and direction in readable text.

### Alerts / Signals
- [ ] Live alerts use `role="status"` (polite) or `role="alert"` (assertive) only when justified.
- [ ] Severity exposed via text label (Critical / Warning / Info / Opportunity), not color alone.

### Chat / Consultation
- [ ] Input has a visible or `aria-label`-provided label.
- [ ] New AI messages announced via a polite live region.
- [ ] Loading state announced.
- [ ] Conversation history keyboard navigable.

## 3. Color and contrast
- [ ] Normal text passes 4.5:1 against its background.
- [ ] Large text (≥18.66px regular or 14px bold) passes 3:1.
- [ ] UI components and focus indicators pass 3:1 against adjacent colors.
- [ ] No information is conveyed by color alone.

## 4. Keyboard
- [ ] Every flow is operable with keyboard alone (Tab / Shift+Tab / Enter / Space / Esc / arrows where applicable).
- [ ] Focus indicator is always visible.
- [ ] No keyboard trap outside of intentional modals.
- [ ] Custom widgets follow the WAI-ARIA Authoring Practices for their pattern (combobox, listbox, tabs, etc.).

## 5. Images and icons
- [ ] Meaningful images have descriptive `alt`.
- [ ] Decorative images have `alt=""`.
- [ ] Icon-only controls have an `aria-label` describing the action.

## 6. Testing
- [ ] Tab-through smoke test on every PR that adds a screen.
- [ ] axe DevTools or Lighthouse a11y scan shows no critical issues.
- [ ] Verified at 200% browser zoom without horizontal scroll on body text.
- [ ] Verified with reduce-motion + high-contrast widget settings.
