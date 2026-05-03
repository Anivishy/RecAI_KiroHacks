import { Card, CardHead, Mono } from "@recai/shared";

export function RecruiterPentagonsSkeleton() {
  return (
    <>
      <Card>
        <CardHead
          eyebrow="Technical · recruiter view"
          meta={<Mono>loading…</Mono>}
        />
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--ink-4)] border-t-[color:var(--verified)]" />
          <span className="ml-3 text-[13px] text-[color:var(--ink-3)]">
            Scoring with Bedrock…
          </span>
        </div>
      </Card>
      <Card>
        <CardHead
          eyebrow="Behavioral · recruiter view"
          meta={<Mono>loading…</Mono>}
        />
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--ink-4)] border-t-[color:var(--verified)]" />
          <span className="ml-3 text-[13px] text-[color:var(--ink-3)]">
            Scoring with Bedrock…
          </span>
        </div>
      </Card>
    </>
  );
}
