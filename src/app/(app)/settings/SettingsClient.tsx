"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import CurrencyPicker from "@/components/CurrencyPicker";
import RulesClient from "../rules/RulesClient";
import VendorizationRulesClient from "../rules/VendorizationRulesClient";
import DataTabs from "@/components/DataTabs";
import IntegrationClient from "../integration/IntegrationClient";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import CurrencySection from "./CurrencySection";
import { BillingClient } from "./billing/BillingClient";
import BusinessDnaSection, { type BusinessDnaProps } from "./BusinessDnaSection";
import MembersAndAccessSection from "@/components/MembersAndAccessSection";
import { notify } from "@/lib/notify";

// Settings shares a top-level tab row with the Data section
// (/manual-data, /transactions, /data-log). The shared
// BusinessSettingsTabs component renders that nav; this file owns the
// panels that live under the /settings route. The legacy "profile"
// tab now splits into three:
//   - settings : business basics (name/currency/fiscal/VAT) + currency
//                conversion + branding
//   - profile  : strategic Business DNA (the 7 questions + AI summary +
//                derived patterns)
//   - plan     : per-workspace billing (Plan & Credits)
// The default landing tab is `settings` so old /settings links still
// surface the everyday-edit surface; deep-links to the other two tabs
// use ?tab=profile / ?tab=plan.
type SettingsTab = "settings" | "profile" | "plan" | "members" | "categories" | "integration";

function resolveSettingsTab(raw: string | null): SettingsTab {
  if (raw === "categories" || raw === "integration") return raw;
  if (raw === "profile" || raw === "plan" || raw === "settings" || raw === "members") return raw;
  return "settings";
}

type Rule = {
  id: string;
  matchField: string;
  matchType: string;
  pattern: string;
  categoryId: string;
  priority: number;
  setRecurring: boolean;
  setOneTime: boolean;
};

type VendorizationRule = {
  id: string;
  matchField: string;
  matchType: string;
  pattern: string;
  vendorName: string;
  priority: number;
};

type Biz = {
  id: string; name: string; currency: string; fiscalStartMonth: number;
  vatEnabled: boolean; vatRate: number;
  logoData: string | null;
  faviconData: string | null;
  country: string | null;
  timezone: string | null;
  industry: string | null;
};
type Cat = {
  id: string; name: string; kind: string; isOneTime: boolean;
  primaryVendorId: string | null;
  // Spec-required aggregates surfaced on the Categories table:
  transactionCount: number;
  totalAmount:      number;   // signed sum of transaction.amount in base currency
  lastSeenAt:       string | null; // ISO, max transactionDate over active txns
  vendorCount:      number;
  vendorNames:      string[]; // alphabetical, source for the "names (N)" cell
};

// Friendly type label derived from the internal kind field. The categories
// table shows this instead of the full kind taxonomy.
function typeLabel(kind: string): "Income" | "Outcome" {
  return kind === "revenue" ? "Income" : "Outcome";
}
type Vendor = {
  id: string; name: string; categoryId: string | null; isOneTime: boolean;
  // Spec-required aggregates surfaced on the Vendors table:
  transactionCount: number;
  totalAmount:      number;   // signed sum
  lastSeenAt:       string | null; // ISO
  // Type pill derived from the kinds of categories this vendor's
  // transactions sit in. Mirrors the Categories table's Type column so
  // the two views read symmetrically.
  typeLabel:        "Income" | "Outcome" | "Mixed" | null;
  // Distinct transaction descriptions kept for the hover tooltip on
  // the Transactions count cell.
  descriptions:     string[];
  txnCategoryNames: string[];
};

// Suggested categories the spec mandates we offer (but never auto-
// create). Surfaced as quick-pick chips in the Add Category modal  - 
// clicking a chip pre-fills the name + type, the user still has to
// click "Add category" to commit. The Income/Outcome split lets us
// filter chips to whichever type tab the user is on.
const SUGGESTED_EXPENSE_CATEGORIES = [
  "Rent",
  "Payroll",
  "Payment Processing Fees",
  "Advertising",
  "Software",
  "Accounting",
  "Taxes",
  "Government Fees",
  "Utilities",
  "Office Services",
  "Internet & Telephony",
  "Vehicle Expenses",
  "Equipment",
  "Travel",
  "Professional Services",
] as const;
const SUGGESTED_INCOME_CATEGORIES = [
  "Product Sales",
  "Service Revenue",
  "Subscription Revenue",
  "Consulting Revenue",
  "One-Time Payments",
  "Refunds / Adjustments",
  "Other Income",
] as const;
type View = "categories" | "vendors";


const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const FAVICON_ACCEPT = "image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico";
// Cap the raw file at ~1MB; base64-encoded that's ~1.33MB, under the 1.4MB
// server limit. Larger uploads are rejected with a clear message rather than
// silently failing on the server.
const MAX_FILE_BYTES = 1_000_000;

// Pending = the staged change for a brand slot:
//   undefined → no draft (display saved value)
//   null      → user wants to remove the saved value
//   string    → user picked a new file, staged as a data URL
type Pending = string | null | undefined;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function effectiveValue(saved: string | null, pending: Pending): string | null {
  return pending === undefined ? saved : pending;
}

export default function SettingsClient({
  business,
  categories,
  vendors,
  rules,
  vendorizationRules,
  billing,
  businessDna,
}: {
  business: Biz;
  categories: Cat[];
  vendors: Vendor[];
  rules: Rule[];
  vendorizationRules: VendorizationRule[];
  // Per-workspace billing payload. Rendered as a "Plan & Credits"
  // section inside the Business Profile tab - billing lives with the
  // workspace it belongs to, not at account level.
  billing?: React.ComponentProps<typeof BillingClient>;
  // Business DNA - strategic profile the AI uses across the platform.
  // null when the workspace hasn't filled it in yet; the section
  // still renders with empty fields so the user can start.
  businessDna?: BusinessDnaProps["initial"];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [biz, setBiz] = useState<Biz>(business);
  const [cats, setCats] = useState<Cat[]>(categories);
  const [vends, setVends] = useState<Vendor[]>(vendors);
  const [view, setView] = useState<View>("categories");
  // The active panel is driven by the ?tab= query so the shared
  // BusinessSettingsTabs nav (which is just a row of Links) and the
  // panel selection stay in sync - switching tabs is a navigation, not
  // local state. Defaulting to "profile" means /settings with no query
  // renders the Business Profile panel.
  const tab: SettingsTab = resolveSettingsTab(searchParams.get("tab"));
  // Modal state for Add category / Add vendor.
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addCatDraft, setAddCatDraft] = useState<{ name: string; isIncome: boolean; isOneTime: boolean }>({
    name: "", isIncome: false, isOneTime: false,
  });
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addVendorDraft, setAddVendorDraft] = useState<{ name: string; categoryId: string; isOneTime: boolean }>({
    name: "", categoryId: "__new__", isOneTime: false,
  });

  // Branding draft state - staged changes that only persist on Save.
  const [logoPending, setLogoPending] = useState<Pending>(undefined);
  const [faviconPending, setFaviconPending] = useState<Pending>(undefined);
  const [brandSaving, setBrandSaving] = useState<"logo" | "favicon" | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);

  // Business-card save state - keeps the user informed when their name /
  // currency / VAT changes actually land in the database.
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  async function saveBiz() {
    setBizSaving(true);
    setBizError(null);
    setBizSaved(false);
    const trimmedName = biz.name.trim();
    if (!trimmedName) {
      setBizError("Business name can't be empty.");
      setBizSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/business", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          currency: biz.currency,
          fiscalStartMonth: biz.fiscalStartMonth,
          vatEnabled: biz.vatEnabled,
          vatRate: biz.vatRate,
          country: biz.country,
          timezone: biz.timezone,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt || `Save failed (${res.status})`;
        try { msg = JSON.parse(txt).error ?? msg; } catch { /* keep raw text */ }
        setBizError(msg);
        return;
      }
      // Sync local form state with what the server actually persisted - this
      // is the user's confirmation that the name override took effect.
      const updated = await res.json();
      setBiz((b) => ({
        ...b,
        name: updated.name ?? b.name,
        currency: updated.currency ?? b.currency,
        fiscalStartMonth: updated.fiscalStartMonth ?? b.fiscalStartMonth,
        vatEnabled: !!updated.vatEnabled,
        vatRate: updated.vatRate ?? 0,
        country: updated.country ?? null,
        timezone: updated.timezone ?? null,
        industry: updated.industry ?? null,
      }));
      setBizSaved(true);
      // Clear the success badge after a moment so it doesn't linger.
      setTimeout(() => setBizSaved(false), 2500);
      // Re-render server components (sidebar, page header, tab title) so the
      // new name shows up everywhere else immediately.
      startTransition(() => router.refresh());
    } catch (err) {
      setBizError(err instanceof Error ? err.message : "Save failed - check the browser console.");
    } finally {
      setBizSaving(false);
    }
  }

  async function saveBrand(field: "logoData" | "faviconData", value: string | null) {
    const kind: "logo" | "favicon" = field === "logoData" ? "logo" : "favicon";
    setBrandSaving(kind);
    setBrandError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt || `Save failed (${res.status})`;
        try { msg = JSON.parse(txt).error ?? msg; } catch { /* keep raw text */ }
        setBrandError(msg);
        return false;
      }
      setBiz((b) => ({ ...b, [field]: value }));
      if (field === "logoData") setLogoPending(undefined);
      else setFaviconPending(undefined);
      startTransition(() => router.refresh());
      return true;
    } catch (err) {
      // Network failure, body too large, etc. Surface it instead of leaving
      // the user staring at an unresponsive Save button.
      const msg = err instanceof Error ? err.message : "Save failed - check the browser console.";
      setBrandError(msg);
      return false;
    } finally {
      setBrandSaving(null);
    }
  }

  async function stageFile(kind: "logo" | "favicon", file: File | undefined) {
    if (!file) return;
    setBrandError(null);
    if (file.size > MAX_FILE_BYTES) {
      setBrandError(`File is too large (${Math.round(file.size / 1024)} KB). Max is ${MAX_FILE_BYTES / 1024} KB.`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      if (kind === "logo") setLogoPending(dataUrl);
      else setFaviconPending(dataUrl);
    } catch (e) {
      setBrandError(e instanceof Error ? e.message : "Could not read file");
    }
  }

  async function addCategoryFromModal() {
    const name = addCatDraft.name.trim();
    if (!name) return;
    const res = await fetch("/api/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        kind: addCatDraft.isIncome ? "revenue" : "variable",
        isOneTime: addCatDraft.isOneTime,
      }),
    });
    if (!res.ok) { notify.alert(await res.text()); return; }
    const c = await res.json();
    // Brand-new categories start with zero of everything - without
    // these explicit defaults the table renderer crashes on
    // c.totalAmount.toLocaleString() before the next router.refresh
    // catches up with the server snapshot.
    setCats((cur) => [...cur, {
      ...c,
      primaryVendorId:  c.primaryVendorId ?? null,
      transactionCount: 0,
      totalAmount:      0,
      vendorCount:      0,
      vendorNames:      [],
    }]);
    setAddCatDraft({ name: "", isIncome: false, isOneTime: false });
    setAddCatOpen(false);
    startTransition(() => router.refresh());
  }

  async function addVendorFromModal() {
    const name = addVendorDraft.name.trim();
    if (!name) return;
    // "__new__" sentinel: prompt for a new category name first.
    let categoryId: string | null = null;
    if (addVendorDraft.categoryId === "__new__") {
      const catName = window.prompt("New category name:")?.trim();
      if (!catName) return;
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, kind: "variable", isOneTime: false }),
      });
      if (!res.ok) { notify.alert(await res.text()); return; }
      const created = await res.json();
      setCats((cur) => [...cur, {
        ...created,
        primaryVendorId:  created.primaryVendorId ?? null,
        transactionCount: 0,
        totalAmount:      0,
        vendorCount:      0,
        vendorNames:      [],
      }]);
      categoryId = created.id;
    } else if (addVendorDraft.categoryId && addVendorDraft.categoryId !== "__undefined__") {
      categoryId = addVendorDraft.categoryId;
    }
    const res = await fetch("/api/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId,
        isOneTime: addVendorDraft.isOneTime,
      }),
    });
    if (!res.ok) { notify.alert(await res.text()); return; }
    const v = await res.json();
    // Same defaults story as addCategoryFromModal - the Vendors table
    // reads transactionCount / totalAmount / lastSeenAt and crashes
    // on undefined. Brand-new vendors are zero of everything.
    const withDefaults = {
      ...v,
      transactionCount: v.transactionCount ?? 0,
      totalAmount:      v.totalAmount      ?? 0,
      lastSeenAt:       v.lastSeenAt       ?? null,
      descriptions:     v.descriptions     ?? [],
      txnCategoryNames: v.txnCategoryNames ?? [],
    };
    setVends((cur) => {
      const existing = cur.find((x) => x.id === withDefaults.id);
      if (existing) return cur.map((x) => (x.id === withDefaults.id ? withDefaults : x));
      return [...cur, withDefaults];
    });
    setAddVendorDraft({ name: "", categoryId: "__new__", isOneTime: false });
    setAddVendorOpen(false);
    startTransition(() => router.refresh());
  }

  async function removeCategory(id: string) {
    if (!(await notify.confirm({ title: "Delete category?", body: "Delete this category? Transactions using it will become Uncategorized.", confirmLabel: "Delete", danger: true }))) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    setCats(cats.filter((c) => c.id !== id));
    startTransition(() => router.refresh());
  }

  async function removeVendor(id: string) {
    if (!(await notify.confirm({ title: "Delete vendor?", body: "Delete this vendor? Transactions keep their text vendor field, but this entry will disappear from the registry.", confirmLabel: "Delete", danger: true }))) return;
    await fetch(`/api/vendors?id=${id}`, { method: "DELETE" });
    setVends((cur) => cur.filter((v) => v.id !== id));
    setCats((cur) => cur.map((c) => (c.primaryVendorId === id ? { ...c, primaryVendorId: null } : c)));
    startTransition(() => router.refresh());
  }

  // Merge: reassign every Transaction.vendor matching the source name
  // to the target's name, copy categoryId/isOneTime if the source had
  // them and the target didn't, then delete the source row.
  const [mergeFrom, setMergeFrom] = useState<Vendor | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [mergeBusy, setMergeBusy] = useState(false);

  // Category merge mirrors the vendor merge UX. Re-points every
  // Transaction.categoryId / Vendor.categoryId / CategorizationRule
  // pointing at the source onto the target, then deletes the source.
  const [mergeCategoryFrom, setMergeCategoryFrom] = useState<Cat | null>(null);
  const [mergeCategoryTargetId, setMergeCategoryTargetId] = useState<string>("");
  const [mergeCategoryBusy, setMergeCategoryBusy] = useState(false);

  async function doMerge() {
    if (!mergeFrom || !mergeTargetId) return;
    setMergeBusy(true);
    try {
      const res = await fetch("/api/vendors/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromVendorId: mergeFrom.id, toVendorId: mergeTargetId }),
      });
      if (!res.ok) { notify.alert(await res.text()); return; }
      const data = await res.json();
      setVends((cur) => cur.filter((v) => v.id !== mergeFrom.id));
      setMergeFrom(null);
      setMergeTargetId("");
      notify.alert(`Merged. ${data.transactionsReassigned ?? 0} transaction${(data.transactionsReassigned ?? 0) === 1 ? "" : "s"} reassigned.`);
      startTransition(() => router.refresh());
    } finally {
      setMergeBusy(false);
    }
  }

  async function doMergeCategory() {
    if (!mergeCategoryFrom || !mergeCategoryTargetId) return;
    setMergeCategoryBusy(true);
    try {
      const res = await fetch("/api/categories/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCategoryId: mergeCategoryFrom.id, toCategoryId: mergeCategoryTargetId }),
      });
      if (!res.ok) { notify.alert(await res.text()); return; }
      const data = await res.json();
      setCats((cur) => cur.filter((c) => c.id !== mergeCategoryFrom.id));
      setMergeCategoryFrom(null);
      setMergeCategoryTargetId("");
      notify.alert(`Merged. ${data.transactionsReassigned ?? 0} transaction${(data.transactionsReassigned ?? 0) === 1 ? "" : "s"} reassigned.`);
      startTransition(() => router.refresh());
    } finally {
      setMergeCategoryBusy(false);
    }
  }

  async function toggleVendorOneTime(v: Vendor) {
    const next = !v.isOneTime;
    setVends((cur) => cur.map((x) => (x.id === v.id ? { ...x, isOneTime: next } : x)));
    const res = await fetch("/api/vendors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, isOneTime: next }),
    });
    if (!res.ok) {
      notify.alert(await res.text());
      setVends((cur) => cur.map((x) => (x.id === v.id ? { ...x, isOneTime: v.isOneTime } : x)));
      return;
    }
    startTransition(() => router.refresh());
  }

  // "GENERAL" or a specific vendor - picks the category's primary vendor.

  // Vendor → category assignment, with a special "__new__" sentinel that
  // prompts for a brand-new category name, creates it, and then assigns.
  async function assignVendorCategory(vendorId: string, raw: string) {
    let categoryId: string | null = null;
    if (raw === "__new__") {
      const name = window.prompt("New category name:")?.trim();
      if (!name) return;
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind: "variable", isOneTime: false }),
      });
      if (!res.ok) { notify.alert(await res.text()); return; }
      const created: Cat = await res.json();
      setCats((cur) => [...cur, created]);
      categoryId = created.id;
    } else if (raw === "" || raw === "__undefined__") {
      categoryId = null;
    } else {
      categoryId = raw;
    }
    setVends((cur) => cur.map((v) => (v.id === vendorId ? { ...v, categoryId } : v)));
    const res = await fetch("/api/vendors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vendorId, categoryId }),
    });
    if (!res.ok) {
      notify.alert(await res.text());
      // Roll back: re-fetch on next render.
      startTransition(() => router.refresh());
      return;
    }
    startTransition(() => router.refresh());
  }

  // Vendors grouped by their assigned category, for the "Vendors" column in
  // the categories table. Vendors with no category land in the "Undefined"
  // bucket (only shown in the Vendors view).
  function vendorsForCategory(categoryId: string): Vendor[] {
    return vends.filter((v) => v.categoryId === categoryId);
  }

  async function toggleOneTime(c: Cat) {
    const next = !c.isOneTime;
    // Optimistic update - flip the local row first, roll back if the API
    // rejects. Changing the category default flows through to every place
    // that uses it (data flow, dashboard, forecasts) on the next render.
    setCats(cats.map((x) => (x.id === c.id ? { ...x, isOneTime: next } : x)));
    const res = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isOneTime: next }),
    });
    if (!res.ok) {
      notify.alert(await res.text());
      setCats(cats.map((x) => (x.id === c.id ? { ...x, isOneTime: c.isOneTime } : x)));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <>
      {/* Categories & Vendors now lives in the Data section, so it
          renders the DataTabs strip instead of BusinessSettingsTabs
          (even though the URL is still /settings?tab=categories). */}
      {tab === "categories" ? <DataTabs /> : <BusinessSettingsTabs />}

      {/* ─── Business Settings tab ─────────────────────────────── */}
      {tab === "settings" ? (
        <>
      <div className="card mb-6">
        <div className="font-medium mb-1">Business Settings</div>
        <div className="text-xs text-slate-400 mb-4">
          These settings drive every financial calculation in the platform. Defaults
          (USD, January fiscal year, no VAT) work for most US-based businesses -
          change anything that doesn&apos;t fit yours.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-3"><label className="label">Name</label>
            <input className="input" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
          </div>
          <div><label className="label">Default currency</label>
            <CurrencyPicker
              value={biz.currency}
              onChange={(code) => setBiz({ ...biz, currency: code })}
            />
          </div>
          <div><label className="label">Fiscal year starts in</label>
            <select className="input" value={biz.fiscalStartMonth} onChange={(e) => setBiz({ ...biz, fiscalStartMonth: Number(e.target.value) })}>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(Date.UTC(2024, i, 1)).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div><label className="label">Country</label>
            <input className="input" value={biz.country ?? ""} onChange={(e) => setBiz({ ...biz, country: e.target.value || null })} placeholder="e.g. United States" />
          </div>
          <div><label className="label">Timezone</label>
            <input className="input" value={biz.timezone ?? ""} onChange={(e) => setBiz({ ...biz, timezone: e.target.value || null })} placeholder="e.g. America/New_York" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="biz-vat" checked={biz.vatEnabled} onChange={(e) => setBiz({ ...biz, vatEnabled: e.target.checked })} />
            <label htmlFor="biz-vat" className="text-sm">Track VAT</label>
          </div>
          {biz.vatEnabled ? (
            <div><label className="label">VAT rate %</label>
              <input className="input" type="number" step="0.1" value={biz.vatRate} onChange={(e) => setBiz({ ...biz, vatRate: Number(e.target.value) })} />
            </div>
          ) : null}
          {biz.currency !== business.currency ? (
            <div className="md:col-span-3">
              <div className="rounded-md border border-warn/40 bg-warn/10 text-warn text-xs px-3 py-2">
                <strong>Heads up:</strong> changing the currency from {business.currency} to {biz.currency} won&apos;t
                convert existing transactions. Historical imports keep their original amounts;
                only labels change. Review imported data after saving.
              </div>
            </div>
          ) : null}
          <div className="md:col-span-3 flex items-center justify-end gap-3">
            {bizError ? <span className="text-sm text-red-300">{bizError}</span> : null}
            {bizSaved && !bizError ? <span className="text-sm text-good">Saved ✓</span> : null}
            <button className="btn-primary" disabled={pending || bizSaving} onClick={saveBiz}>
              {bizSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <CurrencySection baseCurrency={business.currency} />

      <div className="card mb-6">
        <div className="font-medium mb-1">Branding</div>
        <div className="text-xs text-slate-400 mb-4">
          Upload your own logo and favicon. Pick a file to preview it, then click <strong>Save</strong> to apply.
          The TWEAXLY wordmark stays as the platform brand; your logo appears beneath it (replacing the business name).
          The favicon replaces the browser tab icon.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BrandSlot
            label="Logo"
            hint="PNG, JPEG, WEBP, or SVG. Up to 1 MB. Rectangular logos look best - they'll be scaled to fit a ~48px tall slot in the sidebar."
            previewBg="#0a1428"
            previewClassName="h-24 w-full flex items-center justify-center"
            saved={biz.logoData}
            pending={logoPending}
            accept={LOGO_ACCEPT}
            saving={brandSaving === "logo"}
            onPick={(f) => stageFile("logo", f)}
            onClearDraft={() => { setLogoPending(undefined); setBrandError(null); }}
            onStageRemove={() => { setLogoPending(null); setBrandError(null); }}
            onSave={() => saveBrand("logoData", logoPending ?? null)}
            renderPreview={(src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Logo" className="max-h-20 max-w-full object-contain" />
            )}
          />
          <BrandSlot
            label="Favicon"
            hint="PNG, SVG, or ICO. Up to 1 MB. A square image works best - browsers render it at 16–32px."
            previewBg="#0a1428"
            previewClassName="h-24 w-full flex items-center justify-center"
            saved={biz.faviconData}
            pending={faviconPending}
            accept={FAVICON_ACCEPT}
            saving={brandSaving === "favicon"}
            onPick={(f) => stageFile("favicon", f)}
            onClearDraft={() => { setFaviconPending(undefined); setBrandError(null); }}
            onStageRemove={() => { setFaviconPending(null); setBrandError(null); }}
            onSave={() => saveBrand("faviconData", faviconPending ?? null)}
            renderPreview={(src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Favicon" className="h-12 w-12 object-contain" />
            )}
          />
        </div>
        {brandError ? (
          <div className="mt-3 text-sm text-red-300">{brandError}</div>
        ) : null}
      </div>

        </>
      ) : null}

      {/* ─── Business Profile tab (Business DNA) ────────────────── */}
      {tab === "profile" ? (
        <BusinessDnaSection initial={businessDna ?? null} />
      ) : null}

      {/* ─── Business Plan tab (per-workspace billing) ──────────── */}
      {tab === "plan" && billing ? (
        <BillingClient {...billing} />
      ) : null}

      {/* ─── Members & Access tab ─────────────────────────────── */}
      {tab === "members" ? (
        <MembersAndAccessSection businessId={biz.id} />
      ) : null}

      {tab === "categories" ? (
        <>
      <div className="card mb-6">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
          <div className="font-medium">Categories &amp; vendors</div>
          <select
            className="input text-xs py-1 px-2 w-auto"
            value={view}
            onChange={(e) => setView(e.target.value as View)}
          >
            <option value="categories">Show by categories</option>
            <option value="vendors">Show by vendors</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 mb-4">
          <button className="btn-primary" onClick={() => setAddCatOpen(true)}>+ Add category</button>
          <button className="btn-ghost" onClick={() => setAddVendorOpen(true)}>+ Add vendor</button>
        </div>

        {view === "categories" ? (
          <>
            <table className="table-base mb-2">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Vendors</th>
                  <th className="text-right">Transactions</th>
                  <th className="text-right">Total</th>
                  <th>Last seen</th>
                  <th>One-time?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => {
                  const unused = c.transactionCount === 0 && c.vendorCount === 0;
                  // Vendors cell: list every vendor in this category
                  // with the count in parens. Long lists are truncated
                  // visually but the full set is in the hover title so
                  // owners can still see everything without crowding
                  // the row.
                  const vendorLabel =
                    c.vendorNames.length === 0
                      ? <span className="text-slate-500 text-xs"> - </span>
                      : (
                        <span
                          className="text-slate-300 text-xs"
                          title={c.vendorNames.join("\n")}
                        >
                          <span className="line-clamp-2">{c.vendorNames.join(", ")}</span>
                          <span className="text-slate-500"> ({c.vendorNames.length})</span>
                        </span>
                      );
                  return (
                    <tr key={c.id}>
                      <td>
                        {c.transactionCount > 0 ? (
                          <Link
                            href={`/transactions?category=${c.id}`}
                            className="text-slate-100 hover:text-accent underline-offset-2 hover:underline"
                            title="Drill into every transaction in this category"
                          >
                            {c.name}
                          </Link>
                        ) : (
                          <span className="text-slate-300">{c.name}</span>
                        )}
                      </td>
                      <td>
                        <span className={c.kind === "revenue" ? "pill-good" : "pill"}>
                          {typeLabel(c.kind)}
                        </span>
                      </td>
                      <td className="max-w-[320px]">{vendorLabel}</td>
                      <td className="text-right text-slate-300">{c.transactionCount}</td>
                      <td className="text-right text-slate-300 font-mono text-xs">
                        {!c.totalAmount ? " - " : c.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-slate-400 text-xs whitespace-nowrap">
                        {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleDateString() : " - "}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleOneTime(c)}
                          title="Click to toggle. The change applies wherever this category is used."
                          className={c.isOneTime
                            ? "pill-warn cursor-pointer hover:opacity-80"
                            : "pill cursor-pointer hover:opacity-80"}
                        >
                          {c.isOneTime ? "YES" : "NO"}
                        </button>
                      </td>
                      <td className="text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          className="btn-ghost py-1 text-xs"
                          onClick={() => setMergeCategoryFrom(c)}
                          title="Merge this category into another. Transactions, vendor pins, and rules are reassigned + this row is deleted."
                        >
                          Merge
                        </button>
                        <button
                          className="btn-danger py-1 text-xs"
                          onClick={() => removeCategory(c.id)}
                          disabled={!unused}
                          title={unused
                            ? "Delete this category"
                            : `Has ${c.transactionCount} transaction${c.transactionCount === 1 ? "" : "s"} / ${c.vendorCount} vendor${c.vendorCount === 1 ? "" : "s"} - reassign them first.`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : null}

        {view === "vendors" ? (
          <>
            {/* Mirrors the Categories table column-for-column so the
                two views read as the same idea with the lead entity
                swapped. Lead | Type | Related | Transactions | Total |
                Last seen | One-time? | Actions. */}
            <table className="table-base mb-2">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Type</th>
                  <th>Categories</th>
                  <th className="text-right">Transactions</th>
                  <th className="text-right">Total</th>
                  <th>Last seen</th>
                  <th>One-time?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {/* Only show vendors with at least one active transaction.
                    Filters out stale auto-created Vendor rows whose
                    transactions have since been re-vendored via the
                    Transactions bulk "Set vendor" action. Keeping the
                    unassigned-first order so vendors needing a pin
                    bubble up. */}
                {[...vends.filter((v) => v.transactionCount > 0 && !v.categoryId),
                  ...vends.filter((v) => v.transactionCount > 0 && v.categoryId)].map((v) => {
                  // Categories cell: list every category this vendor's
                  // transactions sit in with the count in parens - the
                  // mirror image of the Categories table's Vendors cell.
                  const catLabel =
                    v.txnCategoryNames.length === 0
                      ? <span className="text-slate-500 text-xs"> - </span>
                      : (
                        <span
                          className="text-slate-300 text-xs"
                          title={v.txnCategoryNames.join("\n")}
                        >
                          <span className="line-clamp-2">{v.txnCategoryNames.join(", ")}</span>
                          <span className="text-slate-500"> ({v.txnCategoryNames.length})</span>
                        </span>
                      );
                  // Type pill: Income (revenue-only), Outcome
                  // (non-revenue-only), Mixed (both), or - when no
                  // categorized txns yet.
                  const typePill = v.typeLabel === "Income"
                    ? <span className="pill-good">Income</span>
                    : v.typeLabel === "Outcome"
                    ? <span className="pill">Outcome</span>
                    : v.typeLabel === "Mixed"
                    ? <span className="pill">Mixed</span>
                    : <span className="text-slate-500 text-xs"> - </span>;
                  return (
                  <tr key={v.id}>
                    <td>
                      {v.transactionCount > 0 ? (
                        <Link
                          href={`/transactions?vendor=${encodeURIComponent(v.name)}`}
                          className="text-slate-100 hover:text-accent underline-offset-2 hover:underline"
                          title="Drill into every transaction tagged with this vendor"
                        >
                          {v.name}
                        </Link>
                      ) : (
                        <span className="text-slate-300">{v.name}</span>
                      )}
                    </td>
                    <td>{typePill}</td>
                    <td className="max-w-[320px]">{catLabel}</td>
                    <td
                      className="text-right text-slate-300"
                      title={v.descriptions.length > 0 ? v.descriptions.join("\n") : undefined}
                    >
                      {v.transactionCount}
                    </td>
                    <td className="text-right text-slate-300 font-mono text-xs">
                      {!v.transactionCount || !v.totalAmount ? " - " : v.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-slate-400 text-xs whitespace-nowrap">
                      {v.lastSeenAt ? new Date(v.lastSeenAt).toLocaleDateString() : " - "}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleVendorOneTime(v)}
                        title="Click to toggle. Vendors marked one-time default to one-time on every transaction that matches them."
                        className={v.isOneTime
                          ? "pill-warn cursor-pointer hover:opacity-80"
                          : "pill cursor-pointer hover:opacity-80"}
                      >
                        {v.isOneTime ? "YES" : "NO"}
                      </button>
                    </td>
                    <td className="text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        className="btn-ghost py-1 text-xs"
                        onClick={() => setMergeFrom(v)}
                        title="Merge this vendor into another. Transactions are reassigned + this row is deleted."
                      >
                        Merge
                      </button>
                      <button className="btn-danger py-1 text-xs" onClick={() => removeVendor(v.id)}>Delete</button>
                    </td>
                  </tr>
                  );
                })}
                {vends.filter((v) => v.transactionCount > 0).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-sm text-slate-400 py-6">
                      No vendors with active transactions yet. Use the <span className="text-slate-200">Set vendor…</span> bulk action on Transactions to normalize raw descriptions into vendors.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </>
        ) : null}
      </div>

      {/* Categorization rules - auto-assign categories to incoming
          transactions when their description or vendor matches a
          pattern. Collapsed by default - most users only configure
          rules occasionally, so it doesn't need to take real estate
          while they're scanning categories or vendors. */}
      <details className="group card !p-0 overflow-hidden mt-4">
        <summary className="cursor-pointer list-none select-none px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap hover:bg-ink-900/40 transition">
          <div className="flex items-baseline gap-3 flex-wrap min-w-0">
            <span className="font-medium text-slate-100">Categorization rules</span>
            <p className="text-xs text-slate-400 max-w-md">
              If a description or vendor matches your pattern, the system auto-assigns the category. Higher priority wins.
            </p>
          </div>
          <span aria-hidden="true" className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-line bg-ink-900/60 text-slate-300 group-hover:text-slate-100 group-hover:border-accent/50 group-hover:bg-accent-soft/20 transition group-open:rotate-180 shrink-0">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </summary>
        <div className="px-5 pb-5 pt-1 border-t border-line/40">
          <RulesClient
            rules={rules}
            categories={cats.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </details>

      {/* Vendorization rules - mirrors the categorization rules card,
          but the target is a canonical vendor name. Same collapsed-
          by-default treatment. */}
      <details className="group card !p-0 overflow-hidden mt-4">
        <summary className="cursor-pointer list-none select-none px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap hover:bg-ink-900/40 transition">
          <div className="flex items-baseline gap-3 flex-wrap min-w-0">
            <span className="font-medium text-slate-100">Vendorization rules</span>
            <p className="text-xs text-slate-400 max-w-md">
              If a description or raw vendor matches your pattern, the system rewrites the transaction&apos;s vendor to the canonical name. Higher priority wins. Runs before categorization rules.
            </p>
          </div>
          <span aria-hidden="true" className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-line bg-ink-900/60 text-slate-300 group-hover:text-slate-100 group-hover:border-accent/50 group-hover:bg-accent-soft/20 transition group-open:rotate-180 shrink-0">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </summary>
        <div className="px-5 pb-5 pt-1 border-t border-line/40">
          <VendorizationRulesClient
            rules={vendorizationRules}
            vendors={vends.map((v) => ({ id: v.id, name: v.name }))}
          />
        </div>
      </details>

      {/* Merge category modal - mirrors the vendor merge modal. Picks
          a target category, then POSTs to /api/categories/merge which
          reassigns transactions / vendor pins / rules and deletes the
          source. */}
      {mergeCategoryFrom ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => (mergeCategoryBusy ? null : (setMergeCategoryFrom(null), setMergeCategoryTargetId("")))}
        >
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100 mb-2">
              Merge &quot;{mergeCategoryFrom.name}&quot; into…
            </div>
            <div className="text-sm text-slate-400 mb-3">
              Every transaction, vendor pin, and rule currently assigned to &quot;{mergeCategoryFrom.name}&quot; will be reassigned to the category you pick, and &quot;{mergeCategoryFrom.name}&quot; will be removed. This is irreversible.
            </div>
            <label className="label">Merge into</label>
            <select
              className="input"
              value={mergeCategoryTargetId}
              onChange={(e) => setMergeCategoryTargetId(e.target.value)}
              disabled={mergeCategoryBusy}
            >
              <option value="">Pick a category…</option>
              {cats
                .filter((c) => c.id !== mergeCategoryFrom.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.transactionCount > 0 ? ` (${c.transactionCount} txns)` : ""}
                  </option>
                ))}
            </select>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => { setMergeCategoryFrom(null); setMergeCategoryTargetId(""); }}
                disabled={mergeCategoryBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-sm disabled:opacity-50"
                onClick={doMergeCategory}
                disabled={!mergeCategoryTargetId || mergeCategoryBusy}
              >
                {mergeCategoryBusy ? "Merging…" : "Merge"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Merge vendor modal - only mounted when the user clicked
          "Merge" on a vendor row. Picks which other vendor to merge
          INTO, then POSTs to /api/vendors/merge which reassigns the
          transactions and deletes the source row. */}
      {mergeFrom ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => (mergeBusy ? null : (setMergeFrom(null), setMergeTargetId("")))}
        >
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100 mb-2">
              Merge "{mergeFrom.name}" into…
            </div>
            <div className="text-sm text-slate-400 mb-3">
              Every transaction whose vendor matches "{mergeFrom.name}" will be reassigned to the vendor you pick, and "{mergeFrom.name}" will be removed. This is irreversible.
            </div>
            <label className="label">Merge into</label>
            <select
              className="input"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              disabled={mergeBusy}
            >
              <option value="">Pick a vendor…</option>
              {vends
                .filter((v) => v.id !== mergeFrom.id)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.transactionCount > 0 ? ` (${v.transactionCount} txns)` : ""}
                  </option>
                ))}
            </select>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => { setMergeFrom(null); setMergeTargetId(""); }}
                disabled={mergeBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-sm disabled:opacity-50"
                onClick={doMerge}
                disabled={!mergeTargetId || mergeBusy}
              >
                {mergeBusy ? "Merging…" : "Merge"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      ) : null}

      {tab === "integration" ? <IntegrationClient /> : null}

      {/* Add category modal */}
      {addCatOpen ? (
        <Modal
          title="Add category"
          onClose={() => setAddCatOpen(false)}
        >
          <div className="space-y-3">
            {/* Suggestions row - filtered by the currently-selected
                type (Income vs Outcome). Picks fill in the name; the
                user still confirms before the category is created. */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                Common {addCatDraft.isIncome ? "income" : "expense"} categories - pick to start
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(addCatDraft.isIncome ? SUGGESTED_INCOME_CATEGORIES : SUGGESTED_EXPENSE_CATEGORIES).map((s) => {
                  const taken = cats.some((c) => c.name.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={taken}
                      onClick={() => setAddCatDraft({ ...addCatDraft, name: s })}
                      className={`text-[11px] px-2 py-1 rounded border transition ${
                        taken
                          ? "border-line/40 text-slate-600 bg-ink-900/30 cursor-not-allowed"
                          : addCatDraft.name === s
                            ? "border-accent bg-accent-soft/40 text-accent"
                            : "border-line text-slate-300 hover:border-accent/40 hover:text-slate-100"
                      }`}
                      title={taken ? "Already exists in this workspace" : "Use as category name"}
                    >
                      {s}{taken ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Category name</label>
              <input
                className="input"
                autoFocus
                value={addCatDraft.name}
                onChange={(e) => setAddCatDraft({ ...addCatDraft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn flex-1 ${!addCatDraft.isIncome ? "border border-bad text-bad hover:bg-bad/10" : "btn-ghost"}`}
                  onClick={() => setAddCatDraft({ ...addCatDraft, isIncome: false })}
                >
                  Outcome
                </button>
                <button
                  type="button"
                  className={`btn flex-1 ${addCatDraft.isIncome ? "border border-good text-good hover:bg-good/10" : "btn-ghost"}`}
                  onClick={() => setAddCatDraft({ ...addCatDraft, isIncome: true })}
                >
                  Income
                </button>
              </div>
            </div>
            <div>
              <label className="label">One-time?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn flex-1 ${!addCatDraft.isOneTime ? "bg-accent text-white" : "btn-ghost"}`}
                  onClick={() => setAddCatDraft({ ...addCatDraft, isOneTime: false })}
                >
                  NO
                </button>
                <button
                  type="button"
                  className={`btn flex-1 ${addCatDraft.isOneTime ? "bg-warn text-white" : "btn-ghost"}`}
                  onClick={() => setAddCatDraft({ ...addCatDraft, isOneTime: true })}
                >
                  YES
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setAddCatOpen(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!addCatDraft.name.trim()}
                onClick={addCategoryFromModal}
              >
                Add category
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Add vendor modal */}
      {addVendorOpen ? (
        <Modal
          title="Add vendor"
          onClose={() => setAddVendorOpen(false)}
        >
          <div className="space-y-3">
            <div>
              <label className="label">Select vendor</label>
              <input
                className="input"
                autoFocus
                value={addVendorDraft.name}
                onChange={(e) => setAddVendorDraft({ ...addVendorDraft, name: e.target.value })}
                placeholder="e.g. Meta, Google, Bing"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={addVendorDraft.categoryId}
                onChange={(e) => setAddVendorDraft({ ...addVendorDraft, categoryId: e.target.value })}
              >
                <option value="__new__">+ Add new category…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">One-time?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn flex-1 ${!addVendorDraft.isOneTime ? "bg-accent text-white" : "btn-ghost"}`}
                  onClick={() => setAddVendorDraft({ ...addVendorDraft, isOneTime: false })}
                >
                  NO
                </button>
                <button
                  type="button"
                  className={`btn flex-1 ${addVendorDraft.isOneTime ? "bg-warn text-white" : "btn-ghost"}`}
                  onClick={() => setAddVendorDraft({ ...addVendorDraft, isOneTime: true })}
                >
                  YES
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setAddVendorOpen(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!addVendorDraft.name.trim()}
                onClick={addVendorFromModal}
              >
                Add vendor
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-semibold">{title}</div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-200 px-2"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BrandSlot({
  label,
  hint,
  saved,
  pending,
  accept,
  saving,
  onPick,
  onClearDraft,
  onStageRemove,
  onSave,
  renderPreview,
  previewBg,
  previewClassName,
}: {
  label: string;
  hint: string;
  saved: string | null;
  pending: Pending;
  accept: string;
  saving: boolean;
  onPick: (file: File | undefined) => void;
  onClearDraft: () => void;
  onStageRemove: () => void;
  onSave: () => void;
  renderPreview: (src: string) => React.ReactNode;
  previewBg: string;
  previewClassName: string;
}) {
  const display = effectiveValue(saved, pending);
  const isDirty = pending !== undefined;
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="label">{label}</div>
        {isDirty ? <span className="text-[11px] text-warn">Unsaved changes</span> : null}
      </div>
      <div
        className={`rounded-md border ${isDirty ? "border-warn/50" : "border-line"} ${previewClassName}`}
        style={{ backgroundColor: previewBg }}
      >
        {display ? renderPreview(display) : <span className="text-xs text-slate-500">No {label.toLowerCase()} set</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="btn-ghost cursor-pointer">
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={saving}
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {saved || (typeof pending === "string") ? "Replace" : "Upload"}
        </label>
        {/* Stage a removal - only meaningful if there's something currently saved or pending */}
        {(saved || typeof pending === "string") ? (
          <button
            className="btn-ghost"
            disabled={saving}
            onClick={onStageRemove}
            title={`Stage removal of the ${label.toLowerCase()}`}
          >
            Remove
          </button>
        ) : null}
        {isDirty ? (
          <>
            <button
              className="btn-primary"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              className="btn-ghost"
              disabled={saving}
              onClick={onClearDraft}
            >
              Cancel
            </button>
          </>
        ) : null}
      </div>
      <div className="text-xs text-slate-500 mt-2">{hint}</div>
    </div>
  );
}
