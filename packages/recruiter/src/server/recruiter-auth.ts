import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RecruiterAccount } from "@recai/shared";
import { appRoutes } from "@recai/shared";
import { isRecruiterDatabaseConfigured, query, withConnection } from "./recruiter-database";

const scryptAsync = promisify(scrypt);

const RECRUITER_SESSION_COOKIE_NAME = "recai_recruiter_session";
const RECRUITER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const MIN_PASSWORD_LENGTH = 8;

type RecruiterSessionRecord = RecruiterAccount & {
  sessionExpiresAt: string;
  sessionId: string;
};

type RecruiterAccountRow = {
  company: string;
  email: string;
  full_name: string;
  id: string;
  password_hash: string;
  title: string;
};

type RecruiterSessionRow = {
  company: string;
  email: string;
  expires_at: Date;
  full_name: string;
  recruiter_id: string;
  session_id: string;
  title: string;
};

type RegisterRecruiterInput = {
  company: string;
  email: string;
  fullName: string;
  password: string;
  title: string;
};

class RecruiterAuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RecruiterAuthError";
  }
}

let schemaBootstrapPromise: Promise<void> | null = null;

function mapRecruiterAccount(row: RecruiterAccountRow): RecruiterAccount {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    title: row.title,
    company: row.company,
  };
}

function mapRecruiterSession(row: RecruiterSessionRow): RecruiterSessionRecord {
  return {
    id: row.recruiter_id,
    email: row.email,
    fullName: row.full_name,
    title: row.title,
    company: row.company,
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

function buildRecruiterSignInUrl(errorCode?: string, noticeCode?: string) {
  const params = new URLSearchParams();

  if (errorCode) {
    params.set("error", errorCode);
  }

  if (noticeCode) {
    params.set("notice", noticeCode);
  }

  const queryString = params.toString();

  return queryString
    ? `${appRoutes.recruiterSignIn}?${queryString}`
    : appRoutes.recruiterSignIn;
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
  const derivedKey = (await scryptAsync(password, salt, expectedBuffer.length)) as Buffer;

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, derivedKey);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function findRecruiterByEmail(email: string) {
  const result = await query<RecruiterAccountRow>(
    `
      SELECT id, email, full_name, title, company, password_hash
      FROM recruiter_accounts
      WHERE normalized_email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return result.rows[0] ?? null;
}

async function deleteExpiredSessions() {
  await query(
    `
      DELETE FROM recruiter_sessions
      WHERE expires_at <= NOW()
    `,
  );
}

async function createRecruiterSession(recruiterId: string) {
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RECRUITER_SESSION_TTL_MS);

  await deleteExpiredSessions();

  await query(
    `
      INSERT INTO recruiter_sessions (
        id,
        recruiter_id,
        session_token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
    `,
    [randomUUID(), recruiterId, hashSessionToken(sessionToken), expiresAt],
  );

  return {
    sessionToken,
    expiresAt,
  };
}

async function registerRecruiter(input: RegisterRecruiterInput) {
  const normalizedEmail = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const recruiterId = randomUUID();

  try {
    const result = await query<RecruiterAccountRow>(
      `
        INSERT INTO recruiter_accounts (
          id,
          email,
          normalized_email,
          full_name,
          title,
          company,
          password_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, full_name, title, company, password_hash
      `,
      [
        recruiterId,
        input.email,
        normalizedEmail,
        input.fullName,
        input.title,
        input.company,
        passwordHash,
      ],
    );

    return mapRecruiterAccount(result.rows[0]);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new RecruiterAuthError("email-in-use");
    }

    throw error;
  }
}

export async function ensureRecruiterAuthSchema() {
  if (schemaBootstrapPromise) {
    return schemaBootstrapPromise;
  }

  schemaBootstrapPromise = withConnection(async (client) => {
    await client.query("BEGIN");

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS recruiter_accounts (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          normalized_email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS recruiter_sessions (
          id TEXT PRIMARY KEY,
          recruiter_id TEXT NOT NULL REFERENCES recruiter_accounts(id) ON DELETE CASCADE,
          session_token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS recruiter_sessions_recruiter_id_idx
        ON recruiter_sessions (recruiter_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS recruiter_sessions_expires_at_idx
        ON recruiter_sessions (expires_at)
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

export async function signUpRecruiter(input: RegisterRecruiterInput) {
  if (!isRecruiterDatabaseConfigured()) {
    throw new RecruiterAuthError("setup-required");
  }

  await ensureRecruiterAuthSchema();

  const fullName = cleanText(input.fullName);
  const company = cleanText(input.company);
  const title = cleanText(input.title);
  const email = cleanText(input.email);

  if (!fullName || !company || !title || !email || !input.password) {
    throw new RecruiterAuthError("missing-fields");
  }

  if (!email.includes("@")) {
    throw new RecruiterAuthError("invalid-email");
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new RecruiterAuthError("weak-password");
  }

  const recruiter = await registerRecruiter({
    fullName,
    company,
    title,
    email,
    password: input.password,
  });

  return createRecruiterSession(recruiter.id);
}

export async function signInRecruiter(email: string, password: string) {
  if (!isRecruiterDatabaseConfigured()) {
    throw new RecruiterAuthError("setup-required");
  }

  await ensureRecruiterAuthSchema();

  const cleanEmail = cleanText(email);

  if (!cleanEmail || !password) {
    throw new RecruiterAuthError("missing-fields");
  }

  const recruiter = await findRecruiterByEmail(cleanEmail);

  if (!recruiter) {
    throw new RecruiterAuthError("invalid-credentials");
  }

  const passwordMatches = await verifyPassword(password, recruiter.password_hash);

  if (!passwordMatches) {
    throw new RecruiterAuthError("invalid-credentials");
  }

  return createRecruiterSession(recruiter.id);
}

export async function getRecruiterSession() {
  if (!isRecruiterDatabaseConfigured()) {
    return null;
  }

  await ensureRecruiterAuthSchema();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(RECRUITER_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const result = await query<RecruiterSessionRow>(
    `
      SELECT
        recruiter_accounts.email,
        recruiter_accounts.full_name,
        recruiter_accounts.title,
        recruiter_accounts.company,
        recruiter_sessions.id AS session_id,
        recruiter_sessions.expires_at,
        recruiter_sessions.recruiter_id
      FROM recruiter_sessions
      INNER JOIN recruiter_accounts
        ON recruiter_accounts.id = recruiter_sessions.recruiter_id
      WHERE recruiter_sessions.session_token_hash = $1
        AND recruiter_sessions.expires_at > NOW()
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
      UPDATE recruiter_sessions
      SET last_seen_at = NOW()
      WHERE id = $1
    `,
    [session.session_id],
  );

  return mapRecruiterSession(session);
}

export async function requireRecruiterSession() {
  if (!isRecruiterDatabaseConfigured()) {
    redirect(buildRecruiterSignInUrl("setup-required"));
  }

  const session = await getRecruiterSession();

  if (!session) {
    redirect(buildRecruiterSignInUrl("auth-required"));
  }

  return session;
}

export async function destroyRecruiterSession(sessionToken: string) {
  if (!isRecruiterDatabaseConfigured()) {
    return;
  }

  await ensureRecruiterAuthSchema();

  await query(
    `
      DELETE FROM recruiter_sessions
      WHERE session_token_hash = $1
    `,
    [hashSessionToken(sessionToken)],
  );
}

export {
  buildRecruiterSignInUrl,
  getSessionCookieOptions,
  isRecruiterDatabaseConfigured,
  RECRUITER_SESSION_COOKIE_NAME,
  RecruiterAuthError,
};
