import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { getJoinedPostingsForCandidate } from "@recai/recruiter/server/recruiter-jobs";
import { requireCandidateSession } from "../server/candidate-auth";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function CandidateGroupsPage() {
  const session = await requireCandidateSession();
  const joinedPostings = await getJoinedPostingsForCandidate(session.id);

  return (
    <AppShell
      eyebrow="Recruiter Groups"
      title="Postings you have joined through recruiter invite links"
      description="Each group below represents one recruiter-owned job posting whose candidate pool now includes your profile."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate dashboard", href: appRoutes.candidateDashboard },
        { label: "Recruiter groups" },
      ]}
      actions={
        <Link
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href={appRoutes.candidateDashboard}
        >
          Back to dashboard
        </Link>
      }
    >
      <SectionCard
        eyebrow="Joined Pools"
        title={
          joinedPostings.length > 0
            ? `${joinedPostings.length} recruiter pool${joinedPostings.length === 1 ? "" : "s"}`
            : "No recruiter pools joined yet"
        }
        description="Recruiters search each posting-specific pool independently. Joining one posting does not make you searchable everywhere."
      >
        {joinedPostings.length > 0 ? (
          <div className="grid gap-4">
            {joinedPostings.map((posting) => (
              <div
                key={posting.jobId}
                className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {posting.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {posting.location} - {posting.employmentType} -{" "}
                      {posting.experienceLevel}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    Joined {formatDate(posting.joinedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
            You have not joined any recruiter pools yet. Use a recruiter&apos;s RecAI invite
            link and sign in to be added to that posting&apos;s candidate set.
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
