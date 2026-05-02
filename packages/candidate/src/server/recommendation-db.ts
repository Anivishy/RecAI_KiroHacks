import { randomBytes, randomUUID } from "node:crypto";
import { query, withConnection } from "@recai/recruiter/server/recruiter-database";

export type RecommendationStatus = "pending" | "draft" | "submitted" | "deleted";

export type RecommendationProject = {
  id: string;
  title: string;
  description: string;
  skills: string[];
};

export type RecommendationRequest = {
  id: string;
  token: string;
  candidateName: string;
  candidateContext: string;
  recommenderName: string;
  recommenderEmail: string;
  recommenderTitle: string;
  recommenderCompany: string;
  relationship: string;
  expiresAt: string;
  status: RecommendationStatus;
  technicalResponse: string;
  behavioralResponse: string;
  projects: RecommendationProject[];
  submittedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

type RecommendationRow = {
  id: string;
  token: string;
  candidate_name: string;
  candidate_context: string;
  recommender_name: string;
  recommender_email: string;
  recommender_title: string;
  recommender_company: string;
  relationship: string;
  expires_at: Date;
  status: RecommendationStatus;
  technical_response: string;
  behavioral_response: string;
  projects: RecommendationProject[];
  submitted_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
};

function mapRow(row: RecommendationRow): RecommendationRequest {
  return {
    id: row.id,
    token: row.token,
    candidateName: row.candidate_name,
    candidateContext: row.candidate_context,
    recommenderName: row.recommender_name,
    recommenderEmail: row.recommender_email,
    recommenderTitle: row.recommender_title,
    recommenderCompany: row.recommender_company,
    relationship: row.relationship,
    expiresAt: row.expires_at.toISOString(),
    status: row.status,
    technicalResponse: row.technical_response,
    behavioralResponse: row.behavioral_response,
    projects: row.projects ?? [],
    submittedAt: row.submitted_at?.toISOString() ?? null,
    deletedAt: row.deleted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

let schemaPromise: Promise<void> | null = null;

export async function ensureRecommendationSchema() {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await withConnection(async (client) => {
      await client.query("BEGIN");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS recommendation_requests (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            candidate_name TEXT NOT NULL,
            candidate_context TEXT NOT NULL DEFAULT '',
            recommender_name TEXT NOT NULL DEFAULT '',
            recommender_email TEXT NOT NULL DEFAULT '',
            recommender_title TEXT NOT NULL DEFAULT '',
            recommender_company TEXT NOT NULL DEFAULT '',
            relationship TEXT NOT NULL DEFAULT '',
            expires_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            technical_response TEXT NOT NULL DEFAULT '',
            behavioral_response TEXT NOT NULL DEFAULT '',
            projects JSONB NOT NULL DEFAULT '[]',
            submitted_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS recommendation_requests_token_idx
          ON recommendation_requests (token)
        `);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    });
  })().catch((err) => {
    schemaPromise = null;
    throw err;
  });

  return schemaPromise;
}

export async function createRecommendationRequest(data: {
  candidateName: string;
  candidateContext?: string;
  recommenderName?: string;
  recommenderEmail?: string;
  recommenderTitle?: string;
  recommenderCompany?: string;
  relationship?: string;
}): Promise<RecommendationRequest> {
  await ensureRecommendationSchema();

  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = await query<RecommendationRow>(
    `INSERT INTO recommendation_requests (
        id, token, candidate_name, candidate_context,
        recommender_name, recommender_email, recommender_title,
        recommender_company, relationship, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
    [
      id, token,
      data.candidateName,
      data.candidateContext ?? "",
      data.recommenderName ?? "",
      data.recommenderEmail ?? "",
      data.recommenderTitle ?? "",
      data.recommenderCompany ?? "",
      data.relationship ?? "",
      expiresAt,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function getRecommendationByToken(
  token: string,
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `SELECT * FROM recommendation_requests WHERE token = $1 LIMIT 1`,
    [token],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function saveRecommendationDraft(
  token: string,
  data: {
    technicalResponse: string;
    behavioralResponse: string;
    projects: RecommendationProject[];
  },
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `UPDATE recommendation_requests
      SET
        technical_response = $2,
        behavioral_response = $3,
        projects = $4::jsonb,
        status = CASE WHEN status = 'pending' THEN 'draft' ELSE status END,
        updated_at = NOW()
      WHERE token = $1 AND status IN ('pending', 'draft')
      RETURNING *`,
    [token, data.technicalResponse, data.behavioralResponse, JSON.stringify(data.projects)],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function submitRecommendation(
  token: string,
  data: {
    technicalResponse: string;
    behavioralResponse: string;
    projects: RecommendationProject[];
  },
): Promise<RecommendationRequest | null> {
  await ensureRecommendationSchema();
  const result = await query<RecommendationRow>(
    `UPDATE recommendation_requests
      SET
        technical_response = $2,
        behavioral_response = $3,
        projects = $4::jsonb,
        status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()
      WHERE token = $1 AND status IN ('pending', 'draft') AND expires_at > NOW()
      RETURNING *`,
    [token, data.technicalResponse, data.behavioralResponse, JSON.stringify(data.projects)],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteRecommendation(token: string): Promise<boolean> {
  await ensureRecommendationSchema();
  const result = await query(
    `UPDATE recommendation_requests
      SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
      WHERE token = $1 AND status = 'submitted'`,
    [token],
  );
  return (result.rowCount ?? 0) > 0;
}
