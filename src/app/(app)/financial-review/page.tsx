// Financial Review - module landing.
//
// A separate top-level workflow: upload a financial report from your
// accountant and get a plain-English AI review (health score, second
// opinion, questions for your CPA, an action plan, and a 12-month
// outlook). Independent from Dashboard / Advisory / Forecast / Signals
// / Transactions / Data Sources.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UploadCard from "./UploadCard";
import ReviewDisclaimer from "@/components/financial-review/Disclaimer";
import { statusLabel, statusPillClass } from "@/lib/financialReview/types";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function FinancialReviewPage() {
  const { business } = await requireBusiness();

  const reviews = await prisma.financialReview.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fileName: true, reportType: true, status: true,
      score: true, statusLevel: true, createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Financial Review"
        subtitle="Upload a report from your accountant and get a clear, plain-English review of your business."
      />

      <div className="space-y-6 pb-12">
        <ReviewDisclaimer />

        <UploadCard />

        <section className="card">
          <h2 className="t-card mb-1">Previous reviews</h2>
          <p className="t-meta mb-4 text-slate-400">
            Reopen any past review instantly - no reprocessing needed.
          </p>

          {reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
              <div className="t-body text-slate-300">No reviews yet</div>
              <div className="t-meta mt-1 text-slate-500">
                Upload your first financial report above to get started.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Review</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="cursor-pointer">
                      <td>
                        <Link href={`/financial-review/${r.id}`} className="block">
                          <div className="font-medium text-slate-100">{r.reportType || r.fileName}</div>
                          {r.reportType ? (
                            <div className="t-meta text-slate-500">{r.fileName}</div>
                          ) : null}
                        </Link>
                      </td>
                      <td className="text-slate-300">
                        <Link href={`/financial-review/${r.id}`} className="block">{fmtDate(r.createdAt)}</Link>
                      </td>
                      <td>
                        <Link href={`/financial-review/${r.id}`} className="block font-semibold text-slate-100">
                          {r.status === "complete" && r.score != null ? r.score : "—"}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/financial-review/${r.id}`} className="block">
                          {r.status === "complete" ? (
                            <span className={statusPillClass(r.statusLevel)}>{statusLabel(r.statusLevel)}</span>
                          ) : r.status === "processing" ? (
                            <span className="pill">Processing…</span>
                          ) : (
                            <span className="pill-bad">Failed</span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
