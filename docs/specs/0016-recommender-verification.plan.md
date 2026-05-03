# Recommender Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the recommender form behind an email-OTP + ZoomInfo domain check so the displayed company comes from a verified work-email domain rather than candidate-entered text.

**Architecture:** Two new state columns and a new OTP table on the existing `recommendation_requests` schema in Aurora. Three new API routes under `/api/recommend/[token]`. A two-stage UI gate in front of the existing recommendation form. Resend for OTP delivery; ZoomInfo behind a swappable lookup interface with a stub fallback. No new tests-runner is introduced — this codebase has no test framework today, so each task is validated by `npm run typecheck`, `npm run lint`, and a manual smoke check.

**Tech Stack:** Next.js App Router (16.x) on Vercel, Postgres (Aurora) via `pg`, TypeScript, React 19, Tailwind v4. Resend SDK for email. ZoomInfo HTTP API behind an interface.

**Spec:** `docs/specs/0016-recommender-verification.md`

---

## File Structure

**Created:**
- `packages/shared/src/lib/domain/personal-email-domains.ts` — domain blocklist + `isPersonalEmailDomain` helper
- `packages/candidate/src/server/recommender-otp.ts` — OTP generate/hash/issue/verify
- `packages/candidate/src/server/email/resend-client.ts` — Resend wrapper for OTP send
- `packages/candidate/src/server/company-lookup/types.ts` — `CompanyLookupService` interface and result type
- `packages/candidate/src/server/company-lookup/stub.ts` — env-driven stub implementation
- `packages/candidate/src/server/company-lookup/zoom-info.ts` — ZoomInfo HTTP implementation
- `packages/candidate/src/server/company-lookup/index.ts` — `getCompanyLookupService()` factory
- `packages/candidate/src/components/recommender-verification-gate.tsx` — client component for email/OTP UI
- `apps/web/src/app/api/recommend/[token]/start-verification/route.ts`
- `apps/web/src/app/api/recommend/[token]/verify-code/route.ts`
- `apps/web/src/app/api/recommend/[token]/status/route.ts`

**Modified:**
- `packages/candidate/src/server/recommendation-db.ts` — schema migration, new fields on `RecommendationRequest`, helpers to update verification state
- `packages/candidate/src/server/candidate-profile-db.ts:170` — switch displayed company to `verifiedCompany`
- `packages/candidate/src/components/recommendation-form.tsx:286` — switch displayed company to `verifiedCompany`
- `packages/candidate/src/pages/recommendation-request-page.tsx` — render the verification gate before the form
- `apps/web/src/app/api/recommend/[token]/route.ts` — include verification fields in GET response
- `apps/web/src/app/api/recommend/[token]/save/route.ts` — gate on `verification_status = 'verified'`
- `apps/web/src/app/api/recommend/[token]/submit/route.ts` — gate on `verification_status = 'verified'`
- `apps/web/package.json` — add `resend` dependency
- `.env.example` — add new env vars

---

## Task 1: Database schema migration

**Files:**
- Modify: `packages/candidate/src/server/recommendation-db.ts`

- [ ] **Step 1: Add new columns and OTP table to `ensureRecommendationSchema`**

In `recommendation-db.ts`, inside the existing `ensureRecommendationSchema` `BEGIN/COMMIT` block (after the existing `ALTER TABLE` blocks, before the `CREATE INDEX` calls), add:

```ts
await client.query(`
  ALTER TABLE recommendation_requests
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
`);
await client.query(`
  ALTER TABLE recommendation_requests
  ADD COLUMN IF NOT EXISTS verified_email TEXT
`);
await client.query(`
  ALTER TABLE recommendation_requests
  ADD COLUMN IF NOT EXISTS verified_domain TEXT
`);
await client.query(`
  ALTER TABLE recommendation_requests
  ADD COLUMN IF NOT EXISTS verified_company TEXT
`);
await client.query(`
  ALTER TABLE recommendation_requests
  ADD COLUMN IF NOT EXISTS zoom_info_company_id TEXT
`);
await client.query(`
  CREATE TABLE IF NOT EXISTS recommendation_otps (
    request_id TEXT PRIMARY KEY REFERENCES recommendation_requests(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);
await client.query(`
  CREATE INDEX IF NOT EXISTS recommendation_otps_expires_at_idx
  ON recommendation_otps (expires_at)
`);
```

- [ ] **Step 2: Extend `RecommendationRequest` type and `RecommendationRow`**

Add to `RecommendationRequest`:

```ts
verificationStatus: "pending" | "email_verified" | "verified" | "company_pending";
verifiedEmail: string | null;
verifiedDomain: string | null;
verifiedCompany: string | null;
zoomInfoCompanyId: string | null;
```

Add to `RecommendationRow`:

```ts
verification_status: "pending" | "email_verified" | "verified" | "company_pending";
verified_email: string | null;
verified_domain: string | null;
verified_company: string | null;
zoom_info_company_id: string | null;
```

Update `mapRow` to copy these fields:

```ts
verificationStatus: row.verification_status,
verifiedEmail: row.verified_email,
verifiedDomain: row.verified_domain,
verifiedCompany: row.verified_company,
zoomInfoCompanyId: row.zoom_info_company_id,
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS. The new fields flow through `mapRow`; any consumer that destructures `RecommendationRequest` is unaffected because the additions are new optional/nullable fields.

- [ ] **Step 4: Commit**

```bash
git add packages/candidate/src/server/recommendation-db.ts
git commit -m "feat(rec-verify): add verification columns + recommendation_otps table"
```

---

## Task 2: Personal-email-domain helper

**Files:**
- Create: `packages/shared/src/lib/domain/personal-email-domains.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the helper module**

```ts
// packages/shared/src/lib/domain/personal-email-domains.ts
export const PERSONAL_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tuta.io",
]);

export function extractEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx <= 0 || atIdx === trimmed.length - 1) return null;
  const domain = trimmed.slice(atIdx + 1);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return null;
  return domain;
}

export function isPersonalEmailDomain(domain: string): boolean {
  return PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
}
```

- [ ] **Step 2: Re-export from shared index**

In `packages/shared/src/index.ts`, find the existing re-exports and add:

```ts
export {
  PERSONAL_EMAIL_DOMAINS,
  extractEmailDomain,
  isPersonalEmailDomain,
} from "./lib/domain/personal-email-domains";
```

If the file uses `export * from "./lib/..."` style, follow that pattern instead. Read the file first to match existing style.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/lib/domain/personal-email-domains.ts packages/shared/src/index.ts
git commit -m "feat(rec-verify): add personal-email-domain helper"
```

---

## Task 3: OTP module

**Files:**
- Create: `packages/candidate/src/server/recommender-otp.ts`

- [ ] **Step 1: Implement OTP module**

```ts
// packages/candidate/src/server/recommender-otp.ts
import { createHash, randomInt } from "node:crypto";
import { query } from "./candidate-database";
import { ensureRecommendationSchema } from "./recommendation-db";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getSalt(): string {
  return process.env.RECOMMENDER_OTP_SALT ?? "recai-dev-otp-salt";
}

export function hashOtpCode(code: string, requestId: string): string {
  return createHash("sha256")
    .update(`${code}:${requestId}:${getSalt()}`)
    .digest("hex");
}

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export type IssueOtpInput = {
  requestId: string;
  email: string;
};

export type IssueOtpResult = {
  code: string;
  expiresAt: Date;
};

export async function issueOtp({ requestId, email }: IssueOtpInput): Promise<IssueOtpResult> {
  await ensureRecommendationSchema();
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code, requestId);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await query(
    `INSERT INTO recommendation_otps (request_id, email, code_hash, expires_at, attempts)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (request_id) DO UPDATE
       SET email = EXCLUDED.email,
           code_hash = EXCLUDED.code_hash,
           expires_at = EXCLUDED.expires_at,
           attempts = 0,
           created_at = NOW()`,
    [requestId, email.toLowerCase(), codeHash, expiresAt],
  );

  return { code, expiresAt };
}

export type VerifyOtpOutcome =
  | { ok: true; email: string }
  | { ok: false; reason: "no_otp" | "expired" | "attempts_exhausted" | "mismatch" };

export async function verifyOtp(requestId: string, submittedCode: string): Promise<VerifyOtpOutcome> {
  await ensureRecommendationSchema();
  const result = await query<{
    email: string;
    code_hash: string;
    expires_at: Date;
    attempts: number;
  }>(
    `SELECT email, code_hash, expires_at, attempts
     FROM recommendation_otps
     WHERE request_id = $1
     LIMIT 1`,
    [requestId],
  );
  const row = result.rows[0];
  if (!row) return { ok: false, reason: "no_otp" };
  if (row.expires_at.getTime() <= Date.now()) {
    await query(`DELETE FROM recommendation_otps WHERE request_id = $1`, [requestId]);
    return { ok: false, reason: "expired" };
  }
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "attempts_exhausted" };

  await query(
    `UPDATE recommendation_otps SET attempts = attempts + 1 WHERE request_id = $1`,
    [requestId],
  );

  const expectedHash = hashOtpCode(submittedCode, requestId);
  if (expectedHash !== row.code_hash) return { ok: false, reason: "mismatch" };

  await query(`DELETE FROM recommendation_otps WHERE request_id = $1`, [requestId]);
  return { ok: true, email: row.email };
}

export async function hasActiveOtp(requestId: string): Promise<boolean> {
  await ensureRecommendationSchema();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM recommendation_otps
     WHERE request_id = $1 AND expires_at > NOW()`,
    [requestId],
  );
  return Number(result.rows[0]?.count ?? "0") > 0;
}

export async function deleteExpiredOtp(requestId: string): Promise<void> {
  await ensureRecommendationSchema();
  await query(
    `DELETE FROM recommendation_otps WHERE request_id = $1 AND expires_at <= NOW()`,
    [requestId],
  );
}

export const RECOMMENDER_OTP_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const RECOMMENDER_OTP_TTL_MS = OTP_TTL_MS;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/candidate/src/server/recommender-otp.ts
git commit -m "feat(rec-verify): add OTP issue/verify module"
```

---

## Task 4: Resend email client

**Files:**
- Modify: `apps/web/package.json`
- Create: `packages/candidate/src/server/email/resend-client.ts`

- [ ] **Step 1: Add the Resend dependency**

Run: `npm install resend --workspace @recai/web`
Expected: `package-lock.json` updates. `resend` appears under `@recai/web` dependencies.

- [ ] **Step 2: Create the email client module**

```ts
// packages/candidate/src/server/email/resend-client.ts
import { Resend } from "resend";

type SendOtpInput = {
  to: string;
  code: string;
  candidateName: string;
};

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

export async function sendRecommenderOtpEmail({ to, code, candidateName }: SendOtpInput): Promise<void> {
  const client = getClient();
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "verify@recai.app";

  if (!client) {
    console.log(
      `[recommender-otp] (dev) would send code ${code} to ${to} for candidate ${candidateName}`,
    );
    return;
  }

  const subject = `Your RecAI verification code: ${code}`;
  const text = [
    `Hi,`,
    ``,
    `${candidateName} asked you to write a recommendation on RecAI.`,
    ``,
    `Your verification code is: ${code}`,
    ``,
    `This code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  ].join("\n");

  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? "unknown"}`);
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json package-lock.json packages/candidate/src/server/email/resend-client.ts
git commit -m "feat(rec-verify): add Resend OTP email client"
```

---

## Task 5: Company-lookup service (interface + stub + ZoomInfo)

**Files:**
- Create: `packages/candidate/src/server/company-lookup/types.ts`
- Create: `packages/candidate/src/server/company-lookup/stub.ts`
- Create: `packages/candidate/src/server/company-lookup/zoom-info.ts`
- Create: `packages/candidate/src/server/company-lookup/index.ts`

- [ ] **Step 1: Define types**

```ts
// packages/candidate/src/server/company-lookup/types.ts
export type CompanyLookupResult = {
  companyId: string;
  companyName: string;
};

export interface CompanyLookupService {
  lookupByDomain(domain: string): Promise<CompanyLookupResult | null>;
}
```

- [ ] **Step 2: Stub implementation**

```ts
// packages/candidate/src/server/company-lookup/stub.ts
import type { CompanyLookupResult, CompanyLookupService } from "./types";

type StubMap = Record<string, { companyId: string; companyName: string }>;

function loadStubMap(): StubMap {
  const raw = process.env.RECOMMENDER_STUB_COMPANY_MAP;
  if (!raw) {
    return {
      "acme.com": { companyId: "stub-acme", companyName: "Acme Inc." },
      "stripe.com": { companyId: "stub-stripe", companyName: "Stripe" },
      "vercel.com": { companyId: "stub-vercel", companyName: "Vercel" },
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as StubMap;
  } catch (err) {
    console.warn("[company-lookup] failed to parse RECOMMENDER_STUB_COMPANY_MAP:", err);
  }
  return {};
}

export class StubCompanyLookup implements CompanyLookupService {
  private readonly map: StubMap;
  constructor(map?: StubMap) {
    this.map = map ?? loadStubMap();
  }
  async lookupByDomain(domain: string): Promise<CompanyLookupResult | null> {
    const hit = this.map[domain.toLowerCase()];
    return hit ? { companyId: hit.companyId, companyName: hit.companyName } : null;
  }
}
```

- [ ] **Step 3: ZoomInfo implementation skeleton**

```ts
// packages/candidate/src/server/company-lookup/zoom-info.ts
import type { CompanyLookupResult, CompanyLookupService } from "./types";

const ZOOMINFO_ENDPOINT = "https://api.zoominfo.com/lookup/company";

export class ZoomInfoCompanyLookup implements CompanyLookupService {
  constructor(private readonly apiKey: string) {}

  async lookupByDomain(domain: string): Promise<CompanyLookupResult | null> {
    try {
      const url = `${ZOOMINFO_ENDPOINT}?domain=${encodeURIComponent(domain)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });
      if (response.status === 404) return null;
      if (!response.ok) {
        console.warn(`[zoominfo] lookup failed for ${domain}: ${response.status}`);
        return null;
      }
      const body: unknown = await response.json();
      if (!body || typeof body !== "object") return null;
      const record = body as { id?: unknown; companyId?: unknown; name?: unknown; companyName?: unknown };
      const companyId = String(record.id ?? record.companyId ?? "").trim();
      const companyName = String(record.name ?? record.companyName ?? "").trim();
      if (!companyId || !companyName) return null;
      return { companyId, companyName };
    } catch (err) {
      console.warn(`[zoominfo] lookup error for ${domain}:`, err);
      return null;
    }
  }
}
```

The exact ZoomInfo response shape is documented as an open question in the spec; this implementation tolerates `id`/`name` or `companyId`/`companyName` field names and returns `null` on any deviation, which the caller treats as `company_pending`.

- [ ] **Step 4: Factory**

```ts
// packages/candidate/src/server/company-lookup/index.ts
import { StubCompanyLookup } from "./stub";
import { ZoomInfoCompanyLookup } from "./zoom-info";
import type { CompanyLookupService } from "./types";

export type { CompanyLookupResult, CompanyLookupService } from "./types";
export { StubCompanyLookup } from "./stub";
export { ZoomInfoCompanyLookup } from "./zoom-info";

let cached: CompanyLookupService | null = null;

export function getCompanyLookupService(): CompanyLookupService {
  if (cached) return cached;
  const apiKey = process.env.ZOOMINFO_API_KEY;
  cached = apiKey ? new ZoomInfoCompanyLookup(apiKey) : new StubCompanyLookup();
  return cached;
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/candidate/src/server/company-lookup/
git commit -m "feat(rec-verify): add company-lookup service (stub + zoominfo)"
```

---

## Task 6: Verification-state mutators in `recommendation-db`

**Files:**
- Modify: `packages/candidate/src/server/recommendation-db.ts`

- [ ] **Step 1: Add helpers to set verification state**

At the end of `recommendation-db.ts`, add:

```ts
export async function recordVerifiedCompany(
  requestId: string,
  data: {
    verifiedEmail: string;
    verifiedDomain: string;
    verifiedCompany: string;
    zoomInfoCompanyId: string;
  },
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `UPDATE recommendation_requests
       SET verification_status = 'verified',
           verified_email = $2,
           verified_domain = $3,
           verified_company = $4,
           zoom_info_company_id = $5,
           updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      requestId,
      data.verifiedEmail,
      data.verifiedDomain,
      data.verifiedCompany,
      data.zoomInfoCompanyId,
    ],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function recordCompanyPending(
  requestId: string,
  data: { verifiedEmail: string; verifiedDomain: string },
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `UPDATE recommendation_requests
       SET verification_status = 'company_pending',
           verified_email = $2,
           verified_domain = $3,
           verified_company = NULL,
           zoom_info_company_id = NULL,
           updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [requestId, data.verifiedEmail, data.verifiedDomain],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getRecommendationById(
  id: string,
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `SELECT * FROM recommendation_requests WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
```

- [ ] **Step 2: Tighten the form-mutator gates**

Update `saveRecommendationDraft` and `submitRecommendation` to also require `verification_status = 'verified'`.

In `saveRecommendationDraft`, change:

```ts
WHERE token = $1 AND status IN ('pending', 'draft')
```

to:

```ts
WHERE token = $1 AND status IN ('pending', 'draft') AND verification_status = 'verified'
```

In `submitRecommendation`, change:

```ts
WHERE token = $1 AND status IN ('pending', 'draft') AND expires_at > NOW()
```

to:

```ts
WHERE token = $1 AND status IN ('pending', 'draft') AND expires_at > NOW() AND verification_status = 'verified'
```

These DB-level gates are the source of truth; the API-route checks in Task 11 are a defense in depth that produce nicer error messages.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/candidate/src/server/recommendation-db.ts
git commit -m "feat(rec-verify): add verification-state mutators + DB-level form gate"
```

---

## Task 7: API route — `start-verification`

**Files:**
- Create: `apps/web/src/app/api/recommend/[token]/start-verification/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/api/recommend/[token]/start-verification/route.ts
import { extractEmailDomain, isPersonalEmailDomain } from "@recai/shared";
import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";
import { issueOtp } from "@recai/candidate/server/recommender-otp";
import { sendRecommenderOtpEmail } from "@recai/candidate/server/email/resend-client";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string"
    ? (body as { email: string }).email.trim().toLowerCase()
    : "";
  if (!email) return Response.json({ error: "email_required" }, { status: 400 });

  const domain = extractEmailDomain(email);
  if (!domain) return Response.json({ error: "invalid_email" }, { status: 400 });
  if (isPersonalEmailDomain(domain)) {
    return Response.json({ error: "personal_domain", domain }, { status: 400 });
  }

  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });
  if (new Date(rec.expiresAt).getTime() <= Date.now()) {
    return Response.json({ error: "link_expired" }, { status: 410 });
  }
  if (rec.status === "submitted" || rec.status === "deleted") {
    return Response.json({ error: "request_closed" }, { status: 409 });
  }
  if (rec.verificationStatus === "verified") {
    return Response.json({ error: "already_verified" }, { status: 409 });
  }

  const { code } = await issueOtp({ requestId: rec.id, email });

  try {
    await sendRecommenderOtpEmail({
      to: email,
      code,
      candidateName: rec.candidateName,
    });
  } catch (err) {
    console.error("[start-verification] resend failed:", err);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, verificationStatus: rec.verificationStatus });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/recommend/[token]/start-verification/route.ts
git commit -m "feat(rec-verify): add start-verification API route"
```

---

## Task 8: API route — `verify-code`

**Files:**
- Create: `apps/web/src/app/api/recommend/[token]/verify-code/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/api/recommend/[token]/verify-code/route.ts
import { extractEmailDomain } from "@recai/shared";
import {
  getRecommendationByToken,
  recordCompanyPending,
  recordVerifiedCompany,
} from "@recai/candidate/server/recommendation-db";
import { verifyOtp } from "@recai/candidate/server/recommender-otp";
import { getCompanyLookupService } from "@recai/candidate/server/company-lookup";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const code = typeof (body as { code?: unknown })?.code === "string"
    ? (body as { code: string }).code.trim()
    : "";
  if (!/^\d{6}$/.test(code)) {
    return Response.json({ error: "invalid_code_format" }, { status: 400 });
  }

  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });
  if (rec.verificationStatus === "verified") {
    return Response.json({
      verificationStatus: "verified",
      verifiedDomain: rec.verifiedDomain,
      verifiedCompany: rec.verifiedCompany,
    });
  }

  const outcome = await verifyOtp(rec.id, code);
  if (!outcome.ok) {
    const statusByReason: Record<typeof outcome.reason, number> = {
      no_otp: 404,
      expired: 410,
      attempts_exhausted: 429,
      mismatch: 401,
    };
    return Response.json({ error: outcome.reason }, { status: statusByReason[outcome.reason] });
  }

  const verifiedEmail = outcome.email;
  const domain = extractEmailDomain(verifiedEmail);
  if (!domain) {
    // Should be unreachable — start-verification already validated this — but guard anyway.
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const lookup = getCompanyLookupService();
  const company = await lookup.lookupByDomain(domain);

  if (company) {
    const updated = await recordVerifiedCompany(rec.id, {
      verifiedEmail,
      verifiedDomain: domain,
      verifiedCompany: company.companyName,
      zoomInfoCompanyId: company.companyId,
    });
    return Response.json({
      verificationStatus: "verified",
      verifiedDomain: updated?.verifiedDomain ?? domain,
      verifiedCompany: updated?.verifiedCompany ?? company.companyName,
    });
  }

  await recordCompanyPending(rec.id, { verifiedEmail, verifiedDomain: domain });
  return Response.json({
    verificationStatus: "company_pending",
    verifiedDomain: domain,
    verifiedCompany: null,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/recommend/[token]/verify-code/route.ts
git commit -m "feat(rec-verify): add verify-code API route"
```

---

## Task 9: API route — `status`

**Files:**
- Create: `apps/web/src/app/api/recommend/[token]/status/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/api/recommend/[token]/status/route.ts
import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";
import { hasActiveOtp } from "@recai/candidate/server/recommender-otp";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });

  const otpPending = await hasActiveOtp(rec.id);

  return Response.json({
    verificationStatus: rec.verificationStatus,
    verifiedEmail: rec.verifiedEmail,
    verifiedDomain: rec.verifiedDomain,
    verifiedCompany: rec.verifiedCompany,
    otpPending,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/recommend/[token]/status/route.ts
git commit -m "feat(rec-verify): add verification status API route"
```

---

## Task 10: Update existing GET `/api/recommend/[token]`

**Files:**
- Modify: `apps/web/src/app/api/recommend/[token]/route.ts`

- [ ] **Step 1: Strip OTP-irrelevant secrets and surface verification fields**

The current route already strips `recommenderEmail`. Update it to also surface verification fields (the page needs them server-side to decide which UI to render). The full file becomes:

```ts
// apps/web/src/app/api/recommend/[token]/route.ts
import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return new Response("Not found", { status: 404 });
  const { recommenderEmail, ...safe } = rec;
  void recommenderEmail;
  return Response.json(safe);
}
```

The new fields (`verificationStatus`, `verifiedEmail`, `verifiedDomain`, `verifiedCompany`, `zoomInfoCompanyId`) are already on the mapped object from Task 1, so the spread already includes them.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit (only if the file actually changed)**

If Task 1 already produces the right behavior here without edits, skip the commit. Otherwise:

```bash
git add apps/web/src/app/api/recommend/[token]/route.ts
git commit -m "feat(rec-verify): expose verification fields on token GET"
```

---

## Task 11: Gate `save` and `submit` routes

**Files:**
- Modify: `apps/web/src/app/api/recommend/[token]/save/route.ts`
- Modify: `apps/web/src/app/api/recommend/[token]/submit/route.ts`

- [ ] **Step 1: Add a verification check to `save`**

Replace the file:

```ts
// apps/web/src/app/api/recommend/[token]/save/route.ts
import {
  getRecommendationByToken,
  saveRecommendationDraft,
} from "@recai/candidate/server/recommendation-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return new Response("Not found", { status: 404 });
  if (rec.verificationStatus !== "verified") {
    return Response.json({ error: "verification_required" }, { status: 403 });
  }

  const body = await request.json();

  const updated = await saveRecommendationDraft(token, {
    technicalResponse: body.technicalResponse ?? "",
    behavioralResponse: body.behavioralResponse ?? "",
    projects: body.projects ?? [],
  });

  if (!updated) return new Response("Not found or already submitted", { status: 404 });
  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Add a verification check to `submit`**

Replace the file:

```ts
// apps/web/src/app/api/recommend/[token]/submit/route.ts
import {
  getRecommendationByToken,
  submitRecommendation,
} from "@recai/candidate/server/recommendation-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return new Response("Not found", { status: 404 });
  if (rec.verificationStatus !== "verified") {
    return Response.json({ error: "verification_required" }, { status: 403 });
  }

  const body = await request.json();

  const updated = await submitRecommendation(token, {
    technicalResponse: body.technicalResponse ?? "",
    behavioralResponse: body.behavioralResponse ?? "",
    projects: body.projects ?? [],
  });

  if (!updated) {
    return new Response("Link expired or already submitted", { status: 409 });
  }
  return Response.json({ ok: true });
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/recommend/[token]/save/route.ts apps/web/src/app/api/recommend/[token]/submit/route.ts
git commit -m "feat(rec-verify): gate save/submit on verified status"
```

---

## Task 12: Verification gate UI component

**Files:**
- Create: `packages/candidate/src/components/recommender-verification-gate.tsx`

- [ ] **Step 1: Implement the client component**

```tsx
// packages/candidate/src/components/recommender-verification-gate.tsx
"use client";

import { useState } from "react";

type VerificationStatus = "pending" | "email_verified" | "verified" | "company_pending";

type Props = {
  token: string;
  initialStatus: VerificationStatus;
  initialVerifiedDomain: string | null;
  initialVerifiedCompany: string | null;
  initialOtpPending: boolean;
  onVerified: (data: { verifiedDomain: string; verifiedCompany: string }) => void;
};

type Stage = "email" | "code" | "company_pending";

export function RecommenderVerificationGate({
  token,
  initialStatus,
  initialVerifiedDomain,
  initialVerifiedCompany,
  initialOtpPending,
  onVerified,
}: Props) {
  const [stage, setStage] = useState<Stage>(() => {
    if (initialStatus === "verified") return "email"; // unreachable; parent should hide gate
    if (initialStatus === "company_pending" && !initialOtpPending) return "company_pending";
    if (initialOtpPending) return "code";
    return "email";
  });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastDomain, setLastDomain] = useState<string | null>(initialVerifiedDomain);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommend/${token}/start-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === "personal_domain") {
          setError(`Please use a work email — ${json.domain} addresses aren't accepted.`);
        } else if (json?.error === "invalid_email") {
          setError("That doesn't look like a valid email.");
        } else if (json?.error === "send_failed") {
          setError("We couldn't send the code. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }
      setStage("code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommend/${token}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === "expired") setError("This code has expired. Request a new one.");
        else if (json?.error === "attempts_exhausted") setError("Too many attempts. Request a new code.");
        else if (json?.error === "mismatch") setError("Incorrect code. Try again.");
        else setError("Verification failed. Please try again.");
        return;
      }
      if (json.verificationStatus === "verified") {
        onVerified({
          verifiedDomain: json.verifiedDomain,
          verifiedCompany: json.verifiedCompany,
        });
        return;
      }
      if (json.verificationStatus === "company_pending") {
        setLastDomain(json.verifiedDomain ?? null);
        setStage("company_pending");
        return;
      }
      setError("Unexpected response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetToEmail() {
    setStage("email");
    setCode("");
    setError(null);
  }

  if (initialStatus === "verified" && initialVerifiedCompany) {
    return (
      <div className="rounded-lg border border-(--line) bg-(--surface) p-4 text-sm">
        Verified at <strong>{initialVerifiedCompany}</strong>
        {initialVerifiedDomain ? <> &mdash; {initialVerifiedDomain}</> : null}
      </div>
    );
  }

  if (stage === "company_pending") {
    return (
      <div className="rounded-lg border border-(--line) bg-(--surface) p-4 text-sm space-y-3">
        <div>
          We sent the code, but couldn't verify a company at{" "}
          <strong>{lastDomain ?? "that domain"}</strong>. Please try a different work email.
        </div>
        <button
          type="button"
          className="rounded-md border border-(--line) px-3 py-1 text-xs"
          onClick={resetToEmail}
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (stage === "code") {
    return (
      <form onSubmit={handleVerify} className="rounded-lg border border-(--line) bg-(--surface) p-4 text-sm space-y-3">
        <div>Enter the 6-digit code we sent to your work email.</div>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-md border border-(--line) bg-background px-3 py-2 font-mono tracking-[0.4em]"
          placeholder="123456"
          required
        />
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="rounded-md bg-(--accent) px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={resetToEmail}
            className="rounded-md border border-(--line) px-3 py-1.5 text-xs"
          >
            Change email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleStart} className="rounded-lg border border-(--line) bg-(--surface) p-4 text-sm space-y-3">
      <div>Enter your work email to start. We'll send you a 6-digit code.</div>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="w-full rounded-md border border-(--line) bg-background px-3 py-2"
        placeholder="you@company.com"
        required
      />
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
      <button
        type="submit"
        disabled={submitting || !email}
        className="rounded-md bg-(--accent) px-3 py-1.5 text-xs text-white disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/candidate/src/components/recommender-verification-gate.tsx
git commit -m "feat(rec-verify): add recommender verification gate UI"
```

---

## Task 13: Wire the gate into the recommender page

**Files:**
- Modify: `packages/candidate/src/pages/recommendation-request-page.tsx`

- [ ] **Step 1: Render the gate before the form**

The page is a server component. We need to fetch `otpPending` (we can compute it server-side directly, no need to round-trip through the status API). Update the page:

```tsx
// packages/candidate/src/pages/recommendation-request-page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { appRoutes } from "@recai/shared";
import { getRecommendationByToken } from "../server/recommendation-db";
import { hasActiveOtp } from "../server/recommender-otp";
import { RecommendationForm } from "../components/recommendation-form";
import { RecommenderVerificationGate } from "../components/recommender-verification-gate";
import { RecommendationRequestClient } from "./recommendation-request-client";

type Props = {
  params: Promise<{ requestId: string }>;
};

export async function RecommendationRequestPage({ params }: Props) {
  const { requestId: token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) notFound();

  const otpPending = await hasActiveOtp(rec.id);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-pattern opacity-25" />
      <div className="relative flex min-h-screen flex-col">
        <header className="glass-panel sticky top-0 z-20 border-b border-(--line)">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
            <Link
              className="text-sm font-semibold uppercase tracking-[0.28em] text-(--accent)"
              href={appRoutes.home}
            >
              RecAI
            </Link>
            <span className="text-sm text-(--muted)">Recommendation form</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Recommendation for {rec.candidateName}
            </h1>
            <p className="mt-1 text-sm text-(--muted)">
              {rec.status === "submitted"
                ? "Your recommendation has been submitted."
                : rec.status === "deleted"
                  ? "This recommendation has been removed."
                  : new Date(rec.expiresAt) < new Date()
                    ? "This link has expired."
                    : `Link valid until ${new Date(rec.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
            </p>
          </div>

          <RecommendationRequestClient
            rec={rec}
            initialOtpPending={otpPending}
          />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the client wrapper that holds verification state**

Create `packages/candidate/src/pages/recommendation-request-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { RecommendationRequest } from "../server/recommendation-db";
import { RecommendationForm } from "../components/recommendation-form";
import { RecommenderVerificationGate } from "../components/recommender-verification-gate";

type Props = {
  rec: RecommendationRequest;
  initialOtpPending: boolean;
};

export function RecommendationRequestClient({ rec, initialOtpPending }: Props) {
  const [verificationStatus, setVerificationStatus] = useState(rec.verificationStatus);
  const [verifiedDomain, setVerifiedDomain] = useState(rec.verifiedDomain);
  const [verifiedCompany, setVerifiedCompany] = useState(rec.verifiedCompany);

  if (verificationStatus !== "verified") {
    return (
      <RecommenderVerificationGate
        token={rec.token}
        initialStatus={verificationStatus}
        initialVerifiedDomain={verifiedDomain}
        initialVerifiedCompany={verifiedCompany}
        initialOtpPending={initialOtpPending}
        onVerified={({ verifiedDomain: d, verifiedCompany: c }) => {
          setVerifiedDomain(d);
          setVerifiedCompany(c);
          setVerificationStatus("verified");
        }}
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border border-(--line) bg-(--surface) p-4 text-sm">
        Verified at <strong>{verifiedCompany ?? "(unknown)"}</strong>
        {verifiedDomain ? <> &mdash; {verifiedDomain}</> : null}
      </div>
      <RecommendationForm rec={{ ...rec, verifiedDomain, verifiedCompany }} />
    </>
  );
}
```

- [ ] **Step 3: Remove the now-unused server-only import**

Delete the unused `RecommendationForm` and `RecommenderVerificationGate` imports from `recommendation-request-page.tsx` since they moved to the client wrapper. The final imports there should be:

```ts
import { notFound } from "next/navigation";
import Link from "next/link";
import { appRoutes } from "@recai/shared";
import { getRecommendationByToken } from "../server/recommendation-db";
import { hasActiveOtp } from "../server/recommender-otp";
import { RecommendationRequestClient } from "./recommendation-request-client";
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/candidate/src/pages/recommendation-request-page.tsx packages/candidate/src/pages/recommendation-request-client.tsx
git commit -m "feat(rec-verify): render verification gate on recommender page"
```

---

## Task 14: Display the verified company instead of candidate-entered company

**Files:**
- Modify: `packages/candidate/src/server/candidate-profile-db.ts:170`
- Modify: `packages/candidate/src/components/recommendation-form.tsx:286`

- [ ] **Step 1: Switch profile assembly to `verifiedCompany`**

In `candidate-profile-db.ts`, find the line:

```ts
company: normalizeText(recommendation.recommenderCompany) || "Company not shared",
```

Replace with:

```ts
company: normalizeText(recommendation.verifiedCompany ?? "") || "Company not shared",
```

- [ ] **Step 2: Switch the recommender form header to `verifiedCompany`**

In `recommendation-form.tsx`, find:

```tsx
{initial.recommenderCompany ? `, ${initial.recommenderCompany}` : ""}
```

Replace with:

```tsx
{initial.verifiedCompany ? `, ${initial.verifiedCompany}` : ""}
```

(The candidate dashboard at `candidate-recommendations-page.tsx` continues to display `recommenderCompany` — that's the candidate's own view of what they typed when creating the request, which is correct.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/candidate/src/server/candidate-profile-db.ts packages/candidate/src/components/recommendation-form.tsx
git commit -m "feat(rec-verify): display verified company on profile + form header"
```

---

## Task 15: Add env vars to `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append new env vars**

Append to `.env.example`:

```
# Recommender verification (Resend OTP + ZoomInfo company lookup)
RESEND_API_KEY=
RESEND_FROM_EMAIL=verify@recai.app
ZOOMINFO_API_KEY=
ZOOMINFO_USERNAME=
RECOMMENDER_OTP_SALT=
RECOMMENDER_STUB_COMPANY_MAP=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat(rec-verify): document new env vars"
```

---

## Task 16: Smoke-test the full flow

**Files:** none (manual validation)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` with no startup errors. Aurora connection is established (check console).

- [ ] **Step 2: Lint and typecheck the whole repo**

Run: `npm run lint && npm run typecheck`
Expected: both PASS.

- [ ] **Step 3: Create a recommendation request as a candidate**

Sign in as a candidate (existing flow), create a recommendation request, copy the recommender link.

- [ ] **Step 4: Walk the recommender flow against the stub**

Without `ZOOMINFO_API_KEY` set, the stub map applies. Open the recommender link and:

1. Submit `me@gmail.com` → see the personal-domain rejection.
2. Submit `me@vercel.com` → check the dev console for the OTP log line (since `RESEND_API_KEY` is unset locally, the email is logged not sent).
3. Enter the 6-digit code → page should swap to the form, and the verified header reads "Verified at Vercel — vercel.com".
4. Submit `someone@unknown.example` (with a fresh request) → after OTP verification, page shows the `company_pending` block.
5. Try to `POST /api/recommend/<token>/save` from a separate terminal while a request is in `pending` verification status → 403 with `{ "error": "verification_required" }`.

- [ ] **Step 6: Verify display swap**

After successfully submitting a verified recommendation, open the candidate's public profile (`/c/<slug>`). The recommendation card shows the ZoomInfo company name (e.g. "Vercel"), not whatever the candidate typed when creating the request.

- [ ] **Step 7: Commit (only if any final fixes were needed)**

If steps 1–6 surfaced bugs, fix them and commit per the usual pattern. Otherwise this task closes the plan with no commit.
