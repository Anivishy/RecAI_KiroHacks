import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppShell,
  SectionCard,
  appRoutes,
  pentagonTraitMeta,
  sampleCandidateProfiles,
  sampleJobPosting,
} from "@recai/shared";
import { RecruiterSignOutForm } from "../components/recruiter-sign-out-form";
import { requireRecruiterSession } from "../server/recruiter-auth";

type RecruiterJobPostingPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function RecruiterJobPostingPage({
  params,
}: RecruiterJobPostingPageProps) {
  const recruiter = await requireRecruiterSession();
  const { jobId } = await params;

  if (jobId !== sampleJobPosting.id) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Recruiter Job Posting"
      title={sampleJobPosting.title}
      description={`Posting-scoped recruiter workspace for ${recruiter.fullName}. Narrow the pool with structured filters, evidence thresholds, and natural-language search.`}
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Recruiter dashboard", href: appRoutes.recruiterDashboard },
        { label: sampleJobPosting.title },
      ]}
      actions={
        <>
          <Link
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={appRoutes.recruiterDashboard}
          >
            Back to dashboard
          </Link>
          <RecruiterSignOutForm />
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow="Structured Filters"
          title="Posting-scoped qualification controls"
          description="Structured filters narrow the candidate pool before or alongside natural-language search."
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Role focus
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Platform engineering, backend systems, Python services, distributed
                systems
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Experience range
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                4-8 years, production backend ownership, shipped cross-functional work
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                Search pentagon minimums
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pentagonTraitMeta.map((trait) => (
                  <div
                    key={trait.id}
                    className="rounded-[18px] border border-[color:var(--line)] bg-[rgba(21,94,239,0.05)] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {trait.label}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Minimum: 4 / 5</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Natural-Language Search"
          title="Describe the candidate you want"
          description="Search in plain language when you want a combination of technical and behavioral proof, not just exact keyword matches."
        >
          <div className="rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              Example query
            </p>
            <p className="mt-3 text-base leading-7 text-[var(--foreground)]">
              "Show me candidates in this pool with strong Python systems experience who
              also demonstrated ownership and leadership on shipped projects."
            </p>
          </div>
          <div className="mt-4 rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              Result destination
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Search results return candidate cards ranked by relevance. Clicking a card
              opens the candidate review page with job-specific evidence.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Candidate Pool"
        title={`Candidates for ${sampleJobPosting.title}`}
        description="These cards represent the results a recruiter reviews inside this posting."
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
                    {candidate.currentRole} - {candidate.yearsExperience} years
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                  href={appRoutes.recruiterCandidateProfile(jobId, candidate.slug)}
                >
                  View recruiter profile
                </Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {candidate.bio}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
