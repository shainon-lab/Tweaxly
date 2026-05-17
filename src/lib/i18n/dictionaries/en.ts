// English dictionary. This file is the source of truth for every
// translation key. Other locales (he.ts) translate from these keys;
// any key missing from a non-English locale falls back to the value
// here at runtime.
//
// Keys follow 'namespace.key' format. Keep namespaces narrow:
//   common.*    — generic verbs / nouns (save, cancel, loading)
//   nav.*       — sidebar nav labels
//   auth.*      — login / register / forgot / reset
//   account.*   — Account section and Preferences
//   settings.*  — Settings section + sub-tab labels
//   page.*      — page-header titles + subtitles
//   tabs.*      — internal tab labels per section
//   dashboard.* — dashboard surface
//   signals.*   — signals page
//   advisory.*  — consultation / advisory page
//   forecast.*  — forecast + scenarios + workforce
//   reports.*   — reports / charts / trends pages
//   data.*      — manual data + data log + transactions
//   consult.*   — global Consult button + panel
//   errors.*    — validation + error messages

import type { Dictionary } from "../types";

export const en: Dictionary = {
  // ─── common ────────────────────────────────────────────────────
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.confirm": "Confirm",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.next": "Next",
  "common.close": "Close",
  "common.add": "Add",
  "common.edit": "Edit",
  "common.create": "Create",
  "common.loading": "Loading…",
  "common.saving": "Saving…",
  "common.saved": "Saved",
  "common.search": "Search",
  "common.signOut": "Sign out",
  "common.signIn": "Sign in",
  "common.email": "Email",
  "common.password": "Password",
  "common.name": "Name",
  "common.optional": "optional",
  "common.required": "required",
  "common.actions": "Actions",
  "common.status": "Status",
  "common.date": "Date",
  "common.amount": "Amount",
  "common.description": "Description",
  "common.viewAll": "View all",
  "common.showMore": "Show more",
  "common.showLess": "Show less",
  "common.refresh": "Refresh",
  "common.noData": "No data yet.",
  "common.never": "never",
  "common.justNow": "just now",
  "common.consultOnThis": "Consult on this",

  // ─── nav ───────────────────────────────────────────────────────
  "nav.overview": "Overview",
  "nav.signals": "Signals",
  "nav.advisory": "Advisory",
  "nav.forecast": "Forecast",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "nav.account": "Account",
  "nav.admin": "Admin",
  "nav.workspace": "Workspace",
  "nav.createWorkspace": "Create new workspace",
  "nav.manageWorkspaces": "Manage workspaces →",

  // ─── auth ──────────────────────────────────────────────────────
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.createAccount": "Create account",
  "auth.businessName": "Business name",
  "auth.yourName": "Your name",
  "auth.passwordMinHint": "Password (min 6 chars)",
  "auth.signupFooter": "You can change currency, fiscal year, and VAT later in Settings.",
  "auth.haveAccount": "Already have an account?",
  "auth.noAccount": "Don’t have an account?",
  "auth.create": "Create one",
  "auth.forgotPassword": "Forgot password?",
  "auth.resetSuccess": "Your password has been updated. You can now log in.",
  "auth.invalidCredentials": "Email or password didn’t match. Try again.",
  "auth.duplicateEmail": "An account with this email already exists. Please log in or reset your password.",
  "auth.weakSignup": "Please enter a valid email and a password of at least 6 characters.",

  // ─── forgot / reset ────────────────────────────────────────────
  "forgot.title": "Reset your password",
  "forgot.subtitle": "Enter the email you signed up with. We’ll send you a link to choose a new password.",
  "forgot.sentMessage": "If this email exists in our system, a password reset link will be sent.",
  "forgot.sendLink": "Send reset link",
  "forgot.backToLogin": "Back to log in",
  "reset.title": "Choose a new password",
  "reset.subtitle": "Pick a password you haven’t used before. At least 6 characters.",
  "reset.newPassword": "New password",
  "reset.confirmPassword": "Confirm new password",
  "reset.update": "Update password",
  "reset.invalid": "This reset link is invalid. Request a new one from the forgot-password page.",
  "reset.expired": "This reset link has expired. Request a new one from the forgot-password page.",
  "reset.used": "This reset link has already been used. Request a new one if you still need to reset.",
  "reset.mismatch": "The two passwords don’t match.",
  "reset.weak": "Pick a stronger password (at least 6 characters).",
  "reset.requestNew": "Request a new reset link",

  // ─── account ───────────────────────────────────────────────────
  "account.title": "Account",
  "account.subtitle": "Your personal profile and preferences.",
  "account.tab.billing": "Billing & Products",
  "account.tab.payment": "Payment Methods",
  "account.tab.password": "Password",
  "account.tab.preferences": "Language & Region",
  "account.tab.accessLog": "Access Logs",
  "account.tab.danger": "Close Account",
  "account.preferences.title": "Language & region",
  "account.preferences.intro": "Choose the language and regional settings for your view of Tweaxly.",
  "account.preferences.language": "Interface language",
  "account.preferences.languageHelp": "Applies to menus, buttons, forms, and validation messages. Deep product surfaces (forecast, signals, consultation) are still in English; we’re translating them gradually.",
  "account.preferences.dirAuto": "Layout direction follows the language automatically (Hebrew is right-to-left).",

  // ─── settings ──────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.subtitle": "Business profile and branding, plus categories, vendors, and the rules that auto-classify your transactions.",
  "settings.tab.profile": "Business Profile",
  "settings.tab.import": "Import Data",
  "settings.tab.integration": "Integration",
  "settings.tab.categories": "Categories & Vendors",
  "settings.tab.transactions": "Transactions",
  "settings.tab.dataLog": "Data Log",
  "settings.tab.workspaces": "Workspaces",

  // ─── page headers (per route) ──────────────────────────────────
  "page.dashboard.title": "Overview",
  "page.dashboard.subtitle": "The most-important changes in your business, at a glance.",
  "page.signals.title": "Signals",
  "page.signals.subtitle": "A command-center view of what’s changing in your business — click any card for the full story.",
  "page.advisory.title": "Advisory",
  "page.advisory.subtitle": "Strategic AI recommendations based on your business data.",
  "page.forecast.title": "Forecast",
  "page.forecast.subtitle.overview": "AI outlook for the next months based on what your data is doing today.",
  "page.forecast.subtitle.scenarios": "Layer hires, raises, contracts, and one-time events on top of the baseline.",
  "page.workforce.title": "Forecast",
  "page.workforce.subtitle": "Workforce planning — real team costs, payroll-to-revenue, and hire affordability.",
  "page.employees.title": "Forecast",
  "page.employees.subtitle": "Workforce planning · Edit roster.",
  "page.report.title": "P&L Statement",
  "page.charts.title": "Charts",
  "page.charts.subtitle": "Visual breakdowns of your business across one chosen period.",
  "page.trends.title": "Category Trends",
  "page.transactions.title": "Settings",
  "page.manualData.title": "Settings",
  "page.dataLog.title": "Settings",
  "page.notifications.title": "Set notifications",
  "page.notifications.subtitle": "Get alerted when your revenue, expenses, net profit, or any category moves past a threshold you set.",
  "page.integration.title": "Integration",
  "page.integration.subtitle": "Pull data from your tools automatically (coming soon).",

  // ─── tabs (internal sub-tab nav) ───────────────────────────────
  "tabs.signals.signals": "Signals",
  "tabs.signals.monitor": "Monitor",
  "tabs.consult.new": "New Advisory",
  "tabs.consult.history": "Advisory History",
  "tabs.forecast.overview": "Overview",
  "tabs.forecast.scenarios": "Scenarios",
  "tabs.forecast.workforce": "Workforce Planning",
  "tabs.reports.pnl": "P&L Statement",
  "tabs.reports.charts": "Charts",
  "tabs.reports.trends": "Category Trends",
  "tabs.reports.yearly": "Yearly Summary",
  "tabs.reports.viewCharts": "View Charts",
  "tabs.reports.backToReports": "Back to Reports",
  "tabs.reports.chartsView": "Charts view",

  // ─── dashboard ─────────────────────────────────────────────────
  "dashboard.executive": "Executive Summary",

  // ─── signals deck ──────────────────────────────────────────────
  "signals.headerLabel": "Signals",
  "signals.aiAdvisor": "AI advisor",
  "signals.refresh": "Refresh signals",
  "signals.generate": "Generate signals",
  "signals.restoreResolved": "Restore {n} resolved",
  "signals.emptyTitle": "No signals to show",
  "signals.emptyBody": "Once there’s a few months of data, the advisor surfaces revenue, expense, vendor, and cash-flow signals here automatically.",
  "signals.emptyAllResolved": "Everything’s marked resolved. Use the Restore link above to bring them back.",
  "signals.action.markResolved": "Mark resolved",
  "signals.action.resolved": "Resolved",

  // ─── advisory / consultation ───────────────────────────────────
  "advisory.askPlaceholder": "Ask anything about your business…",

  // ─── global Consult floating button ────────────────────────────
  "consult.button": "Consult AI",
  "consult.aboutThisSignal": "Consult about this signal",
  "consult.dismissForSession": "Dismiss for this session",
  "consult.dismissForever": "Don’t show again",

  // ─── workspaces / business switcher ────────────────────────────
  "workspaces.title": "Workspaces",
  "workspaces.subtitle": "Workspaces under your account. Switch between them, rename, or create a new one.",
  "workspaces.create": "Create new workspace",
  "workspaces.switchTo": "Switch to →",
  "workspaces.rename": "Rename",
  "workspaces.leave": "Leave",
  "workspaces.current": "Current",
  "workspaces.dialog.title": "New workspace",
  "workspaces.dialog.intro": "Belongs to your account. No new login required.",
  "workspaces.dialog.businessType": "Business type",
  "workspaces.dialog.country": "Country",
  "workspaces.dialog.submit": "Create workspace",

  // ─── errors ────────────────────────────────────────────────────
  "errors.generic": "Something went wrong. Please try again.",
  "errors.network": "Network error — check your connection.",
};

export default en;
