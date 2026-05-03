import type { CandidateProfile } from "@recai/shared";
import { getOrGenerateAISummary } from "../../server/ai-summary";
import { RecruiterAISummary } from "./recruiter-ai-summary";

type Stats = {
  avgTraitScore: number;
  topTraitLabel: string;
  topTraitScore: number;
};

type RecruiterAISummaryLoaderProps = {
  candidate: CandidateProfile;
  stats: Stats;
};

export async function RecruiterAISummaryLoader({ candidate, stats }: RecruiterAISummaryLoaderProps) {
  const summary = await getOrGenerateAISummary(candidate, candidate.recommendations);
  return <RecruiterAISummary summary={summary} stats={stats} />;
}
