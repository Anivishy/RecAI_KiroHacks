import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "@recai/candidate/server/candidate-auth";

export default async function CandidateGroupsStubPage() {
  await requireCandidateSession();

  return (
    <AppShell
      eyebrow="Recruiter Groups"
      title="Group management is on the way."
      description="This is where you'll review and leave the recruiter groups you've joined."
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
        eyebrow="Coming Next"
        title="Group management ships in a follow-up slice."
        description="It will list every recruiter group you've joined via an external job posting link, and let you leave any of them at any time — see PRD §2.3."
      >
        <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
          You join a recruiter group by clicking the RecAI link inside a recruiter&apos;s
          external job posting. Until that flow ships, this page is just a stub so the
          dashboard&apos;s &quot;Manage groups&quot; link goes somewhere meaningful.
        </div>
      </SectionCard>
    </AppShell>
  );
}
