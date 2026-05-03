import {
  buildTraitEvidenceSegments,
  scoreCandidateTraitEvidence,
  type CandidateTraitScorecard,
} from "@recai/shared/server/trait-scoring";
import type { CandidateProfile } from "@recai/shared";
import { isRecruiterDatabaseConfigured, query } from "./recruiter-database";

let schemaPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (!isRecruiterDatabaseConfigured()) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = query(`
    CREATE TABLE IF NOT EXISTS candidate_trait_scorecard (
      candidate_id  TEXT PRIMARY KEY,
      generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      scorecard     JSONB NOT NULL,
      model         TEXT NOT NULL,
      rec_count     INTEGER NOT NULL
    )
  `).then(() => {});
  return schemaPromise;
}

type ScorecardRow = {
  generated_at: Date;
  scorecard: unknown;
  model: string;
  rec_count: number;
};

export type ScorecardResult = Omit<CandidateTraitScorecard, "generatedAt"> & {
  generatedAt: Date;
  recCount: number;
};

export async function getOrGenerateTraitScorecard(
  candidate: CandidateProfile,
): Promise<ScorecardResult | null> {
  const liveCount = candidate.recommendations.length;

  if (!isRecruiterDatabaseConfigured()) {
    return null;
  }

  await ensureSchema();

  const cached = await query<ScorecardRow>(
    `SELECT generated_at, scorecard, model, rec_count FROM candidate_trait_scorecard WHERE candidate_id = $1`,
    [candidate.slug],
  );
  const row = cached.rows[0];
  if (row && row.rec_count === liveCount) {
    const stored = row.scorecard as Pick<CandidateTraitScorecard, "technical" | "behavioral" | "overallNotes">;
    return {
      technical: stored.technical,
      behavioral: stored.behavioral,
      overallNotes: stored.overallNotes,
      model: row.model,
      generatedAt: row.generated_at,
      recCount: row.rec_count,
    };
  }

  try {
    const segments = buildTraitEvidenceSegments(candidate);
    const fresh = await scoreCandidateTraitEvidence({ candidate, segments });
    await query(
      `INSERT INTO candidate_trait_scorecard (candidate_id, generated_at, scorecard, model, rec_count)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (candidate_id) DO UPDATE
         SET generated_at = EXCLUDED.generated_at,
             scorecard    = EXCLUDED.scorecard,
             model        = EXCLUDED.model,
             rec_count    = EXCLUDED.rec_count`,
      [
        candidate.slug,
        fresh.generatedAt,
        JSON.stringify({
          technical: fresh.technical,
          behavioral: fresh.behavioral,
          overallNotes: fresh.overallNotes,
        }),
        fresh.model,
        liveCount,
      ],
    );
    return { ...fresh, recCount: liveCount };
  } catch (error) {
    console.warn("[trait-scoring] bedrock unreachable, skipping scorecard", error);
    return null;
  }
}
