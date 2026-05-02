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
      description="Manage your profile, recommendation requests, and the roles you want recruiters to consider you for."
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
            Open recommendation request
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          eyebrow="Profile Snapshot"
          title="Public profile readiness"
          description="Track the public signals that shape how recruiters understand your experience."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Target roles
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {candidate.targetRoles.join(" / ")}
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
          title="Current request state"
          description="Track open recommendation requests, follow up when needed, and decide which completed recommendations stay public."
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
          eyebrow="Manage Your Presence"
          title="Everything candidates control"
          description="Candidates control what appears on their profile without being able to rewrite what recommenders submit."
        >
          <div className="grid gap-3">
            {[
              "Profile editing and project management",
              "Recommendation request tracking",
              "Recommendation visibility choices",
              "Job posting opt-in decisions",
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
          eyebrow="Why Recommendations Matter"
          title="Show impact through trusted voices"
          description="The strongest signal on a RecAI profile is not polished copy. It is what real coworkers and managers say about the work they saw firsthand."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(234,88,12,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Verified recommendations help recruiters trust the profile faster, while
              giving candidates a more credible way to stand out from AI-polished
              applications.
            </p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
