import Link from "next/link";
import {
  AppShell,
  SectionCard,
  appRoutes,
  sampleCandidateProfiles,
  sampleJobPosting,
} from "@recai/shared";
import { RecruiterSignOutForm } from "../components/recruiter-sign-out-form";
import { requireRecruiterSession } from "../server/recruiter-auth";

export async function RecruiterDashboardPage() {
  const recruiter = await requireRecruiterSession();

  return (
    <AppShell
      eyebrow="Recruiter Dashboard"
      title={`${recruiter.fullName}'s portal`}
      description={`Recruiter workspace for ${recruiter.company}. This protected dashboard is the home for job postings, candidate-pool search, and recruiter-specific review work.`}
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
            Open job posting
          </Link>
          <RecruiterSignOutForm />
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
          eyebrow="Signed In As"
          title={recruiter.title}
          description="Your recruiter account stays attached to your workspace and the postings you manage."
        >
          <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <div className="rounded-[20px] border border-[color:var(--line)] bg-white/75 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Email:</span>{" "}
              {recruiter.email}
            </div>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-white/75 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Company:</span>{" "}
              {recruiter.company}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow="How You Can Screen"
          title="Review candidates with more than resume keywords"
          description="Recruiters can combine structured filters with recommendation-backed evidence to narrow the pool."
        >
          <div className="grid gap-3">
            {[
              "Review only candidates who opted into your posting",
              "Filter by role, experience, and fit thresholds",
              "Look for technical depth, ownership, and leadership signals",
              "Open job-contextual candidate review pages",
              "Search for nuanced combinations of skills and behavior",
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
          eyebrow="Candidate Pool"
          title="Candidates currently in this posting"
          description="Open a candidate to review their profile, highlighted evidence, and job-specific fit summary."
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
