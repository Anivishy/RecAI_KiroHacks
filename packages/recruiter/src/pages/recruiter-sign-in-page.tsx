import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";

export function RecruiterSignInPage() {
  return (
    <AppShell
      eyebrow="Recruiter Entry"
      title="Search for people through validated signals instead of self-reported claims."
      description="This route is the recruiter lane starting point. It stays intentionally separate from candidate auth so the portal can evolve independently."
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
            href={appRoutes.recruiterDashboard}
          >
            Continue to portal
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Recruiter Goals"
          title="What this flow will own"
          description="The recruiter portal is scoped around job-specific candidate pools, signal-backed search, and direct access to candidate profile evidence."
        >
          <div className="grid gap-3">
            {[
              "Sign up with an individual recruiter account",
              "Create and manage job postings",
              "Search only inside a posting-specific candidate pool",
              "Use structured filters and natural-language search",
              "Open candidate profiles through RecAI links and continue outreach externally",
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
          title="Portal shell first, data and auth next"
          description="This flow currently routes into the recruiter dashboard shell so we can build the portal structure before wiring real authentication, persistence, and search."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              The current recruiter path is ready for dashboard, job posting, and search
              UX implementation without waiting on the candidate workstream.
            </p>
            <Link
              className="inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
              href={appRoutes.recruiterDashboard}
            >
              Open recruiter dashboard shell
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
