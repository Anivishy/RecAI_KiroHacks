import { Suspense } from "react";
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
  buildRelationMix,
  buildTrustStats,
  type CandidateProfile,
} from "@recai/shared";
import { ExperienceList } from "@recai/candidate/components/profile/experience-list";
import { HeroCard } from "@recai/candidate/components/profile/hero-card";
import { getCandidateProfileBySlug } from "@recai/candidate/server/candidate-profile-db";
import { RecruiterAISummaryLoader } from "../components/rail/recruiter-ai-summary-loader";
import { RecruiterAISummarySkeleton } from "../components/rail/recruiter-ai-summary-skeleton";
import { RecruiterPentagonsLoader } from "../components/rail/recruiter-pentagons-loader";
import { RecruiterPentagonsSkeleton } from "../components/rail/recruiter-pentagons-skeleton";
import { requireRecruiterSession } from "../server/recruiter-auth";
import {
  getJobPostingById,
  getJoinedCandidatesForPosting,
} from "../server/recruiter-jobs";

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

  const experienceRows = buildExperienceRows(candidate, candidate.recommendations);
  const trustStats = buildTrustStats(candidate.recommendations);
  const relationMix = buildRelationMix(candidate.recommendations);

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
          <Suspense fallback={<RecruiterAISummarySkeleton />}>
            <RecruiterAISummaryLoader candidate={candidate} />
          </Suspense>
          <ExperienceList rows={experienceRows} recommendations={candidate.recommendations} />
        </div>
        <aside className="grid gap-4 content-start">
          <Suspense fallback={<RecruiterPentagonsSkeleton />}>
            <RecruiterPentagonsLoader candidate={candidate} />
          </Suspense>
          <TrustCard stats={trustStats} />
          <RelationMix entries={relationMix} />
          <VerifiedDomains domains={trustStats.domains} />
          <HowRecAIScores />
        </aside>
      </main>
    </>
  );
}
