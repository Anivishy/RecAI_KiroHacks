import Link from "next/link";
import {
  AppShell,
  SectionCard,
  appRoutes,
  sampleCandidateProfiles,
  sampleRecommendationRequest,
} from "@recai/shared";

const candidate = sampleCandidateProfiles[0];

export function CandidateDashboardPage() {
  return (
    <AppShell
      eyebrow="Candidate Dashboard"
      title={`${candidate.fullName}'s workspace`}
      description="This is the candidate-side shell for profile management, recommendation requests, and job-interest actions."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate sign in", href: appRoutes.candidateSignIn },
        { label: "Dashboard" },
      ]}
      actions={
        <>
          <Link
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            href={appRoutes.publicCandidateProfile(candidate.slug)}
          >
            View public profile
          </Link>
          <Link
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={appRoutes.recommenderRequest(sampleRecommendationRequest.id)}
          >
            Preview recommender flow
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          eyebrow="Profile Snapshot"
          title="Public profile readiness"
          description="The candidate dashboard will eventually manage the public page, displayed recommendations, and job-interest actions."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Target roles
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {candidate.targetRoles.join(" · ")}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Verified recommendations
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {candidate.verifiedRecommendationCount}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Projects highlighted
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {candidate.projects.length}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Recommendation Queue"
          title="Current scaffold request state"
          description="Recommendation workflows will live here, including request tracking, reminders, and which recommendations are visible publicly."
        >
          <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              Active request
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {sampleRecommendationRequest.recommenderName}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {sampleRecommendationRequest.relationshipPrompt}
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--accent-strong)]">
              Status: {sampleRecommendationRequest.status}
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          eyebrow="What The Candidate Lane Owns"
          title="Parallel track for your teammate"
          description="This route boundary gives the candidate implementation a clean area to evolve without depending on recruiter portal work."
        >
          <div className="grid gap-3">
            {[
              "Candidate onboarding and auth",
              "Profile editing and project management",
              "Recommendation request lifecycle",
              "Job posting opt-in flow",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-[color:var(--line)] bg-white/70 px-4 py-4 text-sm leading-6 text-[var(--muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Next Build Slice"
          title="What should happen next on this lane"
          description="Once the candidate track starts moving, the next useful step is real onboarding followed by editable profile sections and recommendation-request creation."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(234,88,12,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              For now, this dashboard is a truthful shell rather than fake functionality.
              The route exists so page hierarchy, docs, and shared data contracts are ready.
            </p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
