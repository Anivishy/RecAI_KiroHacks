import { notFound } from "next/navigation";
import { Card, CardHead, Mono, appRoutes } from "@recai/shared";
import { RecruiterShell } from "../components/recruiter-shell";
import { CandidateSearch } from "../components/candidate-search";
import { requireRecruiterSession } from "../server/recruiter-auth";
import { getJobPostingById, getJoinedCandidatesForPosting } from "../server/recruiter-jobs";

type RecruiterJobPostingPageProps = {
  params: Promise<{ jobId: string }>;
};

function buildInviteUrl(inviteCode: string) {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://recai-sigma.vercel.app";
  return `${base}/candidate/sign-in?join=${inviteCode}`;
}

export async function RecruiterJobPostingPage({ params }: RecruiterJobPostingPageProps) {
  const recruiter = await requireRecruiterSession();
  const { jobId } = await params;
  const [posting, joinedCandidates] = await Promise.all([
    getJobPostingById(jobId, recruiter.id),
    getJoinedCandidatesForPosting(jobId),
  ]);
  if (!posting) notFound();
  const inviteUrl = buildInviteUrl(posting.inviteCode);

  return (
    <RecruiterShell
      recruiterName={recruiter.fullName}
      recruiterCompany={recruiter.company}
      pageTitle={posting.title}
      pageSubtitle={`${posting.location} · ${posting.employmentType} · ${posting.experienceLevel}`}
      backHref={appRoutes.recruiterDashboard}
      backLabel="Dashboard"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHead eyebrow="Posting details" />
          <div className="divide-y divide-[color:var(--hairline)]">
            {[
              { label: "Location", value: posting.location },
              { label: "Employment type", value: posting.employmentType },
              { label: "Experience level", value: posting.experienceLevel },
            ].map(({ label, value }) => (
              <div className="flex items-center justify-between px-5 py-3" key={label}>
                <span className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--ink-3)]">{label}</span>
                <span className="text-[13px] font-medium text-[color:var(--ink)]">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead eyebrow="Candidate join link" />
          <div className="px-5 py-4">
            <p className="text-[13px] text-[color:var(--ink-3)]">
              Share this URL inside your external posting. Anyone who follows it and signs in is added to this pool.
            </p>
            <div className="mt-3 rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--verified-bg)] px-3 py-2">
              <Mono className="block break-all text-[12px] text-[color:var(--ink)]">{inviteUrl}</Mono>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--hairline)] pt-3">
              <span className="text-[22px] font-semibold tabular-nums text-[color:var(--ink)]">
                {posting.candidateCount}
              </span>
              <span className="text-[13px] text-[color:var(--ink-3)]">
                {posting.candidateCount === 1 ? "candidate has" : "candidates have"} joined
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead
          eyebrow={`Candidate pool · ${posting.candidateCount}`}
          meta={<Mono className="text-[color:var(--verified)]">AI search</Mono>}
        />
        <div className="px-5 py-4">
          <CandidateSearch
            jobId={posting.id}
            defaultCandidates={joinedCandidates.map((c) => ({
              candidateSlug: c.candidateSlug,
              candidateName: c.candidateName,
            }))}
          />
        </div>
      </Card>
    </RecruiterShell>
  );
}
