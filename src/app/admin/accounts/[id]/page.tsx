// Admin · Customer 360 detail page. Sections:
//   A. Overview            — business identity + key dates
//   B. Owner & users       — members with role/status + admin actions
//   C. Plan & billing      — plan + trial (Stripe stub)
//   D. Orders / invoices   — Stripe stub
//   E. Onboarding & data   — computed from real tables
//   F. Usage & activity    — computed from real tables
//   G. Support             — stub (no support tool integrated)
//   H. Security & audit    — login history, failed attempts, admin actions
//   I. Account actions     — destructive controls with confirmation
//   + Internal notes (any section can be referenced from there)

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeHealthScore, HEALTH_BAND_COLOR, HEALTH_BAND_LABEL } from "@/lib/healthScore";
import { AccountActions } from "./AccountActions";
import { PlanEditor } from "./PlanEditor";
import { AdminNotes } from "./AdminNotes";
import { MembersTable } from "./MembersTable";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}
function fmtDay(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtRel(d: Date | null | undefined) {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

const SECTIONS = [
  { id: "overview",    label: "Overview" },
  { id: "members",     label: "Owner & users" },
  { id: "plan",        label: "Plan & billing" },
  { id: "onboarding",  label: "Onboarding & data" },
  { id: "usage",       label: "Usage & activity" },
  { id: "support",     label: "Support" },
  { id: "security",    label: "Security & audit" },
  { id: "notes",       label: "Internal notes" },
  { id: "actions",     label: "Actions" },
];

export default async function Customer360({ params }: { params: { id: string } }) {
  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);
  const since7d = new Date();
  since7d.setDate(since7d.getDate() - 7);

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, email: true, name: true, createdAt: true, lastLoginAt: true } },
      memberships: {
        include: { user: { select: { id: true, email: true, name: true, lastLoginAt: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          transactions: true,
          uploads: true,
          employees: true,
          consultations: true,
          notificationRules: true,
          forecastAssumptions: true,
          adminNotes: true,
        },
      },
    },
  });
  if (!business) notFound();

  const [
    notes,
    recentAudit,
    lastConsultation,
    lastUpload,
    categorizedCount,
    sessions7d,
    sessions30d,
    failedLogins7d,
    successfulLogins,
    impersonationsHere,
    passwordResets,
  ] = await Promise.all([
    prisma.adminNote.findMany({
      where: { targetBusinessId: params.id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { email: true, name: true } } },
    }),
    prisma.auditLog.findMany({
      where: { targetBusinessId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { email: true, name: true } } },
    }),
    prisma.consultation.findFirst({
      where: { businessId: params.id },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.uploadBatch.findFirst({
      where: { businessId: params.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, filename: true },
    }),
    prisma.transaction.count({
      where: { businessId: params.id, categoryId: { not: null } },
    }),
    prisma.loginAttempt.count({
      where: { userId: { in: business.memberships.map((m) => m.userId) }, success: true, createdAt: { gte: since7d } },
    }),
    prisma.loginAttempt.count({
      where: { userId: { in: business.memberships.map((m) => m.userId) }, success: true, createdAt: { gte: since30d } },
    }),
    prisma.loginAttempt.count({
      where: { userId: { in: business.memberships.map((m) => m.userId) }, success: false, createdAt: { gte: since7d } },
    }),
    prisma.loginAttempt.findMany({
      where: { userId: { in: business.memberships.map((m) => m.userId) } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { email: true } } },
    }),
    prisma.auditLog.findMany({
      where: { targetBusinessId: params.id, action: { startsWith: "impersonation." } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { email: true } } },
    }),
    prisma.passwordResetToken.findMany({
      where: { userId: { in: business.memberships.map((m) => m.userId) } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
  ]);

  // Other businesses owned by the same user — used to support consultant /
  // accountant / portfolio workflows where one human owns several
  // workspaces. Excludes the current one.
  const siblingBusinesses = await prisma.business.findMany({
    where: { ownerId: business.owner.id, id: { not: business.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, status: true, plan: true, lastActivityAt: true },
  });

  const totalTx = business._count.transactions;
  const categorizationPct = totalTx > 0 ? Math.round((categorizedCount / totalTx) * 100) : 0;
  const ageDays = Math.floor((Date.now() - business.createdAt.getTime()) / 86_400_000);
  const health = computeHealthScore({
    lastActivityAt: business.lastActivityAt,
    lastLoginAt:    business.owner.lastLoginAt,
    hasUploadedData: totalTx > 0 || business._count.uploads > 0,
    transactionCount: totalTx,
    categorizationPct,
    consultationsCount: business._count.consultations,
    forecastAssumptionsCount: business._count.forecastAssumptions,
    notificationRulesCount: business._count.notificationRules,
    ageDays,
    isSuspended: business.status === "suspended",
  });
  const onboardingSteps = [
    { label: "Account created",        done: true },
    { label: "First data uploaded",    done: totalTx > 0 || business._count.uploads > 0 },
    { label: "Categorization started", done: categorizedCount > 0 },
    { label: "Alert rules configured", done: business._count.notificationRules > 0 },
    { label: "First AI consultation",  done: business._count.consultations > 0 },
    { label: "Forecast scenario added", done: business._count.forecastAssumptions > 0 },
    { label: "Workforce loaded",       done: business._count.employees > 0 },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;
  const trialActive = business.trialEndsAt && business.trialEndsAt.getTime() > Date.now();

  return (
    <div className="space-y-8">
      {/* Breadcrumb + section nav */}
      <div className="space-y-3">
        <div className="text-xs text-slate-500">
          <Link href="/admin/accounts" className="hover:text-slate-200">Accounts</Link>
          <span className="mx-2 text-slate-700">/</span>
          <span className="text-slate-300">{business.name}</span>
        </div>
        <nav className="flex items-center gap-1.5 flex-wrap text-xs">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-2.5 py-1 rounded-md border border-line text-slate-400 hover:text-slate-100 hover:border-slate-500 transition"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{business.name}</h1>
            <span className={`${STATUS_PILL[business.status] ?? "pill"} text-[10px]`}>{business.status}</span>
            {trialActive ? (
              <span className="pill-accent text-[10px]">trial ends {fmtDay(business.trialEndsAt)}</span>
            ) : null}
            <span className="pill text-[10px]">{business.plan}</span>
            <span
              title={health.reasons.join(" · ")}
              className={`inline-flex items-baseline gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-line bg-ink-900/40 ${HEALTH_BAND_COLOR[health.band]}`}
            >
              <span className="font-bold text-sm tabular-nums">{health.score}</span>
              <span>{HEALTH_BAND_LABEL[health.band]}</span>
            </span>
          </div>
          <div className="text-sm text-slate-400">
            Owned by {business.owner.email} · created {fmtDate(business.createdAt)}
            <span className="ml-2 font-mono text-[10px] text-slate-600">{business.id}</span>
          </div>
          {health.reasons.length > 0 ? (
            <ul className="text-[11px] text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {health.reasons.map((r) => (
                <li key={r} className="before:content-['·'] before:mr-1 before:text-slate-700">{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <AccountActions
          businessId={business.id}
          businessName={business.name}
          status={business.status}
        />
      </div>

      {/* Owner's other businesses — surfaces consultant / multi-workspace
          context inline so the operator can pivot between sibling accounts. */}
      {siblingBusinesses.length > 0 ? (
        <div className="rounded-lg border border-accent/30 bg-accent-soft/10 p-3">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="text-[11px] uppercase tracking-wider text-accent font-semibold">
              Same owner manages {siblingBusinesses.length + 1} workspaces
            </div>
            <span className="text-[10px] text-slate-500">{business.owner.email}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {siblingBusinesses.map((s) => (
              <Link
                key={s.id}
                href={`/admin/accounts/${s.id}`}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-900/40 px-2.5 py-1 text-xs text-slate-200 hover:text-white hover:border-slate-500 transition"
              >
                <span>{s.name}</span>
                <span className={`text-[9px] ${STATUS_PILL[s.status] ?? "pill"}`}>{s.status}</span>
                <span className="text-[10px] text-slate-500">{s.plan}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* A. Overview */}
      <Section id="overview" title="A. Account overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Plan"             value={business.plan} />
          <Field label="Status"           value={business.status} />
          <Field label="Signup"           value={fmtDay(business.createdAt)} />
          <Field label="Last activity"    value={fmtRel(business.lastActivityAt)} />
          <Field label="Trial ends"       value={business.trialEndsAt ? fmtDay(business.trialEndsAt) : "—"} />
          <Field label="Members"          value={business.memberships.length.toString()} />
          <Field label="Currency"         value={business.currency} />
          <Field label="Country"          value={business.country ?? "—"} />
          <Field label="Industry"         value={business.industry ?? "—"} />
          <Field label="Timezone"         value={business.timezone ?? "—"} />
          <Field label="Last login (owner)" value={fmtRel(business.owner.lastLoginAt)} />
          <Field label="Onboarding"       value={`${onboardingDone}/${onboardingSteps.length} steps`} />
        </div>
      </Section>

      {/* B. Members */}
      <Section id="members" title="B. Owner & users">
        <MembersTable
          businessId={business.id}
          ownerId={business.owner.id}
          members={business.memberships.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.user.email,
            name: m.user.name,
            role: m.role,
            status: m.status,
            joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
            invitedAt: m.invitedAt ? m.invitedAt.toISOString() : null,
            createdAt: m.createdAt.toISOString(),
            lastLoginAt: m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : null,
          }))}
        />
      </Section>

      {/* C. Plan & billing */}
      <Section id="plan" title="C. Plan & billing">
        <div className="grid lg:grid-cols-2 gap-4">
          <PlanEditor
            businessId={business.id}
            plan={business.plan}
            trialEndsAt={business.trialEndsAt ? business.trialEndsAt.toISOString() : null}
          />
          <Stub
            title="Billing details"
            blurb="MRR, payment status, billing cycle, payment method, and failed payments will appear here once Stripe (or another payments provider) is wired up."
            cta="Connect Stripe"
          />
        </div>
      </Section>

      {/* D. Orders / invoices / payments — stub */}
      <Section id="orders" title="D. Orders, invoices & payments">
        <Stub
          title="No payments provider connected"
          blurb="Order history, invoices, refunds, and chargebacks live in the billing provider. Connect one to see them here."
          cta="Connect Stripe"
        />
      </Section>

      {/* E. Onboarding & data */}
      <Section id="onboarding" title="E. Onboarding & data">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-ink-900/40 p-5">
            <div className="text-sm font-semibold text-slate-100 mb-3">Onboarding signal</div>
            <ul className="space-y-2 text-sm">
              {onboardingSteps.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${s.done ? "bg-good text-ink-950" : "bg-ink-700 text-slate-500"}`}>
                    {s.done ? "✓" : ""}
                  </span>
                  <span className={s.done ? "text-slate-200" : "text-slate-500"}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-ink-900/40 p-5">
            <div className="text-sm font-semibold text-slate-100 mb-3">Data health</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <KV label="Uploads"          value={business._count.uploads.toString()} />
              <KV label="Last upload"      value={lastUpload ? fmtRel(lastUpload.createdAt) : "never"} />
              <KV label="Transactions"     value={totalTx.toLocaleString()} />
              <KV label="Categorized"      value={`${categorizationPct}%`} />
              <KV label="Employees"        value={business._count.employees.toString()} />
              <KV label="Forecast scenarios" value={business._count.forecastAssumptions.toString()} />
            </div>
          </div>
        </div>
      </Section>

      {/* F. Usage & activity */}
      <Section id="usage" title="F. Usage & activity">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Sessions · 7d"   value={sessions7d.toString()} />
          <Field label="Sessions · 30d"  value={sessions30d.toString()} />
          <Field label="Consultations"   value={business._count.consultations.toString()} />
          <Field label="Last consultation" value={lastConsultation ? fmtRel(lastConsultation.updatedAt) : "never"} />
          <Field label="Alert rules"     value={business._count.notificationRules.toString()} />
          <Field label="Scenarios"       value={business._count.forecastAssumptions.toString()} />
          <Field label="Last activity"   value={fmtRel(business.lastActivityAt)} />
          <Field label="Inactive since"  value={business.lastActivityAt ? fmtDay(business.lastActivityAt) : "—"} />
        </div>
      </Section>

      {/* G. Support — stub */}
      <Section id="support" title="G. Support">
        <Stub
          title="No support tool connected"
          blurb="Tickets, open issues, customer feedback, bug reports, and the last support interaction will live here once a support tool (Intercom, Zendesk, Plain, etc.) is wired up."
          cta="Connect support tool"
        />
      </Section>

      {/* H. Security & audit */}
      <Section id="security" title="H. Security & audit">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-ink-900/40 p-5">
            <div className="text-sm font-semibold text-slate-100 mb-3">Login history</div>
            <div className="text-xs text-slate-400 mb-3">
              {sessions7d} successful · <span className={failedLogins7d > 0 ? "text-warn" : ""}>{failedLogins7d} failed</span> in last 7d
            </div>
            {successfulLogins.length === 0 ? (
              <div className="text-sm text-slate-500">No login attempts recorded.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {successfulLogins.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className={a.success ? "text-slate-200" : "text-bad"}>
                      {a.success ? "✓" : "✗"} {a.user?.email ?? a.email}
                    </span>
                    <span className="text-slate-500 tabular-nums">{fmtRel(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-line bg-ink-900/40 p-5">
            <div className="text-sm font-semibold text-slate-100 mb-3">Impersonation history</div>
            {impersonationsHere.length === 0 ? (
              <div className="text-sm text-slate-500">No impersonation sessions on this account.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {impersonationsHere.map((a) => (
                  <li key={a.id}>
                    <div className="text-slate-200">{a.action}</div>
                    <div className="text-slate-500">{a.actor.email} · {fmtRel(a.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-line bg-ink-900/40 p-5">
            <div className="text-sm font-semibold text-slate-100 mb-3">Password resets</div>
            {passwordResets.length === 0 ? (
              <div className="text-sm text-slate-500">No reset requests.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {passwordResets.map((t) => (
                  <li key={t.id}>
                    <div className="text-slate-200">
                      {t.user.email}
                      {t.usedAt ? <span className="text-good ml-1">· used</span> : t.expiresAt.getTime() < Date.now() ? <span className="text-slate-500 ml-1">· expired</span> : <span className="text-accent ml-1">· active</span>}
                    </div>
                    <div className="text-slate-500">requested {fmtRel(t.createdAt)} from {t.ipAddress ?? "—"}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-[11px] text-slate-600">MFA · not yet implemented</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-ink-900/40 p-5">
          <div className="text-sm font-semibold text-slate-100 mb-3">Admin actions on this account</div>
          {recentAudit.length === 0 ? (
            <div className="text-sm text-slate-500">No admin actions recorded yet.</div>
          ) : (
            <ul className="space-y-2 text-xs">
              {recentAudit.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <div className="text-slate-200">{a.action}</div>
                  <div className="text-slate-500">{a.actor.email} · {fmtDate(a.createdAt)}</div>
                  {a.metadata ? (
                    <div className="text-slate-600 mt-0.5 font-mono text-[10px] truncate" title={a.metadata}>
                      {a.metadata}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Notes (internal-only) */}
      <Section id="notes" title="Internal notes">
        <AdminNotes
          businessId={business.id}
          notes={notes.map((n) => ({
            id: n.id,
            body: n.body,
            tags: n.tags,
            authorEmail: n.author.email,
            authorName: n.author.name,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </Section>

      {/* I. Actions */}
      <Section id="actions" title="I. Account actions">
        <div className="rounded-xl border border-line bg-ink-900/40 p-5 text-sm text-slate-300 space-y-3">
          <p>
            Use the controls in the page header for destructive actions: status change
            (active / suspended / demo / test), and <strong>View as customer</strong> for
            impersonation. Member status + plan/trial changes live in their own sections.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Suspend / reactivate (header dropdown)</li>
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Impersonate · View as customer (header)</li>
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Change plan + extend trial (section C)</li>
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Mark as demo / test / internal (header dropdown)</li>
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Disable / re-enable user (section B)</li>
            <li className="flex items-center gap-2"><span className="text-good">✓</span> Add internal note (section: Internal notes)</li>
            <li className="flex items-center gap-2"><span className="text-slate-600">∘</span> Reset password flow (user-initiated via /forgot-password)</li>
            <li className="flex items-center gap-2"><span className="text-slate-600">∘</span> Resend verification email · not yet implemented</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="mt-2 text-sm text-slate-100 tabular-nums leading-tight">{value}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="text-slate-100 tabular-nums">{value}</div>
    </div>
  );
}

function Stub({ title, blurb, cta }: { title: string; blurb: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-6 text-sm">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="text-slate-100 font-medium">{title}</div>
        <span className="text-[10px] uppercase tracking-wider pill">not connected</span>
      </div>
      <p className="text-slate-400">{blurb}</p>
      <button
        type="button"
        disabled
        className="mt-4 btn-ghost text-xs opacity-50 cursor-not-allowed"
        title="Integration not wired up yet"
      >
        {cta}
      </button>
    </div>
  );
}
