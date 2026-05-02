import Link from "next/link";
import { Card, CardHead, Mono, appRoutes } from "@recai/shared";
import { RecruiterShell } from "../components/recruiter-shell";
import { requireRecruiterSession } from "../server/recruiter-auth";
import { getJobPostingsForRecruiter, type RecruiterJobPosting } from "../server/recruiter-jobs";

const fieldClass =
  "h-10 rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

function buildInviteUrl(inviteCode: string) {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://recai-sigma.vercel.app";
  return `${base}/candidate/sign-in?join=${inviteCode}`;
}

function PostingRow({ posting }: { posting: RecruiterJobPosting }) {
  return (
    <div className="grid grid-cols-[56px_1fr_auto] items-start gap-4 border-b border-[color:var(--hairline)] px-5 py-4 transition last:border-0 hover:bg-[color:var(--surface-2)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] bg-[color:var(--ink)] text-[14px] font-semibold text-white">
        {posting.title[0]?.toUpperCase() ?? "·"}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{posting.title}</p>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-3)]">
          {posting.location} · {posting.employmentType} · {posting.experienceLevel}
        </p>
        <Mono className="mt-1 block break-all text-[11px] text-[color:var(--ink-4)]">
          {buildInviteUrl(posting.inviteCode)}
        </Mono>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[13px] tabular-nums text-[color:var(--ink-2)]">
          {posting.candidateCount} {posting.candidateCount === 1 ? "candidate" : "candidates"}
        </span>
        <form action={`/api/recruiter/jobs/${posting.id}/delete`} method="post">
          <button className="text-[12px] text-[#b91c1c]/70 transition hover:text-[#b91c1c]" type="submit">
            Delete
          </button>
        </form>
        <Link
          className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
          href={appRoutes.recruiterJob(posting.id)}
        >
          Open →
        </Link>
      </div>
    </div>
  );
}

export async function RecruiterDashboardPage() {
  const recruiter = await requireRecruiterSession();
  const postings = await getJobPostingsForRecruiter(recruiter.id);

  return (
    <RecruiterShell
      recruiterName={recruiter.fullName}
      recruiterCompany={recruiter.company}
      pageTitle="Dashboard"
      pageSubtitle={`${recruiter.title} · ${recruiter.email}`}
    >
      <Card>
        <CardHead eyebrow={`Job postings · ${postings.length}`} />
        {postings.length > 0 ? (
          <div>
            {postings.map((posting) => (
              <PostingRow key={posting.id} posting={posting} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-[color:var(--ink)]">No job postings yet</p>
            <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
              Add your first listing below to get a candidate join link.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <CardHead eyebrow="Add posting" />
        <form action="/api/recruiter/jobs" className="grid gap-3 px-5 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" method="post">
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            Job title *
            <input className={fieldClass + " mt-1 w-full"} name="title" placeholder="Senior Software Engineer" required type="text" />
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            Location
            <input className={fieldClass + " mt-1 w-full"} defaultValue="Remote" name="location" placeholder="Remote" type="text" />
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            Type
            <select className={fieldClass + " mt-1 w-full"} name="employmentType">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            Level
            <select className={fieldClass + " mt-1 w-full"} name="experienceLevel">
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff</option>
              <option value="Principal">Principal</option>
            </select>
          </label>
          <button
            className="h-10 self-end rounded-[var(--r-md)] bg-[color:var(--verified)] px-5 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
            type="submit"
          >
            Add posting
          </button>
        </form>
      </Card>
    </RecruiterShell>
  );
}
