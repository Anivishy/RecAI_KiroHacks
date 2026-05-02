import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";

export function CandidateSignInPage() {
  return (
    <AppShell
      eyebrow="Candidate Entry"
      title="Build a profile that is backed by people, not just polished copy."
      description="Manage your public profile, request verified recommendations, and decide which trusted voices appear on your page."
      actions={
        <>
          <Link
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            href={appRoutes.home}
          >
            Back to landing
          </Link>
          <Link
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={appRoutes.candidateDashboard}
          >
            Continue to dashboard
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Candidate Experience"
          title="How candidates stand out in RecAI"
          description="Candidates shape their public presence while recommendation content stays in the recommender's hands."
        >
          <div className="grid gap-3">
            {[
              "Sign in and manage a persistent candidate account",
              "Create and update the public-facing profile",
              "Request recommendations from verified coworkers or managers",
              "Choose which submitted recommendations appear publicly",
              "Opt into recruiter job postings that match the candidate's goals",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/70 px-4 py-4 text-sm leading-6 text-[var(--muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Workspace Access"
          title="Enter the candidate workspace"
          description="Use the candidate workspace to manage profile details, recommendation requests, and the roles you want to pursue."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(21,94,239,0.06)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              This path leads into the candidate workspace where profile building,
              recommendations, and job interest all come together.
            </p>
            <Link
              className="inline-flex rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
              href={appRoutes.candidateDashboard}
            >
              Open candidate workspace
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
