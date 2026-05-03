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

export async function verifyOtp(
  requestId: string,
  submittedCode: string,
): Promise<VerifyOtpOutcome> {
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

export const RECOMMENDER_OTP_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const RECOMMENDER_OTP_TTL_MS = OTP_TTL_MS;
