// Hebrew (RTL). Keys missing here fall back to the English value at
// runtime — adding new keys to en.ts doesn't break this locale.

import type { Dictionary } from "../types";

export const he: Dictionary = {
  // ─── common ────────────────────────────────────────────────────
  "common.save": "שמירה",
  "common.cancel": "ביטול",
  "common.delete": "מחיקה",
  "common.confirm": "אישור",
  "common.continue": "המשך",
  "common.back": "חזרה",
  "common.next": "הבא",
  "common.close": "סגירה",
  "common.loading": "טוען…",
  "common.saving": "שומר…",
  "common.saved": "נשמר",
  "common.search": "חיפוש",
  "common.signOut": "התנתקות",
  "common.signIn": "התחברות",
  "common.email": "אימייל",
  "common.password": "סיסמה",
  "common.name": "שם",
  "common.optional": "אופציונלי",
  "common.required": "חובה",

  // ─── nav ───────────────────────────────────────────────────────
  "nav.overview": "סקירה",
  "nav.signals": "סיגנלים",
  "nav.advisory": "ייעוץ",
  "nav.forecast": "תחזית",
  "nav.reports": "דוחות",
  "nav.settings": "הגדרות",
  "nav.account": "חשבון",
  "nav.admin": "ניהול",
  "nav.workspace": "סביבת עבודה",
  "nav.createWorkspace": "צור סביבת עבודה חדשה",
  "nav.manageWorkspaces": "ניהול סביבות עבודה →",

  // ─── auth ──────────────────────────────────────────────────────
  "auth.signIn": "התחברות",
  "auth.signUp": "הרשמה",
  "auth.createAccount": "צור חשבון",
  "auth.businessName": "שם העסק",
  "auth.yourName": "השם שלך",
  "auth.passwordMinHint": "סיסמה (לפחות 6 תווים)",
  "auth.signupFooter": "ניתן לשנות מטבע, שנת כספים ומע״מ בהמשך מתוך הגדרות.",
  "auth.haveAccount": "כבר יש לך חשבון?",
  "auth.noAccount": "אין לך חשבון?",
  "auth.create": "צור אחד",
  "auth.forgotPassword": "שכחת סיסמה?",
  "auth.resetSuccess": "הסיסמה עודכנה. ניתן להתחבר כעת.",
  "auth.invalidCredentials": "האימייל או הסיסמה לא תואמים. נסה שוב.",
  "auth.duplicateEmail": "כבר קיים חשבון עם האימייל הזה. אנא התחבר או אפס את הסיסמה.",
  "auth.weakSignup": "אנא הזן אימייל תקין וסיסמה באורך 6 תווים לפחות.",

  // ─── forgot / reset ────────────────────────────────────────────
  "forgot.title": "איפוס סיסמה",
  "forgot.subtitle": "הזן את כתובת האימייל שלך. אם היא קיימת אצלנו, נשלח קישור לבחירת סיסמה חדשה.",
  "forgot.sentMessage": "אם האימייל קיים במערכת, ישלח אליו קישור לאיפוס סיסמה.",
  "forgot.sendLink": "שלח קישור איפוס",
  "forgot.backToLogin": "חזרה להתחברות",
  "reset.title": "בחר סיסמה חדשה",
  "reset.subtitle": "בחר סיסמה שלא השתמשת בה בעבר, באורך 6 תווים לפחות.",
  "reset.newPassword": "סיסמה חדשה",
  "reset.confirmPassword": "אישור סיסמה חדשה",
  "reset.update": "עדכן סיסמה",
  "reset.invalid": "קישור האיפוס אינו תקף. בקש קישור חדש מדף שכחת סיסמה.",
  "reset.expired": "קישור האיפוס פג תוקף. בקש קישור חדש מדף שכחת סיסמה.",
  "reset.used": "כבר נעשה שימוש בקישור איפוס זה. בקש חדש אם עדיין צריך לאפס.",
  "reset.mismatch": "שתי הסיסמאות אינן תואמות.",
  "reset.weak": "בחר סיסמה חזקה יותר (לפחות 6 תווים).",
  "reset.requestNew": "בקש קישור איפוס חדש",

  // ─── account ───────────────────────────────────────────────────
  "account.title": "חשבון",
  "account.subtitle": "הפרופיל האישי וההעדפות שלך.",
  "account.tab.profile": "פרופיל",
  "account.tab.password": "סיסמה",
  "account.tab.preferences": "שפה ואזור",
  "account.tab.billing": "חיוב",
  "account.tab.accessLog": "יומן גישה",
  "account.tab.danger": "סגירת חשבון",
  "account.preferences.title": "שפה ואזור",
  "account.preferences.intro": "בחר את השפה והגדרות האזור עבור התצוגה שלך ב־Tweaxly.",
  "account.preferences.language": "שפת הממשק",
  "account.preferences.languageHelp": "חל על תפריטים, כפתורים, טפסים והודעות. מסכי המוצר העמוקים (תחזית, סיגנלים, ייעוץ) עדיין באנגלית — אנחנו מתרגמים בהדרגה.",
  "account.preferences.dirAuto": "כיוון הפריסה משתנה אוטומטית לפי השפה (עברית מימין לשמאל).",

  // ─── settings ──────────────────────────────────────────────────
  "settings.title": "הגדרות",
  "settings.subtitle": "פרופיל העסק, מיתוג, קטגוריות, ספקים וכללים.",
  "settings.workspaces": "סביבות עבודה",

  // ─── errors ────────────────────────────────────────────────────
  "errors.generic": "משהו השתבש. אנא נסה שוב.",
  "errors.network": "שגיאת רשת — בדוק את החיבור.",
};

export default he;
