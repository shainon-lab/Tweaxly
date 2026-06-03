import { FINANCIAL_REVIEW_DISCLAIMER } from "@/lib/financialReview/types";

// Prominent, repeated disclaimer for the Financial Review module. Shown
// on the landing page, during upload, and at the top + bottom of every
// review. Uses the app's warn tokens so it reads as an important notice.
export default function ReviewDisclaimer() {
  return (
    <div className="rounded-md border border-warn/30 bg-warn/10 p-3.5">
      <p className="t-meta leading-relaxed text-slate-300">
        <span className="font-semibold text-warn">For information only. </span>
        {FINANCIAL_REVIEW_DISCLAIMER}
      </p>
    </div>
  );
}
