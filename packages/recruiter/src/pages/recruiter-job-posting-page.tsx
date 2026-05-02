import { notFound } from "next/navigation";
import { appRoutes } from "@recai/shared";
import { RecruiterShell } from "../components/recruiter-shell";
import { CandidateSearch } from "../components/candidate-search";
import { requireRecruiterSession } from "../server/recruiter-auth";
import { getJobPostingById } from "../server/recruiter-jobs";

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

  const posting = await getJobPostingById(jobId, recruiter.id);
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
        {/* Posting details */}
        <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white/70 shadow-sm backdrop-blur-sm">
          <div className="border-b border-[color:var(--line)] px-5 py-4">
            <h2 className="font-semibold text-[var(--foreground)]">Posting Details</h2>
          </div>
          <div className="divide-y divide-[color:var(--line)]">
            {[
              { label: "Location", value: posting.location },
              { label: "Employment type", value: posting.employmentType },
              { label: "Experience level", value: posting.experienceLevel },
            ].map(({ label, value }) => (
              <div className="flex items-center justify-between px-5 py-3.5" key={label}>
                <span className="text-sm text-[var(--muted)]">{label}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Join link */}
        <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white/70 shadow-sm backdrop-blur-sm">
          <div className="border-b border-[color:var(--line)] px-5 py-4">
            <h2 className="font-semibold text-[var(--foreground)]">Candidate Join Link</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-[var(--muted)]">
              Share this URL with candidates. Anyone who visits and signs in will be added to this posting's pool.
            </p>
            <div className="mt-3 rounded-xl border border-[color:var(--line)] bg-[rgba(15,118,110,0.05)] px-4 py-3">
              <p className="break-all font-mono text-sm text-[var(--foreground)]">{inviteUrl}</p>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--line)] pt-4">
              <span className="text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {posting.candidateCount}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {posting.candidateCount === 1 ? "candidate has" : "candidates have"} joined
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate pool + AI search */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white/70 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">
            Candidate Pool
            <span className="ml-2 rounded-full bg-[color:var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
              {posting.candidateCount}
            </span>
          </h2>
          <span className="rounded-full bg-[rgba(15,118,110,0.08)] px-2.5 py-0.5 text-xs font-medium text-(--accent)">
            AI search
          </span>
        </div>

        <div className="p-5">
          <CandidateSearch jobId={posting.id} />
        </div>
      </div>
    </RecruiterShell>
  );
}
