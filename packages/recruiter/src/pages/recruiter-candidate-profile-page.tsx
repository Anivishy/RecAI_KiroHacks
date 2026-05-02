import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppShell,
  PentagonChart,
  SectionCard,
  appRoutes,
  getCandidateProfileBySlug,
  getRecruiterCandidateReview,
  pentagonTraitMeta,
  sampleJobPosting,
} from "@recai/shared";

type RecruiterCandidateProfilePageProps = {
  params: Promise<{
    jobId: string;
    candidateSlug: string;
  }>;
};

export async function RecruiterCandidateProfilePage({
  params,
}: RecruiterCandidateProfilePageProps) {
  const { jobId, candidateSlug } = await params;
  const candidate = getCandidateProfileBySlug(candidateSlug);
  const recruiterReview = getRecruiterCandidateReview(jobId, candidateSlug);

  if (!candidate || !recruiterReview || jobId !== sampleJobPosting.id) {
    notFound();
  }

  const highlightedProjects = candidate.projects.filter((project) =>
    recruiterReview.highlightedProjectIds.includes(project.id),
  );

  const highlightedRecommendations = candidate.recommendations.filter(
    (recommendation) =>
      recruiterReview.highlightedRecommendationIds.includes(recommendation.id),
  );

  return (
    <AppShell
      eyebrow="Recruiter Candidate Review"
      title={candidate.fullName}
      description={`Job-contextual review for ${sampleJobPosting.title}. This recruiter-owned view keeps the public profile intact while surfacing faster hiring evaluation signals.`}
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Recruiter dashboard", href: appRoutes.recruiterDashboard },
        { label: sampleJobPosting.title, href: appRoutes.recruiterJob(jobId) },
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
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Recruiter Summary"
          title={`${candidate.currentRole} - ${candidate.location}`}
          description={`${candidate.yearsExperience} years experience - ${candidate.verifiedRecommendationCount} verified recommendations - target roles: ${candidate.targetRoles.join(", ")}`}
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
          description="These reasons are recruiter-facing and tied to the current posting context."
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
          description="These are the places a recruiter or hiring team may want to probe next."
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
        title="How the recommendation evidence maps to the pentagon"
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
          description="These are the projects surfaced as the strongest recruiter evidence for this posting."
        >
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
        </SectionCard>

        <SectionCard
          eyebrow="Highlighted Recommendations"
          title="Recommendation evidence worth reading first"
          description="These recommendations currently look most relevant to the job context and trait match."
        >
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
        </SectionCard>
      </div>
    </AppShell>
  );
}
