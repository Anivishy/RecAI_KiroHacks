import {
  technicalTraitMeta,
  behavioralTraitMeta,
  type CandidateProfile,
} from "@recai/shared";
import { getOrGenerateAISummary } from "../../server/ai-summary";
import { getOrGenerateTraitScorecard } from "../../server/recruiter-trait-scoring";
import { RecruiterAISummary } from "./recruiter-ai-summary";

type RecruiterAISummaryLoaderProps = {
  candidate: CandidateProfile;
};

export async function RecruiterAISummaryLoader({ candidate }: RecruiterAISummaryLoaderProps) {
  const [summary, scorecard] = await Promise.all([
    getOrGenerateAISummary(candidate, candidate.recommendations),
    getOrGenerateTraitScorecard(candidate),
  ]);

  // Compute stats from V2 scorecard (all 10 traits)
  const allTraitScores: { label: string; score: number }[] = [];

  for (const meta of technicalTraitMeta) {
    const detail = scorecard.technical[meta.id as keyof typeof scorecard.technical];
    allTraitScores.push({ label: meta.label, score: detail?.score ?? 0 });
  }
  for (const meta of behavioralTraitMeta) {
    const detail = scorecard.behavioral[meta.id as keyof typeof scorecard.behavioral];
    allTraitScores.push({ label: meta.label, score: detail?.score ?? 0 });
  }

  const avg = allTraitScores.length === 0
    ? 0
    : Math.round(allTraitScores.reduce((sum, t) => sum + t.score, 0) / allTraitScores.length);
  const top = allTraitScores.sort((a, b) => b.score - a.score)[0] ?? { label: "—", score: 0 };

  const stats = {
    avgTraitScore: avg,
    topTraitLabel: top.label,
    topTraitScore: top.score,
  };

  return <RecruiterAISummary summary={summary} stats={stats} />;
}
