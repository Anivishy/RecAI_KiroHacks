import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HowRecAIScores,
  RelationMix,
  TopNav,
  TrustCard,
  VerifiedDomains,
  appRoutes,
  buildExperienceRows,
  buildPentagonForRecruiter,
  buildRelationMix,
  buildTrustStats,
  pentagonTraitMeta,
  type CandidateProfile,
  type PentagonTrait,
} from "@recai/shared";
import { ExperienceList } from "@recai/candidate/components/profile/experience-list";
import { HeroCard } from "@recai/candidate/components/profile/hero-card";
import { getCandidateProfileBySlug } from "@recai/candidate/server/candidate-profile-db";
import { Pentagon } from "../components/rail/pentagon";
import { RecruiterAISummary } from "../components/rail/recruiter-ai-summary";
import { getOrGenerateAISummary } from "../server/ai-summary";
import { requireRecruiterSession } from "../server/recruiter-auth";
import {
  getJobPostingById,
  getJoinedCandidatesForPosting,
} from "../server/recruiter-jobs";
import { getOrGenerateTraitScorecard } from "../server/recruiter-trait-scoring";
import { buildV2PentagonsForRecruiter } from "../server/v2-pentagon";
import { buildTraitEvidenceSegments } from "@recai/shared/server/trait-scoring";

type RecruiterCandidateProfilePageProps = {
  params: Promise<{ jobId: string; candidateSlug: string }>;
};

function getInitials(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function getStatsFromCandidate(candidate: CandidateProfile) {
  const traits = pentagonTraitMeta;
  const traitCount: number = traits.length;
  const totalScore = traits.reduce((sum, trait) => sum + candidate.pentagonScores[trait.id], 0);
  const avg = traitCount === 0 ? 0 : Math.round((totalScore / traitCount) * 20);
  const top = traits
    .map((trait) => ({
      label: trait.label,
      score: Math.round(candidate.pentagonScores[trait.id] * 20),
    }))
    .sort((a, b) => b.score - a.score)[0] ?? { label: "—", score: 0 };
  return { avgTraitScore: avg, topTraitLabel: top.label, topTraitScore: top.score };
}

type PentagonLayout =
  | { kind: "v2"; technical: PentagonTrait[]; behavioral: PentagonTrait[] }
  | { kind: "v1"; traits: PentagonTrait[] };

export async function RecruiterCandidateProfilePage({
  params,
}: RecruiterCandidateProfilePageProps) {
  const recruiter = await requireRecruiterSession();
  const { jobId, candidateSlug } = await params;
  const [posting, joinedCandidates, candidate] = await Promise.all([
    getJobPostingById(jobId, recruiter.id),
    getJoinedCandidatesForPosting(jobId),
    getCandidateProfileBySlug(candidateSlug),
  ]);
  if (!posting || !candidate) notFound();
  const isInPostingPool = joinedCandidates.some(
    (joinedCandidate) => joinedCandidate.candidateSlug === candidateSlug,
  );
  if (!isInPostingPool) notFound();

  const [scorecard, summary] = await Promise.all([
    getOrGenerateTraitScorecard(candidate),
    getOrGenerateAISummary(candidate, candidate.recommendations),
  ]);

  const experienceRows = buildExperienceRows(candidate, candidate.recommendations);
  const trustStats = buildTrustStats(candidate.recommendations);
  const relationMix = buildRelationMix(candidate.recommendations);
  const stats = getStatsFromCandidate(candidate);
  const evidenceSegments = buildTraitEvidenceSegments(candidate);

  const pentagonLayout: PentagonLayout = scorecard
    ? { kind: "v2", ...buildV2PentagonsForRecruiter(scorecard, evidenceSegments) }
    : { kind: "v1", traits: buildPentagonForRecruiter(candidate.pentagonScores, candidate.projects) };

  return (
    <>
      <TopNav
        viewer={{ role: "recruiter", fullName: recruiter.fullName, company: recruiter.company }}
        rightSlot={
          <Link
            className="text-[13px] text-[color:var(--ink-3)] hover:text-[color:var(--ink)]"
            href={appRoutes.recruiterJob(jobId)}
          >
            ← {posting.title}
          </Link>
        }
      />
      <main className="mx-auto grid w-full max-w-[1240px] gap-7 px-6 py-7 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6 min-w-0">
          <HeroCard
            fullName={candidate.fullName}
            initials={getInitials(candidate.fullName)}
            headline={candidate.headline}
            location={candidate.location}
            joinedLabel={`${candidate.yearsExperience}+ yrs experience`}
            contactLinks={[]}
          />
          <RecruiterAISummary summary={summary} stats={stats} />
          <ExperienceList rows={experienceRows} recommendations={candidate.recommendations} />
        </div>
        <aside className="grid gap-4 content-start">
          {pentagonLayout.kind === "v2" ? (
            <>
              <Pentagon traits={pentagonLayout.technical} label="Technical · recruiter view" />
              <Pentagon traits={pentagonLayout.behavioral} label="Behavioral · recruiter view" />
            </>
          ) : (
            <Pentagon traits={pentagonLayout.traits} />
          )}
          <TrustCard stats={trustStats} />
          <RelationMix entries={relationMix} />
          <VerifiedDomains domains={trustStats.domains} />
          <HowRecAIScores />
        </aside>
      </main>
    </>
  );
}
