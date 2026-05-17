// English dictionary. This file is the source of truth for every
// translation key. Other locales (he.ts) translate from these keys;
// any key missing from a non-English locale falls back to the value
// here at runtime.
//
// Keys follow 'namespace.key' format. Keep namespaces narrow:
//   common.* — generic verbs / nouns (save, cancel, loading)
//   nav.*    — sidebar nav labels
//   auth.*   — login / register / forgot / reset
//   account.* — Account section and Preferences
//   settings.* — Settings section
//   admin.*  — Admin panel (mostly English-only for now)
//   errors.* — validation + error messages

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
  "account.tab.profile": "Profile",
  "account.tab.password": "Password",
  "account.tab.preferences": "Language & Region",
  "account.tab.billing": "Billing",
  "account.tab.accessLog": "Access log",
  "account.tab.danger": "Close account",
  "account.preferences.title": "Language & region",
  "account.preferences.intro": "Choose the language and regional settings for your view of Tweaxly.",
  "account.preferences.language": "Interface language",
  "account.preferences.languageHelp": "Applies to menus, buttons, forms, and validation messages. Deep product surfaces (forecast, signals, consultation) are still in English; we’re translating them gradually.",
  "account.preferences.dirAuto": "Layout direction follows the language automatically (Hebrew is right-to-left).",

  // ─── settings ──────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.subtitle": "Business profile, branding, categories, vendors, and rules.",
  "settings.workspaces": "Workspaces",

  // ─── errors ────────────────────────────────────────────────────
  "errors.generic": "Something went wrong. Please try again.",
  "errors.network": "Network error — check your connection.",
};

export default en;
