import Link from "next/link";
import { Card, CardHead, CardPad, Mono, TopNav, appRoutes } from "@recai/shared";
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
    <>
      <TopNav viewer={{ role: "candidate", fullName: session.fullName }} showSearch={false} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">
              Candidate workspace
            </p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
              Recruiter groups
            </h1>
          </div>
          <Link
            className="inline-flex items-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
            href={appRoutes.candidateDashboard}
          >
            Back to dashboard
          </Link>
        </div>

        <Card>
          <CardHead
            eyebrow={`Recruiter groups · ${joinedPostings.length}`}
            meta={<Mono>{joinedPostings.length === 1 ? "1 pool" : `${joinedPostings.length} pools`}</Mono>}
          />
          <CardPad>
            {joinedPostings.length === 0 ? (
              <p className="text-[13px] leading-6 text-[color:var(--ink-3)]">
                You have not joined any recruiter pools yet. Use a recruiter&apos;s recAI invite
                link and sign in to be added to that posting&apos;s candidate set.
              </p>
            ) : (
              <ul className="grid gap-3">
                {joinedPostings.map((posting) => (
                  <li
                    key={posting.jobId}
                    className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[color:var(--ink)]">
                          {posting.title}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[color:var(--ink-3)]">
                          {posting.location} · {posting.employmentType} · {posting.experienceLevel}
                        </div>
                      </div>
                      <Mono className="shrink-0 text-[11px] text-[color:var(--ink-3)]">
                        joined {formatDate(posting.joinedAt)}
                      </Mono>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardPad>
        </Card>
      </main>
    </>
  );
}
