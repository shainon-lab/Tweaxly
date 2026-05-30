"use client";

// Settings → Members & Access. Owner-facing panel for managing the
// people who can use this workspace.
//
// Sections (top to bottom):
//   1. Current Members - one row per active membership, with role
//      change + remove actions (owner-only). The owner row is locked
//      and badged.
//   2. Pending Invitations - one row per outstanding invite, with
//      cancel + resend actions.
//   3. Invite Member button - opens a small modal with email + role.
//
// All mutations go through the new /api/businesses/[id]/members
// + /api/businesses/[id]/invitations endpoints. The endpoints enforce
// owner-only access + the Pro plan cap.

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";

type Role = "owner" | "admin" | "viewer";

interface Member {
  id:        string;
  userId:    string;
  email:     string;
  name:      string | null;
  avatarUrl: string | null;
  role:      Role;
  status:    "active" | "suspended";
  joinedAt:  string | null;
}

interface PendingInvitation {
  id:        string;
  email:     string;
  role:      Role;
  invitedAt: string;
  expiresAt: string;
  invitedBy: string;
}

interface ApiResponse {
  members:     Member[];
  invitations: PendingInvitation[];
  viewerRole:  Role;
  cap:         number | null;
  used:        number;
  plan:        string;
}

const ROLE_LABEL: Record<Role, string> = {
  owner:  "Owner",
  admin:  "Admin",
  viewer: "Viewer",
};

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}

interface IncomingInvitation {
  id:            string;
  role:          Role;
  expiresAt:     string;
  createdAt:     string;
  expired:       boolean;
  workspaceId:   string;
  workspaceName: string;
  invitedBy:     string;
}

export default function MembersAndAccessSection({ businessId }: { businessId: string }) {
  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  // Branded notice modal - replaces window.alert() so messages stay
  // in the app's dark theme instead of using the browser's native
  // dialog (which looks completely out of place).
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  // Pending invitations addressed to THIS user (across any workspace).
  // Loaded separately because the /members endpoint is scoped to the
  // currently-viewed workspace and only returns OUTBOUND invites.
  const [incoming, setIncoming] = useState<IncomingInvitation[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/businesses/${businessId}/members`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message ?? "Couldn't load members.");
      } else {
        setData(await res.json());
      }
    } catch {
      setError("Network error - check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function loadIncoming() {
    try {
      const res = await fetch("/api/invitations/incoming");
      if (!res.ok) return;
      const d = await res.json();
      setIncoming(d.invitations ?? []);
    } catch {
      // Silent: incoming invitations are a secondary surface; the bell
      // notification is the primary channel.
    }
  }

  useEffect(() => { void load(); void loadIncoming(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [businessId]);

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 rounded-md bg-ink-900/40 animate-pulse" />)}</div>;
  }
  if (error || !data) {
    return <div className="card text-sm text-bad">{error ?? "Couldn't load members."}</div>;
  }

  const isOwner    = data.viewerRole === "owner";
  // Both Pro and Business can invite. Pro caps at 3 total members
  // (Owner + 2 Viewers); Business caps at 6 (Owner + 5 Admin /
  // Viewer). isPaid keeps the existing button-render logic
  // (always-show-the-CTA-on-paid-tiers) intact across tiers.
  const isPaid     = data.plan === "pro" || data.plan === "business";
  const isPro      = data.plan === "pro";
  const capReached = data.cap != null && data.used >= data.cap;
  const capLabel   = data.cap != null ? `${data.used}/${data.cap}` : `${data.used}`;

  // The Invite button ALWAYS renders for owners on a paid tier - even
  // when capped - and shows a styled notice explaining the cap if they
  // click it while disabled. Free owners see an upgrade notice. Pro
  // owners at their 3-seat cap see a "Upgrade to Business for more
  // seats" notice (the cap on Business is 6). Business owners at
  // the 6-seat cap have no further tier to upgrade to.
  function handleInviteClick() {
    if (!isPaid) {
      setNotice({
        title: "Upgrade to invite team members",
        body:  "Free workspaces have a single owner. Upgrade this workspace to Pro for up to 3 team members (Viewer role), or to Business for up to 6 (Admin + Viewer).",
      });
      return;
    }
    if (capReached) {
      if (isPro) {
        setNotice({
          title: "All Pro seats are used",
          body:  `You've filled all ${capLabel} seats on the Pro plan. Upgrade to Business for up to 6 team members with Admin + Viewer roles, or remove a member / cancel a pending invitation to free a seat.`,
        });
      } else {
        setNotice({
          title: "All seats are used",
          body:  `You have already filled all the available seats in your package (${capLabel}). Remove a member or cancel a pending invitation to free a seat.`,
        });
      }
      return;
    }
    setInviteOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Incoming invitations to this user ──────────────────── */}
      {incoming.length > 0 ? (
        <section className="rounded-lg border border-accent/40 bg-accent-soft/10 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-100">Invitations for you</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-accent/40 bg-accent-soft/30 text-accent font-semibold">
              {incoming.length} pending
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            You&apos;ve been invited to the following workspace{incoming.length === 1 ? "" : "s"}. Accepting opens the workspace in your switcher; declining cancels the invite.
          </div>
          <div className="space-y-2">
            {incoming.map((inv) => (
              <IncomingInvitationRow
                key={inv.id}
                invitation={inv}
                onChanged={loadIncoming}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Header row ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-slate-100">Members & Access</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold tabular-nums ${
              capReached
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-line bg-ink-900/60 text-slate-300"
            }`}>
              {capLabel} {data.cap != null ? "seats" : "members"}
            </span>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            {isPaid
              ? <>This workspace supports up to <strong className="text-slate-100">{data.cap}</strong> members total - owner + invitations + active members all count toward the cap.</>
              : <>Free workspaces have a single owner. Upgrade to Pro for up to <strong className="text-slate-100">3</strong> team members, or to Business for up to <strong className="text-slate-100">6</strong>.</>}
          </div>
        </div>
        {isOwner ? (
          <button
            type="button"
            onClick={handleInviteClick}
            // Greyed when capped or Free, but click still routes to
            // the NoticeModal explanation - never silently dead. No
            // native title attribute (would render a browser tooltip
            // that looks out of place against the dark theme).
            aria-disabled={!isPaid || capReached}
            aria-label={
              !isPaid    ? "Invite Member (paid plan required)" :
              capReached ? "Invite Member (all seats used)" :
                           "Invite Member"
            }
            className={`text-sm px-4 py-2 rounded-md border font-medium transition shrink-0 ${
              !isPaid || capReached
                ? "border-line bg-ink-900/40 text-slate-500 cursor-not-allowed"
                : "border-accent/40 bg-accent-soft/40 text-accent hover:bg-accent-soft hover:border-accent hover:text-white"
            }`}
          >
            + Invite Member
          </button>
        ) : null}
      </div>

      {/* ── Combined roster: active members + pending invitations ── */}
      <section>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Workspace Roster ({data.members.length + data.invitations.length})
        </div>
        <div className="rounded-lg border border-line overflow-hidden">
          {data.members.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              businessId={businessId}
              isOwner={isOwner}
              showDivider={i > 0}
              onChanged={load}
            />
          ))}
          {data.invitations.map((inv) => (
            <InvitationRow
              key={inv.id}
              invitation={inv}
              businessId={businessId}
              isOwner={isOwner}
              showDivider={data.members.length > 0}
              onChanged={load}
            />
          ))}
        </div>
      </section>

      {inviteOpen ? (
        <InviteModal
          businessId={businessId}
          onClose={() => setInviteOpen(false)}
          onInvited={() => { setInviteOpen(false); void load(); }}
        />
      ) : null}

      {notice ? (
        <NoticeModal
          title={notice.title}
          body={notice.body}
          onClose={() => setNotice(null)}
        />
      ) : null}
    </div>
  );
}

// ─── Branded notice modal ─────────────────────────────────────────
// Replaces browser-native notify.alert() for the in-app "you can't do that"
// messages so the dialog matches the rest of the dark theme. Same
// dismissal mechanics as InviteModal (backdrop click + OK button).
function NoticeModal({
  title, body, onClose,
}: {
  title:   string;
  body:    string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold mb-2 text-slate-100">{title}</div>
        <div className="text-sm text-slate-300 leading-relaxed mb-5">{body}</div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary text-sm">OK</button>
        </div>
      </div>
    </div>
  );
}

// ─── Member row ────────────────────────────────────────────────────
function MemberRow({
  member, businessId, isOwner, showDivider, onChanged,
}: {
  member:      Member;
  businessId:  string;
  isOwner:     boolean;
  showDivider: boolean;
  onChanged:   () => void;
}) {
  const [busy,    setBusy]    = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function changeRole(newRole: "admin" | "viewer") {
    setBusy(true);
    try {
      await fetch(`/api/businesses/${businessId}/members/${member.userId}`, {
        method:  "PATCH",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ role: newRole }),
      });
      onChanged();
    } finally { setBusy(false); }
  }

  async function doRemove() {
    setBusy(true);
    try {
      await fetch(`/api/businesses/${businessId}/members/${member.userId}`, { method: "DELETE" });
      onChanged();
    } finally { setBusy(false); setConfirm(false); }
  }

  const isOwnerRow = member.role === "owner";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${showDivider ? "border-t border-line/40" : ""} ${member.status === "suspended" ? "opacity-60" : ""}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-medium text-slate-300 shrink-0 overflow-hidden">
        {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : (member.name?.[0]?.toUpperCase() ?? member.email[0]?.toUpperCase() ?? "?")}
      </div>
      {/* Identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-medium text-slate-100 truncate">{member.name ?? member.email}</div>
          {isOwnerRow ? <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent font-semibold">Owner</span> : null}
          {member.status === "suspended" ? <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn font-semibold">Suspended</span> : null}
        </div>
        <div className="text-xs text-slate-400 truncate">{member.email}</div>
      </div>
      {/* Role + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isOwnerRow || !isOwner ? (
          <span className="text-xs text-slate-400">{ROLE_LABEL[member.role]}</span>
        ) : (
          <select
            value={member.role}
            disabled={busy}
            onChange={(e) => changeRole(e.target.value as "admin" | "viewer")}
            className="text-xs px-2 py-1 rounded-md border border-line bg-ink-900 text-slate-200"
          >
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        )}
        {isOwner && !isOwnerRow ? (
          confirm ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={doRemove} disabled={busy} className="text-xs px-2 py-1 rounded-md border border-bad/40 text-bad hover:bg-bad/10 transition disabled:opacity-50">
                Confirm
              </button>
              <button type="button" onClick={() => setConfirm(false)} disabled={busy} className="text-xs px-2 py-1 rounded-md text-slate-400 hover:text-slate-200 transition">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} disabled={busy} className="text-xs text-slate-400 hover:text-bad transition">
              Remove
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

// ─── Invitation row ────────────────────────────────────────────────
function InvitationRow({
  invitation, businessId, isOwner, showDivider, onChanged,
}: {
  invitation:  PendingInvitation;
  businessId:  string;
  isOwner:     boolean;
  showDivider: boolean;
  onChanged:   () => void;
}) {
  const [busy, setBusy] = useState<"resend" | "cancel" | null>(null);

  async function cancel() {
    setBusy("cancel");
    try {
      await fetch(`/api/businesses/${businessId}/invitations/${invitation.id}`, { method: "DELETE" });
      onChanged();
    } finally { setBusy(null); }
  }
  async function resend() {
    setBusy("resend");
    try {
      await fetch(`/api/businesses/${businessId}/invitations/${invitation.id}/resend`, { method: "POST" });
    } finally { setBusy(null); }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${showDivider ? "border-t border-line/40" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-ink-700/60 flex items-center justify-center text-xs text-slate-500 shrink-0">
        @
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-100 truncate">{invitation.email}</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn font-semibold">Pending</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Invited {fmtDate(invitation.invitedAt)} by {invitation.invitedBy} · Expires {fmtDate(invitation.expiresAt)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400">{ROLE_LABEL[invitation.role]}</span>
        {isOwner ? (
          <>
            <button type="button" onClick={resend} disabled={busy != null} className="text-xs text-accent hover:text-white transition disabled:opacity-50">
              {busy === "resend" ? "Sending…" : "Resend"}
            </button>
            <button type="button" onClick={cancel} disabled={busy != null} className="text-xs text-slate-400 hover:text-bad transition disabled:opacity-50">
              {busy === "cancel" ? "Cancelling…" : "Remove"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Invite modal ──────────────────────────────────────────────────
function InviteModal({
  businessId, onClose, onInvited,
}: {
  businessId: string;
  onClose:    () => void;
  onInvited:  () => void;
}) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<"admin" | "viewer">("admin");
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res  = await fetch(`/api/businesses/${businessId}/invitations`, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const map: Record<string, string> = {
          free_plan:       "Upgrade to Pro to invite team members.",
          limit_reached:   "You've reached the member limit for this plan.",
          already_member:  "That person is already a member of this workspace.",
          already_pending: "An invitation is already pending for that email.",
          invalid_email:   "Please enter a valid email address.",
          invalid_role:    "Choose a valid role.",
        };
        setError(map[d.error] ?? d.error ?? "Couldn't send the invitation.");
        return;
      }
      onInvited();
    } catch {
      setError("Network error - check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold mb-1 text-slate-100">Invite a member</div>
        <div className="text-xs text-slate-400 mb-4">
          They'll receive an email with a one-click link to join this workspace. The invitation expires in 7 days.
        </div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          disabled={busy}
        />
        <label className="label">Role</label>
        <select
          className="input mb-2"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "viewer")}
          disabled={busy}
        >
          <option value="admin">Admin - can use the app + manage data</option>
          <option value="viewer">Viewer - read-only access</option>
        </select>
        {error ? <div className="text-xs text-bad mt-2">{error}</div> : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={busy || !email.trim()} className="btn-primary text-sm disabled:opacity-50">
            {busy ? "Sending…" : "Invite Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Incoming invitation row (this user is the invitee) ──────────────
function IncomingInvitationRow({
  invitation, onChanged,
}: {
  invitation: IncomingInvitation;
  onChanged:  () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function accept() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/in-app/${invitation.id}/accept`, { method: "POST" });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        await notify.alert({
          title: "Couldn't accept invitation",
          body:  t.error === "expired" ? "This invitation has expired. Ask the workspace owner for a new one."
               : t.error === "already_used" ? "This invitation has already been used."
               : t.error === "email_mismatch" ? "This invitation was sent to a different email. Sign in with that email to accept."
               : "Something went wrong - please try again.",
        });
        onChanged();
        return;
      }
      // Reload the cross-workspace switcher by reloading the page so
      // the new workspace shows up immediately. Soft router.refresh()
      // would refetch server data but won't refresh the sidebar's
      // pre-rendered workspace list.
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (busy) return;
    const ok = await notify.confirm({
      title: "Decline invitation?",
      body:  `Decline the invitation to "${invitation.workspaceName}"? The owner will need to re-invite you if you change your mind.`,
      confirmLabel: "Decline",
      cancelLabel:  "Keep",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/in-app/${invitation.id}/decline`, { method: "POST" });
      if (!res.ok) {
        await notify.alert("Couldn't decline invitation - please try again.");
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-line/60 bg-ink-900/40">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-100 truncate">
          {invitation.workspaceName}
          {invitation.expired ? (
            <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn font-semibold">Expired</span>
          ) : null}
        </div>
        <div className="text-xs text-slate-400 truncate">
          Invited by {invitation.invitedBy} · {ROLE_LABEL[invitation.role]} · expires {fmtDate(invitation.expiresAt)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={accept}
          disabled={busy || invitation.expired}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-good/40 text-good hover:bg-good/10 hover:border-good transition disabled:opacity-50"
        >
          {busy ? "Working…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={decline}
          disabled={busy}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-bad/40 text-bad hover:bg-bad/10 hover:border-bad transition disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
