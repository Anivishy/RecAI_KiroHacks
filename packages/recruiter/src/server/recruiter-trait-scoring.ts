import {
  buildTraitEvidenceSegments,
  scoreCandidateTraitEvidence,
  type CandidateTraitScorecard,
  type TraitScoreDetail,
} from "@recai/shared/server/trait-scoring";
import {
  technicalTraitMeta,
  behavioralTraitMeta,
  type TechnicalTraitId,
  type BehavioralTraitId,
} from "@recai/shared";
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

/**
 * Build a heuristic V2 scorecard from the candidate's existing pentagon scores
 * and evidence segments. Used as a fallback when Bedrock is unavailable.
 */
function buildHeuristicScorecard(
  candidate: CandidateProfile,
): ScorecardResult {
  const segments = buildTraitEvidenceSegments(candidate);
  const segmentIds = segments.map((s) => s.segmentId);
  const scores = candidate.pentagonScores;

  // Map V1 pentagon traits to V2 technical traits using heuristic distribution
  const v1Avg = Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(scores).length, 1);
  const baseScore = Math.round(v1Avg * 20);

  function makeDetail(score: number, label: string): TraitScoreDetail {
    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: Math.min(60, candidate.recommendations.length * 20),
      rationale: `Heuristic score based on ${candidate.recommendations.length} verified recommendation(s). Bedrock scoring was unavailable — this is an approximation for ${label}.`,
      evidenceSegmentIds: segmentIds.slice(0, 2),
    };
  }

  const technical = Object.fromEntries(
    technicalTraitMeta.map((t) => [
      t.id,
      makeDetail(
        baseScore + Math.round((Math.random() - 0.5) * 10),
        t.label,
      ),
    ]),
  ) as Record<TechnicalTraitId, TraitScoreDetail>;

  const behavioral = Object.fromEntries(
    behavioralTraitMeta.map((t) => [
      t.id,
      makeDetail(
        baseScore + Math.round((Math.random() - 0.5) * 10),
        t.label,
      ),
    ]),
  ) as Record<BehavioralTraitId, TraitScoreDetail>;

  return {
    technical,
    behavioral,
    overallNotes: ["Scores generated from heuristic fallback. Bedrock scoring was unavailable."],
    model: "heuristic-v2-fallback",
    generatedAt: new Date(),
    recCount: candidate.recommendations.length,
  };
}

export async function getOrGenerateTraitScorecard(
  candidate: CandidateProfile,
): Promise<ScorecardResult> {
  const liveCount = candidate.recommendations.length;

  if (!isRecruiterDatabaseConfigured()) {
    return buildHeuristicScorecard(candidate);
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
    const msg = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[trait-scoring] bedrock failed (${name}): ${msg}`);
    return buildHeuristicScorecard(candidate);
  }
}
