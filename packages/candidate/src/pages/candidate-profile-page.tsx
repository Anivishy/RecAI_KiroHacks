import { notFound } from "next/navigation";
import { AppShell, PentagonChart, SectionCard, appRoutes } from "@recai/shared";
import { getCandidateProfileBySlug } from "../server/candidate-profile-db";

type CandidateProfilePageProps = {
  params: Promise<{
    candidateSlug: string;
  }>;
};

export async function CandidateProfilePage({
  params,
}: CandidateProfilePageProps) {
  const { candidateSlug } = await params;
  const candidate = await getCandidateProfileBySlug(candidateSlug);

  if (!candidate) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Public Candidate Profile"
      title={candidate.fullName}
      description={candidate.headline}
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate profile" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Profile"
          title={`${candidate.currentRole} in ${candidate.location}`}
          description={`${candidate.yearsExperience} years of experience - ${candidate.verifiedRecommendationCount} verified recommendations`}
        >
          <p className="text-sm leading-7 text-[var(--muted)]">{candidate.bio}</p>
          {candidate.targetRoles.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {candidate.targetRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <PentagonChart scores={candidate.pentagonScores} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Projects"
          title="Proof through concrete work"
          description="Each project is grounded in submitted recommendation evidence, not just self-reported claims."
        >
          {candidate.projects.length > 0 ? (
            <div className="grid gap-4">
              {candidate.projects.map((project) => (
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
                        className="rounded-full bg-[rgba(21,94,239,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
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
              No verified project evidence has been published yet.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Recommendations"
          title="Verified external perspective"
          description="Candidates control visibility, but they do not control the content of submitted recommendations."
        >
          {candidate.recommendations.length > 0 ? (
            <div className="grid gap-4">
              {candidate.recommendations.map((recommendation) => (
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
              No verified recommendations have been published yet.
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
