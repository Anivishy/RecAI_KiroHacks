import Link from "next/link";
import { appRoutes } from "@recai/shared";
import { RecruiterShell } from "../components/recruiter-shell";
import { requireRecruiterSession } from "../server/recruiter-auth";
import { getJobPostingsForRecruiter, type RecruiterJobPosting } from "../server/recruiter-jobs";

const fieldClass =
  "h-10 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

function buildInviteUrl(inviteCode: string) {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://recai-sigma.vercel.app";
  return `${base}/candidate/sign-in?join=${inviteCode}`;
}

function PostingRow({ posting }: { posting: RecruiterJobPosting }) {
  return (
    <div className="group flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[color:var(--line)] px-5 py-4 last:border-0 hover:bg-white/40 transition">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--foreground)]">{posting.title}</p>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          {posting.location} · {posting.employmentType} · {posting.experienceLevel}
        </p>
        <p className="mt-1 break-all font-mono text-xs text-[var(--muted)] opacity-70">
          {buildInviteUrl(posting.inviteCode)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="tabular-nums text-sm text-[var(--muted)]">
          {posting.candidateCount} {posting.candidateCount === 1 ? "candidate" : "candidates"}
        </span>
        <form action={`/api/recruiter/jobs/${posting.id}/delete`} method="post">
          <button
            className="text-sm text-[rgba(220,38,38,0.6)] transition hover:text-[rgb(220,38,38)]"
            type="submit"
          >
            Delete
          </button>
        </form>
        <Link
          className="rounded-lg border border-[color:var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
      {/* Postings panel */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white/70 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">
            Job Postings
            <span className="ml-2 rounded-full bg-[color:var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
              {postings.length}
            </span>
          </h2>
        </div>

        {postings.length > 0 ? (
          <div>
            {postings.map((posting) => (
              <PostingRow key={posting.id} posting={posting} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">No job postings yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add your first listing below to get a candidate join link.
            </p>
          </div>
        )}
      </div>

      {/* Add posting form */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white/70 shadow-sm backdrop-blur-sm">
        <div className="border-b border-[color:var(--line)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">Add Posting</h2>
        </div>
        <form action="/api/recruiter/jobs" className="flex flex-wrap items-end gap-3 p-5" method="post">
          <div className="min-w-[200px] flex-[2]">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Job title *</label>
            <input
              className={fieldClass + " w-full"}
              name="title"
              placeholder="Senior Software Engineer"
              required
              type="text"
            />
          </div>
          <div className="min-w-[130px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Location</label>
            <input
              className={fieldClass + " w-full"}
              defaultValue="Remote"
              name="location"
              placeholder="Remote"
              type="text"
            />
          </div>
          <div className="min-w-[130px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Type</label>
            <select className={fieldClass + " w-full"} name="employmentType">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div className="min-w-[130px] flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Level</label>
            <select className={fieldClass + " w-full"} name="experienceLevel">
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff</option>
              <option value="Principal">Principal</option>
            </select>
          </div>
          <div className="shrink-0">
            <button
              className="h-10 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold transition hover:bg-[var(--foreground)]"
              style={{ color: "white" }}
              type="submit"
            >
              Add posting
            </button>
          </div>
        </form>
      </div>
    </RecruiterShell>
  );
}
