// Shared "How the Data section works" help modal. Rendered as the
// PageHeader.help on every Data sub-tab (Import, Sources, Transactions,
// Categories & Vendors, Data Log, Integration). One file = same modal
// no matter which sub-tab the owner is on; copy edits stay in sync.

import HowItWorks from "@/components/HowItWorks";
import { Upload, FolderTree, ListChecks, Tag, History, Plug } from "lucide-react";

export default function DataHelp() {
  return (
    <HowItWorks
      title="How the Data section works"
      intro="Everything to do with the financial activity Tweaxly knows about - getting it in, organising it, and keeping it tidy. The more complete your data, the sharper your signals, forecasts, and AI answers get."
      cards={[
        { icon: <Upload size={16} strokeWidth={1.7} />,     title: "Import",              body: "Upload CSV statements from any source - bank, credit card, PayPal, Stripe, Shopify. Auto-detects columns, currencies, and credit-card settlements. Manual entry handles one-offs that won't show in any export." },
        { icon: <FolderTree size={16} strokeWidth={1.7} />, title: "Sources",             body: "Each bank, card, or provider is its own source. The coverage matrix shows which months are uploaded per source so the gaps are visible at a glance." },
        { icon: <ListChecks size={16} strokeWidth={1.7} />, title: "Transactions",        body: "The full row-level ledger. Filter, search, categorize, mark one-time, exclude from P&L, or move to trash. Bulk actions for fast cleanup." },
        { icon: <Tag size={16} strokeWidth={1.7} />,        title: "Categories & Vendors", body: "Categorization rules + vendor normalization. Set them once and every future import inherits them. Merge duplicate vendors and categories without breaking history." },
        { icon: <History size={16} strokeWidth={1.7} />,    title: "Data Log",            body: "Audit trail of every upload, edit, deletion, and import batch. Useful when reconciling against your bank statements or rolling back a bad import." },
        { icon: <Plug size={16} strokeWidth={1.7} />,       title: "Integration",         body: "Direct connectors via Plaid (US, more regions soon). Transactions and balances sync automatically. Strictly read-only - Tweaxly never moves money or stores credentials." },
      ]}
      outro="New data flows through these surfaces in the order above: Import or Integration brings data in, Sources organises it, Transactions exposes the rows, Categories & Vendors keep it labelled, Data Log tracks the changes."
    />
  );
}
