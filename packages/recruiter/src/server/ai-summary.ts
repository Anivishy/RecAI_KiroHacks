import {
  generateCandidateAISummary,
  type CandidateAISummary,
} from "@recai/shared/server/bedrock-client";
import type { CandidateProfile, RecommendationSnippet } from "@recai/shared";
import {
  isRecruiterDatabaseConfigured,
  query,
} from "./recruiter-database";

let schemaPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (!isRecruiterDatabaseConfigured()) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = query(`
    CREATE TABLE IF NOT EXISTS candidate_ai_summary (
      candidate_id  TEXT PRIMARY KEY,
      generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      paragraphs    JSONB NOT NULL,
      model         TEXT NOT NULL,
      rec_count     INTEGER NOT NULL
    )
  `).then(() => {});
  return schemaPromise;
}

export type AISummaryResult = CandidateAISummary & { recCount: number };

function buildLocalFallback(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): CandidateAISummary {
  const topRec = recommendations[0];
  const topProject = candidate.projects[0];
  const para1 = topRec
    ? `${candidate.fullName} arrives with verified recommendation evidence anchored by ${topRec.recommenderName} (${topRec.recommenderTitle}, ${topRec.company}). The throughline across submitted recommendations is consistent ownership of ambiguous work and dependable delivery.`
    : `${candidate.fullName} has joined this posting, but no recommendation evidence has been submitted yet. Treat the recruiter view as a placeholder until at least one recommender completes the verification flow.`;
  const para2 = topProject
    ? `On the project side, ${topProject.title} stands out — ${topProject.summary}. Recommendation language reinforces the impact framing rather than relying on candidate self-description.`
    : `No verified projects are surfaced yet. Once recommenders attach project entries, those will replace this paragraph automatically.`;
  return {
    paragraphs: [para1, para2],
    model: "local-fallback",
    generatedAt: new Date(),
  };
}

type SummaryRow = {
  generated_at: Date;
  paragraphs: unknown;
  model: string;
  rec_count: number;
};

export async function getOrGenerateAISummary(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): Promise<AISummaryResult> {
  const liveCount = recommendations.length;

  if (!isRecruiterDatabaseConfigured()) {
    return { ...buildLocalFallback(candidate, recommendations), recCount: liveCount };
  }

  await ensureSchema();

  const cached = await query<SummaryRow>(
    `SELECT generated_at, paragraphs, model, rec_count FROM candidate_ai_summary WHERE candidate_id = $1`,
    [candidate.slug],
  );
  const row = cached.rows[0];
  if (row && row.rec_count === liveCount) {
    return {
      paragraphs: row.paragraphs as string[],
      model: row.model,
      generatedAt: row.generated_at,
      recCount: row.rec_count,
    };
  }

  try {
    const fresh = await generateCandidateAISummary(candidate, recommendations);
    await query(
      `INSERT INTO candidate_ai_summary (candidate_id, generated_at, paragraphs, model, rec_count)
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
    return { ...fresh, recCount: liveCount };
  } catch (error) {
    console.warn("[ai-summary] bedrock unreachable, falling back to local template", error);
    return { ...buildLocalFallback(candidate, recommendations), recCount: liveCount };
  }
}
