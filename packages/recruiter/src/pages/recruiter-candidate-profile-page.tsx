import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppShell,
  PentagonChart,
  SectionCard,
  appRoutes,
  pentagonTraitMeta,
  type CandidateProfile,
  type PentagonTraitId,
  type RecruiterCandidateReview,
  type RecruiterTraitEvidence,
} from "@recai/shared";
import { getCandidateProfileBySlug } from "@recai/candidate/server/candidate-profile-db";
import { RecruiterSignOutForm } from "../components/recruiter-sign-out-form";
import { requireRecruiterSession } from "../server/recruiter-auth";
import {
  getJobPostingById,
  getJoinedCandidatesForPosting,
} from "../server/recruiter-jobs";

type RecruiterCandidateProfilePageProps = {
  params: Promise<{
    jobId: string;
    candidateSlug: string;
  }>;
};

const traitKeywordMap: Record<PentagonTraitId, string[]> = {
  technicalDepth: [
    "api",
    "architecture",
    "aws",
    "backend",
    "code",
    "database",
    "engineering",
    "implementation",
    "infrastructure",
    "observability",
    "platform",
    "python",
    "reliability",
    "scalability",
    "systems",
    "technical",
  ],
  execution: [
    "completed",
    "delivered",
    "delivery",
    "execution",
    "impact",
    "launched",
    "outcome",
    "results",
    "ship",
    "shipped",
    "timeline",
  ],
  ownership: [
    "ambiguity",
    "autonomous",
    "drove",
    "end-to-end",
    "end to end",
    "initiative",
    "owned",
    "owner",
    "ownership",
    "responsibility",
    "took the lead",
  ],
  leadership: [
    "coach",
    "cross-functional",
    "influence",
    "lead",
    "leadership",
    "mentor",
    "mentored",
    "stakeholder",
    "strategy",
    "team",
  ],
  communication: [
    "alignment",
    "clear",
    "clarity",
    "collaboration",
    "communicat",
    "documentation",
    "explain",
    "partner",
    "presentation",
    "wrote",
    "written",
  ],
};

function inferTraitsFromText(input: string) {
  const normalized = input.toLowerCase();
  const traits = Object.entries(traitKeywordMap)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([traitId]) => traitId as PentagonTraitId);

  return traits.length > 0 ? traits : ([] as PentagonTraitId[]);
}

function getTraitLabel(traitId: PentagonTraitId) {
  return pentagonTraitMeta.find((trait) => trait.id === traitId)?.label ?? traitId;
}

function getTopTraitIds(candidate: CandidateProfile) {
  return [...pentagonTraitMeta]
    .sort(
      (left, right) =>
        candidate.pentagonScores[right.id] - candidate.pentagonScores[left.id],
    )
    .map((trait) => trait.id);
}

function buildTraitEvidence(candidate: CandidateProfile): RecruiterTraitEvidence[] {
  return pentagonTraitMeta.map((trait) => {
    const projectIds = candidate.projects
      .filter((project) => project.matchedTraits.includes(trait.id))
      .map((project) => project.id)
      .slice(0, 2);

    const recommendationIds = candidate.recommendations
      .filter((recommendation) =>
        inferTraitsFromText(
          `${recommendation.summary} ${recommendation.skillsMentioned.join(" ")}`,
        ).includes(trait.id),
      )
      .map((recommendation) => recommendation.id)
      .slice(0, 2);

    const evidenceParts = [
      projectIds.length > 0
        ? `${projectIds.length} project${projectIds.length === 1 ? "" : "s"}`
        : null,
      recommendationIds.length > 0
        ? `${recommendationIds.length} recommendation${recommendationIds.length === 1 ? "" : "s"}`
        : null,
    ].filter(Boolean);

    return {
      traitId: trait.id,
      summary:
        evidenceParts.length > 0
          ? `${getTraitLabel(trait.id)} is supported by ${evidenceParts.join(" and ")} in this candidate's record.`
          : `Less direct evidence surfaced yet for ${getTraitLabel(trait.id).toLowerCase()}, so this is a good interview follow-up area.`,
      projectIds,
      recommendationIds,
    };
  });
}

function buildRecruiterReview(
  jobId: string,
  postingTitle: string,
  candidate: CandidateProfile,
): RecruiterCandidateReview {
  const topTraits = getTopTraitIds(candidate);
  const averageScore =
    pentagonTraitMeta.reduce(
      (sum, trait) => sum + candidate.pentagonScores[trait.id],
      0,
    ) / pentagonTraitMeta.length;
  const fitScore = Math.max(20, Math.round(averageScore * 20));
  const fitLabel =
    fitScore >= 85 ? "Strong fit" : fitScore >= 70 ? "Promising fit" : "Selective fit";

  const highlightedProjectIds = [...candidate.projects]
    .sort((left, right) => {
      const leftPriority = left.matchedTraits.filter((trait) =>
        topTraits.slice(0, 2).includes(trait),
      ).length;
      const rightPriority = right.matchedTraits.filter((trait) =>
        topTraits.slice(0, 2).includes(trait),
      ).length;

      return rightPriority - leftPriority || right.skills.length - left.skills.length;
    })
    .slice(0, 2)
    .map((project) => project.id);

  const highlightedRecommendationIds = [...candidate.recommendations]
    .sort((left, right) => {
      const leftPriority = inferTraitsFromText(
        `${left.summary} ${left.skillsMentioned.join(" ")}`,
      ).filter((trait) => topTraits.slice(0, 2).includes(trait)).length;
      const rightPriority = inferTraitsFromText(
        `${right.summary} ${right.skillsMentioned.join(" ")}`,
      ).filter((trait) => topTraits.slice(0, 2).includes(trait)).length;

      return (
        rightPriority - leftPriority ||
        right.skillsMentioned.length - left.skillsMentioned.length
      );
    })
    .slice(0, 2)
    .map((recommendation) => recommendation.id);

  const topTraitLabels = topTraits.slice(0, 2).map(getTraitLabel);

  return {
    jobId,
    candidateSlug: candidate.slug,
    fitScore,
    fitLabel,
    recruiterSummary:
      candidate.verifiedRecommendationCount > 0
        ? `${candidate.fullName} looks like a ${fitLabel.toLowerCase()} for ${postingTitle} based on verified evidence concentrated around ${topTraitLabels.join(" and ")}.`
        : `${candidate.fullName} has joined this posting, but there is still limited submitted recommendation evidence for ${postingTitle}.`,
    whyMatched: [
      `${candidate.verifiedRecommendationCount} verified recommendation${candidate.verifiedRecommendationCount === 1 ? "" : "s"} back this profile with externally authored evidence.`,
      topTraitLabels.length > 0
        ? `The strongest validated traits right now are ${topTraitLabels.join(" and ")}.`
        : "The strongest validated traits will become clearer as more recommendation evidence arrives.",
      candidate.projects.length > 0
        ? `${candidate.projects.length} project-backed proof point${candidate.projects.length === 1 ? "" : "s"} have been extracted from submitted recommendations.`
        : "There is not much project-level evidence yet, so interview follow-up should probe for concrete examples.",
    ],
    interviewFocus: [
      candidate.projects[0]
        ? `Ask for a deeper walkthrough of ${candidate.projects[0].title} and what the candidate personally owned.`
        : "Ask for the most representative project that best reflects their real scope and impact.",
      topTraits[0]
        ? `Validate ${getTraitLabel(topTraits[0]).toLowerCase()} with a specific example that includes tradeoffs and outcomes.`
        : "Validate the strongest trait area with a concrete story and measurable outcomes.",
      candidate.recommendations[0]
        ? `Cross-check the recommendation from ${candidate.recommendations[0].recommenderName} with behavioral follow-up on collaboration and execution.`
        : "Use behavioral follow-up to test how the candidate communicates, collaborates, and drives work forward.",
    ],
    highlightedProjectIds,
    highlightedRecommendationIds,
    traitEvidence: buildTraitEvidence(candidate),
  };
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

  if (!posting || !candidate) {
    notFound();
  }

  const isInPostingPool = joinedCandidates.some(
    (joinedCandidate) => joinedCandidate.candidateSlug === candidateSlug,
  );

  if (!isInPostingPool) {
    notFound();
  }

  const recruiterReview = buildRecruiterReview(jobId, posting.title, candidate);

  const highlightedProjects = candidate.projects.filter((project) =>
    recruiterReview.highlightedProjectIds.includes(project.id),
  );

  const highlightedRecommendations = candidate.recommendations.filter((recommendation) =>
    recruiterReview.highlightedRecommendationIds.includes(recommendation.id),
  );

  return (
    <AppShell
      eyebrow="Recruiter Candidate Review"
      title={candidate.fullName}
      description={`Job-contextual review for ${posting.title}, opened by ${recruiter.fullName}. This layer adds faster evaluation signals without changing the public candidate profile.`}
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Recruiter dashboard", href: appRoutes.recruiterDashboard },
        { label: posting.title, href: appRoutes.recruiterJob(jobId) },
        { label: candidate.fullName },
      ]}
      actions={
        <>
          <Link
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            href={appRoutes.recruiterJob(jobId)}
          >
            Back to candidate pool
          </Link>
          <Link
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={appRoutes.publicCandidateProfile(candidate.slug)}
          >
            Open public profile
          </Link>
          <RecruiterSignOutForm />
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Recruiter Summary"
          title={`${candidate.currentRole} - ${candidate.location}`}
          description={`${candidate.yearsExperience} years experience - ${candidate.verifiedRecommendationCount} verified recommendations - target roles: ${candidate.targetRoles.length > 0 ? candidate.targetRoles.join(", ") : "not specified yet"}`}
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Recruiter brief
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                {recruiterReview.recruiterSummary}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[color:var(--line)] bg-white/75 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                  Fit score
                </p>
                <p className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
                  {recruiterReview.fitScore}
                </p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--line)] bg-white/75 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                  Fit signal
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--accent)]">
                  {recruiterReview.fitLabel}
                </p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--line)] bg-white/75 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                  Highlighted evidence
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                  {highlightedProjects.length + highlightedRecommendations.length}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <PentagonChart scores={candidate.pentagonScores} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          eyebrow="Why This Candidate"
          title="Job-specific match reasons"
          description="These reasons are recruiter-facing and grounded in the candidate data available for this posting."
        >
          <div className="grid gap-3">
            {recruiterReview.whyMatched.map((reason) => (
              <div
                key={reason}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/75 px-4 py-4 text-sm leading-6 text-[var(--muted)]"
              >
                {reason}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Interview Focus"
          title="Suggested follow-up angles"
          description="These are good places for a recruiter or hiring team to probe next."
        >
          <div className="grid gap-3">
            {recruiterReview.interviewFocus.map((question) => (
              <div
                key={question}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/75 px-4 py-4 text-sm leading-6 text-[var(--muted)]"
              >
                {question}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Trait Evidence"
        title="How the submitted evidence maps to the pentagon"
        description="Each trait summary ties back to concrete projects and recommendation records."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {recruiterReview.traitEvidence.map((trait) => {
            const traitMeta = pentagonTraitMeta.find((item) => item.id === trait.traitId);

            return (
              <div
                key={trait.traitId}
                className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {traitMeta?.label}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--accent-strong)]">
                    {candidate.pentagonScores[trait.traitId]} / 5
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {trait.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trait.projectIds.map((projectId) => {
                    const project = candidate.projects.find((item) => item.id === projectId);
                    return project ? (
                      <span
                        key={projectId}
                        className="rounded-full bg-[rgba(21,94,239,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                      >
                        Project: {project.title}
                      </span>
                    ) : null;
                  })}
                  {trait.recommendationIds.map((recommendationId) => {
                    const recommendation = candidate.recommendations.find(
                      (item) => item.id === recommendationId,
                    );
                    return recommendation ? (
                      <span
                        key={recommendationId}
                        className="rounded-full bg-[rgba(15,118,110,0.10)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                      >
                        Recommender: {recommendation.recommenderName}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Highlighted Projects"
          title="Projects most relevant to this job"
          description="These are the projects currently surfacing as the strongest evidence for this posting."
        >
          {highlightedProjects.length > 0 ? (
            <div className="grid gap-4">
              {highlightedProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {project.title}
                    </h3>
                    <p className="text-sm font-medium text-[var(--accent-strong)]">
                      {project.impact}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {project.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
              No project evidence has been extracted for this candidate yet.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Highlighted Recommendations"
          title="Recommendation evidence worth reading first"
          description="These recommendations currently look most relevant to the job context and trait signal."
        >
          {highlightedRecommendations.length > 0 ? (
            <div className="grid gap-4">
              {highlightedRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        {recommendation.recommenderName}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {recommendation.recommenderTitle} - {recommendation.company}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {recommendation.relationship}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {recommendation.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
              No submitted recommendations are available yet for this candidate.
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
