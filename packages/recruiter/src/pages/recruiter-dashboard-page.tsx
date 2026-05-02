import Link from "next/link";
import {
  AppShell,
  SectionCard,
  appRoutes,
  sampleCandidateProfiles,
  sampleJobPosting,
  sampleRecruiter,
} from "@recai/shared";

export function RecruiterDashboardPage() {
  return (
    <AppShell
      eyebrow="Recruiter Dashboard"
      title={`${sampleRecruiter.fullName}'s portal`}
      description="This is the recruiter-side shell for job postings, candidate-pool search, and result-to-profile evaluation."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Recruiter sign in", href: appRoutes.recruiterSignIn },
        { label: "Dashboard" },
      ]}
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
            href={appRoutes.recruiterJob(sampleJobPosting.id)}
          >
            Open sample job posting
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow="Active Posting"
          title={sampleJobPosting.title}
          description="Job postings are the recruiter's top-level workspace. Search is always scoped to one posting and one opted-in candidate pool."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Team
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {sampleJobPosting.team}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Candidate pool
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {sampleJobPosting.candidatePoolSize}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Search mode
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                Filters + RAG
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Portal Status"
          title="Recruiter lane is ready to implement"
          description="The scaffold is already aligned with the recruiter spec: open signup, owned job postings, posting-scoped search, and profile review."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              This is the clean lane for your work. Candidate flow development can
              happen in parallel without changing recruiter routes.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow="Search Contract"
          title="What the recruiter implementation needs next"
          description="The next recruiter pass should focus on job creation, structured filters, search-pentagon UI, and the natural-language search panel."
        >
          <div className="grid gap-3">
            {[
              "Create recruiter-owned job postings",
              "Display opted-in candidate pool counts",
              "Add structured filters for role and experience",
              "Add a pentagon minimum-threshold control",
              "Add a natural-language query panel backed by OpenSearch later",
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
          eyebrow="Candidate Pool Preview"
          title="Mock candidates already exist for recruiter UI work"
          description="These sample profiles give the recruiter lane real cards, links, and search-result destinations before the backend is connected."
        >
          <div className="grid gap-4">
            {sampleCandidateProfiles.map((candidate) => (
              <div
                key={candidate.slug}
                className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">
                      {candidate.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {candidate.currentRole} - {candidate.location}
                    </p>
                  </div>
                  <Link
                    className="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    href={appRoutes.recruiterCandidateProfile(
                      sampleJobPosting.id,
                      candidate.slug,
                    )}
                  >
                    Open recruiter view
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {candidate.bio}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
