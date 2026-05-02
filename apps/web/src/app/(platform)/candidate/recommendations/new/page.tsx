import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "@recai/candidate/server/candidate-auth";

export default async function CandidateRequestRecommendationStubPage() {
  await requireCandidateSession();

  return (
    <AppShell
      eyebrow="Request a Recommendation"
      title="Recommendation request flow is on the way."
      description="This is where you'll send a structured request to a coworker, manager, or peer."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate dashboard", href: appRoutes.candidateDashboard },
        { label: "Request a recommendation" },
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
        title="The recommendation request flow ships in a follow-up slice."
        description="It will let you enter a recommender's email, specify the role you want them to comment on, and send a verification email — see PRD §2.2."
      >
        <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
          For now, head back to your dashboard and edit your profile banner. Once
          recommenders start submitting, your experience and recommendations sections
          on the dashboard will populate automatically.
        </div>
      </SectionCard>
    </AppShell>
  );
}
