import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";

export function CandidateSignInPage() {
  return (
    <AppShell
      eyebrow="Candidate Entry"
      title="Build a profile that is backed by people, not just polished copy."
      description="This route is the candidate lane starting point. We are keeping it separate from recruiter auth from day one so both workstreams can move independently."
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
          eyebrow="Candidate Goals"
          title="What this flow will own"
          description="The candidate experience is where users shape their public presence without being able to rewrite what recommenders actually say."
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
          eyebrow="Scaffold Status"
          title="Auth is intentionally not wired yet"
          description="Right now this page exists to lock in navigation and responsibilities. The next candidate implementation pass can wire the actual auth provider and candidate onboarding flow."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(21,94,239,0.06)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              For the scaffold, the primary action routes directly into the candidate
              dashboard shell so information architecture work can begin immediately.
            </p>
            <Link
              className="inline-flex rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
              href={appRoutes.candidateDashboard}
            >
              Open candidate dashboard shell
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
