# Communication Preferences & Marketing Consent

How Tweaxly captures, stores, and honours user consent for marketing communications, separate from legal acceptance and from operational/transactional emails.

---

## 1. Categories

| Field name             | Channel              | Editable? | Default |
|------------------------|----------------------|-----------|---------|
| `systemEmails`         | Transactional email  | **No** — required while account is active | `true` |
| `marketingEmails`      | Marketing email      | Yes       | `false` |
| `marketingSMS`         | Marketing SMS        | Yes       | `false` |
| `productAnnouncements` | Product launches     | Yes       | `false` |
| `newsletter`           | Periodic newsletter  | Yes       | `false` |

System emails cover **billing notices, renewal reminders, invoices, security alerts, password resets, and operational notices**. They cannot be turned off via the API — the Communication Preferences pane displays them as locked.

Marketing channels are **opt-in only**, default `false` at the database level.

## 2. Capture points

### A. Signup

- `LegalCheckbox` — REQUIRED. Mandatory; submit button stays disabled until checked. Server re-validates `acceptTerms` and 303s back to `/register?err=terms` if missing.
- `MarketingConsentCheckbox` — OPTIONAL. Defaults to unchecked. Submitting without it does NOT block registration.

If `acceptMarketing=yes`, all four marketing channels are flipped to `true` and an `unsubscribeToken` is generated. If `acceptMarketing` is absent, all four stay `false` and no token is issued.

Either way, the audit fields are stamped:
- `marketingConsentTimestamp` = now
- `marketingConsentSource` = `"signup"`
- `marketingConsentIp` = `x-forwarded-for` or `x-real-ip`
- `marketingPolicyVersion` = current Privacy Policy version (`2026-05-19` today)

An `AuditLog` row with action `consent.signup` records `acceptTerms`, `acceptMarketing`, and `marketingChannels` for the regulatory audit trail.

### B. Settings — Account → Communication Preferences

`PATCH /api/account/communication-preferences` with a JSON body containing any subset of channel booleans. Each toggle is optimistically applied client-side, persisted server-side, and logged via `recordAudit` with action `consent.marketing_update`.

### C. One-click unsubscribe

`GET /api/unsubscribe?token=<unsubscribeToken>&channel=<field>` or `&all=1`.

`POST /api/unsubscribe` accepts the same parameters via query string or form body (RFC 8058 "List-Unsubscribe-Post:" compatibility — MUAs that auto-unsubscribe on user action send a POST).

Both verbs:
1. Resolve the user by token (32 random bytes, hex-encoded — impractical to brute-force).
2. Flip the requested channel(s) to `false`.
3. Insert a row into `EmailSuppression` so even if the user re-enables the channel later, campaign senders can choose to keep them off.
4. Stamp `marketingConsentSource = "unsubscribe"` and a fresh `marketingConsentTimestamp`.
5. Redirect to `/unsubscribe?status=success&detail=<channels>` for the human-facing confirmation page.

## 3. Audit trail

Per-user fields on `User` capture the current state of their consent (`marketingConsentTimestamp`, `marketingConsentSource`, `marketingConsentIp`, `marketingPolicyVersion`).

Historical state changes live in `AuditLog`:
- `consent.signup` — the initial decision at registration.
- `consent.marketing_update` — every channel change made via settings.

If we ever need to prove "when and how" a user consented, both surfaces — current state + AuditLog history — are queryable.

## 4. Suppression list

`EmailSuppression` table:

| Column   | Notes                                                                 |
|----------|-----------------------------------------------------------------------|
| email    | Email address (not user id — survives account deletion).              |
| channel  | `"marketing_email"`, `"marketing_sms"`, `"newsletter"`, `"product_announcements"` |
| reason   | `"user_unsubscribe"` \| `"bounce"` \| `"complaint"` \| `"admin"`      |
| source   | Free-form — campaign id, IP, "one_click", etc.                        |
| createdAt| Stamped on insert.                                                    |

Anti-spam best practice: **before sending any marketing campaign, query `EmailSuppression` for the address + channel pair and skip recipients whose row exists**. This is independent of the user's flag — the suppression list outlives flag-flipping.

## 5. List-Unsubscribe header (for senders)

Marketing campaigns sent via Resend (or any future ESP) MUST include both headers:

```
List-Unsubscribe: <https://app.tweaxly.com/api/unsubscribe?token=USER_TOKEN&channel=CHANNEL>, <mailto:unsubscribe@tweaxly.com>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

When the user clicks the MUA's native "Unsubscribe" button, the MUA sends a POST to the URL with no body and no further interaction. The endpoint handles this.

## 6. Transactional vs marketing — the line

| If the email is about… | It's transactional (always send) | It's marketing (gated by flags) |
|-------------------------|----------------------------------|-----------------------------------|
| Billing / invoice / payment | ✅ | |
| Security / password reset / 2FA | ✅ | |
| Account action you just took (signup confirm, export ready) | ✅ | |
| Service interruption / incident | ✅ | |
| Legal / policy update notice | ✅ | |
| New feature you might like | | ✅ |
| Newsletter | | ✅ |
| Webinars / events | | ✅ |
| Promotional offer | | ✅ |
| Upsell to a paid plan | | ✅ |

Rule of thumb: if the email is required to operate the account or fulfil the contract, it's transactional. Anything else is marketing.

## 7. Compliance posture

- **GDPR-style explicit opt-in.** No pre-checked marketing boxes. The signup form's marketing checkbox defaults to unchecked, and the server only persists `true` when it sees `acceptMarketing=yes`.
- **Israeli anti-spam (Israeli Communications Law, Sec. 30A).** Senders must obtain explicit consent before commercial communications, must include sender details and an unsubscribe mechanism, and must honour opt-outs within a reasonable window. The architecture above supports all three.
- **No dark patterns.** Legal acceptance and marketing consent are visually + structurally separated. Unsubscribe is one click and is honoured immediately.
- **Audit trail.** Every consent decision has a timestamp, source, IP, and policy version on the user record + an immutable AuditLog row.

## 8. Versioning

Bump `MARKETING_POLICY_VERSION` in `src/lib/communications.ts` when the Privacy Policy text materially changes. New signups will then consent against the new version and existing users' `marketingPolicyVersion` will lag — useful for "users who consented before the policy change" queries.

## 9. Schema changes (this release)

```prisma
model User {
  // ...
  systemEmails              Boolean   @default(true)
  marketingEmails           Boolean   @default(false)
  marketingSMS              Boolean   @default(false)
  productAnnouncements      Boolean   @default(false)
  newsletter                Boolean   @default(false)
  marketingConsentTimestamp DateTime?
  marketingConsentSource    String?
  marketingConsentIp        String?
  marketingPolicyVersion    String?
  unsubscribeToken          String?   @unique
}

model EmailSuppression {
  id        String   @id @default(cuid())
  email     String
  channel   String
  reason    String
  source    String?
  createdAt DateTime @default(now())
  @@unique([email, channel])
  @@index([email])
}
```

Apply with `npx prisma db push` and restart the product dev server so the regenerated client loads.
