# Candidate Auth & Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship slice A of the candidate flow — Aurora-backed candidate auth, a session-gated LinkedIn-style dashboard, and a working profile-banner editor.

**Architecture:** Mirrors the existing recruiter Aurora auth pattern from spec `0008-recruiter-aurora-auth.md`. Independent `pg.Pool`, separate cookie name (`recai_candidate_session`), separate session table. New code lives in `packages/candidate/{server,components,pages}` and `apps/web/src/app/api/candidate/**`. The dashboard departs from the project's `AppShell` + `SectionCard` grid in favor of a profile-shaped layout (cover gradient, avatar, hero, left-column sections, right-rail action panel) — see spec 0011 §UX Notes and the locked v2 mockup at `.superpowers/brainstorm/.../dashboard-direction-v2.html`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind 4, `pg` 8, `@aws-sdk/rds-signer`, `@vercel/functions` (OIDC + database pool), Node `node:crypto` (`scrypt`).

**Validation pattern:** This repo has no test framework. Per spec 0011 §Validation, every task ends with `npm run lint` + `npm run typecheck` + `npm run build`, plus the manual smoke from the same section once the user-facing surfaces are in. Tasks deliberately do not follow TDD — the writing-plans skill's TDD default is overridden here to match project convention (`AGENTS.md` and prior recruiter-auth spec 0008 use the same lint/typecheck/build/manual loop). Each task ends with a commit so the branch can be reviewed slice by slice.

**Spec:** `docs/specs/0011-candidate-auth-and-banner.md` (commit `f59538c`).

**Reference implementations to mirror (read these before each task — every renamed function should map 1:1 to its recruiter equivalent):**
- `packages/recruiter/src/server/recruiter-database.ts` — Aurora pool pattern.
- `packages/recruiter/src/server/recruiter-auth.ts` — auth functions and schema bootstrap.
- `packages/recruiter/src/components/recruiter-sign-out-form.tsx` — sign-out form.
- `packages/recruiter/src/pages/recruiter-sign-in-page.tsx` — two-up `SectionCard` signup/signin layout.
- `apps/web/src/app/api/recruiter/auth/sign-{in,up,out}/route.ts` — API route handlers.

**Cross-task conventions:**
- All file paths are repo-relative.
- All shell commands run from the repo root unless noted.
- Use `npm run` (not `npm.cmd run`) — the docs use the Windows-safe form, but everything works on macOS/Linux too. The repo is currently being developed on macOS.
- Commit messages use Conventional Commits scoped to the lane: `feat(candidate)`, `chore(candidate)`, `docs(candidate)`.

---

### Task 1: Add shared candidate domain types

**Files:**
- Modify: `packages/shared/src/lib/domain/types.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1.1: Append the new types to `packages/shared/src/lib/domain/types.ts`**

Append at the end of the file (after `RecruiterCandidateReview`):

```ts
export interface CandidateAccount {
  id: string;
  email: string;
  fullName: string;
  slug: string;
}

export interface CandidateBanner {
  email: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}
```

- [ ] **Step 1.2: Re-export from `packages/shared/src/index.ts`**

Locate the existing `export type { ... } from "./lib/domain/types";` block and add `CandidateAccount` and `CandidateBanner` in alphabetical order (so the block becomes):

```ts
export type {
  CandidateAccount,
  CandidateBanner,
  CandidateProfile,
  CandidateProject,
  JobPosting,
  PentagonScoreMap,
  PentagonTraitId,
  RecruiterCandidateReview,
  RecommendationRequestPreview,
  RecommendationSnippet,
  RecruiterAccount,
  RecruiterTraitEvidence,
} from "./lib/domain/types";
```

- [ ] **Step 1.3: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed with no errors related to the new types.

- [ ] **Step 1.4: Commit**

```bash
git add packages/shared/src/lib/domain/types.ts packages/shared/src/index.ts
git commit -m "feat(shared): add CandidateAccount and CandidateBanner types"
```

---

### Task 2: Add candidate Aurora pool helper

**Files:**
- Create: `packages/candidate/src/server/candidate-database.ts`

- [ ] **Step 2.1: Create the file with full content**

Mirror `packages/recruiter/src/server/recruiter-database.ts` 1:1, swapping only the error-message string from "RecAI recruiter auth" → "RecAI candidate auth" and the exported function name from `isRecruiterDatabaseConfigured` → `isCandidateDatabaseConfigured`. The two pools are intentionally independent — separate `Pool` instance, separate `attachDatabasePool` call. Full content:

```ts
import { attachDatabasePool } from "@vercel/functions";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import type { ClientBase, QueryResult, QueryResultRow } from "pg";
import { Pool } from "pg";

const REQUIRED_AURORA_ENV_KEYS = [
  "AWS_REGION",
  "AWS_ROLE_ARN",
  "PGHOST",
  "PGPORT",
  "PGUSER",
  "PGDATABASE",
] as const;

type AuroraConfig = {
  database: string;
  host: string;
  port: number;
  region: string;
  roleArn: string;
  user: string;
};

let pool: Pool | null = null;

function getMissingAuroraEnvKeys() {
  return REQUIRED_AURORA_ENV_KEYS.filter((key) => !process.env[key]);
}

function getAuroraConfig(): AuroraConfig {
  const missingKeys = getMissingAuroraEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(
      `RecAI candidate auth is not connected to Aurora PostgreSQL yet. Missing environment variables: ${missingKeys.join(
        ", ",
      )}. Accept the AWS marketplace install, attach Aurora to this Vercel project, then run \`vercel env pull\` locally.`,
    );
  }

  return {
    database: process.env.PGDATABASE ?? "postgres",
    host: process.env.PGHOST as string,
    port: Number(process.env.PGPORT),
    region: process.env.AWS_REGION as string,
    roleArn: process.env.AWS_ROLE_ARN as string,
    user: process.env.PGUSER as string,
  };
}

export function isCandidateDatabaseConfigured() {
  return getMissingAuroraEnvKeys().length === 0;
}

function getPool() {
  if (pool) {
    return pool;
  }

  const config = getAuroraConfig();

  const signer = new Signer({
    hostname: config.host,
    port: config.port,
    username: config.user,
    region: config.region,
    credentials: awsCredentialsProvider({
      roleArn: config.roleArn,
      clientConfig: {
        region: config.region,
      },
    }),
  });

  pool = new Pool({
    host: config.host,
    user: config.user,
    database: config.database,
    password: () => signer.getAuthToken(),
    port: config.port,
    ssl: {
      rejectUnauthorized: false,
    },
    max: process.env.NODE_ENV === "production" ? 20 : 6,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  attachDatabasePool(pool);

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(sql, values);
}

export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>) {
  const client = await getPool().connect();

  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export type { QueryResult };
```

- [ ] **Step 2.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed. The file is not yet imported anywhere, so no behavior change.

- [ ] **Step 2.3: Commit**

```bash
git add packages/candidate/src/server/candidate-database.ts
git commit -m "feat(candidate): add Aurora pool helper for candidate lane"
```

---

### Task 3: Add slug claim helper

**Files:**
- Create: `packages/candidate/src/server/candidate-slug.ts`

- [ ] **Step 3.1: Create the helper**

```ts
import { randomBytes } from "node:crypto";
import type { ClientBase } from "pg";

const SLUG_FALLBACK = "candidate";
const NUMERIC_SUFFIX_LIMIT = 99;

export function slugFromFullName(fullName: string): string {
  const normalized = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : SLUG_FALLBACK;
}

export function* candidateSlugCandidates(base: string): Generator<string> {
  yield base;
  for (let i = 2; i <= NUMERIC_SUFFIX_LIMIT; i++) {
    yield `${base}-${i}`;
  }
  yield `${base}-${randomBytes(3).toString("hex")}`;
}

type SlugAttemptResult = "ok" | "slug-collision";

export type SlugAttempt = (
  client: ClientBase,
  slug: string,
) => Promise<SlugAttemptResult>;

export async function claimSlugWith(
  client: ClientBase,
  baseFullName: string,
  attempt: SlugAttempt,
): Promise<string> {
  const base = slugFromFullName(baseFullName);

  for (const candidate of candidateSlugCandidates(base)) {
    const result = await attempt(client, candidate);
    if (result === "ok") {
      return candidate;
    }
  }

  throw new Error("candidate-slug-exhausted");
}
```

- [ ] **Step 3.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 3.3: Commit**

```bash
git add packages/candidate/src/server/candidate-slug.ts
git commit -m "feat(candidate): add slug normalization and claim helper"
```

---

### Task 4: Add candidate auth module

**Files:**
- Create: `packages/candidate/src/server/candidate-auth.ts`

- [ ] **Step 4.1: Create the auth module**

Mirrors `packages/recruiter/src/server/recruiter-auth.ts` with the renames specified in the spec, plus banner read/write helpers. Full content:

```ts
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CandidateAccount, CandidateBanner } from "@recai/shared";
import { appRoutes } from "@recai/shared";
import {
  isCandidateDatabaseConfigured,
  query,
  withConnection,
} from "./candidate-database";
import { claimSlugWith } from "./candidate-slug";

const scryptAsync = promisify(scrypt);

const CANDIDATE_SESSION_COOKIE_NAME = "recai_candidate_session";
const CANDIDATE_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const MIN_PASSWORD_LENGTH = 8;

type CandidateSessionRecord = CandidateAccount & {
  sessionExpiresAt: string;
  sessionId: string;
};

type CandidateAccountRow = {
  id: string;
  email: string;
  full_name: string;
  slug: string;
  password_hash: string;
  banner_email: string | null;
  banner_github_url: string | null;
  banner_linkedin_url: string | null;
  banner_website_url: string | null;
};

type CandidateSessionRow = {
  candidate_id: string;
  email: string;
  expires_at: Date;
  full_name: string;
  session_id: string;
  slug: string;
};

type RegisterCandidateInput = {
  email: string;
  fullName: string;
  password: string;
};

class CandidateAuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "CandidateAuthError";
  }
}

let schemaBootstrapPromise: Promise<void> | null = null;

function mapCandidateSession(row: CandidateSessionRow): CandidateSessionRecord {
  return {
    id: row.candidate_id,
    email: row.email,
    fullName: row.full_name,
    slug: row.slug,
    sessionId: row.session_id,
    sessionExpiresAt: row.expires_at.toISOString(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildCandidateSignInUrl(errorCode?: string, noticeCode?: string) {
  const params = new URLSearchParams();

  if (errorCode) {
    params.set("error", errorCode);
  }

  if (noticeCode) {
    params.set("notice", noticeCode);
  }

  const queryString = params.toString();

  return queryString
    ? `${appRoutes.candidateSignIn}?${queryString}`
    : appRoutes.candidateSignIn;
}

function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const derivedKey = (await scryptAsync(
    password,
    salt,
    expectedBuffer.length,
  )) as Buffer;

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, derivedKey);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function findCandidateByEmail(email: string) {
  const result = await query<CandidateAccountRow>(
    `
      SELECT
        id, email, full_name, slug, password_hash,
        banner_email, banner_github_url, banner_linkedin_url, banner_website_url
      FROM candidate_accounts
      WHERE normalized_email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return result.rows[0] ?? null;
}

async function findCandidateById(id: string) {
  const result = await query<CandidateAccountRow>(
    `
      SELECT
        id, email, full_name, slug, password_hash,
        banner_email, banner_github_url, banner_linkedin_url, banner_website_url
      FROM candidate_accounts
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function deleteExpiredSessions() {
  await query(
    `
      DELETE FROM candidate_sessions
      WHERE expires_at <= NOW()
    `,
  );
}

async function createCandidateSession(candidateId: string) {
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CANDIDATE_SESSION_TTL_MS);

  await deleteExpiredSessions();

  await query(
    `
      INSERT INTO candidate_sessions (
        id, candidate_id, session_token_hash, expires_at
      )
      VALUES ($1, $2, $3, $4)
    `,
    [randomUUID(), candidateId, hashSessionToken(sessionToken), expiresAt],
  );

  return { sessionToken, expiresAt };
}

export async function ensureCandidateAuthSchema() {
  if (schemaBootstrapPromise) {
    return schemaBootstrapPromise;
  }

  schemaBootstrapPromise = withConnection(async (client) => {
    await client.query("BEGIN");

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS candidate_accounts (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          normalized_email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          banner_email TEXT,
          banner_github_url TEXT,
          banner_linkedin_url TEXT,
          banner_website_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS candidate_sessions (
          id TEXT PRIMARY KEY,
          candidate_id TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,
          session_token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS candidate_sessions_candidate_id_idx
        ON candidate_sessions (candidate_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS candidate_sessions_expires_at_idx
        ON candidate_sessions (expires_at)
      `);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }).catch((error) => {
    schemaBootstrapPromise = null;
    throw error;
  });

  return schemaBootstrapPromise;
}

export async function signUpCandidate(input: RegisterCandidateInput) {
  if (!isCandidateDatabaseConfigured()) {
    throw new CandidateAuthError("setup-required");
  }

  await ensureCandidateAuthSchema();

  const fullName = cleanText(input.fullName);
  const email = cleanText(input.email);

  if (!fullName || !email || !input.password) {
    throw new CandidateAuthError("missing-fields");
  }

  if (!email.includes("@")) {
    throw new CandidateAuthError("invalid-email");
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new CandidateAuthError("weak-password");
  }

  const passwordHash = await hashPassword(input.password);
  const candidateId = randomUUID();
  const normalizedEmail = normalizeEmail(email);

  await withConnection(async (client) => {
    await claimSlugWith(client, fullName, async (txClient, candidateSlug) => {
      try {
        await txClient.query(
          `
            INSERT INTO candidate_accounts (
              id, email, normalized_email, full_name, slug, password_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            candidateId,
            email,
            normalizedEmail,
            fullName,
            candidateSlug,
            passwordHash,
          ],
        );
        return "ok";
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          const detail =
            "detail" in error && typeof error.detail === "string"
              ? error.detail
              : "";

          if (detail.includes("normalized_email")) {
            throw new CandidateAuthError("email-in-use");
          }

          if (detail.includes("slug")) {
            return "slug-collision";
          }

          throw new CandidateAuthError("email-in-use");
        }

        throw error;
      }
    });
  });

  return createCandidateSession(candidateId);
}

export async function signInCandidate(email: string, password: string) {
  if (!isCandidateDatabaseConfigured()) {
    throw new CandidateAuthError("setup-required");
  }

  await ensureCandidateAuthSchema();

  const cleanEmail = cleanText(email);

  if (!cleanEmail || !password) {
    throw new CandidateAuthError("missing-fields");
  }

  const candidate = await findCandidateByEmail(cleanEmail);

  if (!candidate) {
    throw new CandidateAuthError("invalid-credentials");
  }

  const passwordMatches = await verifyPassword(password, candidate.password_hash);

  if (!passwordMatches) {
    throw new CandidateAuthError("invalid-credentials");
  }

  return createCandidateSession(candidate.id);
}

export async function getCandidateSession() {
  if (!isCandidateDatabaseConfigured()) {
    return null;
  }

  await ensureCandidateAuthSchema();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const result = await query<CandidateSessionRow>(
    `
      SELECT
        candidate_accounts.email,
        candidate_accounts.full_name,
        candidate_accounts.slug,
        candidate_sessions.id AS session_id,
        candidate_sessions.expires_at,
        candidate_sessions.candidate_id
      FROM candidate_sessions
      INNER JOIN candidate_accounts
        ON candidate_accounts.id = candidate_sessions.candidate_id
      WHERE candidate_sessions.session_token_hash = $1
        AND candidate_sessions.expires_at > NOW()
      LIMIT 1
    `,
    [hashSessionToken(sessionToken)],
  );

  const session = result.rows[0];

  if (!session) {
    return null;
  }

  await query(
    `
      UPDATE candidate_sessions
      SET last_seen_at = NOW()
      WHERE id = $1
    `,
    [session.session_id],
  );

  return mapCandidateSession(session);
}

export async function requireCandidateSession() {
  if (!isCandidateDatabaseConfigured()) {
    redirect(buildCandidateSignInUrl("setup-required"));
  }

  const session = await getCandidateSession();

  if (!session) {
    redirect(buildCandidateSignInUrl("auth-required"));
  }

  return session;
}

const EMPTY_BANNER: CandidateBanner = {
  email: null,
  githubUrl: null,
  linkedinUrl: null,
  websiteUrl: null,
};

export async function getCandidateBanner(
  candidateId: string,
): Promise<CandidateBanner> {
  if (!isCandidateDatabaseConfigured()) {
    return EMPTY_BANNER;
  }

  const candidate = await findCandidateById(candidateId);

  if (!candidate) {
    return EMPTY_BANNER;
  }

  return {
    email: candidate.banner_email,
    githubUrl: candidate.banner_github_url,
    linkedinUrl: candidate.banner_linkedin_url,
    websiteUrl: candidate.banner_website_url,
  };
}

type BannerInput = {
  email?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
};

function normalizeBannerLink(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeBannerEmail(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateCandidateBanner(
  candidateId: string,
  input: BannerInput,
) {
  if (!isCandidateDatabaseConfigured()) {
    throw new CandidateAuthError("setup-required");
  }

  await ensureCandidateAuthSchema();

  await query(
    `
      UPDATE candidate_accounts
      SET
        banner_email = $1,
        banner_github_url = $2,
        banner_linkedin_url = $3,
        banner_website_url = $4,
        updated_at = NOW()
      WHERE id = $5
    `,
    [
      normalizeBannerEmail(input.email),
      normalizeBannerLink(input.githubUrl),
      normalizeBannerLink(input.linkedinUrl),
      normalizeBannerLink(input.websiteUrl),
      candidateId,
    ],
  );
}

export async function destroyCandidateSession(sessionToken: string) {
  if (!isCandidateDatabaseConfigured()) {
    return;
  }

  await ensureCandidateAuthSchema();

  await query(
    `
      DELETE FROM candidate_sessions
      WHERE session_token_hash = $1
    `,
    [hashSessionToken(sessionToken)],
  );
}

export {
  buildCandidateSignInUrl,
  CANDIDATE_SESSION_COOKIE_NAME,
  CandidateAuthError,
  getSessionCookieOptions,
  isCandidateDatabaseConfigured,
};
```

- [ ] **Step 4.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 4.3: Commit**

```bash
git add packages/candidate/src/server/candidate-auth.ts
git commit -m "feat(candidate): add Aurora-backed candidate auth module"
```

---

### Task 5: Add `.cover-gradient` and `.avatar-initials` global utilities

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 5.1: Append to `apps/web/src/app/globals.css`**

Add at the end of the file (after the `.accent-ring` rule):

```css
.cover-gradient {
  background: linear-gradient(120deg, rgba(21, 94, 239, 0.85), rgba(15, 118, 110, 0.85));
}

.avatar-initials {
  background: linear-gradient(135deg, #155eef 0%, #0f766e 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 4px solid #ffffff;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
}
```

- [ ] **Step 5.2: Validate**

```bash
npm run lint
npm run build
```

Expected: both succeed. The `build` ensures Tailwind's CSS pipeline picks up the additions cleanly.

- [ ] **Step 5.3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(candidate): add cover-gradient and avatar-initials utilities"
```

---

### Task 6: Add candidate sign-out form component

**Files:**
- Create: `packages/candidate/src/components/candidate-sign-out-form.tsx`

- [ ] **Step 6.1: Create the file**

```tsx
type CandidateSignOutFormProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
};

export function CandidateSignOutForm({
  className,
  label = "Sign out",
  redirectTo = "/candidate/sign-in",
}: CandidateSignOutFormProps) {
  return (
    <form action="/api/candidate/auth/sign-out" method="post">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <button
        className={
          className ??
          "rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
```

- [ ] **Step 6.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 6.3: Commit**

```bash
git add packages/candidate/src/components/candidate-sign-out-form.tsx
git commit -m "feat(candidate): add candidate sign-out form component"
```

---

### Task 7: Add the three auth API routes (sign-up, sign-in, sign-out)

**Files:**
- Create: `apps/web/src/app/api/candidate/auth/sign-up/route.ts`
- Create: `apps/web/src/app/api/candidate/auth/sign-in/route.ts`
- Create: `apps/web/src/app/api/candidate/auth/sign-out/route.ts`

- [ ] **Step 7.1: Create `apps/web/src/app/api/candidate/auth/sign-up/route.ts`**

```ts
import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  CANDIDATE_SESSION_COOKIE_NAME,
  CandidateAuthError,
  buildCandidateSignInUrl,
  getSessionCookieOptions,
  signUpCandidate,
} from "@recai/candidate/server/candidate-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const { expiresAt, sessionToken } = await signUpCandidate({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    const response = redirectWithPath(request, appRoutes.candidateDashboard);
    response.cookies.set(
      CANDIDATE_SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    const errorCode =
      error instanceof CandidateAuthError ? error.code : "server-error";

    return redirectWithPath(request, buildCandidateSignInUrl(errorCode));
  }
}
```

- [ ] **Step 7.2: Create `apps/web/src/app/api/candidate/auth/sign-in/route.ts`**

```ts
import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  CANDIDATE_SESSION_COOKIE_NAME,
  CandidateAuthError,
  buildCandidateSignInUrl,
  getSessionCookieOptions,
  signInCandidate,
} from "@recai/candidate/server/candidate-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const { expiresAt, sessionToken } = await signInCandidate(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
    );

    const response = redirectWithPath(request, appRoutes.candidateDashboard);
    response.cookies.set(
      CANDIDATE_SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    const errorCode =
      error instanceof CandidateAuthError ? error.code : "server-error";

    return redirectWithPath(request, buildCandidateSignInUrl(errorCode));
  }
}
```

- [ ] **Step 7.3: Create `apps/web/src/app/api/candidate/auth/sign-out/route.ts`**

```ts
import { NextResponse } from "next/server";
import {
  CANDIDATE_SESSION_COOKIE_NAME,
  buildCandidateSignInUrl,
  destroyCandidateSession,
  isCandidateDatabaseConfigured,
} from "@recai/candidate/server/candidate-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") ?? buildCandidateSignInUrl());
  const redirectUrl = new URL(redirectTo, request.url);
  const sessionToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CANDIDATE_SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (sessionToken && isCandidateDatabaseConfigured()) {
    await destroyCandidateSession(sessionToken);
  }

  if (
    redirectUrl.pathname === "/candidate/sign-in" &&
    !redirectUrl.searchParams.has("notice")
  ) {
    redirectUrl.searchParams.set("notice", "signed-out");
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(CANDIDATE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
```

- [ ] **Step 7.4: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 7.5: Commit**

```bash
git add apps/web/src/app/api/candidate/auth
git commit -m "feat(candidate): add sign-up, sign-in, sign-out API routes"
```

---

### Task 8: Replace candidate sign-in page with real signup/signin forms

**Files:**
- Modify: `packages/candidate/src/pages/candidate-sign-in-page.tsx`

- [ ] **Step 8.1: Replace the entire file contents**

Mirrors the recruiter sign-in page's two-up `SectionCard` layout, adapted for the candidate field set (no `company` / `title` — just full name, email, password).

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import {
  getCandidateSession,
  isCandidateDatabaseConfigured,
} from "../server/candidate-auth";

type CandidateSignInPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

const errorMessages: Record<string, string> = {
  "auth-required": "Sign in to access the candidate workspace.",
  "email-in-use": "That email already has a candidate account.",
  "invalid-credentials":
    "That email and password combination did not match a candidate account.",
  "invalid-email": "Enter a valid email to create the candidate account.",
  "missing-fields": "Fill out all required candidate account fields to continue.",
  "server-error":
    "Something went wrong while contacting candidate auth. Please try again.",
  "setup-required":
    "Candidate account access is temporarily unavailable. Please try again shortly.",
  "weak-password": "Choose a password with at least 8 characters.",
};

const noticeMessages: Record<string, string> = {
  "signed-out": "You have been signed out of the candidate workspace.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export async function CandidateSignInPage({
  searchParams,
}: CandidateSignInPageProps) {
  if (isCandidateDatabaseConfigured()) {
    const existingSession = await getCandidateSession();

    if (existingSession) {
      redirect(appRoutes.candidateDashboard);
    }
  }

  const resolvedSearchParams = await searchParams;
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;

  return (
    <AppShell
      eyebrow="Candidate Entry"
      title="Build a profile that is backed by people, not just polished copy."
      description="Create an account to manage your profile banner, request verified recommendations, and decide which trusted voices appear on your page."
      actions={
        <Link
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          href={appRoutes.home}
        >
          Back to landing
        </Link>
      }
    >
      <div className="grid gap-4">
        {errorMessage ? (
          <div className="rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div className="rounded-[24px] border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.10)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {noticeMessage}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <SectionCard
          eyebrow="Create Account"
          title="Open candidate signup"
          description="Create a candidate account so you can manage your profile banner and the recommendations that appear on your public profile."
        >
          <form action="/api/candidate/auth/sign-up" className="grid gap-4" method="post">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Full name
              <input
                autoComplete="name"
                className={inputClassName}
                name="fullName"
                placeholder="Maya Chen"
                required
                type="text"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="maya@chen.dev"
                required
                type="email"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Password
              <input
                autoComplete="new-password"
                className={inputClassName}
                minLength={8}
                name="password"
                placeholder="At least 8 characters"
                required
                type="password"
              />
            </label>

            <button
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Create candidate account
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Sign In"
          title="Return to your candidate workspace"
          description="Existing candidates sign in here and return to their workspace."
        >
          <form action="/api/candidate/auth/sign-in" className="grid gap-4" method="post">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="maya@chen.dev"
                required
                type="email"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Password
              <input
                autoComplete="current-password"
                className={inputClassName}
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>

            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
              type="submit"
            >
              Sign in to candidate workspace
            </button>
          </form>

          <div className="mt-5 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Your candidate workspace is where you manage the contact links recruiters see,
              request verified recommendations, and review the recommendations submitted
              about your work.
            </p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 8.2: Validate**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three succeed. The build verifies that the `/candidate/sign-in` route still emits properly through its existing wrapper.

- [ ] **Step 8.3: Commit**

```bash
git add packages/candidate/src/pages/candidate-sign-in-page.tsx
git commit -m "feat(candidate): replace sign-in page with real signup/signin forms"
```

---

### Task 9: Add candidate profile hero component

**Files:**
- Create: `packages/candidate/src/components/candidate-profile-hero.tsx`

- [ ] **Step 9.1: Create the file**

```tsx
import Link from "next/link";
import type { CandidateAccount, CandidateBanner } from "@recai/shared";

type CandidateProfileHeroProps = {
  candidate: CandidateAccount;
  banner: CandidateBanner;
};

function getInitials(fullName: string): string {
  const parts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";

  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

type Pill = {
  key: string;
  filled: boolean;
  emptyLabel: string;
  filledLabel: string;
  href?: string;
};

function buildPills(banner: CandidateBanner): Pill[] {
  return [
    {
      key: "email",
      filled: Boolean(banner.email),
      emptyLabel: "＋ Add email",
      filledLabel: banner.email ?? "",
      href: banner.email ? `mailto:${banner.email}` : undefined,
    },
    {
      key: "github",
      filled: Boolean(banner.githubUrl),
      emptyLabel: "＋ Add GitHub",
      filledLabel: banner.githubUrl ?? "",
      href: banner.githubUrl ?? undefined,
    },
    {
      key: "linkedin",
      filled: Boolean(banner.linkedinUrl),
      emptyLabel: "＋ Add LinkedIn",
      filledLabel: banner.linkedinUrl ?? "",
      href: banner.linkedinUrl ?? undefined,
    },
    {
      key: "website",
      filled: Boolean(banner.websiteUrl),
      emptyLabel: "＋ Add personal website",
      filledLabel: banner.websiteUrl ?? "",
      href: banner.websiteUrl ?? undefined,
    },
  ];
}

export function CandidateProfileHero({
  candidate,
  banner,
}: CandidateProfileHeroProps) {
  const initials = getInitials(candidate.fullName);
  const pills = buildPills(banner);

  return (
    <section className="glass-panel overflow-hidden rounded-[32px] border border-[color:var(--line)]">
      <div className="cover-gradient h-24" />
      <div className="flex flex-col gap-5 px-6 pb-6 pt-0 sm:px-8 sm:pb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-5">
            <div
              aria-hidden="true"
              className="avatar-initials -mt-10 h-20 w-20 rounded-full text-2xl"
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Candidate Workspace
              </p>
              <h1 className="display-face mt-1 text-3xl font-semibold tracking-[-0.025em] text-[var(--foreground)] sm:text-4xl">
                {candidate.fullName}
              </h1>
              <p className="mt-2 text-sm italic leading-6 text-[var(--muted)]">
                Your headline appears once verified recommendations are submitted.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href={`/c/${candidate.slug}`}
            >
              View public profile
            </Link>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {pills.map((pill) =>
            pill.filled && pill.href ? (
              <li key={pill.key}>
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(21,94,239,0.08)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  href={pill.href}
                  rel="noreferrer"
                  target={pill.href.startsWith("mailto:") ? undefined : "_blank"}
                >
                  {pill.filledLabel}
                </a>
              </li>
            ) : (
              <li key={pill.key}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(95,112,134,0.06)] px-3 py-2 text-xs font-semibold italic text-[var(--muted)]">
                  {pill.emptyLabel}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 9.3: Commit**

```bash
git add packages/candidate/src/components/candidate-profile-hero.tsx
git commit -m "feat(candidate): add LinkedIn-style profile hero component"
```

---

### Task 10: Add candidate banner editor component

**Files:**
- Create: `packages/candidate/src/components/candidate-banner-editor.tsx`

- [ ] **Step 10.1: Create the file**

```tsx
import type { CandidateBanner } from "@recai/shared";

type CandidateBannerEditorProps = {
  banner: CandidateBanner;
  status?: "saved" | "error" | null;
};

const inputClassName =
  "mt-1 w-full rounded-[14px] border border-[color:var(--line)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export function CandidateBannerEditor({
  banner,
  status,
}: CandidateBannerEditorProps) {
  return (
    <section className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.06)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          Edit profile banner
        </h3>
        {status === "saved" ? (
          <span className="rounded-full bg-[rgba(15,118,110,0.15)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Saved ✓
          </span>
        ) : null}
        {status === "error" ? (
          <span className="rounded-full bg-[rgba(220,38,38,0.15)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b91c1c]">
            Save failed
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Public-facing contact links. Display-only — never indexed for search.
      </p>

      <form
        action="/api/candidate/profile/banner"
        className="mt-4 grid gap-3"
        method="post"
      >
        <label className="text-xs font-semibold text-[var(--foreground)]">
          Email
          <input
            className={inputClassName}
            defaultValue={banner.email ?? ""}
            name="bannerEmail"
            placeholder="you@example.com"
            type="email"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          GitHub
          <input
            className={inputClassName}
            defaultValue={banner.githubUrl ?? ""}
            name="bannerGithub"
            placeholder="github.com/yourhandle"
            type="text"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          LinkedIn
          <input
            className={inputClassName}
            defaultValue={banner.linkedinUrl ?? ""}
            name="bannerLinkedin"
            placeholder="linkedin.com/in/yourhandle"
            type="text"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          Personal website
          <input
            className={inputClassName}
            defaultValue={banner.websiteUrl ?? ""}
            name="bannerWebsite"
            placeholder="https://yoursite.com"
            type="text"
          />
        </label>

        <button
          className="mt-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
          type="submit"
        >
          Save banner
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 10.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 10.3: Commit**

```bash
git add packages/candidate/src/components/candidate-banner-editor.tsx
git commit -m "feat(candidate): add right-rail banner editor component"
```

---

### Task 11: Add banner update API route

**Files:**
- Create: `apps/web/src/app/api/candidate/profile/banner/route.ts`

- [ ] **Step 11.1: Create the file**

```ts
import { NextResponse } from "next/server";
import {
  CandidateAuthError,
  requireCandidateSession,
  updateCandidateBanner,
} from "@recai/candidate/server/candidate-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const session = await requireCandidateSession();
  const formData = await request.formData();

  try {
    await updateCandidateBanner(session.id, {
      email: String(formData.get("bannerEmail") ?? ""),
      githubUrl: String(formData.get("bannerGithub") ?? ""),
      linkedinUrl: String(formData.get("bannerLinkedin") ?? ""),
      websiteUrl: String(formData.get("bannerWebsite") ?? ""),
    });

    return redirectWithPath(request, "/candidate/dashboard?notice=banner-saved");
  } catch (error) {
    const errorCode =
      error instanceof CandidateAuthError ? error.code : "banner-save-failed";

    return redirectWithPath(
      request,
      `/candidate/dashboard?error=${encodeURIComponent(errorCode)}`,
    );
  }
}
```

- [ ] **Step 11.2: Validate**

```bash
npm run typecheck
npm run lint
```

Expected: both succeed.

- [ ] **Step 11.3: Commit**

```bash
git add apps/web/src/app/api/candidate/profile/banner/route.ts
git commit -m "feat(candidate): add banner update API route"
```

---

### Task 12: Replace candidate dashboard with the LinkedIn-style layout

**Files:**
- Modify: `packages/candidate/src/pages/candidate-dashboard-page.tsx`

- [ ] **Step 12.1: Replace the entire file**

The dashboard skips `AppShell` (per spec UX Notes) and renders its own thin top bar plus the hero, left-column empty-state cards, and the right-rail action panel. Reads `?notice=` and `?error=` to drive the banner editor's status pill.

```tsx
import Link from "next/link";
import { CandidateBannerEditor } from "../components/candidate-banner-editor";
import { CandidateProfileHero } from "../components/candidate-profile-hero";
import { CandidateSignOutForm } from "../components/candidate-sign-out-form";
import {
  getCandidateBanner,
  requireCandidateSession,
} from "../server/candidate-auth";

type CandidateDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function bannerStatusFromParams(
  noticeCode: string | undefined,
  errorCode: string | undefined,
): "saved" | "error" | null {
  if (noticeCode === "banner-saved") return "saved";
  if (errorCode === "banner-save-failed") return "error";
  return null;
}

export async function CandidateDashboardPage({
  searchParams,
}: CandidateDashboardPageProps) {
  const session = await requireCandidateSession();
  const banner = await getCandidateBanner(session.id);

  const resolvedSearchParams = await searchParams;
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const bannerStatus = bannerStatusFromParams(noticeCode, errorCode);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-35" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-12">
        <header className="glass-panel flex items-center justify-between rounded-full border border-[color:var(--line)] px-5 py-3">
          <Link
            className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
            href="/"
          >
            RecAI
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.22em] text-[var(--muted)] sm:block">
            Candidate Workspace
          </p>
        </header>

        <CandidateProfileHero candidate={session} banner={banner} />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="grid gap-6">
            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Experience
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Roles built from verified recommendations
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Each verified recommendation creates an experience row tied to the role
                you held at that time.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No recommendations submitted yet — your experience timeline will
                  appear here.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                  href="/candidate/recommendations/new"
                >
                  Request a recommendation
                </Link>
              </div>
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recommendations
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Verified voices about your work
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                All submitted recommendations appear here, with the same view recruiters
                and viewers see.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No recommendations submitted about you yet.
                </p>
              </div>
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recruiter Groups
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Job pools you have joined
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                You join a recruiter group by clicking the RecAI link inside their
                external job posting.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  You haven&apos;t joined any recruiter groups yet.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  href="/candidate/groups"
                >
                  Open groups manager
                </Link>
              </div>
            </section>
          </div>

          <aside className="grid gap-4">
            <CandidateBannerEditor banner={banner} status={bannerStatus} />

            <section className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(234,88,12,0.08)] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Request a recommendation
                </h3>
                <span className="rounded-full bg-[rgba(234,88,12,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
                  Coming next
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Enter a recommender&apos;s email and the role you want them to comment on.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                href="/candidate/recommendations/new"
              >
                Start a request
              </Link>
            </section>

            <section className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Recruiter groups
                </h3>
                <span className="rounded-full bg-[rgba(95,112,134,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Coming next
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Manage every recruiter group you&apos;ve joined.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                href="/candidate/groups"
              >
                Manage groups
              </Link>
            </section>

            <section className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-5">
              <h3 className="text-base font-semibold text-[var(--foreground)]">Account</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Sign out of the candidate workspace.
              </p>
              <div className="mt-4">
                <CandidateSignOutForm
                  className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 12.2: Validate**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three succeed.

- [ ] **Step 12.3: Commit**

```bash
git add packages/candidate/src/pages/candidate-dashboard-page.tsx
git commit -m "feat(candidate): rebuild dashboard as LinkedIn-style profile workspace"
```

---

### Task 13: Add stub routes for upcoming slices

**Files:**
- Create: `apps/web/src/app/(platform)/candidate/recommendations/new/page.tsx`
- Create: `apps/web/src/app/(platform)/candidate/groups/page.tsx`

These exist purely so the dashboard CTAs from Task 12 navigate somewhere instead of 404'ing. Both are server components rendering a small placeholder with a "Back to dashboard" link.

- [ ] **Step 13.1: Create `apps/web/src/app/(platform)/candidate/recommendations/new/page.tsx`**

```tsx
import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "@recai/candidate/server/candidate-auth";

export default async function CandidateRequestRecommendationStubPage() {
  await requireCandidateSession();

  return (
    <AppShell
      eyebrow="Request a Recommendation"
      title="Recommendation request flow is on the way."
      description="This is where you'll send a structured request to a coworker, manager, or peer."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate dashboard", href: appRoutes.candidateDashboard },
        { label: "Request a recommendation" },
      ]}
      actions={
        <Link
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href={appRoutes.candidateDashboard}
        >
          Back to dashboard
        </Link>
      }
    >
      <SectionCard
        eyebrow="Coming Next"
        title="The recommendation request flow ships in a follow-up slice."
        description="It will let you enter a recommender's email, specify the role you want them to comment on, and send a verification email — see PRD §2.2."
      >
        <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
          For now, head back to your dashboard and edit your profile banner. Once
          recommenders start submitting, your experience and recommendations sections
          on the dashboard will populate automatically.
        </div>
      </SectionCard>
    </AppShell>
  );
}
```

- [ ] **Step 13.2: Create `apps/web/src/app/(platform)/candidate/groups/page.tsx`**

```tsx
import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "@recai/candidate/server/candidate-auth";

export default async function CandidateGroupsStubPage() {
  await requireCandidateSession();

  return (
    <AppShell
      eyebrow="Recruiter Groups"
      title="Group management is on the way."
      description="This is where you'll review and leave the recruiter groups you've joined."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate dashboard", href: appRoutes.candidateDashboard },
        { label: "Recruiter groups" },
      ]}
      actions={
        <Link
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href={appRoutes.candidateDashboard}
        >
          Back to dashboard
        </Link>
      }
    >
      <SectionCard
        eyebrow="Coming Next"
        title="Group management ships in a follow-up slice."
        description="It will list every recruiter group you've joined via an external job posting link, and let you leave any of them at any time — see PRD §2.3."
      >
        <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
          You join a recruiter group by clicking the RecAI link inside a recruiter's
          external job posting. Until that flow ships, this page is just a stub so the
          dashboard's "Manage groups" link goes somewhere meaningful.
        </div>
      </SectionCard>
    </AppShell>
  );
}
```

- [ ] **Step 13.3: Validate**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three succeed. The build emits the two new dynamic-segment-free routes.

- [ ] **Step 13.4: Commit**

```bash
git add apps/web/src/app/\(platform\)/candidate/recommendations apps/web/src/app/\(platform\)/candidate/groups
git commit -m "feat(candidate): add stub pages for /candidate/recommendations/new and /candidate/groups"
```

---

### Task 14: Update product, architecture, and onboarding docs

**Files:**
- Modify: `docs/architecture/current-state.md`
- Modify: `docs/product/candidate-workspace.md`
- Modify: `docs/agent-onboarding.md`

- [ ] **Step 14.1: Update `docs/architecture/current-state.md`**

In the "What Is Implemented" section, append these bullets:

```markdown
- The candidate flow now also includes a real app-managed auth path backed by Aurora PostgreSQL conventions:
  - candidate sign-up form
  - candidate sign-in form
  - candidate sign-out route
  - protected candidate dashboard with a LinkedIn-style profile workspace
  - inline banner editor (email, GitHub, LinkedIn, personal website)
  - Aurora-backed candidate account and session table bootstrap logic
```

In the "Ownership Snapshot" → "Candidate lane" section, replace the existing list with:

```markdown
- Candidate lane:
  - candidate sign-in (real signup/signin forms)
  - candidate workspace dashboard (LinkedIn-style, session-gated)
  - candidate banner editor wired to Aurora
  - candidate auth backend and protected sessions
  - public candidate profile (still mock-backed pending slice B)
  - recommender request flow shell
```

In the "Immediate Next Build Priority" section, replace the recruiter-only list with this combined ordering:

```markdown
The next valuable implementation slices are:

1. finish the live AWS Aurora integration hookup (still gates both lanes)
2. recruiter job posting creation flow
3. structured filters and search-pentagon UI
4. candidate public profile rebuild against Aurora (slice B of candidate flow)
5. candidate recommendation request flow (slice C of candidate flow)
6. candidate groups management (slice D of candidate flow)
7. natural-language search shell backed later by OpenSearch
```

- [ ] **Step 14.2: Update `docs/product/candidate-workspace.md`**

Under "Accounts", replace the bullet list with:

```markdown
- Candidates sign in with their own accounts via email and password.
- The candidate workspace dashboard is a LinkedIn-style profile view that hosts profile banner editing, recommendation request initiation, group membership, and view-own-recommendations.
- The candidate account owns profile editing, job-posting opt-ins, and recommendation request management.
```

Under "Profile", append:

```markdown
- The persistent profile banner (email, GitHub, LinkedIn, personal website) is candidate-entered and display-only. It is never indexed for search.
```

Under "Open Questions", append:

```markdown
- Whether candidate auth will eventually add OAuth (Google / LinkedIn) and email verification at signup, mirroring the PRD's three-option auth list.
- The full final set of supported banner contact-link types (email, GitHub, LinkedIn, personal website are confirmed; portfolio, X, Google Scholar, etc. TBD).
```

- [ ] **Step 14.3: Update `docs/agent-onboarding.md`**

Under "What Exists Right Now", replace the existing list with:

```markdown
The repo already has:

- landing page
- candidate sign-in with real account creation/login routes
- candidate workspace dashboard (LinkedIn-style) protected by candidate session
- candidate banner editor wired to Aurora
- recruiter sign-in with real account creation/login routes
- recruiter dashboard protected by recruiter session
- recruiter job posting route protected by recruiter session
- recruiter-owned candidate review route
- public candidate profile (still mock-backed pending candidate slice B)
- recommender request experience
- lane package split
- product, architecture, and spec documentation
```

Under "Immediate Priority", replace the list with:

```markdown
The next most valuable implementation lanes are split between recruiter and candidate.

Recommended order:

1. Finish the live AWS Aurora hookup in Vercel (gates both lanes)
2. Recruiter job posting creation flow
3. Structured recruiter filters
4. Search pentagon UI
5. Candidate public profile rebuild against Aurora (candidate slice B)
6. Candidate recommendation request flow (candidate slice C)
7. Candidate groups management and group join handler (candidate slice D)
8. Natural-language search shell
```

- [ ] **Step 14.4: Validate**

```bash
npm run lint
```

Expected: succeeds (docs aren't linted by the configured ESLint, but running it confirms no incidental code changes).

- [ ] **Step 14.5: Commit**

```bash
git add docs/architecture/current-state.md docs/product/candidate-workspace.md docs/agent-onboarding.md
git commit -m "docs(candidate): reflect slice A (auth + banner) shipped state"
```

---

### Task 15: Final validation pass

This is the manual smoke described in spec §Validation. No code changes here; just running through the checks and recording any deltas. Execute every check; if any fail, open a follow-up commit on this branch instead of amending.

- [ ] **Step 15.1: Run the automated triple**

```bash
npm run lint
npm run typecheck
npm run build
```

Expected: all three succeed clean.

- [ ] **Step 15.2: Manual checks — Aurora not attached**

Start the dev server in another terminal:

```bash
npm run dev
```

Then in a browser:

- Visit `http://localhost:3000/candidate/sign-in` — both `SectionCard`s render, no console errors.
- Submit the create-account form with valid-looking values — page redirects back with `?error=setup-required` and the red banner displays the matching copy.
- Visit `http://localhost:3000/candidate/dashboard` — page redirects to `/candidate/sign-in?error=setup-required`.
- Visit `http://localhost:3000/recruiter/dashboard` — still redirects to recruiter sign-in (regression check).
- Visit `http://localhost:3000/c/maya-chen` — still renders the existing mock public profile (regression check).

- [ ] **Step 15.3: Manual checks — Aurora attached locally**

Only run if `vercel env pull` has been completed against an attached Aurora integration. From the repo root:

```bash
vercel env pull
npm run dev
```

Then in a browser:

- `/candidate/sign-in` → create account with `Maya Test`, `maya.test@example.com`, password `correcthorse`. Should redirect to `/candidate/dashboard`.
- Hero shows "MT" initials + "Maya Test" + 4 empty contact pills.
- Right-rail editor: enter all 4 fields (`maya.test@example.com`, `github.com/mtest`, `linkedin.com/in/mtest`, `mtest.dev`), click Save. Page refreshes with `?notice=banner-saved`, "Saved ✓" pill renders, and the hero pills now show the saved values (with `https://` prepended to non-email URLs).
- Click Sign out — lands on `/candidate/sign-in?notice=signed-out`, confirmation banner displays.
- Sign back in with `maya.test@example.com` / `correcthorse` — back at the dashboard with banner still populated.
- Try to sign up again with the same email → `?error=email-in-use`.
- Try sign-in with wrong password → `?error=invalid-credentials`.
- Sign up a second account with the same name "Maya Test" but a different email (e.g., `maya.test2@example.com`). Then run `psql` (or any Aurora client) and verify:

  ```sql
  SELECT slug FROM candidate_accounts ORDER BY created_at DESC LIMIT 2;
  ```

  Expected: `maya-test-2` and `maya-test`.
- Empty banner submission (clear all 4 fields, save) → all DB columns set to NULL, dashboard pills go back to the empty-state look, no error.
- Submit just `github.com/x` in the GitHub field → DB stores `https://github.com/x`. `bannerEmail` of `me@example.com` remains as raw `me@example.com`.

- [ ] **Step 15.4: Cross-lane regression**

- `/recruiter/dashboard` works as before, recruiter cookie unaffected (open in a separate browser profile or after signing out of candidate).
- `/c/maya-chen` still renders the mock candidate public profile.
- `/recruiter/jobs/senior-platform-engineer/candidates/maya-chen` still works.

- [ ] **Step 15.5: If any check failed, follow up**

If a check fails, do **not** amend prior task commits. Land a follow-up commit on this branch named `fix(candidate): <description>` and re-run the failing check. The branch can then be opened as a PR with the full slice-A history intact.

- [ ] **Step 15.6: No commit needed** — this task is just validation.

---

## Self-Review Notes

Before opening the PR, run through this checklist (it has already been pre-applied by the planner — keep it for the implementer's reference):

1. **Spec coverage:** Every numbered routes/components/data-contract entry in spec §Surfaces Touched maps to a task above:
   - `CandidateAccount` / `CandidateBanner` types → Task 1.
   - `candidate-database.ts` → Task 2.
   - `candidate-slug.ts` → Task 3.
   - `candidate-auth.ts` (incl. `updateCandidateBanner`, `getCandidateBanner`, `CANDIDATE_SESSION_COOKIE_NAME`, `CandidateAuthError`) → Task 4.
   - `globals.css` additions → Task 5.
   - `candidate-sign-out-form.tsx` → Task 6.
   - Auth API routes → Task 7.
   - `candidate-sign-in-page.tsx` → Task 8.
   - `candidate-profile-hero.tsx` → Task 9.
   - `candidate-banner-editor.tsx` → Task 10.
   - Banner API route → Task 11.
   - `candidate-dashboard-page.tsx` → Task 12.
   - Stub routes → Task 13.
   - Doc updates → Task 14.
   - Spec §Validation manual smoke → Task 15.

2. **`packages/candidate/src/index.ts` is intentionally not modified.** The existing exports (`CandidateSignInPage`, `CandidateDashboardPage`, `CandidateProfilePage`, `RecommendationRequestPage`) already cover the wrappers in `apps/web`. New components (`CandidateProfileHero`, `CandidateBannerEditor`, `CandidateSignOutForm`) are imported only inside the package, so they don't need to be re-exported. The recruiter package follows the same pattern (`recruiter-sign-out-form` is not in `packages/recruiter/src/index.ts`).

3. **Type and name consistency** across tasks:
   - `CandidateAuthError` (Task 4) is imported by Tasks 7 and 11.
   - `CANDIDATE_SESSION_COOKIE_NAME` (Task 4) is imported by Task 7.
   - `requireCandidateSession` (Task 4) is imported by Tasks 11, 12, 13.
   - `getCandidateBanner` (Task 4) is imported by Task 12.
   - `updateCandidateBanner` (Task 4) is imported by Task 11.
   - `CandidateAccount` and `CandidateBanner` (Task 1) are imported by Tasks 4, 9, 10, 12.

4. **Independence verified.** Recruiter pool, recruiter cookie, recruiter session table, and recruiter pages are not touched by any task here. The two lanes can coexist on the same domain (different cookie names) and both auth flows can fail-open with `setup-required` cleanly when Aurora is not attached.

5. **No placeholders.** Every code-bearing step contains the full file or full edit. Where the recruiter file is mirrored, the actual content is reproduced rather than referenced.
