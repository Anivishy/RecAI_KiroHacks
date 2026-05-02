import Link from "next/link";
import { Card, CardHead, CardPad, Mono, appRoutes } from "@recai/shared";

type JoinedGroupsCardProps = {
  postings: Array<{ jobId: string; title: string; location: string; joinedAt: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function JoinedGroupsCard({ postings }: JoinedGroupsCardProps) {
  return (
    <Card>
      <CardHead eyebrow="Recruiter groups" meta={<Mono>{postings.length} joined</Mono>} />
      <CardPad>
        {postings.length === 0 ? (
          <p className="text-[13px] text-[color:var(--ink-3)]">
            You have not joined any recruiter groups yet.
          </p>
        ) : (
          <ul className="grid gap-3">
            {postings.slice(0, 4).map((posting) => (
              <li key={posting.jobId} className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-3 py-2 text-[13px]">
                <div className="font-semibold text-[color:var(--ink)]">{posting.title}</div>
                <div className="text-[12px] text-[color:var(--ink-3)]">
                  {posting.location} · joined {formatDate(posting.joinedAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
          href={appRoutes.candidateGroups}
        >
          Open groups manager
        </Link>
      </CardPad>
    </Card>
  );
}
