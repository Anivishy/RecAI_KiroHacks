import { generateCandidateAISummary } from "@recai/shared/server/bedrock-client";
import type { CandidateProfile, RecommendationSnippet } from "@recai/shared";
import { isCandidateDatabaseConfigured, query } from "./candidate-database";

let schemaPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (!isCandidateDatabaseConfigured()) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = query(`
    CREATE TABLE IF NOT EXISTS candidate_profile_summary (
      candidate_id  TEXT PRIMARY KEY,
      generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      paragraphs    JSONB NOT NULL,
      model         TEXT NOT NULL,
      rec_count     INTEGER NOT NULL
    )
  `).then(() => {});
  return schemaPromise;
}

type SummaryRow = {
  generated_at: Date;
  paragraphs: unknown;
  model: string;
  rec_count: number;
};

export type CandidateProfileSummary = {
  paragraphs: string[];
  model: string;
  generatedAt: Date;
};

export async function getOrGenerateProfileSummary(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): Promise<CandidateProfileSummary | null> {
  const liveCount = recommendations.length;
  if (liveCount === 0) return null;

  if (!isCandidateDatabaseConfigured()) return null;

  await ensureSchema();

  const cached = await query<SummaryRow>(
    `SELECT generated_at, paragraphs, model, rec_count FROM candidate_profile_summary WHERE candidate_id = $1`,
    [candidate.slug],
  );
  const row = cached.rows[0];
  if (row && row.rec_count === liveCount) {
    return {
      paragraphs: row.paragraphs as string[],
      model: row.model,
      generatedAt: row.generated_at,
    };
  }

  try {
    const fresh = await generateCandidateAISummary(candidate, recommendations);
    await query(
      `INSERT INTO candidate_profile_summary (candidate_id, generated_at, paragraphs, model, rec_count)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (candidate_id) DO UPDATE
         SET generated_at = EXCLUDED.generated_at,
             paragraphs   = EXCLUDED.paragraphs,
             model        = EXCLUDED.model,
             rec_count    = EXCLUDED.rec_count`,
      [
        candidate.slug,
        fresh.generatedAt,
        JSON.stringify(fresh.paragraphs),
        fresh.model,
        liveCount,
      ],
    );
    return { paragraphs: fresh.paragraphs, model: fresh.model, generatedAt: fresh.generatedAt };
  } catch (err) {
    console.warn("[candidate-summary] bedrock unreachable", err);
    return null;
  }
}
