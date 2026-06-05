import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FinancialReviewResultSchema } from "@/lib/financialReview/types";
import ReviewDetail from "../ReviewDetail";
import ReviewActions from "./ReviewActions";
import ShareButton from "./ShareButton";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;

  const review = await prisma.financialReview.findFirst({
    where: { id, businessId: business.id },
  });
  if (!review) notFound();

  // Re-validate the stored result defensively (it was validated on write).
  const parsed =
    review.status === "complete" && review.result
      ? FinancialReviewResultSchema.safeParse(review.result)
      : null;

  const title = review.reportType || review.fileName || "Financial Review";

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`${review.financialYear ? `FY ${review.financialYear} · ` : ""}${review.fileName} · ${fmtDate(review.createdAt)}`}
      />

      <div className="pt-2">
        <Link href="/financial-review" className="t-meta inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
          <ArrowLeft size={14} /> All reviews
        </Link>

        {/* Action toolbar - left-aligned in the page body (not the sticky
            header) so the Share popover opens into the content area and
            above the sidebar, never behind it. */}
        <div className="mb-5 mt-3 flex items-center gap-2">
          {review.status === "complete" ? (
            <ShareButton id={review.id} initialToken={review.shareToken} />
          ) : null}
          <ReviewActions id={review.id} />
        </div>

        {review.scanned ? (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-warn/30 bg-warn/10 p-3.5">
            <ScanLine size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="t-meta leading-relaxed text-slate-300">
              <span className="font-semibold text-warn">Scanned PDF detected. </span>
              This report had no text layer, so it was read with AI vision - slower and a little less precise than a text-based file. For the fastest, most accurate reviews, upload the original PDF exported from your accounting software.
            </p>
          </div>
        ) : null}

        {review.notes ? (
          <div className="mb-5 rounded-md border border-line bg-ink-800/60 p-3.5">
            <div className="t-meta mb-1 uppercase tracking-wide text-slate-400">Notes</div>
            <p className="t-body text-slate-200">{review.notes}</p>
          </div>
        ) : null}

        {review.status === "complete" && parsed?.success ? (
          <ReviewDetail result={parsed.data} level={review.statusLevel} />
        ) : review.status === "processing" ? (
          <div className="card mt-2 py-12 text-center">
            <div className="t-card">This review is still processing</div>
            <p className="t-meta mt-2 text-slate-400">Refresh this page in a moment.</p>
          </div>
        ) : (
          <div className="card mt-2 py-10 text-center">
            <div className="t-card text-bad">We could not generate this review</div>
            <p className="t-meta mx-auto mt-2 max-w-md text-slate-400">
              {review.errorMessage || "Something went wrong while analyzing the report."} You can delete this entry and upload the report again.
            </p>
            <Link href="/financial-review" className="btn-primary mt-5 inline-flex">Back to upload</Link>
          </div>
        )}
      </div>
    </>
  );
}
