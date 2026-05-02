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
