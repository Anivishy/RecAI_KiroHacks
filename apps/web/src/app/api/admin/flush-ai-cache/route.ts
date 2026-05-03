import { query as recruiterQuery } from "@recai/recruiter/server/recruiter-database";
import { query as candidateQuery } from "@recai/candidate/server/candidate-database";

export async function POST() {
  const results: Record<string, string> = {};

  try {
    await recruiterQuery("DELETE FROM candidate_ai_summary");
    results.candidate_ai_summary = "flushed";
  } catch (err) {
    results.candidate_ai_summary = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    await recruiterQuery("DELETE FROM candidate_trait_scorecard");
    results.candidate_trait_scorecard = "flushed";
  } catch (err) {
    results.candidate_trait_scorecard = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    await candidateQuery("DELETE FROM candidate_profile_summary");
    results.candidate_profile_summary = "flushed";
  } catch (err) {
    results.candidate_profile_summary = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return Response.json(results);
}
