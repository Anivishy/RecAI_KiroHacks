# 0016 Recommender Verification

## Summary

Add a verification gate to the recommender flow so that the company shown next to a recommendation is the one ICANN RDAP associates with the recommender's verified work email, not the company the candidate typed in.

The gate has two checks:

1. Email OTP — proves the recommender controls the work email they entered.
2. ICANN RDAP domain lookup — proves the email's domain belongs to a real company, and yields the canonical company name and id stored on the request.

A recommender cannot open the recommendation form until both checks pass.

## Why

Today a candidate creates a `recommendation_request` and supplies the recommender's name, title, company, and email as free text. The recommender opens `/recommend/[requestId]` and lands directly in the form. There is nothing tying the recommendation to a real person at a real company.

For the hackathon demo we want recommendations to read as trustworthy:

- The displayed company must come from an authoritative source (ICANN RDAP), not the candidate.
- The recommender must prove ownership of an email at a non-personal domain before the form unlocks.
- Candidate-entered company stays in the row as an unverified hint, never displayed as verified.

There is no recommender account system. Verification state lives on the `recommendation_requests` row.

## Scope

In scope:

- New verification state on `recommendation_requests` separate from existing form-lifecycle state.
- OTP issuance, hashing, expiry, and attempt-cap enforcement.
- Resend integration for delivering the OTP email.
- A swappable company-lookup service with a ICANN RDAP implementation and a stub implementation for local dev.
- Three new API routes under `/api/recommend/[token]`.
- A two-stage verification UI in front of the existing recommendation form on `/recommend/[requestId]`.
- Gating of the existing `save` and `submit` routes on verification status.
- Switching candidate profile and recommendation displays to use the verified company.

Out of scope:

- Rate limiting beyond the per-request 5-attempt OTP cap.
- Persistent OTP send-history audit log.
- Admin/recruiter UI to retry a failed company lookup.
- Warning the candidate when their entered company differs from the verified company.
- Verifying any field other than work email and domain (no name/title verification).

## Routes And Surfaces Touched

### New API routes

- `POST /api/recommend/[token]/start-verification`
- `POST /api/recommend/[token]/verify-code`
- `GET  /api/recommend/[token]/status`

### Existing API routes (gating change only)

- `POST /api/recommend/[token]/save` — now requires `verification_status = 'verified'`.
- `POST /api/recommend/[token]/submit` — now requires `verification_status = 'verified'`.
- `GET  /api/recommend/[token]` — response gains verification fields (`verificationStatus`, `verifiedEmail`, `verifiedDomain`, `verifiedCompany`). Continues to omit `recommenderEmail` and never returns OTP material.

### UI

- `/recommend/[requestId]` — recommender-facing page gains a verification gate before the existing form. Stages: email entry, OTP entry, verified (form unlocked), `company_pending` block.
- Recommendation display surfaces in candidate profile, recruiter review, and the recommender form header — switch from `recommender_company` (candidate-entered) to `verified_company`. When `verified_company` is null, no company is displayed.

## Data Contract Updates

### `recommendation_requests` — new columns

| Column | Type | Notes |
| --- | --- | --- |
| `verification_status` | `TEXT` | One of `pending`, `email_verified`, `verified`, `company_pending`. Default `pending`. |
| `verified_email` | `TEXT` | Email the recommender proved control of via OTP. Distinct from candidate-supplied `recommender_email`. |
| `verified_domain` | `TEXT` | Lowercased domain extracted from `verified_email`. |
| `verified_company` | `TEXT` | Company name returned by ICANN RDAP for `verified_domain`. |
| `verified_company_id` | `TEXT` | Stable identifier for the matched company. For RDAP this is the registrant entity handle when available, falling back to the domain itself. |

The existing `status` column is unchanged and continues to track form lifecycle (`pending | draft | submitted | deleted`). The two columns are orthogonal.

The existing `recommender_company` column is retained as the candidate-entered hint and is no longer surfaced as a verified value.

### New table: `recommendation_otps`

One row per active OTP. Replaced (delete-then-insert in a transaction) when a new code is issued for the same `request_id`.

| Column | Type | Notes |
| --- | --- | --- |
| `request_id` | `TEXT PRIMARY KEY REFERENCES recommendation_requests(id) ON DELETE CASCADE` | One active OTP per request. |
| `email` | `TEXT NOT NULL` | The email the OTP was sent to. The verify step requires this to match the email the recommender claims. |
| `code_hash` | `TEXT NOT NULL` | `sha256(code + RECOMMENDER_OTP_SALT + request_id)`, hex-encoded. The plaintext code is never stored. |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | 10 minutes after issuance. |
| `attempts` | `INTEGER NOT NULL DEFAULT 0` | Incremented on every verify attempt for this row, regardless of outcome. |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

### State transitions

```
pending ──start-verification──▶ pending (OTP issued; status unchanged)
pending ──verify-code (otp ok, rdap hit)──▶ verified
pending ──verify-code (otp ok, rdap miss/error)──▶ company_pending

company_pending ──start-verification──▶ company_pending (new OTP issued for a different email)
company_pending ──verify-code (otp ok, rdap hit)──▶ verified
company_pending ──verify-code (otp ok, rdap miss/error)──▶ company_pending

verified ──(terminal for verification; form lifecycle continues separately)──▶
```

`start-verification` is allowed from `pending` and `company_pending`. It is rejected once `verification_status = 'verified'`.

`email_verified` is reserved for the case where OTP verification succeeded but the ICANN RDAP lookup could not be completed (e.g. transient network error rather than a definitive miss). The verify-code handler currently treats lookup errors and lookup misses both as `company_pending`, so `email_verified` is not written by the initial implementation. It is kept in the enum so a later iteration can split "company definitively unknown" from "company lookup failed, retry possible" without a migration.

### Endpoint contracts

`POST /api/recommend/[token]/start-verification`

- Body: `{ email: string }`
- Validates: token resolves to a non-deleted, non-expired request; `verification_status !== 'verified'`; email parses; email's domain is not in the personal-domain blocklist.
- On success: deletes any existing OTP row for the request, inserts a fresh one, sends the OTP via Resend. `verification_status` is unchanged (`pending` stays `pending`, `company_pending` stays `company_pending`).
- Returns: `{ ok: true, verificationStatus }`.
- Errors: `400` (bad email), `400` (personal domain, with `code: "personal_domain"`), `404` (token), `409` (already verified), `5xx` (email send failure).

`POST /api/recommend/[token]/verify-code`

- Body: `{ code: string }` (exactly 6 digits).
- Validates: an OTP row exists for the request, `expires_at > now()`, `attempts < 5`, `code_hash` matches. Increments `attempts` on every call.
- On match: deletes the OTP row, sets `verified_email`, `verified_domain`, calls the company-lookup service.
  - Hit: sets `verified_company`, `verified_company_id`, `verification_status = 'verified'`.
  - Miss or error: sets `verification_status = 'company_pending'`. `verified_company` and `verified_company_id` remain null.
- Returns: `{ verificationStatus, verifiedDomain, verifiedCompany | null }`.
- Errors: `400` (malformed), `404` (no active OTP), `410` (expired), `429` (attempts exhausted), `401` (mismatch).

`GET /api/recommend/[token]/status`

- Returns: `{ verificationStatus, verifiedEmail, verifiedDomain, verifiedCompany, otpPending }`. `otpPending` is `true` iff a non-expired OTP row exists for the request — used by the UI to decide between email-entry and OTP-entry stages after a page refresh. Never returns OTP code material or `recommender_email`.
- Errors: `404` (token).

### Domain helper

`packages/shared/src/lib/domain/personal-email-domains.ts` — exports `PERSONAL_EMAIL_DOMAINS: ReadonlySet<string>` and `isPersonalEmailDomain(domain: string): boolean`. Initial set: `gmail.com, googlemail.com, yahoo.com, ymail.com, outlook.com, hotmail.com, live.com, msn.com, icloud.com, me.com, mac.com, aol.com, proton.me, protonmail.com, gmx.com, gmx.net, mail.com, yandex.com, yandex.ru, zoho.com, fastmail.com, hey.com, pm.me, tutanota.com, tuta.io`.

### Company-lookup service

`packages/candidate/src/server/company-lookup/index.ts`:

```ts
export type CompanyLookupResult = {
  companyId: string;
  companyName: string;
};

export interface CompanyLookupService {
  lookupByDomain(domain: string): Promise<CompanyLookupResult | null>;
}

export function getCompanyLookupService(): CompanyLookupService;
```

`getCompanyLookupService()` returns a composite that consults the local stub map first and falls back to ICANN RDAP. RDAP requires no credentials. Setting `RECOMMENDER_USE_STUB_COMPANY_LOOKUP=1` short-circuits to the stub only — useful for offline demos. The stub reads a domain→company JSON map from `RECOMMENDER_STUB_COMPANY_MAP` (env var, JSON-encoded) and ships with a small built-in default for common demo domains.

The ICANN RDAP implementation lives in `icann-rdap.ts` next to `index.ts` and is the only file that knows about the RDAP JSON shape. It calls `https://rdap.org/domain/<domain>` (the bootstrap proxy that routes to the right registry) and extracts the registrant entity's vCard `org` field. Redacted/privacy-protected registrants are treated as misses. Errors and misses both resolve to `null` (caller treats the two identically as `company_pending`).

### Email service

`packages/candidate/src/server/email/resend-client.ts` — exports `sendRecommenderOtpEmail({ to, code, candidateName })`. Uses `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. When `RESEND_API_KEY` is unset (local dev), logs the recipient and code to stdout and resolves successfully so the demo runs without credentials.

## Validation Steps

1. As a candidate, create a recommendation request. Open the recommender link.
2. Enter `me@gmail.com`. Page shows the personal-domain rejection inline. Form remains locked.
3. Enter `me@acme.com`. Receive an OTP email via Resend (or log line in dev). `verification_status` is still `pending`.
4. Enter the wrong code 5 times. Sixth attempt is rejected with attempts-exhausted; the OTP is now dead.
5. Click "Resend code" — a new OTP is issued. Enter the correct code within 10 minutes.
6. With ICANN RDAP configured to recognize `acme.com` (or via the stub map), `verification_status` becomes `verified`. The form unlocks. The page header shows "Verified at: <ICANN RDAP company name> — acme.com".
7. With ICANN RDAP configured to return null for `acme.com`, `verification_status` becomes `company_pending`. The form stays locked. The recommender can re-enter a different work email and start over.
8. While `verification_status !== 'verified'`, `POST /save` and `POST /submit` return `403`.
9. Submit the recommendation. View it on the candidate's public profile and in the recruiter review page — the company shown is `verified_company`, not the candidate-entered `recommender_company`.
10. Let an OTP expire by waiting 10 minutes; verify rejects with `410`.

## Environment Variables

Added to `.env.example`:

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=verify@recai.app
RECOMMENDER_OTP_SALT=
RECOMMENDER_USE_STUB_COMPANY_LOOKUP=
RECOMMENDER_STUB_COMPANY_MAP=
```

`RECOMMENDER_OTP_SALT` is required in production; in dev it falls back to a fixed value so the schema still works.

## Open Questions

- RDAP registrant data is frequently redacted under GDPR or covered by a privacy proxy. The lookup will resolve to `company_pending` for many real domains. The built-in stub map ships with common demo companies so the hackathon walkthrough is reliable; production usage may want to layer in a paid data provider behind the same `CompanyLookupService` interface.
- Should a `company_pending` outcome show the recommender what domain we tried to look up? Current design: yes, inline in the failure message. Reconsider if this leaks too much.
- Resend sandbox vs production sender domain configuration is deferred to deployment-time setup.
