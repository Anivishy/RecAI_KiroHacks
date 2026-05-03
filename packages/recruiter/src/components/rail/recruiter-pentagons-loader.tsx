import type { CandidateProfile, PentagonTrait } from "@recai/shared";
import { buildPentagonForRecruiter } from "@recai/shared";
import { buildTraitEvidenceSegments } from "@recai/shared/server/trait-scoring";
import { getOrGenerateTraitScorecard } from "../../server/recruiter-trait-scoring";
import { buildV2PentagonsForRecruiter } from "../../server/v2-pentagon";
import { Pentagon } from "./pentagon";

type RecruiterPentagonsLoaderProps = {
  candidate: CandidateProfile;
};

export async function RecruiterPentagonsLoader({
  candidate,
}: RecruiterPentagonsLoaderProps) {
  const scorecard = await getOrGenerateTraitScorecard(candidate);

  if (scorecard) {
    const evidenceSegments = buildTraitEvidenceSegments(candidate);
    const { technical, behavioral } = buildV2PentagonsForRecruiter(
      scorecard,
      evidenceSegments,
    );
    return (
      <>
        <Pentagon traits={technical} label="Technical · recruiter view" />
        <Pentagon traits={behavioral} label="Behavioral · recruiter view" />
      </>
    );
  }

  // V1 fallback
  const traits: PentagonTrait[] = buildPentagonForRecruiter(
    candidate.pentagonScores,
    candidate.projects,
  );
  return <Pentagon traits={traits} />;
}
